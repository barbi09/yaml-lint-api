module.exports = validFormat;

function validFormat() {
  return {
    Components: {
      enter(components, ctx) {

        if (!components.schemas) {
          return;
        }

        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          validateSchemaFormats(ctx, schemaName, schema);
        });
      }
    }
  };
}

/**
 * Recursively validates all properties within a schema to ensure `format` is valid.
 */
function validateSchemaFormats(ctx, schemaName, schema) {
  if (!schema || typeof schema !== "object") {
    return;
  }

  if (schema.$ref) {
    return;
  }

  if (!schema.properties || typeof schema.properties !== "object") {
    return;
  }

  Object.entries(schema.properties).forEach(([propertyName, propertySchema]) => {
    if (propertySchema.format && !isValidFormat(propertySchema.format)) {
      const jsonPointer = ctx.location.child(["schemas", schemaName, "properties", propertyName, "format"]).pointer.replace(/~1/g, "/");
      ctx.report({
        message: `Invalid 'format' value '${propertySchema.format}' in property '${propertyName}' of schema '${schemaName}'.`,
        location: { pointer: jsonPointer },
      });
    }

    if (typeof propertySchema.format === "string" && propertySchema.format.match(/^\^.*\$$/)) {
      const jsonPointer = ctx.location.child(["schemas", schemaName, "properties", propertyName, "format"]).pointer.replace(/~1/g, "/");
      ctx.report({
        message: `Property '${propertyName}' in schema '${schemaName}' uses a regex inside 'format'. Move it to 'pattern'.`,
        location: { pointer: jsonPointer },
      });
    }

    // Recursively validate nested properties
    if (propertySchema.properties) {
      validateSchemaFormats(ctx, `${schemaName} -> ${propertyName}`, propertySchema);
    }
  });
}

/**
 * Checks if a format value is valid according to OpenAPI spec.
 */
function isValidFormat(format) {
  const validFormats = new Set([
    "int32", "int64", "float", "double", "string", "byte", "binary",
    "date", "date-time", "password", "email", "uuid", "uri", "hostname", "ipv4", "ipv6"
  ]);

  return validFormats.has(format);
}