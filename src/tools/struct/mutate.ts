import * as vscode from 'vscode';
import { IStructMutateParameters } from '../../types';
import { applyStructuredWorkspaceEdit } from './common';
import { parseXmlDocument, resolveAndReadStructuredFile } from './file';
import { stringifyXmlForEdit } from './formatting';
import { mutateJsonDocument } from './jsonMutations';
import { applyXmlMutations } from './xmlMutations';

export async function mutateStructuredDocument(input: IStructMutateParameters, token: vscode.CancellationToken) {
    const file = await resolveAndReadStructuredFile(input.filePath);

    if (token.isCancellationRequested) {
        throw new Error('Operation cancelled.');
    }

    if (file.format === 'json') {
        const jsonResult = mutateJsonDocument(file, input.operations, token);

        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }

        await applyStructuredWorkspaceEdit(file.absolutePath, jsonResult.serialized, input.writeBack ?? true, input.autoSave);

        return {
            ...file,
            data: {
                format: file.format,
                filePath: file.originalPath,
                writeBack: input.writeBack ?? true,
                autoSave: input.autoSave ?? false,
                changed: jsonResult.summaries.reduce((acc, item) => acc + item.changed, 0),
                operations: jsonResult.summaries,
                content: jsonResult.document
            },
            serialized: jsonResult.serialized
        };
    }

    const document = parseXmlDocument(file.content);
    const summaries = applyXmlMutations(document, input.operations, token);

    if (token.isCancellationRequested) {
        throw new Error('Operation cancelled.');
    }

    const serialized = stringifyXmlForEdit(document, file.content, file.eol, file.trailingNewline);
    await applyStructuredWorkspaceEdit(file.absolutePath, serialized, input.writeBack ?? true, input.autoSave);

    return {
        ...file,
        data: {
            format: file.format,
            filePath: file.originalPath,
            writeBack: input.writeBack ?? true,
            autoSave: input.autoSave ?? false,
            changed: summaries.reduce((acc, item) => acc + item.changed, 0),
            operations: summaries,
            content: serialized
        },
        serialized
    };
}