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

export async function applyStructuredWorkspaceEdit(filePath: string, newContent: string, writeBack: boolean, autoSave?: boolean): Promise<void> {
    if (!writeBack) {
        return;
    }

    const fileUri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(fileUri);
    const originalText = doc.getText();

    if (originalText === newContent) {
        return;
    }

    const textEdits = computeMinimalTextEdits(originalText, newContent, doc);
    const wsEdit = new vscode.WorkspaceEdit();
    wsEdit.set(fileUri, textEdits);

    const success = await vscode.workspace.applyEdit(wsEdit);
    if (!success) {
        throw new Error(`WorkspaceEdit was rejected by VS Code for file: ${filePath}`);
    }

    if (autoSave) {
        const updatedDoc = await vscode.workspace.openTextDocument(fileUri);
        await updatedDoc.save();
    }
}

function computeMinimalTextEdits(originalText: string, newText: string, doc: vscode.TextDocument): vscode.TextEdit[] {
    const originalLines = originalText.split(/\n/);
    const newLines = newText.split(/\n/);
    const edits: vscode.TextEdit[] = [];

    // Find common prefix lines
    let prefixLen = 0;
    const minLen = Math.min(originalLines.length, newLines.length);
    while (prefixLen < minLen && originalLines[prefixLen] === newLines[prefixLen]) {
        prefixLen++;
    }

    // Find common suffix lines (excluding already-matched prefix)
    let suffixLen = 0;
    const maxSuffix = minLen - prefixLen;
    while (
        suffixLen < maxSuffix &&
        originalLines[originalLines.length - 1 - suffixLen] === newLines[newLines.length - 1 - suffixLen]
    ) {
        suffixLen++;
    }

    const origChangedStart = prefixLen;
    const origChangedEnd = originalLines.length - suffixLen;
    const newChangedStart = prefixLen;
    const newChangedEnd = newLines.length - suffixLen;

    if (origChangedStart === origChangedEnd && newChangedStart === newChangedEnd) {
        return edits; // No changes
    }

    // Build a single TextEdit for the changed region
    const startLine = origChangedStart;
    const endLine = origChangedEnd;
    const startPos = new vscode.Position(startLine, 0);
    const endPos = endLine >= doc.lineCount
        ? doc.lineAt(doc.lineCount - 1).range.end
        : new vscode.Position(endLine, 0);

    const replacementLines = newLines.slice(newChangedStart, newChangedEnd);
    const replacementText = endLine >= doc.lineCount
        ? replacementLines.join('\n')
        : replacementLines.join('\n') + '\n';

    edits.push(vscode.TextEdit.replace(new vscode.Range(startPos, endPos), replacementText));
    return edits;
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
    return rawPath.replace(/\[['"]([^'"]+)['"]\]/g, '.$1');
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