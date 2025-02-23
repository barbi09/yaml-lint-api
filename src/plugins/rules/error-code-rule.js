console.log("✅ Loading error-code-required rule...");
module.exports = {
    'error-code-required': {
      description: 'Ensures that all error responses reference an error schema',
      message: 'Error responses must reference an error schema containing the "Code" property.',
      severity: 'error',
      given: "$.paths[*][*].responses[*]['$ref']",
      then: {
        function: (targetVal, _opts, paths) => {
          console.log(`🔍 Running error-code-required on: ${targetVal}`);
          if (!targetVal.includes('/components/responses/')) {
            return [
              {
                message: `Response ${targetVal} must reference an error response from components.responses.`,
                path: paths.target,
              }
            ];
          }
          return [];
        }
      }
    }
  };
  