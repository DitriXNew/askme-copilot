// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';

// Enhanced logging with multiple levels
enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

class Logger {
    private channel: vscode.LogOutputChannel;
    private level: LogLevel = LogLevel.INFO;
    
    constructor(name: string) {
        this.channel = vscode.window.createOutputChannel(name, { log: true });
    }
    
    debug(message: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            this.channel.debug(`🔍 [DEBUG] ${message}`, ...args);
        }
    }
    
    info(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            this.channel.info(`✨ [INFO] ${message}`, ...args);
        }
    }
    
    warn(message: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            this.channel.warn(`⚠️ [WARN] ${message}`, ...args);
        }
    }
    
    error(message: string, error?: any) {
        this.channel.error(`❌ [ERROR] ${message}`, error);
    }
    
    setLevel(level: LogLevel) {
        this.level = level;
    }
}

let logger: Logger;

// Enhanced interfaces with validation
interface IAskExpertParameters {
    question: string;
    context?: string;
    previousAnswer?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
}

interface ISelectFromListParameters {
    question: string;
    options: string[];
    multiSelect?: boolean;
    defaultSelection?: number;
    context?: string;
}

interface IReviewCodeParameters {
    code: string;
    language: string;
    question?: string;
    focusAreas?: string[];
}

interface IConfirmActionParameters {
    action: string;
    details?: string;
}

// Response caching for better performance
class ResponseCache {
    private cache = new Map<string, { response: string; timestamp: number }>();
    private readonly TTL = 5 * 60 * 1000; // 5 minutes
    
    get(key: string): string | null {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        
        if (Date.now() - item.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        
        return item.response;
    }
    
    set(key: string, response: string) {
        this.cache.set(key, { response, timestamp: Date.now() });
    }
    
    clear() {
        this.cache.clear();
    }
}

const responseCache = new ResponseCache();

// Configuration manager
class ConfigurationManager {
    private static readonly SECTION = 'askMeCopilot';
    
    static get notificationStyle(): 'subtle' | 'normal' | 'prominent' {
        return vscode.workspace.getConfiguration(this.SECTION).get('notificationStyle', 'normal');
    }
    
    static get enableSoundNotification(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('enableSoundNotification', true);
    }
    
    static get autoFocusDialog(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('autoFocusDialog', true);
    }
    
    static get responseTimeout(): number {
        return vscode.workspace.getConfiguration(this.SECTION).get('responseTimeout', 300000); // 5 minutes
    }
}

// Analytics collector (privacy-friendly, local only)
class AnalyticsCollector {
    private metrics = {
        questionsAsked: 0,
        selectionsShown: 0,
        responsesProvided: 0,
        responseTime: [] as number[],
        canceledRequests: 0
    };
    
    trackQuestion() {
        this.metrics.questionsAsked++;
    }
    
    trackSelection() {
        this.metrics.selectionsShown++;
    }
    
    trackResponse(startTime: number) {
        this.metrics.responsesProvided++;
        this.metrics.responseTime.push(Date.now() - startTime);
    }
    
    trackCancellation() {
        this.metrics.canceledRequests++;
    }
    
    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.length > 0
            ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
            : 0;
        
        return {
            ...this.metrics,
            avgResponseTime: Math.round(avgResponseTime)
        };
    }
}

const analytics = new AnalyticsCollector();

// Enhanced notification system
async function showNotification(message: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') {
    const style = ConfigurationManager.notificationStyle;
    
    // Play sound if enabled
    if (ConfigurationManager.enableSoundNotification && priority !== 'low') {
        // VS Code doesn't support direct sound, but we can use system notifications
        // This is a placeholder for potential future enhancement
    }
    
    const iconMap = {
        low: '💭',
        normal: '🤖',
        high: '⚡',
        critical: '🚨'
    };
    
    const icon = iconMap[priority];
    const fullMessage = `${icon} Copilot needs your input: ${message}`;
    
    if (style === 'prominent' || priority === 'critical') {
        const action = await vscode.window.showInformationMessage(
            fullMessage,
            { modal: priority === 'critical' },
            'Answer Now',
            'Later'
        );
        return action === 'Answer Now';
    } else if (style === 'normal') {
        vscode.window.showInformationMessage(fullMessage);
        return true;
    } else {
        vscode.window.setStatusBarMessage(fullMessage, 5000);
        return true;
    }
}

