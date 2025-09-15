// src/extension.ts
import * as vscode from 'vscode';

let logger: vscode.LogOutputChannel;

export function activate(context: vscode.ExtensionContext) {
    logger = vscode.window.createOutputChannel('AskMeCopilot', { log: true });
    logger.info('🚀 [ASK-ME-COPILOT] Activating extension');

    // Register tools
    context.subscriptions.push(
        vscode.lm.registerTool('ask-me-copilot-tool_askExpert', new AskExpertTool(context)),
        vscode.lm.registerTool('ask-me-copilot-tool_selectFromList', new SelectFromListTool(context))
    );

    logger.info('✅ [ASK-ME-COPILOT] All Language Model Tools registered successfully!');
}

// Interfaces for parameters
interface IAskExpertParameters {
    question: string;
}

interface ISelectFromListParameters {
    question: string;
    options: string[];
}

// Helper: show notification
async function showNotification(message: string) {
    // Show VS Code notification with sound
    vscode.window.showInformationMessage(`🤖 Copilot needs your attention: ${message}`, 'OK');
}

// Helper function to load HTML template
function getAskExpertTemplate(): string {
    return ASK_EXPERT_TEMPLATE;
}

function getSelectFromListTemplate(): string {
    return SELECT_FROM_LIST_TEMPLATE;
}

// Tool for text input using a polished WebView
class AskExpertTool implements vscode.LanguageModelTool<IAskExpertParameters> {
    constructor(private context: vscode.ExtensionContext) {}

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IAskExpertParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        logger.info('AskExpertTool.invoke called with options:', JSON.stringify(options.input, null, 2));
        
