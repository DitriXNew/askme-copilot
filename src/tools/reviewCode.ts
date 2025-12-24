// Review Code Tool - Code review dialog
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IReviewCodeParameters } from '../types';
import { showNotification, TemplateManager } from '../utils';
import { getCodeReviewTemplate } from '../templates';

export class ReviewCodeTool extends BaseTool<IReviewCodeParameters> {
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
        
        await showNotification('Code review requested', 'normal', this.context);
        
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
            
            // Load templates for this tool and prepare for display
            const templates = TemplateManager.getTemplatesForTool('reviewCode');
            const templatesForDisplay = TemplateManager.prepareTemplatesForDisplay(templates);
            const defaultIndices = TemplateManager.getDefaultEnabledIndices('reviewCode');
            
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setCode',
                                code,
                                language,
                                question,
                                focusAreas,
                                templates: templatesForDisplay,
                                defaultTemplateIndices: defaultIndices
                            });
                            break;
                        case 'submit':
                            // Format response with active templates
                            let finalText = message.text;
                            if (message.activeTemplates && message.activeTemplates.length > 0) {
                                finalText = TemplateManager.formatResponseWithTemplates(
                                    message.text,
                                    message.activeTemplates
                                );
                            }
                            resolve(finalText);
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            break;
                        case 'openSettings':
                            vscode.commands.executeCommand('workbench.action.openSettings', 'askMeCopilot.templates');
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
