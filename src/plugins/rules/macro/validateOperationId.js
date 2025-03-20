module.exports = validateOperationId;

function validateOperationId() {
  return {
    Operation: {
      enter(operation, ctx) {
        if (!operation.operationId) {
          return; // Skip if operationId is missing
        }

        // Extract HTTP method from context
        const httpMethod = getHttpMethod(ctx);
        if (!httpMethod) {
          return; // Skip if method can't be determined
        }

        // Ensure operationId starts with the HTTP method
        if (!operation.operationId.startsWith(httpMethod + "-")) {
          const jsonPointer = ctx.location.child(["operationId"]).pointer.replace(/~1/g, "/");

          ctx.report({
            message: `The operationId '${operation.operationId}' must start with '${httpMethod}-'.`,
            location: { pointer: jsonPointer },
          });
        }
      }
    }
  };
}

/**
 * Extracts the HTTP method from `ctx.parent` safely.
 */
function getHttpMethod(ctx) {
  if (!ctx.parent || typeof ctx.parent !== "object") {
    return null;
  }

  const possibleMethods = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];
  const method = Object.keys(ctx.parent).find((key) => possibleMethods.includes(key.toLowerCase()));

  return method ? method.toLowerCase() : null;
}
