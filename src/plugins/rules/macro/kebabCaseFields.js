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

    Components: {
        enter(components, ctx) {
  
          if (!components.schemas) {
            return;
          }
  
          Object.entries(components.schemas).forEach(([schemaName, schema]) => {
            // Ignore error-related schemas
            if (schemaName === "error" || schemaName === "errors") {
              return;
            }
  
            validateSchemaProperties(ctx, schemaName, schema);
          });
        }
      }
  };
}

/**
 * Recursively validates all properties within a schema to enforce kebab-case naming.
 */
function validateSchemaProperties(ctx, schemaName, schema) {
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
      if (!isKebabCase(propertyName)) {
        const jsonPointer = ctx.location.child(["schemas", schemaName, "properties", propertyName]).pointer.replace(/~1/g, "/");
        ctx.report({
          message: `Property '${propertyName}' in schema '${schemaName}' must be in kebab-case.`,
          location: { pointer: jsonPointer },
        });
      }
  
      // Handle `anyOf`, `oneOf`, `allOf` inside properties
      ["anyOf", "oneOf", "allOf"].forEach((key) => {
        if (propertySchema[key]) {
          propertySchema[key].forEach((subSchema, index) => {
            validateSchemaProperties(ctx, `${schemaName} -> ${propertyName} -> ${key}[${index}]`, subSchema);
          });
        }
      });
  
      // Recursively validate nested properties
      if (propertySchema.properties) {
        validateSchemaProperties(ctx, `${schemaName} -> ${propertyName}`, propertySchema);
      }
    });
  }

/**
 * Checks if a string follows kebab-case.
 */
function isKebabCase(str) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
}
