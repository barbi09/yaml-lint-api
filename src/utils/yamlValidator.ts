import { createConfig, lintFromString } from '@redocly/openapi-core';
const errorCodesRequired = require('../plugins/rules/macro/errorCodesRequired.js');
const errorSchema = require('../plugins/rules/macro/errorSchema.js');
const kebabCaseFields = require('../plugins/rules/macro/kebabCaseFields.js');
const operationExamples = require('../plugins/rules/macro/operationExamples.js');
const validFormat = require('../plugins/rules/macro/validFormat.js');
const validateDateFields = require('../plugins/rules/macro/validateDateFields.js');

export async function validateYamlContent(yamlContent: string) {
    try {
        console.log(`🔍 Validating YAML content...`);

        const config = await createConfig({
            extends: ['recommended'],
            plugins: [
              {
                id: 'MacroTemplate',
                rules: {
                  oas3: {
                    errorSchema: errorSchema,
                    errorCodesRequired: errorCodesRequired,
                    kebabCaseFields: kebabCaseFields,
                    operationExamples: operationExamples,
                    validFormat: validFormat,
                    validateDateFields: validateDateFields
                  }
                }
              }
            ],
            // enable rule
            rules: {
              'paths-kebab-case': 'error',
              'info-license': 'off',
              'MacroTemplate/errorSchema': 'error',
              'MacroTemplate/errorCodesRequired': 'error',
              'MacroTemplate/kebabCaseFields': 'error',
              'MacroTemplate/operationExamples': 'error',
              'MacroTemplate/validFormat': 'error',
              'MacroTemplate/validateDateFields': 'error'
            }
          });

        // Run OpenAPI linting
        const lintResults = await lintFromString({
            source:yamlContent,
            config,
          });

        if (lintResults.length === 0) {
            console.log('✅ YAML is valid!');
            return { valid: true, errors: [], warnings: [] };
        } else {
            // Process and format the results
            const formattedResults = lintResults.map((result) => ({
                ruleId: result.ruleId,
                severity: result.severity,
                message: result.message,
                suggest: result.suggest,
                location: result.location.map((location) => ({
                    component: location.pointer
                }))
            }));

            return { valid: false, errors: formattedResults };
        }
    } catch (error) {
        console.error('🚨 Validation error:', error);
        throw error;
    }
}
