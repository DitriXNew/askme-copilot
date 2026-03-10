import {
    applyEdits as applyJsoncEdits,
    modify as modifyJsonc
} from 'jsonc-parser';
import * as vscode from 'vscode';
import { IStructMutateOperation } from '../../types';
import { deepClone, IMutationSummary, isPlainObject } from './common';
import { parseJsonDocumentWithFlavor } from './file';
import { queryJson } from './inspectQuery';
import {
    getPropertyInsertionIndex,
    getValueAtPath,
    orderJsonMatchesForDeletion,
    parseSimpleJsonPath,
    resolveArrayInsertionIndex
} from './jsonPath';
import { detectJsonIndent } from './formatting';

export function mutateJsoncDocument(file: { content: string; eol: string; trailingNewline: boolean; hasBom: boolean }, operations: IStructMutateOperation[], token: vscode.CancellationToken): {
    document: unknown;
    serialized: string;
    summaries: IMutationSummary[];
} {
    let source = file.content;
    let document = parseJsonDocumentWithFlavor(source, 'jsonc');
    const summaries: IMutationSummary[] = [];
    const formattingOptions = createJsoncFormattingOptions(file.content, file.eol);

    for (const operation of operations) {
        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }
        const result = applySingleJsoncMutation(source, document, operation, formattingOptions);
        source = result.source;
        document = result.document;
        summaries.push(result.summary);
    }

    return {
        document,
        serialized: finalizeJsoncContent(source, file.eol, file.trailingNewline),
        summaries
    };
}

