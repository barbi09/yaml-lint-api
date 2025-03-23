module.exports = validateOperationId;

function validateOperationId() {
  return {
    Operation: {
      enter(operation, ctx) {
        if (!operation.operationId) return;

        const httpMethod = ctx.key?.toLowerCase(); // ← This safely extracts the HTTP method
        if (!httpMethod) return;

        if (!operation.operationId.startsWith(`${httpMethod}-`)) {
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
