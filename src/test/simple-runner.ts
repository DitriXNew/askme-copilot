/**
 * Простой тестовый раннер для локального тестирования без VS Code
 * Запускает симуляцию работы инструментов
 */

// Простая реализация test framework
interface TestCase {
    name: string;
    fn: () => void | Promise<void>;
}

interface TestSuite {
    name: string;
    cases: TestCase[];
}

class SimpleTestRunner {
    private suites: TestSuite[] = [];
    private currentSuite: TestSuite | null = null;
    
    addSuite(name: string, fn: () => void) {
        const suite: TestSuite = { name, cases: [] };
        this.currentSuite = suite;
        this.suites.push(suite);
        fn();
        this.currentSuite = null;
    }
    
    addTest(name: string, fn: () => void | Promise<void>) {
        if (!this.currentSuite) {
            throw new Error('Test must be inside a suite');
        }
        this.currentSuite.cases.push({ name, fn });
    }
    
    async run(): Promise<void> {
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        console.log('🚀 Running Ask Me Copilot Extension Tests\\n');
        
        for (const suite of this.suites) {
            console.log(`📁 ${suite.name}`);
            
            for (const testCase of suite.cases) {
                totalTests++;
                try {
                    await testCase.fn();
                    console.log(`  ✅ ${testCase.name}`);
                    passedTests++;
                } catch (error) {
                    console.log(`  ❌ ${testCase.name}`);
                    console.log(`     Error: ${error}`);
                    failedTests++;
                }
            }
            console.log('');
        }
        
        console.log(`📊 Test Results:`);
        console.log(`   Total: ${totalTests}`);
        console.log(`   Passed: ${passedTests}`);
        console.log(`   Failed: ${failedTests}`);
        
        if (failedTests > 0) {
            process.exit(1);
        } else {
            console.log('\\n🎉 All tests passed!');
        }
    }
}

// Simple assertion functions
const assertion = {
    strictEqual: (actual: any, expected: any, message?: string) => {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    },
    ok: (condition: any, message?: string) => {
        if (!condition) {
            throw new Error(message || 'Expected truthy value');
        }
    },
    equal: (actual: any, expected: any, message?: string) => {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }
};

// Global test runner instance
const runner = new SimpleTestRunner();

// Test implementations
runner.addSuite('Ask Me Copilot Tools - Basic Validation', () => {
    runner.addTest('should validate askExpert input correctly', () => {
        const validateInput = (input: any, requiredFields: string[]): string | null => {
            if (!input || typeof input !== 'object') {
                return 'Invalid input parameters. Expected an object.';
            }
            
            for (const field of requiredFields) {
                if (!(field in input)) {
                    return `Missing required field: "${field}"`;
                }
                
                const value = input[field];
                if (value === null || value === undefined) {
                    return `Field "${field}" cannot be null or undefined`;
                }
                
                if (typeof value === 'string' && value.trim() === '') {
                    return `Field "${field}" cannot be empty`;
                }
            }
            
            return null;
        };
        
        // Test cases
        assertion.strictEqual(validateInput(null, ['question']), 'Invalid input parameters. Expected an object.');
        assertion.strictEqual(validateInput({}, ['question']), 'Missing required field: "question"');
        assertion.strictEqual(validateInput({ question: '' }, ['question']), 'Field "question" cannot be empty');
        assertion.strictEqual(validateInput({ question: 'Valid question' }, ['question']), null);
    });
    
    runner.addTest('should validate selectFromList input correctly', () => {
        const validateInput = (input: any, requiredFields: string[]): string | null => {
            if (!input || typeof input !== 'object') {
                return 'Invalid input parameters. Expected an object.';
            }
            
            for (const field of requiredFields) {
                if (!(field in input)) {
                    return `Missing required field: "${field}"`;
                }
                
                const value = input[field];
                if (value === null || value === undefined) {
                    return `Field "${field}" cannot be null or undefined`;
                }
                
                if (Array.isArray(value) && value.length === 0) {
                    return `Field "${field}" cannot be an empty array`;
                }
            }
            
            return null;
        };
        
        const validateOptions = (options: any[]): boolean => {
            return options.every(opt => typeof opt === 'string' && opt.trim());
        };
        
        assertion.strictEqual(validateInput({}, ['question', 'options']), 'Missing required field: "question"');
        assertion.strictEqual(validateInput({ question: 'test' }, ['question', 'options']), 'Missing required field: "options"');
        assertion.strictEqual(validateInput({ question: 'test', options: [] }, ['question', 'options']), 'Field "options" cannot be an empty array');
        assertion.strictEqual(validateInput({ question: 'test', options: ['A', 'B'] }, ['question', 'options']), null);
        
        assertion.strictEqual(validateOptions(['option1', 'option2']), true);
        assertion.strictEqual(validateOptions(['option1', '']), false);
        assertion.strictEqual(validateOptions([]), true);
    });
});