function applySingleJsoncMutation(
    source: string,
    document: unknown,
    operation: IStructMutateOperation,
    formattingOptions: { insertSpaces: boolean; tabSize: number; eol: string; keepLines: boolean }
): {
    source: string;
    document: unknown;
    summary: IMutationSummary;
} {
    const matches = queryJson(document, operation.target);
    const selectedMatches = operation.bulk ? matches : matches.slice(0, 1);
    const simpleTargetPath = parseSimpleJsonPath(operation.target);

    switch (operation.action) {
        case 'set': {
            if (selectedMatches.length === 0) {
                if (simpleTargetPath) {
                    const updatedSource = applyJsoncModify(source, simpleTargetPath, deepClone(operation.value), formattingOptions);
                    return {
                        source: updatedSource,
                        document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                        summary: { action: operation.action, target: operation.target, matched: 0, changed: 1, details: 'Created missing path.' }
                    };
                }

                return {
                    source,
                    document,
                    summary: { action: operation.action, target: operation.target, matched: 0, changed: 0 }
                };
            }

            let updatedSource = source;
            for (const match of selectedMatches) {
                const path = parseSimpleJsonPath(match.path);
                if (!path) {
                    throw new Error(`Unable to resolve JSONC path for set: ${match.path}`);
                }
                updatedSource = applyJsoncModify(updatedSource, path, deepClone(operation.value), formattingOptions);
            }

            return {
                source: updatedSource,
                document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                summary: { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length }
            };
        }
        case 'delete': {
            const rootDelete = selectedMatches.some(match => parseSimpleJsonPath(match.path)?.length === 0);
            if (rootDelete) {
                throw new Error('Deleting the JSON root is not allowed.');
            }

            const orderedMatches = orderJsonMatchesForDeletion(selectedMatches);
            let updatedSource = source;
            for (const match of orderedMatches) {
                const path = parseSimpleJsonPath(match.path);
                if (!path) {
                    throw new Error(`Unable to resolve JSONC path for delete: ${match.path}`);
                }
                updatedSource = applyJsoncModify(updatedSource, path, undefined, formattingOptions);
            }

            return {
                source: updatedSource,
                document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                summary: { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length }
            };
        }
        case 'rename': {
            if (typeof operation.value !== 'string' || !operation.value.trim()) {
                throw new Error('rename requires a non-empty string in value.');
            }

            let updatedSource = source;
            let updatedDocument = document;
            for (const match of selectedMatches) {
                const path = parseSimpleJsonPath(match.path);
                if (!path || path.length === 0) {
                    throw new Error('rename works only for object properties in JSON/JSONC.');
                }

                const newKey = operation.value;
                const oldKey = path[path.length - 1];
                if (typeof oldKey !== 'string') {
                    throw new Error('rename works only for object properties in JSON/JSONC.');
                }

                const parentPath = path.slice(0, -1);
                const parentValue = getValueAtPath(updatedDocument, parentPath);
                if (!isPlainObject(parentValue)) {
                    throw new Error('rename works only for object properties in JSON/JSONC.');
                }

                if (Object.prototype.hasOwnProperty.call(parentValue, newKey) && newKey !== oldKey) {
                    throw new Error(`rename conflict: property "${newKey}" already exists.`);
                }

                updatedSource = applyJsoncModify(updatedSource, [...parentPath, newKey], deepClone(match.value), formattingOptions, getPropertyInsertionIndex(parentValue as Record<string, unknown>, oldKey, newKey));
                updatedDocument = parseJsonDocumentWithFlavor(updatedSource, 'jsonc');
                updatedSource = applyJsoncModify(updatedSource, path, undefined, formattingOptions);
                updatedDocument = parseJsonDocumentWithFlavor(updatedSource, 'jsonc');
            }

            return {
                source: updatedSource,
                document: updatedDocument,
                summary: { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length }
            };
        }
        case 'insert':
            return applyJsoncInsert(source, document, operation, matches, selectedMatches, formattingOptions);
        case 'move': {
            if (!operation.destination) {
                throw new Error('move requires destination.');
            }

            const match = selectedMatches[0];
            if (!match) {
                return {
                    source,
                    document,
                    summary: { action: operation.action, target: operation.target, matched: 0, changed: 0 }
                };
            }

            const sourcePath = parseSimpleJsonPath(match.path);
            const destinationPath = parseSimpleJsonPath(operation.destination);
            if (!sourcePath || !destinationPath) {
                throw new Error('move for JSONC requires explicit source and destination paths.');
            }
            if (sourcePath.length === 0) {
                throw new Error('Moving the JSON root is not allowed.');
            }

            let updatedSource = applyJsoncModify(source, destinationPath, deepClone(match.value), formattingOptions);
            updatedSource = applyJsoncModify(updatedSource, sourcePath, undefined, formattingOptions);

            return {
                source: updatedSource,
                document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                summary: { action: operation.action, target: operation.target, matched: matches.length, changed: 1 }
            };
        }
        case 'copy': {
            if (!operation.destination) {
                throw new Error('copy requires destination.');
            }

            const match = selectedMatches[0];
            if (!match) {
                return {
                    source,
                    document,
                    summary: { action: operation.action, target: operation.target, matched: 0, changed: 0 }
                };
            }

            const destinationPath = parseSimpleJsonPath(operation.destination);
            if (!destinationPath) {
                throw new Error('copy for JSONC requires an explicit destination path.');
            }

            const updatedSource = applyJsoncModify(source, destinationPath, deepClone(match.value), formattingOptions);

            return {
                source: updatedSource,
                document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                summary: { action: operation.action, target: operation.target, matched: matches.length, changed: 1 }
            };
        }
        default:
            throw new Error(`Action ${operation.action} is not supported for JSONC.`);
    }
}

