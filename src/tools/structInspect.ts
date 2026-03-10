import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IStructInspectParameters } from '../types';
import { createInspectUsage, inspectStructuredDocument } from './structShared';

export class StructInspectTool extends BaseTool<IStructInspectParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IStructInspectParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath']);
        if (validationError) {
            return this.createUsageErrorResult('struct_inspect', validationError, createInspectUsage());
        }

        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }

        try {
            const result = await inspectStructuredDocument(options.input);

            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Inspected ${result.originalPath} as ${result.format}.\n${JSON.stringify(result.data, null, 2)}`
                ),
            ]);
        } catch (error) {
            return this.createUsageErrorResult('struct_inspect', String(error), createInspectUsage());
        }
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IStructInspectParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `🧱 Inspecting structure: ${options.input.filePath}`,
            confirmationMessages: {
                title: 'Inspect JSON/XML structure',
                message: new vscode.MarkdownString(`**File:** ${options.input.filePath}`)
            }
        };
    }
}