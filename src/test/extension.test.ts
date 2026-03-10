import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';

// Ensure Mocha globals are available
declare function suite(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
declare function setup(fn: () => void): void;
declare function teardown(fn: () => void): void;

suite('Unit Tests - Ask Me Copilot Extension', () => {
    let sandbox: sinon.SinonSandbox;
    
    setup(() => {
        sandbox = sinon.createSandbox();
    });
    
    teardown(() => {
        sandbox.restore();
    });
    
    suite('AskExpertTool Tests', () => {
        test('should validate required parameters', async () => {
            // Simulate the tool class behavior
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
            assert.strictEqual(validateInput(null, ['question']), 'Invalid input parameters. Expected an object.');
            assert.strictEqual(validateInput({}, ['question']), 'Missing required field: "question"');
            assert.strictEqual(validateInput({ question: '' }, ['question']), 'Field "question" cannot be empty');
            assert.strictEqual(validateInput({ question: null }, ['question']), 'Field "question" cannot be null or undefined');
            assert.strictEqual(validateInput({ question: 'Valid question' }, ['question']), null);
        });
        
        test('should prepare invocation with correct message', () => {
            const prepareInvocation = (options: any) => {
                const priority = options.input.priority || 'normal';
                const priorityIcons: Record<string, string> = {
                    low: '💭',
                    normal: '🧠',
                    high: '⚡',
                    critical: '🚨'
                };
                const priorityIcon = priorityIcons[priority] || '🧠';
                
                return {
                    invocationMessage: `${priorityIcon} Asking expert: "${options.input.question}"`,
                    confirmationMessages: {
                        title: 'Expert Input Request',
                        message: `**Question:** ${options.input.question}\\n\\n**Priority:** ${priority}`
                    }
                };
            };
            
            const result = prepareInvocation({
                input: { question: 'Test question', priority: 'high' }
            });
            
            assert.strictEqual(result.invocationMessage, '⚡ Asking expert: "Test question"');
            assert.strictEqual(result.confirmationMessages.title, 'Expert Input Request');
        });
    });
    
    suite('SelectFromListTool Tests', () => {
        test('should validate options array', () => {
            const validateOptions = (options: any[]): boolean => {
                return options.every(opt => typeof opt === 'string' && opt.trim());
            };
            
            assert.strictEqual(validateOptions(['option1', 'option2']), true);
            assert.strictEqual(validateOptions(['option1', '']), false);
            assert.strictEqual(validateOptions(['option1', null as any]), false);
            assert.strictEqual(validateOptions([]), true); // Empty array is valid for this check
        });
        
        test('should prepare invocation with options count', () => {
            const prepareInvocation = (options: any) => {
                return {
                    invocationMessage: `🎯 Showing selection: ${options.input.options.length} options`,
                    confirmationMessages: {
                        title: 'Selection Request',
                        message: `**${options.input.question}**\\n\\nOptions: ${options.input.options.join(', ')}`
                    }
                };
            };
            
            const result = prepareInvocation({
                input: { 
                    question: 'Choose approach',
                    options: ['Option A', 'Option B', 'Option C']
                }
            });
            
            assert.strictEqual(result.invocationMessage, '🎯 Showing selection: 3 options');
            assert.ok(result.confirmationMessages.message.includes('Option A, Option B, Option C'));
        });
    });
    
    suite('ReviewCodeTool Tests', () => {
        test('should validate required code and language', () => {
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
            
            assert.strictEqual(validateInput({}, ['code', 'language']), 'Missing required field: "code"');
            assert.strictEqual(validateInput({ code: 'test code' }, ['code', 'language']), 'Missing required field: "language"');
            assert.strictEqual(validateInput({ code: 'test code', language: 'typescript' }, ['code', 'language']), null);
        });
        
        test('should prepare invocation with language info', () => {
            const prepareInvocation = (options: any) => {
                return {
                    invocationMessage: `📝 Requesting code review for ${options.input.language} code`,
                    confirmationMessages: {
                        title: 'Code Review Request',
                        message: `Review ${options.input.language} code${options.input.focusAreas ? ` focusing on: ${options.input.focusAreas.join(', ')}` : ''}`
                    }
                };
            };
            
            const result = prepareInvocation({
                input: { 
                    code: 'console.log("test");',
                    language: 'javascript',
                    focusAreas: ['security', 'performance']
                }
            });
            
            assert.strictEqual(result.invocationMessage, '📝 Requesting code review for javascript code');
            assert.ok(result.confirmationMessages.message.includes('focusing on: security, performance'));
        });
    });
    
    suite('ConfirmActionTool Tests', () => {
        test('should validate action parameter', () => {
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
            
            assert.strictEqual(validateInput({}, ['action']), 'Missing required field: "action"');
            assert.strictEqual(validateInput({ action: '' }, ['action']), 'Field "action" cannot be empty');
            assert.strictEqual(validateInput({ action: 'Delete file' }, ['action']), null);
        });
        
        test('should prepare invocation with action description', () => {
            const prepareInvocation = (options: any) => {
                return {
                    invocationMessage: `⚠️ Confirming action: ${options.input.action}`,
                    confirmationMessages: {
                        title: 'Action Confirmation',
                        message: `**Action:** ${options.input.action}`
                    }
                };
            };
            
            const result = prepareInvocation({
                input: { action: 'Delete configuration file' }
            });
            
            assert.strictEqual(result.invocationMessage, '⚠️ Confirming action: Delete configuration file');
            assert.strictEqual(result.confirmationMessages.title, 'Action Confirmation');
        });
    });
    
    suite('Configuration Tests', () => {
        test('should handle default configuration values', () => {
            const getConfigValue = (key: string, defaultValue: any) => {
                const config: Record<string, any> = {
                    notificationStyle: 'normal',
                    enableSoundNotification: true,
                    autoFocusDialog: true,
                    responseTimeout: 300000,
                    enableResponseCache: true,
                    cacheTimeToLive: 300000,
                    logLevel: 'info'
                };
                return config[key] ?? defaultValue;
            };
            
            assert.strictEqual(getConfigValue('notificationStyle', 'normal'), 'normal');
            assert.strictEqual(getConfigValue('enableSoundNotification', true), true);
            assert.strictEqual(getConfigValue('responseTimeout', 300000), 300000);
            assert.strictEqual(getConfigValue('unknownKey', 'default'), 'default');
        });
    });
    
    suite('Error Handling Tests', () => {
        test('should create appropriate error messages', () => {
            const createErrorMessage = (type: string, message: string) => {
                const icons: Record<string, string> = {
                    cancel: '🚫',
                    error: '❌',
                    warning: '⚠️',
                    info: 'ℹ️'
                };
                return `${icons[type] || '❓'} ${message}`;
            };
            
            assert.strictEqual(createErrorMessage('cancel', 'Operation cancelled'), '🚫 Operation cancelled');
            assert.strictEqual(createErrorMessage('error', 'Invalid input'), '❌ Invalid input');
            assert.strictEqual(createErrorMessage('warning', 'Potential issue'), '⚠️ Potential issue');
            assert.strictEqual(createErrorMessage('unknown', 'Unknown message'), '❓ Unknown message');
        });
        
        test('should validate required fields correctly', () => {
            const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
                const errors: string[] = [];
                
                if (!data || typeof data !== 'object') {
                    errors.push('Data must be an object');
                    return errors;
                }
                
                for (const field of requiredFields) {
                    if (!(field in data)) {
                        errors.push(`Missing required field: ${field}`);
                    } else if (data[field] === null || data[field] === undefined) {
                        errors.push(`Field ${field} cannot be null or undefined`);
                    } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                        errors.push(`Field ${field} cannot be empty`);
                    }
                }
                
                return errors;
            };
            
            const errors1 = validateRequiredFields(null, ['test']);
            assert.strictEqual(errors1.length, 1);
            assert.strictEqual(errors1[0], 'Data must be an object');
            
            const errors2 = validateRequiredFields({}, ['field1', 'field2']);
            assert.strictEqual(errors2.length, 2);
            
            const errors3 = validateRequiredFields({ field1: 'value', field2: '' }, ['field1', 'field2']);
            assert.strictEqual(errors3.length, 1);
            assert.ok(errors3[0].includes('cannot be empty'));
            
            const errors4 = validateRequiredFields({ field1: 'value', field2: 'value' }, ['field1', 'field2']);
            assert.strictEqual(errors4.length, 0);
        });
    });
    
    suite('ExpertMonitorState Tests', () => {
        test('should manage pause state correctly', () => {
            // Simulate state management
            let isPaused = false;
            let pauseResolve: (() => void) | null = null;
            let pausePromise: Promise<void> | null = null;
            
            const setPaused = (paused: boolean) => {
                isPaused = paused;
                if (paused) {
                    pausePromise = new Promise(resolve => {
                        pauseResolve = resolve;
                    });
                } else {
                    if (pauseResolve) {
                        pauseResolve();
                        pauseResolve = null;
                    }
                    pausePromise = null;
                }
            };
            
            // Test pause
            setPaused(true);
            assert.strictEqual(isPaused, true);
            assert.ok(pausePromise !== null, 'Pause promise should be created');
            
            // Test unpause
            setPaused(false);
            assert.strictEqual(isPaused, false);
            assert.strictEqual(pauseResolve, null, 'Pause resolve should be cleared');
        });
        
        test('should manage shouldAskExpert toggle', () => {
            let shouldAskExpert = false;
            
            const setShouldAskExpert = (value: boolean) => {
                shouldAskExpert = value;
            };
            
            const consumeShouldAskExpert = (): boolean => {
                const current = shouldAskExpert;
                shouldAskExpert = false;
                return current;
            };
            
            // Set to true
            setShouldAskExpert(true);
            assert.strictEqual(shouldAskExpert, true);
            
            // Consume - should return true and reset to false
            const consumed = consumeShouldAskExpert();
            assert.strictEqual(consumed, true);
            assert.strictEqual(shouldAskExpert, false);
            
            // Consume again - should return false
            const consumedAgain = consumeShouldAskExpert();
            assert.strictEqual(consumedAgain, false);
        });
        
        test('should manage message queue', () => {
            interface TestMessage {
                id: string;
                text: string;
                status: 'pending' | 'delivered';
            }
            
            let messages: TestMessage[] = [];
            
            const addMessage = (text: string) => {
                messages.push({
                    id: Date.now().toString(),
                    text,
                    status: 'pending'
                });
            };
            
            const consumePendingMessages = () => {
                const pending = messages.filter(m => m.status === 'pending');
                pending.forEach(m => m.status = 'delivered');
                return pending;
            };
            
            // Add messages
            addMessage('First message');
            addMessage('Second message');
            assert.strictEqual(messages.length, 2);
            
            // Consume pending
            const consumed = consumePendingMessages();
            assert.strictEqual(consumed.length, 2);
            assert.strictEqual(messages[0].status, 'delivered');
            assert.strictEqual(messages[1].status, 'delivered');
            
            // Consume again - should be empty
            const consumedAgain = consumePendingMessages();
            assert.strictEqual(consumedAgain.length, 0);
        });
        
        test('should remove messages by id', () => {
            interface TestMessage {
                id: string;
                text: string;
            }
            
            let messages: TestMessage[] = [
                { id: '1', text: 'First' },
                { id: '2', text: 'Second' },
                { id: '3', text: 'Third' }
            ];
            
            const removeMessage = (id: string) => {
                messages = messages.filter(m => m.id !== id);
            };
            
            removeMessage('2');
            assert.strictEqual(messages.length, 2);
            assert.strictEqual(messages.find(m => m.id === '2'), undefined);
            assert.strictEqual(messages[0].id, '1');
            assert.strictEqual(messages[1].id, '3');
        });
    });
    
    suite('CheckTaskStatusTool Tests', () => {
        test('should return correct status when paused', () => {
            const getStatusResult = (isPaused: boolean, shouldAskExpert: boolean, pendingMessages: any[]) => {
                const results: string[] = [];
                
                if (isPaused) {
                    results.push('⏸️ Expert has paused execution. Waiting for resume...');
                }
                
                if (shouldAskExpert) {
                    results.push('🧠 **Expert wants to be consulted!** Please use the askExpert tool.');
                }
                
                if (pendingMessages.length > 0) {
                    results.push(`📨 **${pendingMessages.length} message(s) from expert:**`);
                    pendingMessages.forEach((msg, i) => {
                        results.push(`${i + 1}. ${msg.text}`);
                    });
                }
                
                if (results.length === 0) {
                    results.push('✅ No pending actions from expert. Continue with your task.');
                }
                
                return results.join('\n');
            };
            
            // Test paused
            const pausedResult = getStatusResult(true, false, []);
            assert.ok(pausedResult.includes('paused'));
            
            // Test ask expert
            const askExpertResult = getStatusResult(false, true, []);
            assert.ok(askExpertResult.includes('Expert wants to be consulted'));
            
            // Test with messages
            const messagesResult = getStatusResult(false, false, [
                { text: 'Check file X' },
                { text: 'Review changes' }
            ]);
            assert.ok(messagesResult.includes('2 message(s)'));
            assert.ok(messagesResult.includes('Check file X'));
            
            // Test no actions
            const noActionsResult = getStatusResult(false, false, []);
            assert.ok(noActionsResult.includes('No pending actions'));
        });
        
        test('should prepare correct invocation message', () => {
            const prepareInvocation = (reason?: string) => {
                const reasonText = reason ? ` (${reason})` : '';
                return {
                    invocationMessage: `📊 Checking task status${reasonText}...`
                };
            };
            
            const result1 = prepareInvocation();
            assert.strictEqual(result1.invocationMessage, '📊 Checking task status...');
            
            const result2 = prepareInvocation('After completing file edit');
            assert.strictEqual(result2.invocationMessage, '📊 Checking task status (After completing file edit)...');
        });
    });
    
    suite('QuestionnaireTool Tests', () => {
        test('should validate required parameters', () => {
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
            
            assert.strictEqual(validateInput({}, ['title', 'sections']), 'Missing required field: "title"');
            assert.strictEqual(validateInput({ title: 'Test' }, ['title', 'sections']), 'Missing required field: "sections"');
            assert.strictEqual(validateInput({ title: '', sections: [] }, ['title', 'sections']), 'Field "title" cannot be empty');
            assert.strictEqual(validateInput({ title: 'Test', sections: [] }, ['title', 'sections']), null);
        });
        
        test('should validate sections structure', () => {
            const validateSections = (sections: any[]): string | null => {
                if (!Array.isArray(sections) || sections.length === 0) {
                    return 'Sections must be a non-empty array';
                }
                
                for (const section of sections) {
                    if (!section.title || !Array.isArray(section.fields)) {
                        return 'Each section must have a title and fields array';
                    }
                    
                    for (const field of section.fields) {
                        if (!field.name || !field.type || !field.label) {
                            return 'Each field must have name, type, and label';
                        }
                        
                        const validTypes = ['text', 'checkbox', 'radio', 'select', 'number', 'textarea'];
                        if (!validTypes.includes(field.type)) {
                            return `Invalid field type: ${field.type}`;
                        }
                        
                        if ((field.type === 'radio' || field.type === 'select') && (!field.options || field.options.length === 0)) {
                            return `Field "${field.name}" of type "${field.type}" requires options array`;
                        }
                    }
                }
                
                return null;
            };
            
            // Empty array
            assert.strictEqual(validateSections([]), 'Sections must be a non-empty array');
            
            // Section without title
            assert.strictEqual(validateSections([{ fields: [] }]), 'Each section must have a title and fields array');
            
            // Section without fields
            assert.strictEqual(validateSections([{ title: 'Test' }]), 'Each section must have a title and fields array');
            
            // Field without required properties
            assert.strictEqual(
                validateSections([{ title: 'Test', fields: [{ name: 'test' }] }]),
                'Each field must have name, type, and label'
            );
            
            // Invalid field type
            assert.strictEqual(
                validateSections([{ title: 'Test', fields: [{ name: 'test', type: 'invalid', label: 'Test' }] }]),
                'Invalid field type: invalid'
            );
            
            // Radio without options
            assert.strictEqual(
                validateSections([{ title: 'Test', fields: [{ name: 'test', type: 'radio', label: 'Test' }] }]),
                'Field "test" of type "radio" requires options array'
            );
            
            // Select without options
            assert.strictEqual(
                validateSections([{ title: 'Test', fields: [{ name: 'test', type: 'select', label: 'Test', options: [] }] }]),
                'Field "test" of type "select" requires options array'
            );
            
            // Valid sections
            assert.strictEqual(
                validateSections([{ 
                    title: 'Test', 
                    fields: [
                        { name: 'text1', type: 'text', label: 'Text Field' },
                        { name: 'check1', type: 'checkbox', label: 'Checkbox' },
                        { name: 'radio1', type: 'radio', label: 'Radio', options: ['A', 'B'] },
                        { name: 'select1', type: 'select', label: 'Select', options: ['X', 'Y'] },
                        { name: 'num1', type: 'number', label: 'Number' },
                        { name: 'area1', type: 'textarea', label: 'Textarea' }
                    ] 
                }]),
                null
            );
        });
        
        test('should validate conditional showWhen logic', () => {
            const shouldShowField = (field: any, values: Record<string, any>): boolean => {
                if (!field.showWhen) {
                    return true;
                }
                
                const { field: dependsOn, value: requiredValue } = field.showWhen;
                const currentValue = values[dependsOn];
                
                return currentValue === requiredValue;
            };
            
            const testField = { 
                name: 'strictMode', 
                type: 'radio', 
                label: 'Strict Mode',
                showWhen: { field: 'useTypescript', value: true }
            };
            
            // Should not show when condition not met
            assert.strictEqual(shouldShowField(testField, { useTypescript: false }), false);
            assert.strictEqual(shouldShowField(testField, {}), false);
            
            // Should show when condition is met
            assert.strictEqual(shouldShowField(testField, { useTypescript: true }), true);
            
            // Field without showWhen should always show
            assert.strictEqual(shouldShowField({ name: 'test', type: 'text', label: 'Test' }, {}), true);
        });
        
        test('should prepare invocation with section and field count', () => {
            const prepareInvocation = (options: any) => {
                const sectionCount = options.input.sections?.length || 0;
                const fieldCount = options.input.sections?.reduce(
                    (acc: number, s: any) => acc + (s.fields?.length || 0), 
                    0
                ) || 0;
                
                return {
                    invocationMessage: `📋 Opening questionnaire: "${options.input.title}"`,
                    confirmationMessages: {
                        title: 'Questionnaire',
                        message: `Questionnaire with ${sectionCount} section(s) and ${fieldCount} field(s)`
                    }
                };
            };
            
            const result = prepareInvocation({
                input: {
                    title: 'Project Configuration',
                    sections: [
                        { title: 'Basic', fields: [{ name: 'a' }, { name: 'b' }] },
                        { title: 'Advanced', fields: [{ name: 'c' }] }
                    ]
                }
            });
            
            assert.strictEqual(result.invocationMessage, '📋 Opening questionnaire: "Project Configuration"');
            assert.ok(result.confirmationMessages.message.includes('2 section(s)'));
            assert.ok(result.confirmationMessages.message.includes('3 field(s)'));
        });
        
        test('should format result with field comments', () => {
            const formatResult = (result: {
                values: Record<string, any>;
                fieldComments?: Record<string, string>;
                comment?: string;
            }): string => {
                let responseText = 'Expert completed questionnaire:\n\n';
                
                responseText += '**Values:**\n';
                for (const [key, value] of Object.entries(result.values)) {
                    if (value !== '' && value !== false) {
                        responseText += `- ${key}: ${value}`;
                        if (result.fieldComments && result.fieldComments[key]) {
                            responseText += ` *(Comment: ${result.fieldComments[key]})*`;
                        }
                        responseText += '\n';
                    }
                }
                
                // Add standalone comments for empty/false fields
                if (result.fieldComments) {
                    for (const [key, comment] of Object.entries(result.fieldComments)) {
                        const value = result.values[key];
                        if (value === '' || value === false) {
                            responseText += `- ${key}: *(Comment: ${comment})*\n`;
                        }
                    }
                }
                
                if (result.comment) {
                    responseText += `\n**Additional Comment:**\n${result.comment}\n`;
                }
                
                return responseText;
            };
            
            // Test with values and field comments
            const result1 = formatResult({
                values: { projectName: 'MyApp', useTypescript: true, database: 'postgres' },
                fieldComments: { projectName: 'Use lowercase in production' },
                comment: 'Overall comment here'
            });
            
            assert.ok(result1.includes('projectName: MyApp'));
            assert.ok(result1.includes('Comment: Use lowercase in production'));
            assert.ok(result1.includes('useTypescript: true'));
            assert.ok(result1.includes('database: postgres'));
            assert.ok(result1.includes('**Additional Comment:**'));
            assert.ok(result1.includes('Overall comment here'));
            
            // Test with comment on empty field
            const result2 = formatResult({
                values: { enabled: false },
                fieldComments: { enabled: 'Disabled for security reasons' }
            });
            
            assert.ok(result2.includes('enabled: *(Comment: Disabled for security reasons)*'));
        });
        
        test('should handle all field types', () => {
            const getDefaultValue = (field: any): any => {
                switch (field.type) {
                    case 'text':
                    case 'textarea':
                        return field.defaultValue || '';
                    case 'number':
                        return field.defaultValue !== undefined ? field.defaultValue : 0;
                    case 'checkbox':
                        return field.defaultValue || false;
                    case 'radio':
                    case 'select':
                        return field.defaultValue || (field.options ? field.options[0] : '');
                    default:
                        return '';
                }
            };
            
            // Test each field type
            assert.strictEqual(getDefaultValue({ type: 'text' }), '');
            assert.strictEqual(getDefaultValue({ type: 'text', defaultValue: 'hello' }), 'hello');
            
            assert.strictEqual(getDefaultValue({ type: 'textarea' }), '');
            assert.strictEqual(getDefaultValue({ type: 'textarea', defaultValue: 'multiline' }), 'multiline');
            
            assert.strictEqual(getDefaultValue({ type: 'number' }), 0);
            assert.strictEqual(getDefaultValue({ type: 'number', defaultValue: 42 }), 42);
            
            assert.strictEqual(getDefaultValue({ type: 'checkbox' }), false);
            assert.strictEqual(getDefaultValue({ type: 'checkbox', defaultValue: true }), true);
            
            assert.strictEqual(getDefaultValue({ type: 'radio', options: ['A', 'B'] }), 'A');
            assert.strictEqual(getDefaultValue({ type: 'radio', options: ['A', 'B'], defaultValue: 'B' }), 'B');
            
            assert.strictEqual(getDefaultValue({ type: 'select', options: ['X', 'Y'] }), 'X');
            assert.strictEqual(getDefaultValue({ type: 'select', options: ['X', 'Y'], defaultValue: 'Y' }), 'Y');
        });
    });
});