// Activation function
export function activate(context: vscode.ExtensionContext) {
    logger = new Logger('AskMeCopilot');
    logger.info('🚀 Activating Ask Me Copilot Tool extension');
    
    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('askMeCopilot')) {
                logger.info('Configuration changed, reloading settings');
            }
        })
    );
    
    // Register all tools
    const askExpertTool = new AskExpertTool(context);
    const selectFromListTool = new SelectFromListTool(context);
    const reviewCodeTool = new ReviewCodeTool(context);
    const confirmActionTool = new ConfirmActionTool(context);
    
    context.subscriptions.push(
        vscode.lm.registerTool('ask-me-copilot-tool_askExpert', askExpertTool),
        vscode.lm.registerTool('ask-me-copilot-tool_selectFromList', selectFromListTool),
        vscode.lm.registerTool('ask-me-copilot-tool_reviewCode', reviewCodeTool),
        vscode.lm.registerTool('ask-me-copilot-tool_confirmAction', confirmActionTool)
    );
    
    logger.info('✅ Registered all language model tools');
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('askMeCopilot.showMetrics', () => {
            const metrics = analytics.getMetrics();
            vscode.window.showInformationMessage(
                `📊 Metrics: Questions: ${metrics.questionsAsked}, Selections: ${metrics.selectionsShown}, Avg Response Time: ${metrics.avgResponseTime}ms`
            );
        }),
        
        vscode.commands.registerCommand('askMeCopilot.clearCache', () => {
            responseCache.clear();
            vscode.window.showInformationMessage('🗑️ Response cache cleared');
        }),
        
        vscode.commands.registerCommand('askMeCopilot.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:DitriX.ask-me-copilot-tool');
        })
    );
    
    logger.info('✅ Ask Me Copilot Tool activated successfully!');
}

// Base class for tools with common functionality
abstract class BaseTool<T> implements vscode.LanguageModelTool<T> {
    protected context: vscode.ExtensionContext;
    protected pendingRequests = new Map<string, vscode.CancellationTokenSource>();
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    protected generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    protected validateInput(input: any, requiredFields: string[]): string | null {
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
            
            if (Array.isArray(value) && value.length === 0) {
                return `Field "${field}" cannot be an empty array`;
            }
        }
        
        return null;
    }
    
    protected createErrorResult(message: string): vscode.LanguageModelToolResult {
        logger.error(message);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`❌ Error: ${message}`)
        ]);
    }
    
    protected createCancelResult(): vscode.LanguageModelToolResult {
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('🚫 Operation cancelled by user')
        ]);
    }
    
    abstract invoke(
        options: vscode.LanguageModelToolInvocationOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.LanguageModelToolResult>;
    
    abstract prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.PreparedToolInvocation>;
}

