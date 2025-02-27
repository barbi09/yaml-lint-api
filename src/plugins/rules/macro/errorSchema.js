console.log("✅ Loading ErrorSchema rule...");
module.exports = errorSchema;

function errorSchema() {
  return {
    Components: {
      enter(components, ctx) {
        console.log("🔍 Running ErrorSchema validation...");

        if (!components.schemas || !components.schemas.error) {
          ctx.report({
            message: "Missing 'error' schema in components.schemas.",
            location: ctx.location.child(["schemas"]),
          });
          return;
        }

        if (!components.schemas.errors) {
          ctx.report({
            message: "Missing 'errors' schema in components.schemas.",
            location: ctx.location.child(["schemas"]),
          });
          return;
        }

        const errorSchema = components.schemas.error;
        const errorsSchema = components.schemas.errors;

        // Required properties for error schema
        const requiredErrorProps = {
          Code: "string",
          Id: "string",
          Message: "string",
          Errors: "array"
        };

        // Required properties for errors schema
        const requiredErrorsProps = {
          ErrorCode: "string",
          Message: "string",
          Path: "string"
        };

        // Validate `error` schema properties
        validateSchemaProperties(ctx, "error", errorSchema, requiredErrorProps, "schemas");

        // Validate `errors` schema properties
        validateSchemaProperties(ctx, "errors", errorsSchema, requiredErrorsProps, "schemas");

        // Validate that `Errors` in `error` references `#/components/schemas/errors`
        if (
          errorSchema.properties &&
          errorSchema.properties.Errors &&
          errorSchema.properties.Errors.items &&
          errorSchema.properties.Errors.items.$ref !== "#/components/schemas/errors"
        ) {
          ctx.report({
            message: "'Errors' property in 'error' schema must reference '#/components/schemas/errors'.",
            location: ctx.location.child(["schemas", "error", "properties", "Errors"]),
          });
        }
      },
    },

    Response: {
      enter(response, ctx) {
        // Only check responses that match expected error status codes
        const expectedErrorRefs = {
          "400": "#/components/responses/badRequest",
          "401": "#/components/responses/unauthorized",
          "404": "#/components/responses/notFound",
          "409": "#/components/responses/conflict",
          "429": "#/components/responses/tooManyRequests",
          "500": "#/components/responses/internalServerError",
          "502": "#/components/responses/badGateway",
          "503": "#/components/responses/serviceUnavailable",
          "504": "#/components/responses/gatewayTimeout"
        };

        // Extract the response status code
        const statusCode = ctx.key;
        if (!expectedErrorRefs[statusCode]) {
          return; // Skip checking non-error responses
        }

        if (!response.content || !response.content["application/json"] || !response.content["application/json"].schema) {
          return;
        }

        const schemaRef = response.content["application/json"].schema.$ref;
        if (!schemaRef || schemaRef !== "#/components/schemas/error") {
          const jsonPointer = ctx.location.child(["content", "application/json", "schema"]).pointer.replace(/~1/g, "/");
          ctx.report({
            message: `Error response ${statusCode} must reference '#/components/schemas/error', but found '${schemaRef || "undefined"}'.`,
            location: { pointer: jsonPointer },
          });
        }
      },
    },
  };
}

/**
 * Validates that the schema has all required properties with the correct types.
 */
function validateSchemaProperties(ctx, schemaName, schema, requiredProps, locationKey) {
  const missingProps = [];
  const incorrectTypes = [];

  Object.entries(requiredProps).forEach(([prop, expectedType]) => {
    if (!schema.properties || !(prop in schema.properties)) {
      missingProps.push(prop);
    } else if (schema.properties[prop].type !== expectedType) {
      incorrectTypes.push(`${prop} (expected: ${expectedType}, found: ${schema.properties[prop].type})`);
    }
  });

  if (missingProps.length > 0) {
    ctx.report({
      message: `'${schemaName}' schema is missing required properties: ${missingProps.join(", ")}.`,
      location: ctx.location.child([locationKey, schemaName]),
    });
  }

  if (incorrectTypes.length > 0) {
    ctx.report({
      message: `'${schemaName}' schema has incorrect property types: ${incorrectTypes.join(", ")}.`,
      location: ctx.location.child([locationKey, schemaName]),
    });
  }
}
