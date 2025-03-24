module.exports = validateDateFields;

function validateDateFields() {
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
 * Recursively validates all properties in a schema to enforce correct "date" field types.
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

    // 🔍 Skip validation for fields starting with "is-"
    if (propertyName.startsWith("is-") || propertyName.startsWith("flag-") ) {
        return;
      }
      
    // 🔍 Check if field name contains "date"
    if (propertyName.toLowerCase().includes("date")) {
      if (propertySchema.type !== "string" || !["date", "date-time"].includes(propertySchema.format)) {
        const jsonPointer = ctx.location.child(["schemas", schemaName, "properties", propertyName]).pointer.replace(/~1/g, "/");
        
        ctx.report({
          message: `Field '${propertyName}' in schema '${schemaName}' must be of type 'string' with format 'date' or 'date-time'.`,
          location: { pointer: jsonPointer },
        });
      }
    }

    // Recursively validate nested properties
    if (propertySchema.properties) {
      validateSchemaProperties(ctx, `${schemaName} -> ${propertyName}`, propertySchema);
    }
  });
}
