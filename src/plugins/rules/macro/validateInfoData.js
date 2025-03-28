module.exports = validateInfoData;

function validateInfoData() {
  return {
    Info: {
      enter(info, ctx) {
        const pointerBase = ctx.location.child([]);

        if (!("x-ns" in info)) {
          ctx.report({
            message: "Missing required field: `x-ns` in info section.",
            location: { pointer: pointerBase.pointer }
          });
        }

        if (!("x-ns-path" in info)) {
          ctx.report({
            message: "Missing required field: `x-ns-path` in info section.",
            location: { pointer: pointerBase.pointer }
          });
        }
      }
    }
  };
}