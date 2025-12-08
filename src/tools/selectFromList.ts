// Select From List Tool - Interactive option selection dialog
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { ISelectFromListParameters } from '../types';
import { analytics, showNotification, ConfigurationManager } from '../utils';
import { getSelectFromListTemplate } from '../templates';

export class SelectFromListTool extends BaseTool<ISelectFromListParameters> {
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
        
        await showNotification('Selection needed', 'normal', this.context);
        
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
            
            panel.webview.html = getSelectFromListTemplate();
            
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
