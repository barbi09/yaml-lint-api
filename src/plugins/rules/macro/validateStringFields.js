module.exports = validateStringFields;

function validateStringFields() {
  return {
    Components: {
      enter(components, ctx) {
        if (!components.schemas) return;
        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          validateSchema(ctx, schema, ["schemas", schemaName]);
        });
      }
    }
  };
};

function validateSchema(ctx, schema, pointerPath) {
  if (!schema || typeof schema !== "object") return;

  if (schema.type === "string") {
    if ("minimum" in schema || "maximum" in schema) {
      ctx.report({
        message: `String fields should not define 'minimum' or 'maximum'. Use 'minLength' or 'maxLength' instead.`,
        location: { pointer: ctx.location.child(pointerPath).pointer }
      });
    }
  }

  if (schema.type === "object" && schema.properties) {
    Object.entries(schema.properties).forEach(([key, propSchema]) => {
      validateSchema(ctx, propSchema, [...pointerPath, "properties", key]);
    });
  }

  if (schema.type === "array" && schema.items) {
    validateSchema(ctx, schema.items, [...pointerPath, "items"]);
  }

  ["allOf", "oneOf", "anyOf"].forEach(key => {
    if (Array.isArray(schema[key])) {
      schema[key].forEach((subSchema, idx) => {
        validateSchema(ctx, subSchema, [...pointerPath, key, idx]);
      });
    }
  });
}
