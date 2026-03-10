import * as vscode from 'vscode';
import { IStructMutateOperation } from '../../types';
import { deepClone, deepEqual, IJsonQueryMatch, IMutationSummary } from './common';
import { parseJsonDocumentWithFlavor } from './file';
import { stringifyJsonForEdit } from './formatting';
import { queryJson } from './inspectQuery';
import { mutateJsoncDocument } from './jsoncMutations';
import { getValueAtPath, parseSimpleJsonPath, setJsonAtPath } from './jsonPath';

export function mutateJsonDocument(file: { content: string; jsonFlavor?: 'json' | 'jsonc'; eol: string; trailingNewline: boolean; hasBom: boolean }, operations: IStructMutateOperation[], token: vscode.CancellationToken): {
    document: unknown;
    serialized: string;
    summaries: IMutationSummary[];
} {
    if (file.jsonFlavor === 'jsonc') {
        return mutateJsoncDocument(file, operations, token);
    }

    const document = parseJsonDocumentWithFlavor(file.content, file.jsonFlavor);
    const summaries: IMutationSummary[] = [];

    for (const operation of operations) {
        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }
        summaries.push(applySingleJsonMutation(document, operation));
    }

    const serialized = stringifyJsonForEdit(document, file.content, file.eol, file.trailingNewline);

    return {
        document,
        serialized,
        summaries
    };
}

function applySingleJsonMutation(document: unknown, operation: IStructMutateOperation): IMutationSummary {
    const matches = queryJson(document, operation.target);
    const selectedMatches = operation.bulk ? matches : matches.slice(0, 1);

    switch (operation.action) {
        case 'set': {
            if (selectedMatches.length === 0) {
                // bulk mode with no matches: report 0 changes, do not create path
                if (operation.bulk) {
                    return { action: operation.action, target: operation.target, matched: 0, changed: 0 };
                }

                if (!setJsonAtPath(document, operation.target, deepClone(operation.value))) {
                    throw new Error(`Target not found for set: ${operation.target}`);
                }

                return { action: operation.action, target: operation.target, matched: 0, changed: 1, details: 'Created missing path.' };
            }

            let actualChanged = 0;
            selectedMatches.forEach(match => {
                if (!deepEqual(match.value, operation.value)) {
                    replaceJsonMatch(match, deepClone(operation.value), document);
                    actualChanged++;
                }
            });
            return { action: operation.action, target: operation.target, matched: matches.length, changed: actualChanged };
        }
        case 'delete': {
            const rootDelete = selectedMatches.some(match => parseSimpleJsonPath(match.path)?.length === 0);
            if (rootDelete) {
                throw new Error('Deleting the JSON root is not allowed.');
            }

            deleteJsonMatches(selectedMatches);
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        }
        case 'rename': {
            if (typeof operation.value !== 'string' || !operation.value.trim()) {
                throw new Error('rename requires the new key name in the "value" field (e.g., { action: "rename", target: "$.oldKey", value: "newKey" }).');
            }

            selectedMatches.forEach(match => renameJsonMatch(match, operation.value as string));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        }
        case 'insert': {
            const changed = insertIntoJson(operation, selectedMatches, document);
            return { action: operation.action, target: operation.target, matched: matches.length, changed };
        }
        case 'move': {
            const changed = moveJsonMatch(document, operation, selectedMatches);
            return { action: operation.action, target: operation.target, matched: matches.length, changed };
        }
        case 'copy': {
            const changed = copyJsonMatch(document, operation, selectedMatches);
            return { action: operation.action, target: operation.target, matched: matches.length, changed };
        }
        default:
            throw new Error(`Action ${operation.action} is not supported for JSON.`);
    }
}

function replaceJsonMatch(match: IJsonQueryMatch, value: unknown, root: unknown): void {
    if (match.parent === undefined || match.parent === null || match.parentProperty === null) {
        if (typeof root !== 'object' || root === null) {
            throw new Error('Cannot replace JSON root for a primitive document.');
        }

        Object.keys(root as Record<string, unknown>).forEach(key => {
            delete (root as Record<string, unknown>)[key];
        });
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(root as Record<string, unknown>, value as Record<string, unknown>);
            return;
        }

        throw new Error('Replacing the JSON root is supported only with object values in this version.');
    }

    if (Array.isArray(match.parent) && typeof match.parentProperty === 'number') {
        match.parent[match.parentProperty] = value;
        return;
    }

    (match.parent as Record<string, unknown>)[String(match.parentProperty)] = value;
}

function deleteJsonMatches(matches: IJsonQueryMatch[]): void {
    const arrayMatches = matches
        .filter(match => Array.isArray(match.parent) && typeof match.parentProperty === 'number')
        .sort((left, right) => Number(right.parentProperty) - Number(left.parentProperty));
    const objectMatches = matches.filter(match => !Array.isArray(match.parent) && match.parent && match.parentProperty !== null);

    arrayMatches.forEach(match => {
        (match.parent as unknown[]).splice(match.parentProperty as number, 1);
    });

    objectMatches.forEach(match => {
        delete (match.parent as Record<string, unknown>)[String(match.parentProperty)];
    });
}

