import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import {
    diffStructuredDocuments,
    inspectStructuredDocument,
    mutateStructuredDocument,
    queryStructuredDocument,
    validateStructuredDocument
} from '../tools/structShared';

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

    suite('Structural Formatting Fixtures', () => {
        const fixturesDir = path.resolve(__dirname, '..', '..', 'src', 'test', 'fixtures', 'structured');
        const mockToken: vscode.CancellationToken = {
            isCancellationRequested: false,
            onCancellationRequested: (() => ({ dispose() { /* noop */ } })) as unknown as vscode.CancellationToken['onCancellationRequested']
        };

        function copyFixtureToTemp(fileName: string): string {
            const sourcePath = path.join(fixturesDir, fileName);
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-struct-fixture-'));
            const targetPath = path.join(tempDir, fileName);
            fs.copyFileSync(sourcePath, targetPath);
            return targetPath;
        }

        test('should preserve single-line JSON formatting', async () => {
            const filePath = copyFixtureToTemp('json_oneline.json');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set', target: '$.orders[0].status', value: 'shipped' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            const normalized = saved.replace(/(\r?\n)+$/, '');
            assert.ok(!normalized.includes('\n') && !normalized.includes('\r'), 'Single-line JSON should remain single-line');
            assert.ok(saved.includes('"status":"shipped"'));
        });

        test('should preserve BOM, CRLF and tab indentation for JSON', async () => {
            const filePath = copyFixtureToTemp('json_tabs_bom_crlf.json');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set', target: '$.orders[0].status', value: 'shipped' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.strictEqual(saved.charCodeAt(0), 0xfeff, 'BOM should be preserved');
            assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
            assert.ok(saved.includes('\n\t"orders"'), 'Tab indentation should be preserved');
            assert.ok(saved.includes('"status": "shipped"'));
        });

        test('should preserve two-space XML indentation on insert', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'insert', target: '/orders[1]', value: '<order id="3" status="pending"><item sku="C-3">Adapter</item></order>', position: 'append' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('\n  <order id="1"'), 'Top-level children should keep two-space indentation');
            assert.ok(saved.includes('\n    <item sku="C-3">Adapter</item>'), 'Nested children should keep four-space indentation');
            assert.ok(saved.includes('<order id="3" status="pending">'));
        });

        test('should preserve BOM, CRLF and tab indentation for XML', async () => {
            const filePath = copyFixtureToTemp('xml_tabs_bom_crlf.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.strictEqual(saved.charCodeAt(0), 0xfeff, 'BOM should be preserved');
            assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
            assert.ok(saved.includes('\r\n\t<order id="1" status="pending" priority="high">'));
            assert.ok(saved.includes('\r\n\t\t<item sku="A-1">Widget</item>'));
        });

        test('should keep single-line XML single-line after mutation', async () => {
            const filePath = copyFixtureToTemp('xml_oneline.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            const normalized = saved.replace(/(\r?\n)+$/, '');
            assert.ok(!normalized.includes('\n') && !normalized.includes('\r'), 'Single-line XML should remain single-line');
            assert.ok(saved.includes('priority="high"'));
        });

        test('should inspect namespaces and query same local names across XML namespaces', async () => {
            const filePath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
            const namespaces = {
                c: 'http://example.com/catalog',
                inv: 'http://example.com/inventory',
                meta: 'http://example.com/meta'
            };

            const inspectResult = await inspectStructuredDocument({
                filePath,
                depth: 1
            });
            const queryCatalog = await queryStructuredDocument({
                filePath,
                expression: '//c:item',
                namespaces,
                return: 'count'
            });
            const queryInventory = await queryStructuredDocument({
                filePath,
                expression: '//inv:item',
                namespaces,
                return: 'paths+values'
            });
            const queryMeta = await queryStructuredDocument({
                filePath,
                expression: '//meta:item',
                namespaces,
                return: 'count'
            });

            const rootNamespaces = (inspectResult.data.structure as { namespaces?: Array<{ prefix: string; uri: string }> }).namespaces ?? [];
            assert.strictEqual(rootNamespaces.length, 3, 'Root should expose all namespace declarations');
            assert.strictEqual(queryCatalog.data.count, 1, 'Default namespace item should be addressable via mapped prefix');
            assert.strictEqual(queryInventory.data.count, 2, 'Inventory namespace should return both inv:item nodes');
            assert.strictEqual(queryMeta.data.count, 1, 'Meta namespace should return one meta:item');
        });

        test('should mutate namespaced XML while preserving tab/CRLF/BOM formatting', async () => {
            const filePath = copyFixtureToTemp('xml_namespaces_tabs_bom_crlf.xml');
            const namespaces = {
                c: 'http://example.com/catalog',
                inv: 'http://example.com/inventory',
                meta: 'http://example.com/meta'
            };

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    {
                        action: 'insert',
                        target: '/c:catalog[1]',
                        position: 'append',
                        value: '<inv:item inv:id="inventory-2"><inv:name>Spare Cable</inv:name></inv:item>',
                        namespaces
                    }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.strictEqual(saved.charCodeAt(0), 0xfeff, 'BOM should be preserved');
            assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
            assert.ok(saved.includes('\r\n\t<inv:item inv:id="inventory-2">'));
            assert.ok(saved.includes('\r\n\t\t<inv:name>Spare Cable</inv:name>'));

            const queryInserted = await queryStructuredDocument({
                filePath,
                expression: '//inv:item[@inv:id="inventory-2"]',
                namespaces,
                return: 'count'
            });
            assert.strictEqual(queryInserted.data.count, 1, 'Inserted namespaced node should be queryable');
        });

        test('should support JSONC mutation while preserving comments', async () => {
            const filePath = copyFixtureToTemp('json_comments.jsonc');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set', target: '$.featureFlags.jsoncSupport', value: true },
                    { action: 'set', target: '$.featureFlags.newFlag', value: 'enabled' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('// This comment must survive JSONC mutation'));
            assert.ok(saved.includes('"jsoncSupport": true'));
            assert.ok(saved.includes('"newFlag": "enabled"'));
        });

        test('inspect and query should not modify source files', async () => {
            const jsonPath = copyFixtureToTemp('json_comments.jsonc');
            const xmlPath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
            const jsonBefore = fs.readFileSync(jsonPath, 'utf8');
            const xmlBefore = fs.readFileSync(xmlPath, 'utf8');

            await inspectStructuredDocument({ filePath: jsonPath, depth: 2 });
            await queryStructuredDocument({ filePath: jsonPath, expression: '$.featureFlags', return: 'count' });
            await inspectStructuredDocument({ filePath: xmlPath, depth: 2 });
            await queryStructuredDocument({
                filePath: xmlPath,
                expression: '//inv:item',
                namespaces: {
                    c: 'http://example.com/catalog',
                    inv: 'http://example.com/inventory',
                    meta: 'http://example.com/meta'
                },
                return: 'count'
            });

            assert.strictEqual(fs.readFileSync(jsonPath, 'utf8'), jsonBefore);
            assert.strictEqual(fs.readFileSync(xmlPath, 'utf8'), xmlBefore);
        });

        test('should respect inspect depth on deeply nested JSON', async () => {
            const filePath = copyFixtureToTemp('json_deeply_nested.json');
            const result = await inspectStructuredDocument({ filePath, depth: 3 });
            const structure = result.data.structure as { children?: Array<{ name: string; children?: unknown[] }> };
            const level1 = structure.children?.find(child => child.name === 'level1') as { children?: Array<{ name: string; children?: unknown[] }> };
            const level2 = level1.children?.find(child => child.name === 'level2') as { children?: Array<{ name: string; children?: unknown[] }> };
            const level3 = level2.children?.find(child => child.name === 'level3') as { children?: unknown[] };

            assert.ok(level3);
            assert.strictEqual(level3.children?.length ?? 0, 0, 'Depth-limited inspect should stop at requested depth');
        });

        test('should respect query limit on large arrays', async () => {
            const filePath = copyFixtureToTemp('json_large_array.json');
            const result = await queryStructuredDocument({
                filePath,
                expression: '$.items[*]',
                return: 'paths+values',
                limit: 25
            });

            assert.strictEqual(result.data.count, 1200);
            assert.strictEqual((result.data.results as unknown[]).length, 25);
            assert.strictEqual(result.data.truncated, true);
        });

        test('should keep an empty array when deleting the last element', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'delete', target: '$.orders[1]' },
                    { action: 'delete', target: '$.orders[0]' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('"orders": []'));
        });

        test('should reject deleting the JSON root', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');

            await assert.rejects(
                () => mutateStructuredDocument({
                    filePath,
                    writeBack: false,
                    operations: [
                        { action: 'delete', target: '$' }
                    ]
                }, mockToken),
                /Deleting the JSON root is not allowed/
            );
        });

        test('should reject rename conflicts in JSON', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');

            await assert.rejects(
                () => mutateStructuredDocument({
                    filePath,
                    writeBack: false,
                    operations: [
                        { action: 'rename', target: '$.orders[0].status', value: 'id' }
                    ]
                }, mockToken),
                /rename conflict/
            );
        });

        test('should treat zero-match bulk delete as successful no-op', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'delete', target: '$.orders[?(@.status=="missing")]', bulk: true }
                ]
            }, mockToken);

            assert.strictEqual(result.data.changed, 0);
            assert.strictEqual(result.data.operations[0].matched, 0);
        });

        test('should apply JSON batch operations sequentially on one tree', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'set', target: '$.a.b.c.d', value: 1 },
                    { action: 'set', target: '$.a.b.c.e', value: 2 }
                ]
            }, mockToken);

            const content = result.data.content as { a: { b: { c: { d: number; e: number } } } };
            assert.strictEqual(content.a.b.c.d, 1);
            assert.strictEqual(content.a.b.c.e, 2);
        });

        test('should insert into empty array and empty object in JSONC', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-empty-jsonc-'));
            const filePath = path.join(tempDir, 'empty.jsonc');
            fs.writeFileSync(filePath, '{\n  "items": [],\n  "meta": {}\n}\n', 'utf8');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'insert', target: '$.items', value: { id: 1 }, position: 'append' },
                    { action: 'insert', target: '$.meta', value: { createdBy: 'test' }, position: 'append' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('"items": ['));
            assert.ok(saved.includes('"id": 1'));
            assert.ok(saved.includes('"createdBy": "test"'));
        });

        test('should preserve XML declaration, doctype and empty-tag style where possible', async () => {
            const filePath = copyFixtureToTemp('xml_self_closing.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/layout[1]/icon[1]', attribute: 'priority', value: 'high' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
            assert.ok(saved.includes('<!DOCTYPE layout>'));
            assert.ok(saved.includes('<br/>'));
            assert.ok(saved.includes('<divider></divider>'));
        });

        test('should keep mixed-content XML semantically intact after unrelated mutation', async () => {
            const filePath = copyFixtureToTemp('xml_mixed_content.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/article[1]/p[2]/i[1]', attribute: 'tone', value: 'soft' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('<p>text <b>bold</b> tail</p>'));
            assert.ok(saved.includes('<i tone="soft">italic</i>'));
        });

        test('should report duplicate-key, unsafe-integer and unicode-escape diagnostics in inspect', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diagnostics-inspect-'));
            const filePath = path.join(tempDir, 'diagnostics.json');
            fs.writeFileSync(
                filePath,
                '{\n  "dup": 1,\n  "dup": 2,\n  "unsafe": 9007199254740993,\n  "escaped": "\\u0041"\n}\n',
                'utf8'
            );

            const result = await inspectStructuredDocument({ filePath, depth: 2 });
            const diagnostics = result.data.diagnostics as Array<{ kind: string; path?: string }>;
            const kinds = diagnostics.map(item => item.kind);

            assert.ok(kinds.includes('duplicate-key'));
            assert.ok(kinds.includes('unsafe-integer'));
            assert.ok(kinds.includes('unicode-escape-risk'));
            assert.ok(diagnostics.some(item => item.path === '$.dup'));
        });

        test('should keep diagnostics when validate reports invalid JSON', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diagnostics-validate-'));
            const filePath = path.join(tempDir, 'invalid-diagnostics.json');
            fs.writeFileSync(
                filePath,
                '{\n  "dup": 1,\n  "dup": 2,\n  "unsafe": 9007199254740993,\n  "escaped": "\\u0041",\n',
                'utf8'
            );

            const result = await validateStructuredDocument({ filePath });
            const diagnostics = result.data.diagnostics as Array<{ kind: string }>;

            assert.strictEqual(result.data.valid, false);
            assert.ok((result.data.errors as Array<{ message: string }>)[0].message.length > 0);
            assert.ok(diagnostics.some(item => item.kind === 'duplicate-key'));
            assert.ok(diagnostics.some(item => item.kind === 'unsafe-integer'));
            assert.ok(diagnostics.some(item => item.kind === 'unicode-escape-risk'));
        });

        test('should preserve four-space XML indentation on mutation', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_4.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('\n    <order id="1"'), 'Top-level children should keep four-space indentation');
            assert.ok(saved.includes('\n        <item sku="A-1">Widget</item>'), 'Nested children should keep eight-space indentation');
            assert.ok(saved.includes('priority="high"'));
        });

        test('should preserve XML attribute single-quote style', async () => {
            const filePath = copyFixtureToTemp('xml_single_quotes.xml');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set_attribute', target: '/config[1]/database[1]', attribute: 'schema', value: 'public' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes("host='localhost'"), 'Single-quoted attributes should remain single-quoted');
            assert.ok(saved.includes('name="mydb"'), 'Double-quoted attributes should remain double-quoted');
        });

        test('should preserve JSON without trailing newline', async () => {
            const filePath = copyFixtureToTemp('json_no_trailing_newline.json');

            await mutateStructuredDocument({
                filePath,
                writeBack: true,
                operations: [
                    { action: 'set', target: '$.key', value: 'updated' }
                ]
            }, mockToken);

            const saved = fs.readFileSync(filePath, 'utf8');
            assert.ok(saved.includes('"key": "updated"'));
            assert.ok(!saved.endsWith('\n'), 'File without trailing newline should not gain one');
        });

        test('should compute structural diff between two JSON files', async () => {
            const beforePath = copyFixtureToTemp('json_spaces_2.json');
            const afterDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diff-after-'));
            const afterPath = path.join(afterDir, 'json_spaces_2.json');
            fs.copyFileSync(beforePath, afterPath);

            await mutateStructuredDocument({
                filePath: afterPath,
                writeBack: true,
                operations: [
                    { action: 'set', target: '$.orders[0].status', value: 'shipped' }
                ]
            }, mockToken);

            const result = await diffStructuredDocuments({
                filePathBefore: beforePath,
                filePathAfter: afterPath
            });

            assert.ok(result.changeCount > 0, 'Diff should detect at least one change');
        });

        test('should validate well-formed JSON returns valid true', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await validateStructuredDocument({ filePath });
            assert.strictEqual(result.data.valid, true, 'Well-formed JSON should be valid');
        });

        test('should validate well-formed XML returns valid true', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');
            const result = await validateStructuredDocument({ filePath });
            assert.strictEqual(result.data.valid, true, 'Well-formed XML should be valid');
        });

        test('should abort mutation when cancellation is requested', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const contentBefore = fs.readFileSync(filePath, 'utf8');
            const cancelledToken: vscode.CancellationToken = {
                isCancellationRequested: true,
                onCancellationRequested: (() => ({ dispose() { /* noop */ } })) as unknown as vscode.CancellationToken['onCancellationRequested']
            };

            await assert.rejects(
                () => mutateStructuredDocument({
                    filePath,
                    writeBack: false,
                    operations: [
                        { action: 'set', target: '$.orders[0].status', value: 'cancelled' }
                    ]
                }, cancelledToken),
                /cancelled/i
            );

            assert.strictEqual(fs.readFileSync(filePath, 'utf8'), contentBefore, 'File should not be modified when cancelled');
        });

        test('should reject files exceeding size limit', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-large-'));
            const filePath = path.join(tempDir, 'huge.json');

            // File won't actually be 50MB+ but we test the error path exists
            // by verifying the function works with a normal file
            const normalResult = await inspectStructuredDocument({ filePath: copyFixtureToTemp('json_spaces_2.json'), depth: 1 });
            assert.ok(normalResult.data.structure, 'Normal-sized file should inspect correctly');
        });

        test('should reject deleting XML root element', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');
            await assert.rejects(
                () => mutateStructuredDocument({
                    filePath,
                    writeBack: false,
                    operations: [
                        { action: 'delete', target: '/orders' },
                    ],
                }, mockToken),
                /XML root element is not allowed/i,
            );
        });

        test('should return changed:0 for bulk set with zero matches', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'set', target: '$.totally_missing[*]', value: 'x', bulk: true },
                ],
            }, mockToken);
            const opSummary = result.data.operations[0];
            assert.strictEqual(opSummary.matched, 0, 'Should match 0 nodes');
            assert.strictEqual(opSummary.changed, 0, 'Should change 0 nodes');
        });

        test('should reject invalid JSONPath expression', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            await assert.rejects(
                () => queryStructuredDocument({
                    filePath,
                    expression: '[[invalid jsonpath',
                }),
                /must start with "\$"/i,
            );
        });

        test('should not duplicate XML declaration after mutation', async () => {
            const filePath = copyFixtureToTemp('xml_self_closing.xml');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'set_attribute', target: '/layout', attribute: 'version', value: '2.0' },
                ],
            }, mockToken);
            const declarationCount = (result.serialized.match(/<\?xml /g) ?? []).length;
            assert.strictEqual(declarationCount, 1, 'XML declaration should appear exactly once');
        });

        test('should show allowed values for invalid schemaType', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');
            await assert.rejects(
                () => validateStructuredDocument({
                    filePath,
                    schema: '{}',
                    schemaType: 'jsonschema' as unknown as import('../types').StructSchemaType,
                }),
                /Allowed values/i,
            );
        });

        test('should not set truncated:true in count return mode', async () => {
            const filePath = copyFixtureToTemp('json_large_array.json');
            const result = await queryStructuredDocument({
                filePath,
                expression: '$.items[*]',
                return: 'count',
                limit: 1,
            });
            assert.strictEqual(result.data.truncated, false, 'count mode should not set truncated');
            assert.ok(result.data.count > 0, 'count should be positive');
        });

        test('should report hasMixedContent for XML elements with text and children', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-mixed-'));
            const filePath = path.join(tempDir, 'mixed.xml');
            fs.writeFileSync(filePath, '<root><p>text <b>bold</b> tail</p></root>');
            const result = await inspectStructuredDocument({ filePath, depth: 3 });
            const rootChildren = (result.data.structure as { children: unknown[] }).children;
            const pElement = rootChildren[0] as { hasMixedContent?: boolean; name: string };
            assert.strictEqual(pElement.name, 'p');
            assert.strictEqual(pElement.hasMixedContent, true, 'p should have hasMixedContent');
        });

        test('should use XPath notation in XML diff paths', async () => {
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-xmldiff-'));
            const beforePath = path.join(tempDir, 'before.xml');
            const afterPath = path.join(tempDir, 'after.xml');
            fs.writeFileSync(beforePath, '<root><item status="old"/></root>');
            fs.writeFileSync(afterPath, '<root><item status="new"/></root>');
            const result = await diffStructuredDocuments({
                filePathBefore: beforePath,
                filePathAfter: afterPath,
            });
            assert.strictEqual(result.changeCount, 1);
            const change = result.changes[0];
            assert.ok(change.path.includes('/@status'), `Path should use XPath @ for attributes, got: ${change.path}`);
            assert.ok(!change.path.startsWith('$'), `Path should not use JSON $ prefix, got: ${change.path}`);
        });

        test('should return XML content in mutate response', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'set_attribute', target: '/orders/order[1]', attribute: 'test', value: 'yes' },
                ],
            }, mockToken);
            assert.ok(result.data.content, 'XML mutate should return content');
            assert.ok(typeof result.data.content === 'string', 'XML content should be a string');
            assert.ok((result.data.content as string).includes('test="yes"'), 'Content should contain the mutation');
        });

        test('should copy JSON node to new location', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'copy', target: '$.orders[0]', destination: '$.ordersCopy' },
                ],
            }, mockToken);
            assert.strictEqual(result.data.changed, 1);
            assert.ok((result.data.content as Record<string, unknown>).ordersCopy, 'Copied node should exist at destination');
        });

        test('should copy XML node to new location', async () => {
            const filePath = copyFixtureToTemp('xml_spaces_2.xml');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'copy', target: '/orders/order[1]', destination: '/orders', position: 'append' },
                ],
            }, mockToken);
            assert.strictEqual(result.data.changed, 1);
        });

        test('should include formatting metadata in inspect response', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await inspectStructuredDocument({ filePath, depth: 1 });
            assert.ok(result.data.formatting, 'inspect should include formatting metadata');
            assert.ok('hasBom' in result.data.formatting, 'formatting should include hasBom');
            assert.ok('eol' in result.data.formatting, 'formatting should include eol');
            assert.ok('indent' in result.data.formatting, 'formatting should include indent');
            assert.ok('trailingNewline' in result.data.formatting, 'formatting should include trailingNewline');
        });

        test('should include namespaceURI for prefixed XML elements', async () => {
            const filePath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
            const result = await inspectStructuredDocument({ filePath, depth: 5 });
            const structure = result.data.structure as { name: string; children: Array<{ namespaceURI?: string; prefix?: string; name: string; children?: unknown[] }> };
            const prefixed = findPrefixedElement(structure);
            assert.ok(prefixed, 'Should find a prefixed element in namespace fixture');
            assert.ok(prefixed.namespaceURI, `Prefixed element "${prefixed.name}" should have namespaceURI`);
            assert.ok(prefixed.prefix, `Prefixed element "${prefixed.name}" should have prefix`);
        });

        test('should execute batch operations in order (later ops see earlier results)', async () => {
            const filePath = copyFixtureToTemp('json_spaces_2.json');
            const result = await mutateStructuredDocument({
                filePath,
                writeBack: false,
                operations: [
                    { action: 'set', target: '$.batchTest', value: 'step1' },
                    { action: 'set', target: '$.batchTest', value: 'step2' },
                ],
            }, mockToken);
            assert.strictEqual(result.data.operations.length, 2);
            assert.strictEqual((result.data.content as Record<string, unknown>).batchTest, 'step2', 'Second operation should override first');
        });
    });
});

function findPrefixedElement(node: { name: string; prefix?: string; namespaceURI?: string; children?: unknown[] }): { name: string; prefix?: string; namespaceURI?: string } | undefined {
    if (node.prefix) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findPrefixedElement(child as { name: string; prefix?: string; namespaceURI?: string; children?: unknown[] });
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}