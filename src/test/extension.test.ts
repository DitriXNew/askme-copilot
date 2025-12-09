import * as assert from 'assert';
import * as sinon from 'sinon';

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
});