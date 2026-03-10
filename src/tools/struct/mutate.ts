import * as vscode from 'vscode';
import { IStructMutateParameters } from '../../types';
import { computeEditInstructions, EditInstruction, isJsonLikeFormat } from './common';
import { parseXmlDocument, resolveAndReadStructuredFile } from './file';
import { stringifyXmlForEdit } from './formatting';
import { mutateJsonDocument } from './jsonMutations';
import { applyXmlMutations } from './xmlMutations';

export interface IMutateResult {
    success: boolean;
    file: string;
    editInstructions: EditInstruction[];
    summary: string;
    warnings: string[];
    operationDetails: Array<{ action: string; target: string; matched: number; changed: number; details?: string }>;
    /** Internal: full serialized content for testing. NOT sent to LLM. */
    _serializedContent: string;
}

export async function mutateStructuredDocument(input: IStructMutateParameters, token: vscode.CancellationToken): Promise<IMutateResult> {
    const file = await resolveAndReadStructuredFile(input.filePath);

    if (token.isCancellationRequested) {
        throw new Error('Operation cancelled.');
    }

    // Propagate top-level bulk flag to operations that don't have their own
    const operations = input.operations.map(op =>
        op.bulk === undefined && input.bulk ? { ...op, bulk: true } : op,
    );

    let serialized: string;
    let summaries: Array<{ action: string; target: string; matched: number; changed: number; details?: string }>;

    if (isJsonLikeFormat(file.format)) {
        const jsonResult = mutateJsonDocument(file, operations, token);

        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }

        serialized = jsonResult.serialized;
        summaries = jsonResult.summaries;
    } else {
        const document = parseXmlDocument(file.content);
        summaries = applyXmlMutations(document, operations, token);

        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }

        serialized = stringifyXmlForEdit(document, file.content, file.eol, file.trailingNewline);
    }

    const editInstructions = computeEditInstructions(file.content, serialized, file.eol);
    const totalChanged = summaries.reduce((acc, item) => acc + item.changed, 0);
    const warnings: string[] = [];
    summaries.forEach((op, i) => {
        if (op.matched === 0 && op.changed === 0) {
            warnings.push(`Operation ${i + 1} (${op.action} on ${op.target}): 0 nodes matched.`);
        } else if (op.matched === 0 && op.changed > 0) {
            warnings.push(`Operation ${i + 1} (${op.action} on ${op.target}): path did not exist — created intermediate nodes.`);
        }
    });

    const summaryText = `${summaries.length} operation(s) applied. ${totalChanged} node(s) modified. ${editInstructions.length} edit instruction(s).`;

    return {
        success: true,
        file: file.absolutePath,
        editInstructions,
        summary: summaryText,
        warnings,
        operationDetails: summaries,
        _serializedContent: serialized,
    };
}