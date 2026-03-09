import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IStructDiffParameters } from '../types';
import { createDiffUsage, diffStructuredDocuments } from './structShared';

export class StructDiffTool extends BaseTool<IStructDiffParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IStructDiffParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePathBefore', 'filePathAfter']);
        if (validationError) {
            return this.createUsageErrorResult('struct_diff', validationError, createDiffUsage());
        }

        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }

        try {
            const result = await diffStructuredDocuments(options.input);

            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Computed ${result.changeCount} structural change(s).\n${JSON.stringify(result, null, 2)}`
                ),
            ]);
        } catch (error) {
            return this.createUsageErrorResult('struct_diff', String(error), createDiffUsage());
        }
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IStructDiffParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `🧮 Diffing structures: ${options.input.filePathBefore} ↔ ${options.input.filePathAfter}`,
            confirmationMessages: {
                title: 'Diff JSON/XML structures',
                message: new vscode.MarkdownString(`**Before:** ${options.input.filePathBefore}\n\n**After:** ${options.input.filePathAfter}`)
            }
        };
    }
}