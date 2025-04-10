module.exports = validateOperationTags;

function validateOperationTags() {
  let globalTagNames = new Set();

  return {
    Root: {
      enter(root, ctx) {
        if (Array.isArray(root.tags)) {
          root.tags.forEach(tag => {
            if (tag?.name) {
              globalTagNames.add(tag.name);
            }
          });
        }
      }
    },
    Operation: {
      enter(operation, ctx) {
        
        if (!operation.tags) {
            ctx.report({
              message: `The operation must have at least one tag.`,
              location: ctx.location 
            });
            return;
          }

        operation.tags.forEach((tag, index) => {
          if (!globalTagNames.has(tag)) {
            ctx.report({
              message: `The tag '${tag}' is used in an operation but not defined in the root 'tags' list.`,
              location: ctx.location.child(['tags', index])
            });
          }
        });
      }
    }
  };
}
