console.log("✅ Loading error-schema-consistency rule...");
module.exports = {
    'error-schema-consistency': {
      description: 'Ensures that error schemas contain required properties.',
      message: 'Error schemas must include "Code" and "Message" properties.',
      severity: 'error',
      given: "$.components.schemas.error.properties",
      then: {
        function: (targetVal, _opts, paths) => {
          const requiredProps = ['Code', 'Message'];
          const missingProps = requiredProps.filter(prop => !(prop in targetVal));
          
          if (missingProps.length > 0) {
            return [
              {
                message: `Error schema is missing required properties: ${missingProps.join(', ')}`,
                path: paths.target,
              }
            ];
          }
          return [];
        }
      }
    }
  };
  