runner.addSuite('Ask Me Copilot Tools - Simulation Tests', () => {
    runner.addTest('should simulate askExpert tool call', () => {
        const simulateAskExpert = (input: any): { success: boolean; output?: string; error?: string } => {
            if (!input.question || typeof input.question !== 'string' || input.question.trim() === '') {
                return { success: false, output: '❌ Error: Missing or invalid question' };
            }
            
            return { 
                success: true, 
                output: `Expert responded: "Based on your question '${input.question}', here's my recommendation..."` 
            };
        };
        
        const result1 = simulateAskExpert({ question: 'How to implement authentication?' });
        assertion.ok(result1.success);
        assertion.ok(result1.output?.includes('Expert responded:'));
        
        const result2 = simulateAskExpert({ question: '' });
        assertion.ok(!result2.success);
        assertion.ok(result2.output?.includes('❌ Error:'));
    });
    
    runner.addTest('should simulate selectFromList tool call', () => {
        const simulateSelectFromList = (input: any): { success: boolean; output?: string; error?: string } => {
            if (!input.question || !input.options || !Array.isArray(input.options) || input.options.length === 0) {
                return { success: false, output: '❌ Error: Missing question or options' };
            }
            
            if (!input.options.every((opt: any) => typeof opt === 'string' && opt.trim())) {
                return { success: false, output: '❌ Error: All options must be non-empty strings' };
            }
            
            return { 
                success: true, 
                output: `Expert selected: "${input.options[0]}"` 
            };
        };
        
        const result1 = simulateSelectFromList({ 
            question: 'Choose database',
            options: ['PostgreSQL', 'MongoDB', 'MySQL']
        });
        assertion.ok(result1.success);
        assertion.ok(result1.output?.includes('Expert selected:'));
        
        const result2 = simulateSelectFromList({ question: 'test', options: [] });
        assertion.ok(!result2.success);
    });
    
    runner.addTest('should simulate reviewCode tool call', () => {
        const simulateReviewCode = (input: any): { success: boolean; output?: string; error?: string } => {
            if (!input.code || !input.language || typeof input.code !== 'string' || typeof input.language !== 'string') {
                return { success: false, output: '❌ Error: Missing code or language' };
            }
            
            return { 
                success: true, 
                output: `Expert review: The ${input.language} code looks good.` 
            };
        };
        
        const result1 = simulateReviewCode({ 
            code: 'console.log("Hello");',
            language: 'javascript'
        });
        assertion.ok(result1.success);
        assertion.ok(result1.output?.includes('Expert review:'));
        
        const result2 = simulateReviewCode({ code: '', language: 'js' });
        assertion.ok(!result2.success);
    });
    
    runner.addTest('should simulate confirmAction tool call', () => {
        const simulateConfirmAction = (input: any): { success: boolean; output?: string; error?: string } => {
            if (!input.action || typeof input.action !== 'string' || input.action.trim() === '') {
                return { success: false, output: '❌ Error: Missing or invalid action' };
            }
            
            return { 
                success: true, 
                output: `Expert confirmed action: "${input.action}"` 
            };
        };
        
        const result1 = simulateConfirmAction({ action: 'Delete old files' });
        assertion.ok(result1.success);
        assertion.ok(result1.output?.includes('Expert confirmed action:'));
        
        const result2 = simulateConfirmAction({ action: '' });
        assertion.ok(!result2.success);
    });
});

runner.addSuite('Ask Me Copilot Tools - Complex Workflows', () => {
    runner.addTest('should handle sequential tool calls workflow', () => {
        const workflow = [
            {
                tool: 'askExpert',
                input: { question: 'What architecture should I use?' },
                validate: (result: any) => result.success && result.output?.includes('Expert responded:')
            },
            {
                tool: 'selectFromList',
                input: { question: 'Choose implementation', options: ['React', 'Vue', 'Angular'] },
                validate: (result: any) => result.success && result.output?.includes('Expert selected:')
            },
            {
                tool: 'reviewCode',
                input: { code: 'import React from "react";', language: 'typescript' },
                validate: (result: any) => result.success && result.output?.includes('Expert review:')
            },
            {
                tool: 'confirmAction',
                input: { action: 'Proceed with implementation' },
                validate: (result: any) => result.success && result.output?.includes('Expert confirmed action:')
            }
        ];
        
        // Simulate each step
        for (let i = 0; i < workflow.length; i++) {
            const step = workflow[i];
            let result;
            
            switch (step.tool) {
                case 'askExpert':
                    result = { success: true, output: `Expert responded: "Recommendation for ${step.input.question}"` };
                    break;
                case 'selectFromList':
                    result = { success: true, output: `Expert selected: "${(step.input as any).options?.[0] || 'First option'}"` };
                    break;
                case 'reviewCode':
                    result = { success: true, output: `Expert review: The ${step.input.language} code looks good.` };
                    break;
                case 'confirmAction':
                    result = { success: true, output: `Expert confirmed action: "${step.input.action}"` };
                    break;
                default:
                    result = { success: false, error: 'Unknown tool' };
            }
            
            assertion.ok(step.validate(result), `Workflow step ${i + 1} (${step.tool}) failed validation`);
        }
    });
});

// Run tests
if (require.main === module) {
    runner.run().catch(console.error);
}

export { runner };