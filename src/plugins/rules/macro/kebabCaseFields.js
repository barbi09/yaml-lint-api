console.log("✅ Loading KebabCaseFields rule...");
module.exports = kebabCaseFields;

function kebabCaseFields() {
  return {
    Parameter: {
      enter(parameter, ctx) {
        if (parameter.name && !isKebabCase(parameter.name)) {
          const jsonPointer = ctx.location.child(["name"]).pointer.replace(/~1/g, "/");
          ctx.report({
            message: `Parameter '${parameter.name}' must be in kebab-case.`,
            location: { pointer: jsonPointer },
          });
        }
      }
    },

    RequestBody: {
      enter(requestBody, ctx) {
        if (!requestBody.content || !requestBody.content["application/json"] || !requestBody.content["application/json"].schema) {
          return;
        }

        const schema = requestBody.content["application/json"].schema;
        console.log("🔍 Request Body Schema Found:", JSON.stringify(schema, null, 2));
        validateSchemaProperties(schema, ctx, "request body");
      }
    },

    Response: {
      enter(response, ctx) {
        const schemaRef = response.content?.["application/json"]?.schema?.$ref || null;

        // Skip validation for error responses
        if (schemaRef && schemaRef === "#/components/schemas/error") {
          return;
        }

        if (!response.content || !response.content["application/json"] || !response.content["application/json"].schema) {
          return;
        }

        const schema = response.content["application/json"].schema;
        console.log("🔍 Response Schema Found:", JSON.stringify(schema, null, 2));
        validateSchemaProperties(schema, ctx, "response body");
      }
    }
  };
}

/**
 * Recursively validates all properties within a schema to enforce kebab-case naming.
 */
function validateSchemaProperties(schema, ctx, contextName) {
  if (!schema) {
    console.log(`⚠️ Skipping empty schema in ${contextName}`);
    return;
  }

  // Handle references to external schemas
  if (schema.$ref) {
    console.log(`🔗 Resolving schema reference: ${schema.$ref}`);
    const refPath = schema.$ref.replace("#/components/schemas/", "");
    console.log("refPath", refPath);

    let resolvedSchema = resolveSchema(refPath, ctx);

    if (resolvedSchema) {
      console.log(`✅ Successfully resolved schema: ${refPath}`);
      validateSchemaProperties(resolvedSchema, ctx, contextName);
      return;
    } else {
      console.log(`❌ Failed to resolve schema: ${refPath}`);
    }
    return;
  }

  // Ensure schema has properties to check
  if (!schema.properties || typeof schema.properties !== "object") {
    console.log(`⚠️ No properties found in schema for ${contextName}`);
    return;
  }

  console.log(`🔍 Checking properties in ${contextName}:`, Object.keys(schema.properties));

  Object.keys(schema.properties).forEach((propertyName) => {
    if (!isKebabCase(propertyName)) {
      const jsonPointer = ctx.location.child(["properties", propertyName]).pointer.replace(/~1/g, "/");
      console.log(`❌ Invalid kebab-case found: ${propertyName}`);
      console.log("jsonPointer", jsonPointer);
      ctx.report({
        message: `Field '${propertyName}' in ${contextName} must be in kebab-case.`,
        location: { pointer: jsonPointer },
      });
    }

    // Recursively validate nested properties
    const nestedSchema = schema.properties[propertyName];
    if (nestedSchema && typeof nestedSchema === "object" && (nestedSchema.properties || nestedSchema.$ref)) {
      validateSchemaProperties(nestedSchema, ctx, `${contextName} -> ${propertyName}`);
    }
  });
}

/**
 * Resolves the schema reference correctly.
 */
function resolveSchema(refPath, ctx) {
  // Try using ctx.resolve()
  let resolvedSchema = ctx.resolve(refPath);
  if (resolvedSchema && resolvedSchema.node && typeof resolvedSchema.node === "object") {
    return resolvedSchema.node;
  }

  // If ctx.resolve() fails, try fetching from components.schemas manually
  if (ctx.root && ctx.root.components && ctx.root.components.schemas) {
    const schemas = ctx.root.components.schemas;

    if (schemas && schemas[refPath] && typeof schemas[refPath] === "object") {
      return schemas[refPath];
    }
  }

  return null;
}

/**
 * Checks if a string follows kebab-case.
 */
function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}
