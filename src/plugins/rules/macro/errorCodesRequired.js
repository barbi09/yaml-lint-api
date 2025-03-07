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
                pointer: humanReadableLocation
              }
            });
          }
        });

        // 🔍 2. Validate that all present error codes match their expected references
        definedResponses.forEach(statusCode => {
          if (expectedErrorRefs[statusCode]) { // Only validate defined error codes
            let expectedRef = expectedErrorRefs[statusCode];
            let actualRef = operation.responses[statusCode].$ref || null;

            // 🔍 Check nested schema reference inside content -> application/json -> schema
            if (!actualRef && operation.responses[statusCode].content &&
                operation.responses[statusCode].content["application/json"] &&
                operation.responses[statusCode].content["application/json"].schema &&
                operation.responses[statusCode].content["application/json"].schema.$ref) {
              actualRef = operation.responses[statusCode].content["application/json"].schema.$ref;
              expectedRef = "#/components/schemas/error";
            }

            if (!actualRef || actualRef !== expectedRef) {
              const jsonPointer = ctx.location.child(['responses', statusCode]).pointer;
              const humanReadableLocation = jsonPointer.replace(/~1/g, '/');

              ctx.report({
                message: `Response code ${statusCode} must reference '${expectedRef}', but found '${actualRef || "undefined"}'.`,
                location: {
                  pointer: humanReadableLocation
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
                  pointer: humanReadableLocation
                }
              });
            }
          }
        });
      }
    }
  };
}