// Enhanced Ask Expert Tool
class AskExpertTool extends BaseTool<IAskExpertParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IAskExpertParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const startTime = Date.now();
        analytics.trackQuestion();
        
        const validationError = this.validateInput(options.input, ['question']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { question, context, previousAnswer, priority = 'normal' } = options.input;
        const requestId = this.generateRequestId();
        
        logger.info(`Processing ask expert request ${requestId}`, { question, priority });
        
        // Check cache
        const cacheKey = JSON.stringify({ question, context });
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
            logger.info('Returning cached response');
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(cachedResponse)
            ]);
        }
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        const shouldAnswer = await showNotification('Expert input needed', priority);
        if (!shouldAnswer) {
            return this.createCancelResult();
        }
        
        try {
            const answer = await this.showWebViewDialog(question, context, previousAnswer);
            
            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }
            
            if (answer && answer.trim()) {
                analytics.trackResponse(startTime);
                const response = `Expert responded: "${answer}"`;
                responseCache.set(cacheKey, response);
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(response)
                ]);
            } else {
                analytics.trackCancellation();
                return this.createCancelResult();
            }
        } catch (error) {
            return this.createErrorResult(`Failed to get expert input: ${error}`);
        }
    }
    
    private async showWebViewDialog(question: string, context?: string, previousAnswer?: string): Promise<string | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'askExpertDialog',
                '🧠 Copilot Expert Input',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: []
                }
            );
            
            panel.webview.html = this.getWebviewContent();
            
            panel.webview.onDidReceiveMessage(
                message => {
                    logger.debug('Received message from webview', message);
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setData',
                                question,
                                context,
                                previousAnswer
                            });
                            break;
                        case 'submit':
                            resolve(message.text);
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            break;
                    }
                },
                undefined,
                this.context.subscriptions
            );
            
            panel.onDidDispose(() => resolve(null));
            
            if (ConfigurationManager.autoFocusDialog) {
                panel.reveal();
            }
            
            // Set timeout
            const timeout = ConfigurationManager.responseTimeout;
            if (timeout > 0) {
                setTimeout(() => {
                    if (panel.visible) {
                        vscode.window.showWarningMessage('Expert input dialog timed out');
                        panel.dispose();
                    }
                }, timeout);
            }
        });
    }
    
    private getWebviewContent(): string {
        return getAskExpertTemplate();
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IAskExpertParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        const priority = options.input.priority || 'normal';
        const priorityIcon = {
            low: '💭',
            normal: '🧠',
            high: '⚡',
            critical: '🚨'
        }[priority];
        
        return {
            invocationMessage: `${priorityIcon} Asking expert: "${options.input.question}"`,
            confirmationMessages: {
                title: 'Expert Input Request',
                message: new vscode.MarkdownString(`**Question:** ${options.input.question}\n\n**Priority:** ${priority}`)
            }
        };
    }
}

// Enhanced Select From List Tool
class SelectFromListTool extends BaseTool<ISelectFromListParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ISelectFromListParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const startTime = Date.now();
        analytics.trackSelection();
        
        const validationError = this.validateInput(options.input, ['question', 'options']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { question, options: choices, multiSelect, defaultSelection, context } = options.input;
        
        // Validate options are strings
        if (!choices.every(opt => typeof opt === 'string' && opt.trim())) {
            return this.createErrorResult('All options must be non-empty strings');
        }
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        await showNotification('Selection needed', 'normal');
        
        try {
            const result = await this.showSelectionWebView(question, choices, multiSelect, defaultSelection, context);
            
            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }
            
            if (result && result.trim()) {
                analytics.trackResponse(startTime);
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Expert selected: "${result}"`)
                ]);
            } else {
                analytics.trackCancellation();
                return this.createCancelResult();
            }
        } catch (error) {
            return this.createErrorResult(`Failed to get selection: ${error}`);
        }
    }
    
    private async showSelectionWebView(
        question: string, 
        choices: string[], 
        multiSelect?: boolean,
        defaultSelection?: number,
        context?: string
    ): Promise<string | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'selectFromListDialog',
                '🎯 Copilot Selection',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            panel.webview.html = this.getWebviewContent();
            
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setData',
                                question,
                                options: choices,
                                multiSelect,
                                defaultSelection,
                                context
                            });
                            break;
                        case 'submit':
                            resolve(message.text);
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            break;
                    }
                },
                undefined,
                this.context.subscriptions
            );
            
            panel.onDidDispose(() => resolve(null));
            
            if (ConfigurationManager.autoFocusDialog) {
                panel.reveal();
            }
        });
    }
    
    private getWebviewContent(): string {
        return getSelectFromListTemplate();
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ISelectFromListParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `🎯 Showing selection: ${options.input.options.length} options`,
            confirmationMessages: {
                title: 'Selection Request',
                message: new vscode.MarkdownString(`**${options.input.question}**\n\nOptions: ${options.input.options.join(', ')}`)
            }
        };
    }
}

// New Tool: Review Code
class ReviewCodeTool extends BaseTool<IReviewCodeParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IReviewCodeParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['code', 'language']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { code, language, question, focusAreas } = options.input;
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        await showNotification('Code review requested', 'normal');
        
        try {
            const review = await this.showCodeReviewDialog(code, language, question, focusAreas);
            
            if (review && review.trim()) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Expert review: ${review}`)
                ]);
            } else {
                return this.createCancelResult();
            }
        } catch (error) {
            return this.createErrorResult(`Failed to get code review: ${error}`);
        }
    }
    
    private async showCodeReviewDialog(
        code: string,
        language: string,
        question?: string,
        focusAreas?: string[]
    ): Promise<string | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'codeReviewDialog',
                '📝 Code Review',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            panel.webview.html = getCodeReviewTemplate();
            
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setCode',
                                code,
                                language,
                                question,
                                focusAreas
                            });
                            break;
                        case 'submit':
                            resolve(message.text);
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            break;
                    }
                },
                undefined,
                this.context.subscriptions
            );
            
            panel.onDidDispose(() => resolve(null));
        });
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IReviewCodeParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `📝 Requesting code review for ${options.input.language} code`,
            confirmationMessages: {
                title: 'Code Review Request',
                message: new vscode.MarkdownString(`Review ${options.input.language} code${options.input.focusAreas ? ` focusing on: ${options.input.focusAreas.join(', ')}` : ''}`)
            }
        };
    }
}

