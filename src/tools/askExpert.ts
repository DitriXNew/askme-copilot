// Ask Expert Tool - Interactive dialog for expert input
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IAskExpertParameters, IExpertResponse } from '../types';
import { getLogger, analytics, responseCache, showNotification, ConfigurationManager, TemplateManager } from '../utils';
import { getAskExpertTemplate } from '../templates';

export class AskExpertTool extends BaseTool<IAskExpertParameters> {
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
        
        getLogger().info(`Processing ask expert request ${requestId}`, { question, priority });
        
        // Check cache
        const cacheKey = JSON.stringify({ question, context });
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
            getLogger().info('Returning cached response');
            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(cachedResponse)
            ]);
        }
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        const shouldAnswer = await showNotification('Expert input needed', priority, this.context);
        if (!shouldAnswer) {
            return this.createCancelResult();
        }
        
        try {
            const response = await this.showWebViewDialog(question, context, previousAnswer);
            
            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }
            
            if (response && response.text.trim()) {
                analytics.trackResponse(startTime);
                const textResponse = `Expert responded: "${response.text}"`;
                responseCache.set(cacheKey, textResponse);
                
                // Build result parts with text and any attachments
                const resultParts: (vscode.LanguageModelTextPart | vscode.LanguageModelDataPart)[] = [
                    new vscode.LanguageModelTextPart(textResponse)
                ];
                
                // Add attachments if any
                if (response.attachments && response.attachments.length > 0) {
                    const fileAttachments: string[] = [];
                    
                    for (const attachment of response.attachments) {
                        try {
                            // Check if it's a file path attachment (non-image)
                            if (attachment.isFilePath && attachment.filePath) {
                                // Add file path info to text response
                                let fileInfo = `\nAttached file: ${attachment.filePath}`;
                                try {
                                    const fs = await import('fs');
                                    const stats = fs.statSync(attachment.filePath);
                                    const sizeKB = (stats.size / 1024).toFixed(1);
                                    fileInfo += ` (${sizeKB} KB)`;
                                } catch {
                                    // Ignore stat errors
                                }
                                fileAttachments.push(fileInfo);
                                getLogger().info(`Added file path attachment: ${attachment.filePath}`);
                            } else if (attachment.data) {
                                // Image attachment with base64 data
                                const binaryString = Buffer.from(attachment.data, 'base64');
                                const bytes = new Uint8Array(binaryString);
                                
                                // Use LanguageModelDataPart.image for image attachments
                                if (attachment.mimeType.startsWith('image/')) {
                                    resultParts.push(
                                        vscode.LanguageModelDataPart.image(bytes, attachment.mimeType)
                                    );
                                    getLogger().info(`Added image attachment: ${attachment.name} (${attachment.mimeType})`);
                                }
                            }
                        } catch (err) {
                            getLogger().warn(`Failed to process attachment ${attachment.name}:`, err);
                        }
                    }
                    
                    // Append file attachments info to text response
                    if (fileAttachments.length > 0) {
                        resultParts[0] = new vscode.LanguageModelTextPart(
                            textResponse + fileAttachments.join('')
                        );
                    }
                }
                
                return new vscode.LanguageModelToolResult(resultParts);
            } else {
                analytics.trackCancellation();
                return this.createCancelResult();
            }
        } catch (error) {
            return this.createErrorResult(`Failed to get expert input: ${error}`);
        }
    }
    
    private async showWebViewDialog(question: string, context?: string, previousAnswer?: string): Promise<IExpertResponse | null> {
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
            
            panel.webview.html = getAskExpertTemplate();
            
            // Load templates for this tool and prepare for display
            const templates = TemplateManager.getTemplatesForTool('askExpert');
            const templatesForDisplay = TemplateManager.prepareTemplatesForDisplay(templates);
            const defaultIndices = TemplateManager.getDefaultEnabledIndices('askExpert');
            
            panel.webview.onDidReceiveMessage(
                message => {
                    getLogger().debug('Received message from webview', message);
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setData',
                                question,
                                context,
                                previousAnswer,
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
                            
                            resolve({
                                text: finalText,
                                attachments: message.attachments || []
                            });
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