function renameJsonMatch(match: IJsonQueryMatch, newKey: string): void {
    if (!match.parent || Array.isArray(match.parent) || match.parentProperty === null) {
        throw new Error('rename works only for object properties in JSON.');
    }

    const parent = match.parent as Record<string, unknown>;
    const oldKey = String(match.parentProperty);
    if (Object.prototype.hasOwnProperty.call(parent, newKey) && newKey !== oldKey) {
        throw new Error(`rename conflict: property "${newKey}" already exists.`);
    }

    // Preserve key order by rebuilding in place
    const entries = Object.keys(parent).map(key =>
        key === oldKey ? [newKey, parent[key]] as const : [key, parent[key]] as const,
    );
    for (const key of Object.keys(parent)) {
        delete parent[key];
    }
    for (const [key, value] of entries) {
        parent[key] = value;
    }
}

function insertIntoJson(operation: IStructMutateOperation, matches: IJsonQueryMatch[], document: unknown): number {
    if (matches.length === 0) {
        if (operation.position === 'append' || operation.position === 'prepend') {
            const created = setJsonAtPath(document, operation.target, [deepClone(operation.value)]);
            return created ? 1 : 0;
        }
        throw new Error(`No target matched for insert: ${operation.target}`);
    }

    matches.forEach(match => {
        if (operation.position === 'before' || operation.position === 'after') {
            if (!Array.isArray(match.parent) || typeof match.parentProperty !== 'number') {
                throw new Error('JSON insert with before/after requires the target to be an array element.');
            }

            const index = match.parentProperty + (operation.position === 'after' ? 1 : 0);
            (match.parent as unknown[]).splice(index, 0, deepClone(operation.value));
            return;
        }

        if (Array.isArray(match.value)) {
            const targetArray = match.value as unknown[];
            if (!operation.position || operation.position === 'append') {
                targetArray.push(deepClone(operation.value));
                return;
            }

            if (operation.position === 'prepend') {
                targetArray.unshift(deepClone(operation.value));
                return;
            }

            if (operation.position.startsWith('at:')) {
                const index = Number(operation.position.slice(3));
                if (!Number.isInteger(index) || index < 0 || index > targetArray.length) {
                    throw new Error(`Invalid insert position: ${operation.position}`);
                }
                targetArray.splice(index, 0, deepClone(operation.value));
                return;
            }
        }

        throw new Error('JSON insert requires an array target for append/prepend/at:N, or an array element target for before/after.');
    });

    return matches.length;
}

function moveJsonMatch(document: unknown, operation: IStructMutateOperation, matches: IJsonQueryMatch[]): number {
    if (!operation.destination) {
        throw new Error('move requires destination.');
    }

    const match = matches[0];
    if (!match) {
        throw new Error(`No source matched for move: ${operation.target}`);
    }

    const value = deepClone(match.value);
    deleteJsonMatches([match]);
    const placed = placeJsonValue(document, operation.destination, value, operation.position);
    if (!placed) {
        throw new Error(`Destination not found for move: ${operation.destination}`);
    }

    return 1;
}

function copyJsonMatch(document: unknown, operation: IStructMutateOperation, matches: IJsonQueryMatch[]): number {
    if (!operation.destination) {
        throw new Error('copy requires destination.');
    }

    const match = matches[0];
    if (!match) {
        throw new Error(`No source matched for copy: ${operation.target}`);
    }

    const value = deepClone(match.value);
    const placed = placeJsonValue(document, operation.destination, value, operation.position);
    if (!placed) {
        throw new Error(`Destination not found for copy: ${operation.destination}`);
    }

    return 1;
}

function placeJsonValue(document: unknown, destination: string, value: unknown, position?: string): boolean {
    const segments = parseSimpleJsonPath(destination);
    if (!segments) {
        return setJsonAtPath(document, destination, value);
    }

    const target = getValueAtPath(document, segments);
    if (target === undefined) {
        return setJsonAtPath(document, destination, value);
    }

    // If destination is an array and a position is specified, insert into it
    if (Array.isArray(target)) {
        if (!position || position === 'append') {
            target.push(value);
            return true;
        }
        if (position === 'prepend') {
            target.unshift(value);
            return true;
        }
        if (position.startsWith('at:')) {
            const index = Number(position.slice(3));
            if (!Number.isInteger(index) || index < 0 || index > target.length) {
                throw new Error(`Invalid insert position: ${position}`);
            }
            target.splice(index, 0, value);
            return true;
        }
    }

    // Default: replace the destination value
    return setJsonAtPath(document, destination, value);
}