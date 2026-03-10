import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { DOMParser } from '@xmldom/xmldom';
import { XMLValidator } from 'fast-xml-parser';
import { parse as parseJsonc, ParseError, printParseErrorCode } from 'jsonc-parser';
import { StructFileFormat } from '../../types';
import { IResolvedFile } from './common';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB — VS Code TextDocument limit

export async function resolveAndReadStructuredFile(filePath: string): Promise<IResolvedFile> {
    let absolutePath = filePath;

    if (!path.isAbsolute(filePath)) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            throw new Error('No workspace folder is open. Provide an absolute file path or open a workspace folder.');
        }

        absolutePath = path.join(workspaceFolder, filePath);
    }

    const fileUri = vscode.Uri.file(absolutePath);

    // Check file size before attempting to open
    try {
        const stat = await vscode.workspace.fs.stat(fileUri);
        if (stat.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(
                `File is too large (${Math.round(stat.size / 1024 / 1024)}MB). ` +
                `VS Code cannot open files larger than 50MB. ` +
                `Consider splitting the file or processing it externally.`
            );
        }
    } catch (error) {
        if (error instanceof vscode.FileSystemError) {
            throw new Error(`File not found: ${absolutePath}`);
        }
        throw error;
    }

    // Use TextDocument to read file — respects open/dirty buffers and encoding
    const doc = await vscode.workspace.openTextDocument(fileUri);
    const content = doc.getText();
    const eol = doc.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    // BOM: VS Code strips BOM from TextDocument.getText() and re-adds on save.
    // We detect BOM only when needed for non-WorkspaceEdit paths (e.g. validate/diff).
    // For WorkspaceEdit writes, BOM is handled transparently by VS Code.
    let hasBom = false;
    try {
        const rawBytes = await vscode.workspace.fs.readFile(fileUri);
        hasBom = rawBytes.length >= 3 && rawBytes[0] === 0xEF && rawBytes[1] === 0xBB && rawBytes[2] === 0xBF;
    } catch {
        // If we can't read raw bytes, assume no BOM — TextDocument path handles it
    }

    const baseFormat = detectStructuredFormat(absolutePath, content);
    const jsonFlavor = baseFormat === 'json' ? detectJsonFlavor(absolutePath, content) : undefined;
    const format = jsonFlavor === 'jsonc' ? 'jsonc' as const : baseFormat;

    return {
        format,
        absolutePath,
        originalPath: filePath,
        content,
        hasBom,
        eol,
        trailingNewline: /\r?\n$/.test(content),
        jsonFlavor
    };
}

export function detectStructuredFormat(filePath: string, content: string): StructFileFormat {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json' || ext === '.jsonc' || ext === '.code-workspace') {
        return 'json';
    }

    if (ext === '.xml' || ext === '.svg' || ext === '.xsd' || ext === '.rng' || ext === '.dtd') {
        return 'xml';
    }

    const trimmed = content.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return 'json';
    }

    if (trimmed.startsWith('<')) {
        return 'xml';
    }

    throw new Error('Unable to determine file format. Supported formats are JSON and XML.');
}

export function detectJsonFlavor(filePath: string, content: string): 'json' | 'jsonc' {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jsonc' || ext === '.code-workspace') {
        return 'jsonc';
    }

    if (/^\s*\/\//m.test(content) || /^\s*\/\*/m.test(content) || /,\s*[}\]]/.test(content)) {
        return 'jsonc';
    }

    return 'json';
}

export function parseJsonDocument(content: string): unknown {
    return JSON.parse(content);
}

export function parseJsonDocumentWithFlavor(content: string, flavor: 'json' | 'jsonc' = 'json'): unknown {
    if (flavor === 'jsonc') {
        const errors: ParseError[] = [];
        const result = parseJsonc(content, errors, {
            allowTrailingComma: true,
            allowEmptyContent: false,
            disallowComments: false
        });

        if (errors.length > 0) {
            const firstError = errors[0];
            throw new Error(`JSONC parse error: ${printParseErrorCode(firstError.error)} at offset ${firstError.offset}`);
        }

        return result;
    }

    return parseJsonDocument(content);
}

export function parseXmlDocument(content: string): Document {
    const validation = XMLValidator.validate(content);
    if (validation !== true) {
        const err = validation.err;
        throw new Error(`XML is not well-formed at line ${err.line}, column ${err.col}: ${err.msg}`);
    }

    const parser = new DOMParser({
        locator: {},
        errorHandler: {
            warning: () => undefined,
            error: (message) => {
                throw new Error(`XML parse error: ${message}`);
            },
            fatalError: (message) => {
                throw new Error(`XML parse error: ${message}`);
            }
        }
    });

    return parser.parseFromString(content, 'application/xml');
}