// Confirm Action Tool - Destructive action confirmation
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IConfirmActionParameters } from '../types';

export class ConfirmActionTool extends BaseTool<IConfirmActionParameters> {
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
