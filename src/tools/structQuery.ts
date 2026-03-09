import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IStructQueryParameters } from '../types';
import { createQueryUsage, queryStructuredDocument } from './structShared';

export class StructQueryTool extends BaseTool<IStructQueryParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IStructQueryParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath', 'expression']);
        if (validationError) {
            return this.createUsageErrorResult('struct_query', validationError, createQueryUsage());
        }

        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }

        try {
            const result = await queryStructuredDocument(options.input);

            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Query matched ${result.data.count} node(s) in ${result.originalPath}.\n${JSON.stringify(result.data, null, 2)}`
                ),
            ]);
        } catch (error) {
            return this.createUsageErrorResult('struct_query', String(error), createQueryUsage());
        }
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IStructQueryParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `🔎 Querying structure: ${options.input.filePath}`,
            confirmationMessages: {
                title: 'Query JSON/XML structure',
                message: new vscode.MarkdownString(`**File:** ${options.input.filePath}\n\n**Expression:** ${options.input.expression}`)
            }
        };
    }
}