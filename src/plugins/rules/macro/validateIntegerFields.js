module.exports = validateIntegerFields;

function validateIntegerFields() {
  return {
    Components: {
      enter(components, ctx) {
        if (!components.schemas) return;
        Object.entries(components.schemas).forEach(([schemaName, schema]) => {
           //console.log("components.schemas",components.schemas);
          //validateSchema(ctx, schema, ["schemas", schemaName]);
        });
      }
    },
    Operation: {
      enter(operation, ctx) {
        // Check parameters
        if (operation.parameters) {
          operation.parameters.forEach((param, index) => {
            //console.log("operation.parameters",operation.parameters);
            //validateSchema(ctx, param.schema, ["parameters", index, "schema"], false);
          });
        }

        // Check responses (only schemas inside responses)
        if (operation.responses) {
          Object.entries(operation.responses).forEach(([status, response]) => {
            if (response?.content?.["application/json"]?.schema) {
                console.log("response.content.schema",response.content["application/json"].schema);
                validateSchema(ctx, response.content["application/json"].schema, ["responses", status, "content", "application/json", "schema"], true);
            }
            if (response?.content?.["multipart/form-data"]?.schema) {
                validateSchema(ctx, response.content["multipart/form-data"].schema, ["responses", status, "content", "multipart/form-data", "schema"], true);
            }
          });
        }
      }
    }
  };
}

/**
 * Recursively validates schema objects and their properties.
 */
function validateSchema(ctx, schema, pointerPath, insideResponse = false) {

    if (schema.type === "integer" && insideResponse) {
        console.log("✅ Inside response context for pointer:", ctx.location.child(pointerPath).pointer);
      }
    // Handle $ref at root level
    if (schema.$ref) {
        const resolvedNode = resolveSchemaNode(ctx, schema.$ref);
        console.log("schema.$ref",resolvedNode);
        if (resolvedNode && typeof resolvedNode === "object") {
            console.log("schema.$ref",resolvedNode);
            console.log("schema.$ref insideResponse",insideResponse);
            // Pass along insideResponse context
            validateSchema(ctx, resolvedNode, pointerPath, insideResponse);
        }
        return;
    }

    if (!schema || typeof schema !== "object") return;

    if (schema.type === "object" && schema.properties) {
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
            console.log("propSchema",propSchema);
            console.log("properties",[...pointerPath, "properties", key]);
            console.log("insideResponse",insideResponse);
        validateSchema(ctx, propSchema, [...pointerPath, "properties", key], insideResponse);
        });
    }

    // Handle arrays
    if (schema.type === "array" && schema.items) {
        const itemSchema = schema.items;
    
        if (itemSchema.$ref) {
            const resolvedNode = resolveSchemaNode(ctx, itemSchema.$ref);
            if (resolvedNode && typeof resolvedNode === "object") {
              validateSchema(ctx, resolvedNode, [...pointerPath, "items"], insideResponse);
            }
            return;
        } else {
            validateSchema(ctx, itemSchema, [...pointerPath, "items"], insideResponse);
        }
    }  

    // Validation logic for integer fields
    if (schema.type === "integer") {
        // Must have format int32
        if (schema.format !== "int32") {
        ctx.report({
            message: `Integer field must use format 'int32'.`,
            location: { pointer: ctx.location.child(pointerPath).pointer.replace(/~1/g, "/") }
        });
        }

        // Should not have minLength/maxLength
        if ("minLength" in schema || "maxLength" in schema) {
        ctx.report({
            message: `Integer fields cannot use 'minLength' or 'maxLength'. Use 'minimum', 'maximum', or 'multipleOf' instead.`,
            location: { pointer: ctx.location.child(pointerPath).pointer.replace(/~1/g, "/") }
        });
        }
        console.log("insideResponseBeforeNullable",insideResponse);
        // If it's inside a response, it must be nullable: true
        if (insideResponse && schema.nullable !== true) {
        ctx.report({
            message: `Integer fields in responses must be 'nullable: true'.`,
            location: { pointer: ctx.location.child(pointerPath).pointer.replace(/~1/g, "/") }
        });
        }
    }

    // Recurse through allOf/oneOf/anyOf
    ["allOf", "oneOf", "anyOf"].forEach(key => {
        if (Array.isArray(schema[key])) {
        schema[key].forEach((subSchema, idx) => {
            validateSchema(ctx, subSchema, [...pointerPath, key, idx], insideResponse);
        });
        }
    });
}

function resolveSchemaNode(ctx, ref) {
    const refPath = ref.replace(/^#\/components\/schemas\//, "");
    const resolved = ctx.resolve(refPath);
    console.log("resolved" ,resolved);
    // Handle case where ctx.resolve().node is just the string name
    if (typeof resolved?.node === "string") {
        console.log("ctx.rawNode?.schemas?.[resolved.node]",ctx.rawNode);
        console.log("ctx",ctx);
        return ctx.rawNode?.schemas?.[resolved.node];
    }
  
    return resolved?.node;
  }