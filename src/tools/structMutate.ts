import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IStructMutateParameters } from '../types';
import { createMutateUsage, mutateStructuredDocument, summarizeMutationResult } from './structShared';

export class StructMutateTool extends BaseTool<IStructMutateParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IStructMutateParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath', 'operations']);
        if (validationError) {
            return this.createUsageErrorResult('struct_mutate', validationError, createMutateUsage());
        }

        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }

        try {
            const result = await mutateStructuredDocument(options.input, token);

            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `${summarizeMutationResult(result)}\n${JSON.stringify(result.data, null, 2)}`
                ),
            ]);
        } catch (error) {
            return this.createUsageErrorResult('struct_mutate', String(error), createMutateUsage());
        }
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IStructMutateParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        const ops = options.input.operations;
        const opSummary = ops.map((op, i) => `${i + 1}. **${op.action}** at \`${op.target}\``).join('\n');
        return {
            invocationMessage: `🛠️ Mutating structure: ${options.input.filePath} (${ops.length} operation(s))`,
            confirmationMessages: {
                title: 'Mutate JSON/XML structure',
                message: new vscode.MarkdownString(`**File:** ${options.input.filePath}\n\n**Operations (${ops.length}):**\n${opSummary}`)
            }
        };
    }
}