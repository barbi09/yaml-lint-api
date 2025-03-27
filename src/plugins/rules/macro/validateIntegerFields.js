module.exports = validateIntegerFields;

function validateIntegerFields() {
  return {
    Components: {
      enter(components, ctx) {
        if (!components.schemas) return;
        for (const [schemaName, schema] of Object.entries(components.schemas)) {
          validateSchema(ctx, schema, ['schemas', schemaName]);
        }
      }
    }
  };
};

function validateSchema(ctx, schema, pointerPath) {
  if (!schema || typeof schema !== 'object') return;

  if (schema.type === 'integer') {
    if (schema.format !== 'int32') {
      ctx.report({
        message: `Integer field must use format 'int32'.`,
        location: { pointer: ctx.location.child(pointerPath).pointer }
      });
    }

    if ('minLength' in schema || 'maxLength' in schema) {
      ctx.report({
        message: `Integer fields cannot use 'minLength' or 'maxLength'.`,
        location: { pointer: ctx.location.child(pointerPath).pointer }
      });
    }

    const schemaName = pointerPath?.[1]; 
    const isResponseSchema = typeof schemaName === "string" && schemaName.toLowerCase().includes("response");
    if (isResponseSchema && schema.nullable !== true) {
      ctx.report({
        message: `Integer fields in responses must be 'nullable: true'.`,
        location: { pointer: ctx.location.child(pointerPath).pointer }
      });
    }
  }
  
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      validateSchema(ctx, propSchema, [...pointerPath, 'properties', propName]);
    }
  }

  if (schema.items) {
    validateSchema(ctx, schema.items, [...pointerPath, 'items']);
  }

  for (const key of ['allOf', 'oneOf', 'anyOf']) {
    if (Array.isArray(schema[key])) {
      schema[key].forEach((subSchema, idx) => {
        validateSchema(ctx, subSchema, [...pointerPath, key, idx]);
      });
    }
  }
}