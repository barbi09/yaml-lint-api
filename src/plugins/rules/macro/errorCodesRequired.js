module.exports = errorCodeRequired;

function errorCodeRequired() {
  return {
    Operation: {
      enter(operation, ctx) {

        if (!operation.responses) {
          return;
        }

        // Expected references for each status code
        const expectedErrorRefs = {
          "400": "#/components/responses/badRequest",
          "401": "#/components/responses/unauthorized",
          "404": "#/components/responses/notFound",
          "409": "#/components/responses/conflict",
          "429": "#/components/responses/tooManyRequests",
          "500": "#/components/responses/internalServerError",
          "502": "#/components/responses/badGateway",
          "503": "#/components/responses/serviceUnavailable",
          "504": "#/components/responses/gatewayTimeout"
        };


        const definedResponses = Object.keys(operation.responses);

        // 🔍 1. Check for missing expected error codes
        Object.keys(expectedErrorRefs).forEach(expectedCode => {
          if (!definedResponses.includes(expectedCode)) {
            const jsonPointer = ctx.location.child(['responses']).pointer;
            const humanReadableLocation = jsonPointer.replace(/~1/g, '/');

            ctx.report({
              message: `Missing required response code ${expectedCode}. Every operation must define '${expectedErrorRefs[expectedCode]}'.`,
              location: {
                pointer: humanReadableLocation // ✅ Correct location format
              }
            });
          }
        });

        // 🔍 2. Validate that all present error codes match their expected references
        definedResponses.forEach(statusCode => {
          if (expectedErrorRefs[statusCode]) { // Only validate defined error codes
            const expectedRef = expectedErrorRefs[statusCode];
            const actualRef = operation.responses[statusCode].$ref || 'undefined';

            if (actualRef !== expectedRef) {
              const jsonPointer = ctx.location.child(['responses', statusCode]).pointer;
              const humanReadableLocation = jsonPointer.replace(/~1/g, '/');

              ctx.report({
                message: `Response code ${statusCode} must reference '${expectedRef}', but found '${actualRef}'.`,
                location: {
                  pointer: humanReadableLocation // ✅ Correct location format
                }
              });
            }
          } else {
            // ❌ Reject unexpected error codes (anything non-2XX)
            if (!statusCode.startsWith("2")) {
              const jsonPointer = ctx.location.child(['responses', statusCode]).pointer;
              const humanReadableLocation = jsonPointer.replace(/~1/g, '/');

              ctx.report({
                message: `Response code ${statusCode} is not allowed.`,
                location: {
                  pointer: humanReadableLocation // ✅ Correct location format
                }
              });
            }
          }
        });
      }
    }
  };
}
