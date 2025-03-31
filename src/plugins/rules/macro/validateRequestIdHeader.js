module.exports = validateRequestIdHeader;

function validateRequestIdHeader() {
  return {
    Operation: {
      enter(operation, ctx) {
        const expectedHeader = 'x-request-id';
        const expectedPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

        const headers = (operation.parameters || []).filter(p => p.in === 'header');

        const requestIdParam = headers.find(h => h.name === expectedHeader);

        if (!requestIdParam) {
          ctx.report({
            message: `Missing required header parameter: ${expectedHeader}`,
            location: ctx.location.child(['parameters']).key(),
          });
          return;
        }

        const schema = requestIdParam.schema || {};
        const issues = [];

        if (schema.type !== 'string') issues.push("type must be 'string'");
        if (schema.format !== 'uuid') issues.push("format must be 'uuid'");
        //if (schema.pattern !== expectedPattern) issues.push(`pattern must be '${expectedPattern}'`);

        if (issues.length > 0) {
          ctx.report({
            message: `${expectedHeader} is invalid: ${issues.join(', ')}`,
            location: ctx.location.child(['parameters']).key(),
          });
        }
      }
    }
  };
}
