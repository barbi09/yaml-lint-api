module.exports = operationExamples;

function operationExamples() {
  return {
    Operation: {
      enter(operation, ctx) {

        // Validate RequestBody Examples (Supports application/json & multipart/form-data)
        if (operation.requestBody) {
          validateRequestBodyExamples(operation, ctx);
        }

        // Validate Response Examples for Success Cases Only (e.g., 200, 201)
        if (operation.responses) {
          validateResponseExamples(operation, ctx);
        }
      }
    }
  };
}

/**
 * Validates that `requestBody` contains at least one example (excluding "none") and has "none".
 */
function validateRequestBodyExamples(operation, ctx) {
  const content = operation.requestBody.content;
  if (!content) return;

  const contentTypes = ["application/json", "multipart/form-data"];
  
  contentTypes.forEach((type) => {
    if (content[type]) {
      if (!content[type].examples) {
        reportMissingExamples(ctx, `requestBody (${type})`, true);
        return;
      }
      const examples = content[type].examples;
      checkExamples(examples, ctx, `requestBody (${type})`);
    }
  });
}

/**
 * Validates that success responses (`200`, `201`, etc.) contain at least one example (excluding "none") and have "none".
 */
function validateResponseExamples(operation, ctx) {
  const successStatusCodes = ["200", "201", "202"]; // Define success cases

  Object.entries(operation.responses).forEach(([statusCode, response]) => {
    if (!successStatusCodes.includes(statusCode)) return; // Ignore error responses

    if (!response.content) return;

    const contentTypes = ["application/json", "multipart/form-data"];

    contentTypes.forEach((type) => {
      if (response.content[type]) {
        if (!response.content[type].examples) {
          reportMissingExamples(ctx, `responses.${statusCode} (${type})`, true);
          return;
        }

        const examples = response.content[type].examples;
        checkExamples(examples, ctx, `responses.${statusCode} (${type})`);
      }
    });
  });
}

/**
 * Checks if examples exist (excluding "none") and ensures "none" exists.
 */
function checkExamples(examples, ctx, locationKey) {
  const hasValidExamples = Object.keys(examples).some((key) => key !== "none");
  const hasNoneExample = "none" in examples;

  if (!hasValidExamples) {
    reportMissingExamples(ctx, locationKey, false);
  }

  if (!hasNoneExample) {
    reportMissingNoneExample(ctx, locationKey);
  }
}

/**
 * Reports missing examples for a given location.
 */
function reportMissingExamples(ctx, locationKey, enforceNone) {
  const jsonPointer = ctx.location.child([locationKey]).pointer.replace(/~1/g, "/");
  ctx.report({
    message: `The '${locationKey}' must contain at least one example (excluding 'none').`,
    location: { pointer: jsonPointer },
  });

  if (enforceNone) {
    reportMissingNoneExample(ctx, locationKey);
  }
}

/**
 * Reports missing "none" example for a given location.
 */
function reportMissingNoneExample(ctx, locationKey) {
  const jsonPointer = ctx.location.child([locationKey]).pointer.replace(/~1/g, "/");
  ctx.report({
    message: `The '${locationKey}' must contain a 'none' example.`,
    location: { pointer: jsonPointer },
  });
}
