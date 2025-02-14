import { createConfig, lintFromString } from '@redocly/openapi-core';
import path from 'path';

export async function validateYamlContent(yamlContent: string) {
    try {
        console.log(`🔍 Validating YAML content...`);

        // Initialize Redocly configuration
        // Load the external .redocly.yaml configuration
        const configPath = path.resolve(__dirname, '../custom-rules.redocly.yaml');
        const config = await createConfig({extends: ['recommended']}, { configPath });

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

            console.error('❌ YAML validation errors:', formattedResults);
            return { valid: false, errors: formattedResults };
        }
    } catch (error) {
        console.error('🚨 Validation error:', error);
        throw error;
    }
}
