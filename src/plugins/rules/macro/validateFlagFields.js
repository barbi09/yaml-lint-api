module.exports = validateFlagFields;

function validateFlagFields() {
  return {
    Components: {
      enter(components, ctx) {
        if (!components.schemas) return;
        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
          validateSchemaProperties(ctx, schemaName, schema);
        });
      }
    },
    Operation: {
      enter(operation, ctx) {
        if (!operation.parameters) return;

        operation.parameters.forEach((param, index) => {
          const name = param.name;
          const schema = param.schema;
          if (name && name.startsWith("flag-")) {
            const isEnum = schema?.enum && Array.isArray(schema.enum);
            if (!isEnum) {
              const jsonPointer = ctx.location.child(['parameters', index, 'schema']).pointer.replace(/~1/g, "/");
              ctx.report({
                message: `The parameter '${name}' must be an enum.`,
                location: { pointer: jsonPointer }
              });
            }
          }
        });
      }
    }
  };
}

function validateSchemaProperties(ctx, schemaName, schema, rootCtx) {
  if (!schema || typeof schema !== "object" || schema.$ref) return;

  const properties = schema.properties;
  if (!properties || typeof properties !== "object") return;

  for (const [propertyName, propertySchema] of Object.entries(properties)) {
    if (propertyName.startsWith("flag-")) {
      const hasEnum =
        isEnumDefined(propertySchema) ||
        checkCompositeForEnum(propertySchema, rootCtx, "allOf") ||
        checkCompositeForEnum(propertySchema, rootCtx, "oneOf") ||
        checkCompositeForEnum(propertySchema, rootCtx, "anyOf");

      if (!hasEnum) {
        ctx.report({
          message: `The field '${propertyName}' must be defined as an enum (directly or via allOf/oneOf/anyOf).`,
          location: ctx.location.child(["schemas", schemaName, "properties", propertyName]),
        });
      }
    }

    // Recurse into nested objects
    if (propertySchema.type === "object") {
      validateSchemaProperties(ctx, `${schemaName} -> ${propertyName}`, propertySchema, rootCtx);
    }
  }
}

function isEnumDefined(schema) {
    return Array.isArray(schema.enum);
  }

function checkCompositeForEnum(schema, ctx, key) {
  if (!Array.isArray(schema[key])) return false;

  return schema[key].some(sub => {
    if (sub.$ref){
      const refPath = sub.$ref.replace(/^#\/components\/schemas\//, "");
      // 💡 Ignore ctx.resolve(). Go directly to the actual schema
      const schemaNode = ctx.rawNode?.schemas?.[refPath];
      return schemaNode && isEnumDefined(schemaNode);
    }  
  return isEnumDefined(sub);    
  });
}
  
  

