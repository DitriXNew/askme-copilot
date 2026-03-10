import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { IStructValidateParameters } from '../types';
import { createValidateUsage, schemaTypeLabel, validateStructuredDocument } from './structShared';

export class StructValidateTool extends BaseTool<IStructValidateParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IStructValidateParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath']);
        if (validationError) {
            return this.createUsageErrorResult('struct_validate', validationError, createValidateUsage());
        }

        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }

        try {
            const result = await validateStructuredDocument(options.input);

            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Validation completed for ${result.originalPath} using ${schemaTypeLabel(options.input.schemaType)}.\n${JSON.stringify(result.data, null, 2)}`
                ),
            ]);
        } catch (error) {
            return this.createUsageErrorResult('struct_validate', String(error), createValidateUsage());
        }
    }

    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IStructValidateParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `✅ Validating structure: ${options.input.filePath}`,
            confirmationMessages: {
                title: 'Validate JSON/XML structure',
                message: new vscode.MarkdownString(`**File:** ${options.input.filePath}`)
            }
        };
    }
}