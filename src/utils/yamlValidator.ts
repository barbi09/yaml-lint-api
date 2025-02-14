import { createConfig, lintFromString } from '@redocly/openapi-core';

export async function validateYamlContent(yamlContent: string) {
    try {
        console.log(`🔍 Validating YAML content...`);

        // Initialize Redocly configuration
        const config = await createConfig(
            {
              extends: ['recommended']
            }
          );

        // Run OpenAPI linting
        const lintResults = await lintFromString({
            source:yamlContent,
            // optionally pass path to the file for resolving $refs and proper error locations
            //absoluteRef: 'optional/path/to/openapi.yaml',
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

            console.error('❌ YAML validation errors:', formattedResults);
            return { valid: false, errors: formattedResults };
        }
    } catch (error) {
        console.error('🚨 Validation error:', error);
        throw error;
    }
}
