module.exports = validateBooleanFields;

function validateBooleanFields() {
  return {
    Components: {
      enter(components, ctx) {
        if (!components.schemas) {
          return;
        }

        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          validateSchemaProperties(ctx, schemaName, schema);
        });
      }
    }
  };
}

/**
 * Recursively validates all properties in a schema to enforce correct boolean naming.
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
    // 🔍 Check if the field is a boolean
    if (propertySchema.type === "boolean" && !propertyName.startsWith("is-")) {
      const jsonPointer = ctx.location.child(["schemas", schemaName, "properties", propertyName]).pointer.replace(/~1/g, "/");
      
      ctx.report({
        message: `Boolean field '${propertyName}' in schema '${schemaName}' must start with 'is-'.`,
        location: { pointer: jsonPointer },
      });
    }

    // Recursively validate nested properties
    if (propertySchema.properties) {
      validateSchemaProperties(ctx, `${schemaName} -> ${propertyName}`, propertySchema);
    }
  });
}