function applyJsoncInsert(
    source: string,
    document: unknown,
    operation: IStructMutateOperation,
    matches: ReturnType<typeof queryJson>,
    selectedMatches: ReturnType<typeof queryJson>,
    formattingOptions: { insertSpaces: boolean; tabSize: number; eol: string; keepLines: boolean }
): {
    source: string;
    document: unknown;
    summary: IMutationSummary;
} {
    if (selectedMatches.length === 0) {
        const simplePath = parseSimpleJsonPath(operation.target);
        if (simplePath && (operation.position === 'append' || operation.position === 'prepend')) {
            const seedValue = isPlainObject(operation.value)
                ? operation.value
                : [deepClone(operation.value)];
            const updatedSource = applyJsoncModify(source, simplePath, deepClone(seedValue), formattingOptions);
            return {
                source: updatedSource,
                document: parseJsonDocumentWithFlavor(updatedSource, 'jsonc'),
                summary: { action: operation.action, target: operation.target, matched: 0, changed: 1, details: 'Created missing container.' }
            };
        }

        return {
            source,
            document,
            summary: { action: operation.action, target: operation.target, matched: 0, changed: 0 }
        };
    }

    let updatedSource = source;
    let updatedDocument = document;
    let changed = 0;

    for (const match of selectedMatches) {
        const path = parseSimpleJsonPath(match.path);
        if (!path) {
            throw new Error(`Unable to resolve JSONC path for insert: ${match.path}`);
        }

        if (operation.position === 'before' || operation.position === 'after') {
            const parentPath = path.slice(0, -1);
            const index = path[path.length - 1];
            if (typeof index !== 'number') {
                throw new Error('JSON/JSONC insert with before/after requires an array element target.');
            }
            updatedSource = applyJsoncModify(
                updatedSource,
                [...parentPath, operation.position === 'after' ? index + 1 : index],
                deepClone(operation.value),
                formattingOptions,
                undefined,
                true
            );
            updatedDocument = parseJsonDocumentWithFlavor(updatedSource, 'jsonc');
            changed += 1;
            continue;
        }

        const currentTarget = getValueAtPath(updatedDocument, path);
        if (Array.isArray(currentTarget)) {
            const insertionIndex = resolveArrayInsertionIndex(currentTarget.length, operation.position);
            updatedSource = applyJsoncModify(updatedSource, [...path, insertionIndex], deepClone(operation.value), formattingOptions, undefined, true);
            updatedDocument = parseJsonDocumentWithFlavor(updatedSource, 'jsonc');
            changed += 1;
            continue;
        }

        if (isPlainObject(currentTarget) && isPlainObject(operation.value)) {
            const entries = Object.entries(operation.value as Record<string, unknown>);
            const propertyNames = Object.keys(currentTarget as Record<string, unknown>);
            const append = !operation.position || operation.position === 'append';
            const orderedEntries = append ? entries : [...entries].reverse();

            for (const [key, value] of orderedEntries) {
                const insertionIndex = append ? propertyNames.length : 0;
                updatedSource = applyJsoncModify(updatedSource, [...path, key], deepClone(value), formattingOptions, insertionIndex);
                propertyNames.splice(insertionIndex, 0, key);
                updatedDocument = parseJsonDocumentWithFlavor(updatedSource, 'jsonc');
                changed += 1;
            }
            continue;
        }

        throw new Error('JSON/JSONC insert requires an array target, array element target, or object target with an object value.');
    }

    return {
        source: updatedSource,
        document: updatedDocument,
        summary: { action: operation.action, target: operation.target, matched: matches.length, changed }
    };
}

function applyJsoncModify(
    source: string,
    path: Array<string | number>,
    value: unknown,
    formattingOptions: { insertSpaces: boolean; tabSize: number; eol: string; keepLines: boolean },
    insertionIndex?: number,
    isArrayInsertion = false
): string {
    const edits = modifyJsonc(source, path, value, {
        formattingOptions,
        isArrayInsertion,
        getInsertionIndex: insertionIndex === undefined ? undefined : () => insertionIndex
    });

    return applyJsoncEdits(source, edits);
}

function createJsoncFormattingOptions(content: string, eol: string): { insertSpaces: boolean; tabSize: number; eol: string; keepLines: boolean } {
    const indent = detectJsonIndent(content);
    return {
        insertSpaces: indent !== '\t',
        tabSize: indent === '\t' ? 1 : typeof indent === 'number' && indent > 0 ? indent : 2,
        eol,
        keepLines: true
    };
}

function finalizeJsoncContent(source: string, eol: string, trailingNewline: boolean): string {
    const normalized = source.replace(/\r?\n/g, eol);
    return trailingNewline ? `${normalized}${eol}` : normalized;
}