// New Tool: Confirm Action
class ConfirmActionTool extends BaseTool<IConfirmActionParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IConfirmActionParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['action']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { action, details } = options.input;
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        const message = details ? `${action}\n\n${details}` : action;
        const result = await vscode.window.showWarningMessage(
            `⚠️ Copilot wants to: ${message}`,
            { modal: true },
            'Proceed',
            'Cancel'
        );
        
        if (result === 'Proceed') {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('✅ Expert confirmed action')
            ]);
        } else {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('❌ Expert rejected action')
            ]);
        }
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IConfirmActionParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `⚠️ Confirming action: ${options.input.action}`,
            confirmationMessages: {
                title: 'Action Confirmation',
                message: new vscode.MarkdownString(`**Action:** ${options.input.action}`)
            }
        };
    }
}

export function deactivate() {
    logger.info('🛑 Ask Me Copilot Tool deactivated');
    const metrics = analytics.getMetrics();
    logger.info('📊 Final metrics:', metrics);
}

// ====================================================================
// ENHANCED HTML TEMPLATES
// ====================================================================

const getAskExpertTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expert Input</title>
    <style>
        :root {
            --animation-duration: 0.3s;
            --focus-glow: 0 0 0 2px var(--vscode-focusBorder);
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Variable', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
            animation: fadeIn var(--animation-duration) ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        
        .header-icon {
            font-size: 48px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .header-content h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .header-content .subtitle {
            margin-top: 5px;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .context-badge {
            display: inline-block;
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 10px;
        }
        
        .question-section {
            background: linear-gradient(135deg, 
                var(--vscode-textBlockQuote-background) 0%, 
                var(--vscode-editor-background) 100%);
            border-left: 4px solid var(--vscode-textLink-foreground);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
        }
        
        .question-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, 
                var(--vscode-textLink-foreground) 0%,
                transparent 100%);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .question-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .question-content {
            font-size: 16px;
            line-height: 1.8;
        }
        
        .question-content code {
            background: var(--vscode-textCodeBlock-background);
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 14px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .question-content pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
            position: relative;
        }
        
        .question-content pre code {
            background: none;
            padding: 0;
            border: none;
        }
        
        .context-section {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .context-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--vscode-textPreformat-foreground);
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .context-content {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .previous-answer-section {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .answer-section {
            margin-bottom: 25px;
        }
        
        .answer-label {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
            font-weight: 600;
            color: var(--vscode-input-foreground);
        }
        
        .char-counter {
            margin-left: auto;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            font-weight: normal;
        }
        
        .answer-input {
            width: 100%;
            min-height: 150px;
            padding: 16px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
            resize: vertical;
            transition: all var(--animation-duration) ease;
        }
        
        .answer-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: var(--focus-glow);
            transform: translateY(-1px);
        }
        
        .answer-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
            font-style: italic;
        }
        
        .quick-actions {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .quick-action {
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .quick-action:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            transform: translateY(-1px);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .button-group {
            display: flex;
            gap: 12px;
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
        
        .btn-secondary:hover:not(:disabled) {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .btn-danger {
            background: transparent;
            color: var(--vscode-editorError-foreground);
            border: 1px solid var(--vscode-editorError-foreground);
        }
        
        .btn-danger:hover:not(:disabled) {
            background: var(--vscode-editorError-foreground);
            color: var(--vscode-editor-background);
        }
        
        .keyboard-shortcuts {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            padding: 10px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 6px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .keyboard-shortcut {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .key {
            padding: 2px 6px;
            background: var(--vscode-button-secondaryBackground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
            animation: fadeIn 0.3s ease;
        }
        
        .status-indicator.saving {
            background: var(--vscode-notificationsInfoIcon-foreground);
            color: white;
        }
        
        @media (max-width: 600px) {
            .header {
                flex-direction: column;
                text-align: center;
            }
            
            .button-container {
                flex-direction: column;
            }
            
            .button-group {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🧠</div>
            <div class="header-content">
                <h1>GitHub Copilot Expert Input</h1>
                <div class="subtitle">Your expertise is needed to guide the AI assistant</div>
            </div>
        </div>
        
        <div class="question-section">
            <div class="question-label">COPILOT QUESTION</div>
            <div class="question-content" id="questionContent">
                <!-- Question will be loaded here -->
            </div>
        </div>
        
        <div id="contextSection" class="context-section" style="display: none;">
            <div class="context-label">ADDITIONAL CONTEXT</div>
            <div class="context-content" id="contextContent"></div>
        </div>
        
        <div id="previousAnswerSection" class="previous-answer-section" style="display: none;">
            <div class="context-label">⚠️ PREVIOUS ANSWER</div>
            <div class="context-content" id="previousAnswerContent"></div>
        </div>
        
        <div class="answer-section">
            <label class="answer-label" for="answerInput">
                Your Expert Response
                <span class="char-counter" id="charCounter">0 characters</span>
            </label>
            
            <div class="quick-actions">
                <button class="quick-action" onclick="insertTemplate('needs-clarification')">Needs Clarification</button>
                <button class="quick-action" onclick="insertTemplate('approve')">Approve</button>
                <button class="quick-action" onclick="insertTemplate('reject')">Reject with Reason</button>
                <button class="quick-action" onclick="insertTemplate('alternative')">Suggest Alternative</button>
            </div>
            
            <textarea 
                id="answerInput" 
                class="answer-input" 
                placeholder="Provide your expert guidance here..."
                autofocus
            ></textarea>
        </div>
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">
                    Cancel
                </button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-secondary" onclick="skipQuestion()">
                    Skip
                </button>
                <button class="btn btn-secondary" onclick="needMoreInfo()">
                    Need More Info
                </button>
                <button class="btn btn-primary" onclick="submit()" id="submitBtn">
                    Submit Response
                </button>
            </div>
        </div>
        
        <div class="keyboard-shortcuts">
            <div class="keyboard-shortcut">
                <span class="key">Ctrl</span> + <span class="key">Enter</span>
                <span>Submit</span>
            </div>
            <div class="keyboard-shortcut">
                <span class="key">Esc</span>
                <span>Cancel</span>
            </div>
            <div class="keyboard-shortcut">
                <span class="key">Ctrl</span> + <span class="key">S</span>
                <span>Save Draft</span>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const previousAnswerSection = document.getElementById('previousAnswerSection');
        const previousAnswerContent = document.getElementById('previousAnswerContent');
        const charCounter = document.getElementById('charCounter');
        
        // State management
        let state = vscode.getState() || {};
        
        // Templates for quick actions
        const templates = {
            'needs-clarification': 'I need more information to provide accurate guidance. Specifically:\\n\\n1. ',
            'approve': 'This approach looks good. You can proceed with the implementation.',
            'reject': 'I would not recommend this approach because:\\n\\n1. ',
            'alternative': 'Instead of the current approach, I suggest:\\n\\n'
        };
        
        // Listen for messages
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                questionContent.innerHTML = marked.parse(message.question || '');
                
                if (message.context) {
                    contextContent.innerHTML = marked.parse(message.context);
                    contextSection.style.display = 'block';
                }
                
                if (message.previousAnswer) {
                    previousAnswerContent.textContent = message.previousAnswer;
                    previousAnswerSection.style.display = 'block';
                }
                
                // Restore saved draft if exists
                if (state.draft) {
                    answerInput.value = state.draft;
                    updateCharCounter();
                }
            }
        });
        
        // Send ready message
        vscode.postMessage({ command: 'ready' });
        
        // Character counter
        function updateCharCounter() {
            charCounter.textContent = answerInput.value.length + ' characters';
        }
        
        answerInput.addEventListener('input', () => {
            updateCharCounter();
            updateButtonStates();
            saveDraft();
        });
        
        // Button state management
        function updateButtonStates() {
            const hasText = answerInput.value.trim().length > 0;
            submitBtn.disabled = !hasText;
        }
        
        // Save draft to state
        function saveDraft() {
            state.draft = answerInput.value;
            vscode.setState(state);
        }
        
        // Template insertion
        function insertTemplate(templateName) {
            const template = templates[templateName];
            if (template) {
                answerInput.value = template;
                answerInput.focus();
                // Place cursor at the end
                answerInput.setSelectionRange(answerInput.value.length, answerInput.value.length);
                updateCharCounter();
                updateButtonStates();
                saveDraft();
            }
        }
        
        // Action handlers
        function submit() {
            const text = answerInput.value.trim();
            if (text) {
                state.draft = ''; // Clear draft on submit
                vscode.setState(state);
                vscode.postMessage({
                    command: 'submit',
                    text: text
                });
            }
        }
        
        function cancel() {
            if (answerInput.value.trim() && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
            vscode.postMessage({ command: 'cancel' });
        }
        
        function skipQuestion() {
            vscode.postMessage({
                command: 'submit',
                text: '[SKIPPED] Expert chose to skip this question'
            });
        }
        
        function needMoreInfo() {
            vscode.postMessage({
                command: 'submit',
                text: '[NEEDS MORE INFO] Please provide additional context or clarification'
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveDraft();
                // Show saved indicator
                const indicator = document.createElement('span');
                indicator.className = 'status-indicator saving';
                indicator.textContent = '✓ Draft saved';
                document.querySelector('.answer-label').appendChild(indicator);
                setTimeout(() => indicator.remove(), 2000);
            }
        });
        
        // Auto-resize textarea
        answerInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400) + 'px';
        });
        
        // Initial setup
        answerInput.focus();
        updateButtonStates();
        updateCharCounter();
    </script>
</body>
</html>`;

const getSelectFromListTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selection Required</title>
    <style>
        :root {
            --animation-duration: 0.3s;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            animation: fadeIn var(--animation-duration) ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        
        .header-icon {
            font-size: 48px;
            animation: rotate 4s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .header-content h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .header-content .subtitle {
            margin-top: 5px;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 30px;
        }
        
        .question-panel {
            background: linear-gradient(135deg,
                var(--vscode-textBlockQuote-background) 0%,
                var(--vscode-editor-background) 100%);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .question-content {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 25px;
        }
        
        .context-section {
            background: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .options-panel {
            background: var(--vscode-sideBar-background);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }
        
        .options-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .option-item {
            display: flex;
            align-items: center;
            padding: 14px 16px;
            margin-bottom: 12px;
            background: var(--vscode-list-inactiveSelectionBackground);
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .option-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-list-hoverBackground);
            transform: translateX(4px);
        }
        
        .option-item.selected {
            background: var(--vscode-list-activeSelectionBackground);
            border-color: var(--vscode-focusBorder);
        }
        
        .option-item.selected::before {
            content: '✓';
            position: absolute;
            left: -25px;
            color: var(--vscode-terminal-ansiGreen);
            font-weight: bold;
        }
        
        .option-checkbox {
            margin-right: 12px;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .option-text {
            flex: 1;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .option-index {
            display: inline-block;
            width: 24px;
            height: 24px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
        }
        
        .custom-input-section {
            background: var(--vscode-input-background);
            border-radius: 12px;
            padding: 20px;
            margin-top: 25px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .custom-input-label {
            display: block;
            margin-bottom: 12px;
            font-weight: 600;
            color: var(--vscode-input-foreground);
        }
        
        .custom-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .custom-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
        
        .btn-secondary:hover:not(:disabled) {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .selected-summary {
            padding: 12px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        @media (max-width: 900px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .options-panel {
                max-height: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🎯</div>
            <div class="header-content">
                <h1>GitHub Copilot Selection</h1>
                <div class="subtitle">Select the best option to proceed</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="left-section">
                <div class="question-panel">
                    <div class="question-content" id="questionContent"></div>
                    
                    <div id="contextSection" class="context-section" style="display: none;">
                        <div style="font-weight: 600; margin-bottom: 8px;">Context:</div>
                        <div id="contextContent"></div>
                    </div>
                </div>
                
                <div class="custom-input-section">
                    <label class="custom-input-label" for="customInput">
                        Or provide a custom response:
                    </label>
                    <input 
                        type="text" 
                        id="customInput" 
                        class="custom-input" 
                        placeholder="Type your custom answer..."
                    />
                </div>
                
                <div id="selectedSummary" class="selected-summary" style="display: none;">
                    <strong>Selected:</strong> <span id="selectedText"></span>
                </div>
                
                <div class="button-container">
                    <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
                    <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit</button>
                </div>
            </div>
            
            <div class="options-panel">
                <div class="options-title">
                    <span>Available Options</span>
                    <span id="optionCount" style="font-size: 12px; color: var(--vscode-descriptionForeground);"></span>
                </div>
                <div id="optionsContainer"></div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const customInput = document.getElementById('customInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const optionsContainer = document.getElementById('optionsContainer');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const selectedSummary = document.getElementById('selectedSummary');
        const selectedText = document.getElementById('selectedText');
        const optionCount = document.getElementById('optionCount');
        
        let multiSelect = false;
        let selectedOptions = new Set();
        let defaultSelection = null;
        
        // Listen for messages
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                // Render question
                questionContent.innerHTML = marked.parse(message.question || '');
                
                // Show context if provided
                if (message.context) {
                    contextContent.innerHTML = marked.parse(message.context);
                    contextSection.style.display = 'block';
                }
                
                // Set multi-select mode
                multiSelect = message.multiSelect || false;
                defaultSelection = message.defaultSelection;
                
                // Render options
                renderOptions(message.options || []);
                
                // Update option count
                optionCount.textContent = '(' + (message.options?.length || 0) + ' options)';
            }
        });
        
        function renderOptions(options) {
            optionsContainer.innerHTML = '';
            
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                optionDiv.dataset.value = option;
                optionDiv.dataset.index = index;
                
                if (defaultSelection === index) {
                    optionDiv.classList.add('selected');
                    selectedOptions.add(option);
                }
                
                if (multiSelect) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'option-checkbox';
                    checkbox.checked = defaultSelection === index;
                    optionDiv.appendChild(checkbox);
                }
                
                const indexSpan = document.createElement('span');
                indexSpan.className = 'option-index';
                indexSpan.textContent = (index + 1).toString();
                optionDiv.appendChild(indexSpan);
                
                const textSpan = document.createElement('span');
                textSpan.className = 'option-text';
                textSpan.textContent = option;
                optionDiv.appendChild(textSpan);
                
                optionDiv.addEventListener('click', () => selectOption(optionDiv, option));
                
                optionsContainer.appendChild(optionDiv);
            });
        }
        
        function selectOption(element, value) {
            if (multiSelect) {
                const checkbox = element.querySelector('.option-checkbox');
                checkbox.checked = !checkbox.checked;
                
                if (checkbox.checked) {
                    selectedOptions.add(value);
                    element.classList.add('selected');
                } else {
                    selectedOptions.delete(value);
                    element.classList.remove('selected');
                }
            } else {
                // Single select - clear previous selection
                document.querySelectorAll('.option-item').forEach(el => {
                    el.classList.remove('selected');
                });
                
                selectedOptions.clear();
                selectedOptions.add(value);
                element.classList.add('selected');
            }
            
            updateSelectedSummary();
            updateButtonState();
        }
        
        function updateSelectedSummary() {
            if (selectedOptions.size > 0) {
                selectedText.textContent = Array.from(selectedOptions).join(', ');
                selectedSummary.style.display = 'block';
            } else {
                selectedSummary.style.display = 'none';
            }
        }
        
        function updateButtonState() {
            const hasSelection = selectedOptions.size > 0 || customInput.value.trim();
            submitBtn.disabled = !hasSelection;
        }
        
        function submit() {
            let result = '';
            
            if (customInput.value.trim()) {
                result = customInput.value.trim();
            } else if (selectedOptions.size > 0) {
                result = multiSelect 
                    ? Array.from(selectedOptions).join(', ')
                    : Array.from(selectedOptions)[0];
            }
            
            if (result) {
                vscode.postMessage({
                    command: 'submit',
                    text: result
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                submit();
            } else if (e.key === 'Escape') {
                cancel();
            } else if (e.key >= '1' && e.key <= '9' && !customInput.matches(':focus')) {
                const index = parseInt(e.key) - 1;
                const option = document.querySelector('[data-index="' + index + '"]');
                if (option) {
                    option.click();
                }
            }
        });
        
        // Update button state on custom input
        customInput.addEventListener('input', updateButtonState);
        
        // Send ready message
        vscode.postMessage({ command: 'ready' });
        
        // Initial button state
        updateButtonState();
    </script>
</body>
</html>`;

const getCodeReviewTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    <style>
        /* Base styles similar to other templates */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        
        .header-icon {
            font-size: 48px;
        }
        
        .code-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .code-section {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .code-header {
            padding: 10px 15px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            font-weight: 600;
        }
        
        .code-content {
            padding: 15px;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
        
        pre {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .review-section {
            background: var(--vscode-input-background);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .review-input {
            width: 100%;
            min-height: 200px;
            padding: 15px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        
        .focus-areas {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .focus-badge {
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">📝</div>
            <div class="header-content">
                <h1>Code Review Request</h1>
                <div class="subtitle">Please review the following code</div>
            </div>
        </div>
        
        <div id="focusAreas" class="focus-areas"></div>
        
        <div class="code-container">
            <div class="code-section">
                <div class="code-header">
                    <span id="language">Code</span>
                </div>
                <div class="code-content">
                    <pre><code id="codeContent"></code></pre>
                </div>
            </div>
        </div>
        
        <div class="review-section">
            <label style="font-weight: 600; display: block; margin-bottom: 10px;">
                Your Review:
            </label>
            <textarea 
                id="reviewInput" 
                class="review-input" 
                placeholder="Provide your code review feedback..."
            ></textarea>
        </div>
        
        <div class="button-container">
            <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="submit()">Submit Review</button>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const codeContent = document.getElementById('codeContent');
        const reviewInput = document.getElementById('reviewInput');
        const focusAreasContainer = document.getElementById('focusAreas');
        const languageLabel = document.getElementById('language');
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setCode') {
                codeContent.textContent = message.code;
                languageLabel.textContent = message.language || 'Code';
                
                // Add focus areas if provided
                if (message.focusAreas && message.focusAreas.length > 0) {
                    message.focusAreas.forEach(area => {
                        const badge = document.createElement('span');
                        badge.className = 'focus-badge';
                        badge.textContent = area;
                        focusAreasContainer.appendChild(badge);
                    });
                }
                
                // Apply syntax highlighting
                Prism.highlightElement(codeContent);
            }
        });
        
        function submit() {
            const review = reviewInput.value.trim();
            if (review) {
                vscode.postMessage({
                    command: 'submit',
                    text: review
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
        
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;