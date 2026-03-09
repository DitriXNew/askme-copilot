import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { XMLSerializer } from '@xmldom/xmldom';
import { StructFileFormat, StructSchemaType } from '../../types';

export interface IResolvedFile {
    format: StructFileFormat;
    absolutePath: string;
    originalPath: string;
    content: string;
    hasBom: boolean;
    eol: string;
    trailingNewline: boolean;
    jsonFlavor?: 'json' | 'jsonc';
}

export interface IJsonQueryMatch {
    path: string;
    pointer?: string;
    value: unknown;
    parent: unknown;
    parentProperty: string | number | null;
}

export interface IXmlQueryMatch {
    path: string;
    value: unknown;
    node: Node;
}

export interface IMutationSummary {
    action: string;
    target: string;
    matched: number;
    changed: number;
    details?: string;
}

export interface IXmlFormattingStyle {
    singleLine: boolean;
    indent: string;
    xmlDeclaration: string | null;
    emptyElementStyle: Map<string, 'selfClosing' | 'expanded'>;
    attributeQuoteStyles: Map<string, "'" | '"'>;
}

export function getChildElements(element: Element): Element[] {
    return Array.from(element.childNodes).filter((node): node is Element => node.nodeType === node.ELEMENT_NODE);
}

export function buildXPath(node: Node): string {
    if (node.nodeType === node.DOCUMENT_NODE) {
        return '/';
    }

    if (node.nodeType === node.ATTRIBUTE_NODE) {
        const attribute = node as Attr;
        const ownerPath = attribute.ownerElement ? buildXPath(attribute.ownerElement) : '';
        return `${ownerPath}/@${attribute.name}`;
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
        return node.parentNode ? buildXPath(node.parentNode) : '/';
    }

    const element = node as Element;
    const siblings = element.parentNode
        ? Array.from(element.parentNode.childNodes).filter(sibling => sibling.nodeType === sibling.ELEMENT_NODE && (sibling as Element).tagName === element.tagName)
        : [element];
    const index = siblings.indexOf(element) + 1;

    const parentPath = element.parentNode && element.parentNode.nodeType !== element.DOCUMENT_NODE
        ? buildXPath(element.parentNode)
        : '';

    return `${parentPath}/${element.tagName}[${index}]`;
}

export function serializeXmlNodeValue(node: Node): unknown {
    if (node.nodeType === node.ATTRIBUTE_NODE) {
        return (node as Attr).value;
    }

    if (node.nodeType === node.TEXT_NODE) {
        return node.nodeValue;
    }

    if (node.nodeType === node.ELEMENT_NODE) {
        return new XMLSerializer().serializeToString(node);
    }

    return node.toString();
}

export function normalizeJsonPath(rawPath: string): string {
    // Only convert bracket notation to dot notation for simple identifiers
    // Keep bracket notation for keys with special JSONPath chars (@, *, ., etc.)
    return rawPath.replace(/\[['"]([^'"]+)['"]\]/g, (_match, key: string) => {
        if (/^[A-Za-z_$][\w$-]*$/.test(key)) {
            return `.${key}`;
        }
        return _match; // Keep bracket notation for special characters
    });
}

export function appendJsonPath(basePath: string, key: string | number): string {
    if (typeof key === 'number') {
        return `${basePath}[${key}]`;
    }

    if (/^[A-Za-z_$][\w$-]*$/.test(key)) {
        return basePath === '$' ? `$.${key}` : `${basePath}.${key}`;
    }

    const escapedKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `${basePath}['${escapedKey}']`;
}

