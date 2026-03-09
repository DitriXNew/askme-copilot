import { createScanner, SyntaxKind } from 'jsonc-parser';
import { IStructDiagnostic } from '../../types';
import { appendJsonPath } from './common';

export function analyzeJsonLikeDiagnostics(content: string): IStructDiagnostic[] {
    const scanner = createScanner(content, true);
    const lineStarts = computeLineStarts(content);
    const diagnostics: IStructDiagnostic[] = [];
    let token: number = scanner.scan();

    const nextToken = (): void => {
        token = scanner.scan();
    };

    const tokenText = (): string => content.slice(scanner.getTokenOffset(), scanner.getTokenOffset() + scanner.getTokenLength());

    const addDiagnostic = (
        kind: IStructDiagnostic['kind'],
        message: string,
        path: string,
        extra: Partial<IStructDiagnostic> = {}
    ): void => {
        const offset = scanner.getTokenOffset();
        const position = toLineColumn(offset, lineStarts);
        diagnostics.push({
            kind,
            severity: 'warning',
            message,
            path,
            offset,
            length: scanner.getTokenLength(),
            line: position.line,
            column: position.column,
            ...extra
        });
    };

    const inspectStringToken = (path: string, source: 'key' | 'value'): void => {
        const raw = tokenText();
        if (raw.includes('\\u')) {
            addDiagnostic(
                'unicode-escape-risk',
                `String ${source} uses Unicode escape sequences that may not preserve lexical form after mutation.`,
                path,
                { source }
            );
        }
    };

    const inspectNumericToken = (path: string): void => {
        const raw = tokenText();
        const parsed = Number(raw);
        const looksInteger = /^-?(?:0|[1-9]\d*)(?:e[+-]?\d+)?$/i.test(raw);

        if (looksInteger && Number.isFinite(parsed) && Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
            addDiagnostic(
                'unsafe-integer',
                'Numeric literal exceeds JavaScript safe integer range and may lose precision after parse/mutate.',
                path,
                { valuePreview: raw }
            );
        }
    };

    const parseValue = (currentPath: string): void => {
        switch (token) {
            case SyntaxKind.OpenBraceToken:
                parseObject(currentPath);
                return;
            case SyntaxKind.OpenBracketToken:
                parseArray(currentPath);
                return;
            case SyntaxKind.StringLiteral:
                inspectStringToken(currentPath, 'value');
                nextToken();
                return;
            case SyntaxKind.NumericLiteral:
                inspectNumericToken(currentPath);
                nextToken();
                return;
            case SyntaxKind.NullKeyword:
            case SyntaxKind.TrueKeyword:
            case SyntaxKind.FalseKeyword:
                nextToken();
                return;
            default:
                nextToken();
        }
    };

    const parseObject = (currentPath: string): void => {
        nextToken();
        const seenKeys = new Map<string, string>();

        while (token !== SyntaxKind.CloseBraceToken && token !== SyntaxKind.EOF) {
            if (token === SyntaxKind.CommaToken) {
                nextToken();
                continue;
            }

            if (token !== SyntaxKind.StringLiteral) {
                nextToken();
                continue;
            }

            const key = scanner.getTokenValue();
            const keyPath = appendJsonPath(currentPath, key);
            inspectStringToken(keyPath, 'key');

            const previousPath = seenKeys.get(key);
            if (previousPath) {
                addDiagnostic(
                    'duplicate-key',
                    `Object contains duplicate key "${key}". Earlier value at ${previousPath} may be shadowed by later parse result.`,
                    keyPath,
                    { keyName: key }
                );
            } else {
                seenKeys.set(key, keyPath);
            }

            nextToken();
            if ((token as number) === SyntaxKind.ColonToken) {
                nextToken();
                parseValue(keyPath);
            }

            if ((token as number) === SyntaxKind.CommaToken) {
                nextToken();
            }
        }

        if (token === SyntaxKind.CloseBraceToken) {
            nextToken();
        }
    };

    const parseArray = (currentPath: string): void => {
        nextToken();
        let index = 0;

        while (token !== SyntaxKind.CloseBracketToken && token !== SyntaxKind.EOF) {
            if (token === SyntaxKind.CommaToken) {
                nextToken();
                continue;
            }

            parseValue(appendJsonPath(currentPath, index));
            index += 1;

            if (token === SyntaxKind.CommaToken) {
                nextToken();
            }
        }

        if (token === SyntaxKind.CloseBracketToken) {
            nextToken();
        }
    };

    parseValue('$');
    return diagnostics;
}

function computeLineStarts(content: string): number[] {
    const starts = [0];
    for (let index = 0; index < content.length; index += 1) {
        if (content[index] === '\n') {
            starts.push(index + 1);
        }
    }
    return starts;
}

function toLineColumn(offset: number, lineStarts: number[]): { line: number; column: number } {
    let low = 0;
    let high = lineStarts.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (lineStarts[mid] <= offset) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }

    const lineIndex = Math.max(0, high);
    return {
        line: lineIndex + 1,
        column: offset - lineStarts[lineIndex] + 1
    };
}