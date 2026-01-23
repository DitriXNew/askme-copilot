// Questionnaire Tool - Dynamic form with multiple field types
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IQuestionnaireParameters, IQuestionnaireResult } from '../types';
import { showNotification, TemplateManager, panelRegistry } from '../utils';
import { getQuestionnaireTemplate } from '../templates';

export class QuestionnaireTool extends BaseTool<IQuestionnaireParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IQuestionnaireParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['title', 'sections']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { title, description, sections } = options.input;
        
        // Validate sections structure
        if (!Array.isArray(sections) || sections.length === 0) {
            return this.createErrorResult('Sections must be a non-empty array');
        }
        
        for (const section of sections) {
            if (!section.title || !Array.isArray(section.fields)) {
                return this.createErrorResult('Each section must have a title and fields array');
            }
            
            for (const field of section.fields) {
                if (!field.name || !field.type || !field.label) {
                    return this.createErrorResult('Each field must have name, type, and label');
                }
                
                // Validate field type
                const validTypes = ['text', 'checkbox', 'radio', 'select', 'number', 'textarea'];
                if (!validTypes.includes(field.type)) {
                    return this.createErrorResult(`Invalid field type: ${field.type}. Valid types: ${validTypes.join(', ')}`);
                }
                
                // Validate options for radio/select
                if ((field.type === 'radio' || field.type === 'select') && (!field.options || field.options.length === 0)) {
                    return this.createErrorResult(`Field "${field.name}" of type "${field.type}" requires options array`);
                }
            }
        }
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        await showNotification('Questionnaire requested', 'normal', this.context);
        
        try {
            const result = await this.showQuestionnaireDialog(title, description, sections);
            
            if (result) {
                // Format the result for Copilot
                let responseText = `Expert completed questionnaire:\n\n`;
                
                // Add values with field-specific comments
                responseText += `**Values:**\n`;
                for (const [key, value] of Object.entries(result.values)) {
                    if (value !== '' && value !== false) {
                        responseText += `- ${key}: ${value}`;
                        // Add field comment if present
                        if (result.fieldComments && result.fieldComments[key]) {
                            responseText += ` *(Comment: ${result.fieldComments[key]})*`;
                        }
                        responseText += `\n`;
                    }
                }
                
                // Add standalone field comments for empty/false fields
                if (result.fieldComments) {
                    for (const [key, comment] of Object.entries(result.fieldComments)) {
                        const value = result.values[key];
                        if (value === '' || value === false) {
                            responseText += `- ${key}: *(Comment: ${comment})*\n`;
                        }
                    }
                }
                
                // Add comment if provided
                if (result.comment) {
                    responseText += `\n**Additional Comment:**\n${result.comment}\n`;
                }
                
                // Add attachments info
                if (result.attachments && result.attachments.length > 0) {
                    responseText += `\n**Attachments:** ${result.attachments.length} file(s) attached`;
                }
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(responseText)
                ]);
            } else {
                return this.createCancelResult();
            }
        } catch (error) {
            return this.createErrorResult(`Failed to show questionnaire: ${error}`);
        }
    }
    
    private async showQuestionnaireDialog(
        title: string,
        description: string | undefined,
        sections: IQuestionnaireParameters['sections']
    ): Promise<IQuestionnaireResult | null> {
        return new Promise((resolve) => {
            const panel = vscode.window.createWebviewPanel(
                'questionnaireDialog',
                `📋 ${title}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );
            
            // Register panel for live template updates
            panelRegistry.register(panel, 'questionnaire');
            
            panel.webview.html = getQuestionnaireTemplate();
            
            // Load templates for this tool
            const templates = TemplateManager.getTemplatesForTool('questionnaire');
            const templatesForDisplay = TemplateManager.prepareTemplatesForDisplay(templates);
            const defaultIndices = TemplateManager.getDefaultEnabledIndices('questionnaire');
            
            panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'ready':
                            panel.webview.postMessage({
                                command: 'setData',
                                title,
                                description,
                                sections,
                                templates: templatesForDisplay,
                                defaultTemplateIndices: defaultIndices
                            });
                            break;
                        case 'submit':
                            // Format comment with active templates
                            let finalComment = message.comment || '';
                            if (message.activeTemplates && message.activeTemplates.length > 0 && finalComment) {
                                finalComment = TemplateManager.formatResponseWithTemplates(
                                    finalComment,
                                    message.activeTemplates
                                );
                            }
                            
                            resolve({
                                values: message.values || {},
                                fieldComments: message.fieldComments || {},
                                comment: finalComment || undefined,
                                attachments: message.attachments || []
                            });
                            panel.dispose();
                            break;
                        case 'cancel':
                            resolve(null);
                            panel.dispose();
                            break;
                        case 'openSettings':
                            vscode.commands.executeCommand('askMeCopilot.editTemplates');
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
        options: vscode.LanguageModelToolInvocationPrepareOptions<IQuestionnaireParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        const sectionCount = options.input.sections?.length || 0;
        const fieldCount = options.input.sections?.reduce((acc, s) => acc + (s.fields?.length || 0), 0) || 0;
        
        return {
            invocationMessage: `📋 Opening questionnaire: "${options.input.title}"`,
            confirmationMessages: {
                title: 'Questionnaire',
                message: new vscode.MarkdownString(`Questionnaire with ${sectionCount} section(s) and ${fieldCount} field(s)`)
            }
        };
    }
}