export function escapeXmlText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function escapeXmlAttribute(value: string): string {
    return escapeXmlText(value)
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function finalizeSerializedContent(content: string, eol: string, trailingNewline: boolean, hasBom: boolean): string {
    const normalized = content.replace(/\r?\n/g, eol);
    const withNewline = trailingNewline ? `${normalized}${eol}` : normalized;
    return hasBom ? `\uFEFF${withNewline}` : withNewline;
}

/**
 * Finalize serialized content for WorkspaceEdit.
 * VS Code handles BOM transparently — never add BOM to WorkspaceEdit text.
 * EOL must match doc.eol since WorkspaceEdit does NOT auto-normalize line endings.
 */
export function finalizeSerializedContentForEdit(content: string, eol: string, trailingNewline: boolean): string {
    const normalized = content.replace(/\r?\n/g, eol);
    return trailingNewline ? `${normalized}${eol}` : normalized;
}

export function isSingleLineContent(content: string): boolean {
    const withoutTrailingNewline = content.replace(/(\r?\n)+$/, '');
    return !withoutTrailingNewline.includes('\n') && !withoutTrailingNewline.includes('\r');
}

export function deepClone<T>(value: T): T {
    return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}

export function isPlainObject(value: unknown): boolean {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isJsonLikeFormat(format: string): boolean {
    return format === 'json' || format === 'jsonc';
}

export function deepEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

export function loadInlineOrFileSchema(schema: unknown): unknown {
    if (typeof schema !== 'string') {
        return schema;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const absolutePath = path.isAbsolute(schema)
        ? schema
        : workspaceFolder
            ? path.join(workspaceFolder, schema)
            : schema;

    if (fs.existsSync(absolutePath)) {
        const content = fs.readFileSync(absolutePath, 'utf8');
        return JSON.parse(content);
    }

    return JSON.parse(schema);
}

export function schemaTypeLabel(schemaType?: StructSchemaType): string {
    return schemaType ?? 'well-formedness';
}

export interface EditInstruction {
    line: number;
    oldText: string;
    newText: string;
    endLine?: number;
    action?: 'replace' | 'insertAfter' | 'insertBefore' | 'delete';
}

export function computeEditInstructions(originalText: string, newText: string, eol: string): EditInstruction[] {
    const originalLines = originalText.split(eol);
    const newLines = newText.split(eol);
    const instructions: EditInstruction[] = [];

    // LCS-based diff to find common prefix/suffix and changed hunks
    let prefixLen = 0;
    const minLen = Math.min(originalLines.length, newLines.length);
    while (prefixLen < minLen && originalLines[prefixLen] === newLines[prefixLen]) {
        prefixLen++;
    }

    let suffixLen = 0;
    const maxSuffix = minLen - prefixLen;
    while (
        suffixLen < maxSuffix &&
        originalLines[originalLines.length - 1 - suffixLen] === newLines[newLines.length - 1 - suffixLen]
    ) {
        suffixLen++;
    }

    const origStart = prefixLen;
    const origEnd = originalLines.length - suffixLen;
    const newStart = prefixLen;
    const newEnd = newLines.length - suffixLen;

    if (origStart === origEnd && newStart === newEnd) {
        return instructions;
    }

    const origChanged = originalLines.slice(origStart, origEnd);
    const newChanged = newLines.slice(newStart, newEnd);

    if (origChanged.length === 0 && newChanged.length > 0) {
        // Pure insertion — lines added after prefixLen
        const anchorLine = prefixLen; // 1-based: line before insertion
        instructions.push({
            line: anchorLine,
            action: 'insertAfter',
            oldText: anchorLine > 0 ? originalLines[anchorLine - 1] : '',
            newText: newChanged.join(eol),
        });
    } else if (origChanged.length > 0 && newChanged.length === 0) {
        // Pure deletion
        instructions.push({
            line: origStart + 1, // 1-based
            endLine: origEnd,    // 1-based inclusive
            action: 'delete',
            oldText: origChanged.join(eol),
            newText: '',
        });
    } else {
        // Replacement — try to emit compact range-based instructions
        if (origChanged.length === newChanged.length) {
            // Group consecutive changed lines into contiguous ranges
            let rangeStart = -1;
            for (let i = 0; i <= origChanged.length; i++) {
                const isDiff = i < origChanged.length && origChanged[i] !== newChanged[i];
                if (isDiff && rangeStart === -1) {
                    rangeStart = i;
                } else if (!isDiff && rangeStart !== -1) {
                    // Emit range [rangeStart, i-1]
                    const rangeLen = i - rangeStart;
                    if (rangeLen === 1) {
                        instructions.push({
                            line: origStart + rangeStart + 1,
                            oldText: origChanged[rangeStart],
                            newText: newChanged[rangeStart],
                        });
                    } else {
                        instructions.push({
                            line: origStart + rangeStart + 1,
                            endLine: origStart + i,
                            oldText: origChanged.slice(rangeStart, i).join(eol),
                            newText: newChanged.slice(rangeStart, i).join(eol),
                        });
                    }
                    rangeStart = -1;
                }
            }
        } else {
            // Different number of lines — emit a single range replacement
            instructions.push({
                line: origStart + 1, // 1-based
                endLine: origEnd,    // 1-based inclusive
                oldText: origChanged.join(eol),
                newText: newChanged.join(eol),
            });
        }
    }

    return instructions;
}