        // Validate input parameters
        try {
            if (!options.input || typeof options.input !== 'object') {
                logger.error('Error: Invalid input parameters');
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: Invalid input parameters. Please retry your request with correct format: { "question": "your question" }')
                ]);
            }

            if (!options.input.question || typeof options.input.question !== 'string' || options.input.question.trim() === '') {
                logger.error('Error: Missing or empty question parameter');
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: Missing or empty "question" parameter. Please retry your request with a valid question.')
                ]);
            }
        } catch (error) {
            logger.error('Error parsing input parameters:', error);
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('❌ Error: Failed to parse input parameters. Please retry your request with valid JSON format.')
            ]);
        }

        const { question } = options.input;
        logger.info('Question:', question);

        if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        // Show notification before opening dialog
        await showNotification('Please answer the question');

        const answer = await this.showWebViewDialog(question);

        if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        if (answer !== null && answer.trim() !== '') {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Expert answered: "${answer}"`)
            ]);
        } else {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('Expert cancelled input or provided an empty answer')
            ]);
        }
    }

    private async showWebViewDialog(question: string): Promise<string | null> {
        logger.info('🔥 [AskExpertTool] Creating webview dialog for question:', question);
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'askExpertDialog',
                'Copilot asks',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            logger.info('📋 [AskExpertTool] Webview panel created');

            // Set HTML content with template
            panel.webview.html = this.getWebviewContent();
            logger.info('🎨 [AskExpertTool] HTML content set');

            // Send question data to webview after it loads
            panel.webview.onDidReceiveMessage(
                message => {
                    logger.info('AskExpertTool: Received message from webview:', message);
                    switch (message.command) {
                        case 'ready':
                            // WebView is ready, send the question data
                            panel.webview.postMessage({
                                command: 'setQuestion',
                                question: question
                            });
                            break;
                        case 'submit':
                            logger.info('AskExpertTool: Submit with text:', message.text);
                            resolve(message.text);
                            panel.dispose();
                            return;
                        case 'cancel':
                            logger.info('AskExpertTool: Cancel action');
                            resolve(null);
                            panel.dispose();
                            return;
                    }
                },
                undefined,
                this.context.subscriptions
            );

            // Handle panel disposal
            panel.onDidDispose(() => {
                resolve(null);
            }, null, this.context.subscriptions);
        });
    }

    private getWebviewContent(): string {
        return getAskExpertTemplate();
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IAskExpertParameters>,
        _token: vscode.CancellationToken
    ) {
        return {
            invocationMessage: `Asking the expert: "${options.input.question}"`,
            confirmationMessages: {
                title: 'Expert Input Request',
                message: new vscode.MarkdownString(`Show dialog with question: **${options.input.question}**`)
            }
        };
    }
}

// Tool for selecting from a list
class SelectFromListTool implements vscode.LanguageModelTool<ISelectFromListParameters> {
    constructor(private context: vscode.ExtensionContext) {}

    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ISelectFromListParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        // Validate input parameters
        try {
            if (!options.input || typeof options.input !== 'object') {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: Invalid input parameters. Please retry your request with correct format: { "question": "your question", "options": ["option1", "option2"] }')
                ]);
            }

            if (!options.input.question || typeof options.input.question !== 'string' || options.input.question.trim() === '') {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: Missing or empty "question" parameter. Please retry your request with a valid question.')
                ]);
            }

            if (!options.input.options || !Array.isArray(options.input.options) || options.input.options.length === 0) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: Missing or empty "options" array. Please retry your request with at least one option in the array.')
                ]);
            }

            if (!options.input.options.every(option => typeof option === 'string' && option.trim() !== '')) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart('❌ Error: All options must be non-empty strings. Please retry your request with valid options.')
                ]);
            }
        } catch (error) {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('❌ Error: Failed to parse input parameters. Please retry your request with valid JSON format.')
            ]);
        }

        const { question, options: choices } = options.input;

        if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        // Show notification before opening selection dialog
        await showNotification('Please select an option');

        const result = await this.showSelectionWebView(question, choices);

        if (token.isCancellationRequested) {
            throw new vscode.CancellationError();
        }

        if (result && result.trim() !== '') {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(`Expert selected: "${result}"`)
            ]);
        } else {
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart('Expert cancelled selection')
            ]);
        }
    }

    private async showSelectionWebView(question: string, choices: string[]): Promise<string | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'selectFromListDialog',
                'Copilot asks',
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
                            // WebView is ready, send the data
                            panel.webview.postMessage({
                                command: 'setData',
                                question: question,
                                options: choices
                            });
                            break;
                        case 'submit':
                            resolve(message.text);
                            panel.dispose();
                            return;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            return;
                    }
                },
                undefined,
                this.context.subscriptions
            );

            panel.onDidDispose(() => {
                resolve(null);
            }, null, this.context.subscriptions);
        });
    }

    private getWebviewContent(): string {
        return getSelectFromListTemplate();
    }

    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ISelectFromListParameters>,
        _token: vscode.CancellationToken
    ) {
        return {
            invocationMessage: `Showing selection list: ${options.input.options.join(', ')}`,
            confirmationMessages: {
                title: 'Expert selection required',
                message: new vscode.MarkdownString(`**${options.input.question}**\n\nOptions: ${options.input.options.join(', ')}`)
            }
        };
    }
}

export function deactivate() {
    logger.info('Ask Me Copilot extension deactivated');
}

// ====================================================================
// EMBEDDED HTML TEMPLATES
// ====================================================================

const ASK_EXPERT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Question</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 12px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .question-container {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .question-content {
            font-size: 16px;
        }
        
        .question-content h1, .question-content h2, .question-content h3 {
            margin-top: 0;
            color: var(--vscode-textPreformat-foreground);
        }
        
        .question-content code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
        
        .question-content pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .question-content pre code {
            background: none;
            padding: 0;
        }
        
        .question-content blockquote {
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            margin: 0;
            padding-left: 20px;
            color: var(--vscode-textBlockQuote-foreground);
            background: var(--vscode-textBlockQuote-background);
            padding: 15px 20px;
            border-radius: 0 8px 8px 0;
        }
        
        .answer-container {
            margin-bottom: 20px;
        }
        
        .answer-label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: var(--vscode-input-foreground);
        }
        
        .answer-input {
            width: 100%;
            min-height: 120px;
            padding: 15px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            line-height: 1.5;
            resize: vertical;
            box-sizing: border-box;
            transition: border-color 0.2s ease;
        }
        
        .answer-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .answer-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        
        .header-icon {
            font-size: 32px;
        }
        
        .header-text h1 {
            margin: 0;
            color: var(--vscode-foreground);
            font-size: 24px;
            font-weight: 600;
        }
        
        .header-text .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
            font-size: 14px;
        }
        
        /* Styles for markdown lists */
        .question-content ul, .question-content ol {
            padding-left: 20px;
        }
        
        .question-content li {
            margin-bottom: 5px;
        }
        
        /* Styles for tables */
        .question-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 15px 0;
        }
        
        .question-content th, .question-content td {
            border: 1px solid var(--vscode-panel-border);
            padding: 8px 12px;
            text-align: left;
        }
        
        .question-content th {
            background: var(--vscode-textCodeBlock-background);
            font-weight: 600;
        }
        
        .context-container {
            margin-top: 15px;
            padding: 12px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 6px;
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        
        .context-label {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-textLink-foreground);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .context-content {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🧠</div>
            <div class="header-text">
                <h1>GitHub Copilot</h1>
                <div class="subtitle">Asking expert for input</div>
            </div>
        </div>
        
        <div class="question-container">
            <div class="question-content" id="questionContent">
                <!-- Question will be loaded here via JavaScript -->
            </div>
        </div>
        
        <div class="answer-container">
            <label class="answer-label" for="answerInput">Expert's answer:</label>
            <textarea 
                id="answerInput" 
                class="answer-input" 
                placeholder="Enter your answer..."
                autofocus
            ></textarea>
        </div>
        
        <div class="button-container">
            <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button class="btn btn-secondary" onclick="continueAction()">Continue</button>
            <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit</button>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        console.log('🎯 [WEBVIEW] Script starting');
        const vscode = acquireVsCodeApi();
        console.log('📡 [WEBVIEW] VSCode API acquired:', !!vscode);
        
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        
        console.log('🔍 [WEBVIEW] Elements found:', {
            answerInput: !!answerInput,
            submitBtn: !!submitBtn,
            questionContent: !!questionContent
        });
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('📨 [WEBVIEW] Received message:', message);
            
            if (message.command === 'setQuestion') {
                const questionHtml = marked.parse(message.question);
                questionContent.innerHTML = questionHtml;
                console.log('✅ [WEBVIEW] Question set with Markdown rendering');
            }
        });
        
        // Send ready message to extension
        vscode.postMessage({ command: 'ready' });
        console.log('📤 [WEBVIEW] Ready message sent');
        
        // Handle Ctrl+Enter to submit
        answerInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                submit();
            }
        });
        
        // Handle Escape to cancel
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                cancel();
            }
        });
        
        // Auto-focus on input field
        answerInput.focus();
        
        function submit() {
            console.log('🔴 [WEBVIEW] Submit button clicked');
            if (!answerInput) {
                console.error('❌ [WEBVIEW] Answer input not found!');
                return;
            }
            const text = answerInput.value.trim();
            console.log('📝 [WEBVIEW] Answer text:', text);
            if (text) {
                console.log('📤 [WEBVIEW] Sending submit message to extension');
                try {
                    vscode.postMessage({
                        command: 'submit',
                        text: text
                    });
                    console.log('✅ [WEBVIEW] Submit message sent successfully');
                } catch (error) {
                    console.error('❌ [WEBVIEW] Error sending submit message:', error);
                }
            } else {
                console.log('⚠️ [WEBVIEW] Empty answer, not submitting');
            }
        }
        
        function cancel() {
            console.log('🟡 [WEBVIEW] Cancel button clicked');
            try {
                vscode.postMessage({
                    command: 'cancel'
                });
                console.log('✅ [WEBVIEW] Cancel message sent successfully');
            } catch (error) {
                console.error('❌ [WEBVIEW] Error sending cancel message:', error);
            }
        }
        
        function continueAction() {
            console.log('🟢 [WEBVIEW] Continue button clicked');
            try {
                vscode.postMessage({
                    command: 'submit',
                    text: 'Continue'
                });
                console.log('✅ [WEBVIEW] Continue message sent successfully');
            } catch (error) {
                console.error('❌ [WEBVIEW] Error sending continue message:', error);
            }
        }
        
        // Update button state
        answerInput.addEventListener('input', function() {
            submitBtn.disabled = !answerInput.value.trim();
        });
        
        // Initially button is disabled
        submitBtn.disabled = true;
    </script>
</body>
</html>`;

const SELECT_FROM_LIST_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Copilot Selection</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 12px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            display: flex;
            gap: 20px;
        }
        
        .left-panel {
            flex: 1;
            min-width: 0;
        }
        
        .right-panel {
            flex: 0 0 300px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            grid-column: 1 / -1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
        }
        
        .header-icon {
            font-size: 32px;
        }
        
        .header-text h1 {
            margin: 0;
            color: var(--vscode-foreground);
            font-size: 24px;
            font-weight: 600;
        }
        
        .header-text .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-top: 8px;
            font-size: 14px;
        }
        
        .question-container {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .question-content {
            font-size: 16px;
        }
        
        .options-container {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
        }
        
        .options-title {
            font-weight: 600;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
            font-size: 16px;
        }
        
        .option-item {
            padding: 12px 15px;
            margin-bottom: 8px;
            background: var(--vscode-list-inactiveSelectionBackground);
            border: 1px solid var(--vscode-list-inactiveSelectionBackground);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .option-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-list-hoverBackground);
        }
        
        .option-item:last-child {
            margin-bottom: 0;
        }
        
        .custom-input-container {
            margin-top: 20px;
        }
        
        .custom-input-label {
            display: block;
            margin-bottom: 10px;
            font-weight: 600;
            color: var(--vscode-input-foreground);
        }
        
        .custom-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        .custom-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 1px var(--vscode-focusBorder);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 30px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        @media (max-width: 800px) {
            .container {
                flex-direction: column;
            }
            
            .right-panel {
                flex: none;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-icon">🎯</div>
        <div class="header-text">
            <h1>GitHub Copilot</h1>
            <div class="subtitle">Expert selection required</div>
        </div>
    </div>

    <div class="container">
        <div class="left-panel">
            <div class="question-container">
                <div class="question-content" id="questionContent"></div>
            </div>
            
            <div class="custom-input-container">
                <label class="custom-input-label" for="customInput">Or enter custom text:</label>
                <input type="text" id="customInput" class="custom-input" placeholder="Type your custom response..." />
            </div>
            
            <div class="button-container">
                <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
                <button class="btn btn-secondary" onclick="continueAction()">Continue</button>
                <button class="btn btn-primary" onclick="submitCustom()" id="submitBtn">Submit Custom</button>
            </div>
        </div>
        
        <div class="right-panel">
            <div class="options-container">
                <div class="options-title">Available Options:</div>
                <div id="optionsContainer">
                    <!-- Options will be loaded here via JavaScript -->
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const customInput = document.getElementById('customInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const optionsContainer = document.getElementById('optionsContainer');
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            console.log('📨 [WEBVIEW] Received message:', message);
            
            if (message.command === 'setData') {
                // Render question with Markdown
                const questionHtml = marked.parse(message.question);
                questionContent.innerHTML = questionHtml;
                
                // Render options
                const optionsHtml = message.options.map(option => 
                    \`<div class="option-item" onclick="selectOption('\${option.replace(/'/g, "\\\\'")}')">\${option}</div>\`
                ).join('');
                optionsContainer.innerHTML = optionsHtml;
                
                console.log('✅ [WEBVIEW] Question and options set with Markdown rendering');
            }
        });
        
        // Send ready message to extension
        vscode.postMessage({ command: 'ready' });
        console.log('📤 [WEBVIEW] Ready message sent');
        
        function selectOption(option) {
            const customText = customInput.value.trim();
            let response = option;
            if (customText) {
                response += ' | ' + customText;
            }
            vscode.postMessage({
                command: 'submit',
                text: response
            });
        }
        
        function submitCustom() {
            const text = customInput.value.trim();
            if (text) {
                vscode.postMessage({
                    command: 'submit',
                    text: text
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({
                command: 'cancel'
            });
        }
        
        function continueAction() {
            vscode.postMessage({
                command: 'submit',
                text: 'Continue'
            });
        }
        
        // Handle Enter in custom input
        customInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                submitCustom();
            }
        });
        
        // Handle Escape to cancel
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                cancel();
            }
        });
    </script>
</body>
</html>`;