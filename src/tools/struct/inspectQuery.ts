import { JSONPath } from 'jsonpath-plus';
import * as xpath from 'xpath';
import {
    IStructInspectParameters,
    IStructQueryParameters,
    StructQueryReturnMode
} from '../../types';
import { analyzeJsonLikeDiagnostics } from './diagnostics';
import {
    buildXPath,
    getChildElements,
    IJsonQueryMatch,
    IResolvedFile,
    IXmlQueryMatch,
    isJsonLikeFormat,
    isPlainObject,
    isSingleLineContent,
    normalizeJsonPath,
    serializeXmlNodeValue
} from './common';
import { parseJsonDocumentWithFlavor, parseXmlDocument, resolveAndReadStructuredFile } from './file';
import { detectJsonIndent } from './formatting';
import { getValueAtPath, parseSimpleJsonPath } from './jsonPath';

export async function inspectStructuredDocument(input: IStructInspectParameters) {
    const file = await resolveAndReadStructuredFile(input.filePath);
    const depth = input.depth ?? 3;

    if (isJsonLikeFormat(file.format)) {
        const document = parseJsonDocumentWithFlavor(file.content, file.jsonFlavor);
        const indent = detectJsonIndent(file.content);

        let target = document;
        let basePath = '$';
        if (input.path) {
            const matches = queryJson(document, input.path);
            if (matches.length === 0) {
                throw new Error(`Path not found: ${input.path}`);
            }
            target = matches[0].value;
            basePath = matches[0].path;
        }

        const structure = inspectJsonNode(target, basePath === '$' ? 'root' : basePath.split('.').pop() ?? 'root', basePath, depth, 0);

        return {
            ...file,
            data: {
                format: file.format,
                filePath: file.originalPath,
                ...(input.path ? { path: input.path } : {}),
                depth,
                formatting: {
                    hasBom: file.hasBom,
                    eol: file.eol === '\r\n' ? 'CRLF' : 'LF',
                    indent: typeof indent === 'string' ? 'tab' : indent === 0 ? 'minified' : `${indent} spaces`,
                    trailingNewline: file.trailingNewline,
                },
                structure,
                diagnostics: analyzeJsonLikeDiagnostics(file.content)
            }
        };
    }

    const document = parseXmlDocument(file.content);
    const root = document.documentElement;
    if (!root) {
        throw new Error('XML document does not have a document element.');
    }

    let targetElement: Element = root;
    if (input.path) {
        const matches = queryXml(document, input.path, input.namespaces);
        if (matches.length === 0) {
            throw new Error(`Path not found: ${input.path}`);
        }
        const node = matches[0].node;
        if (node.nodeType !== node.ELEMENT_NODE) {
            throw new Error(`Path "${input.path}" does not resolve to an XML element.`);
        }
        targetElement = node as unknown as Element;
    }

    const xmlIndent = detectXmlIndent(file.content);

    return {
        ...file,
        data: {
            format: file.format,
            filePath: file.originalPath,
            ...(input.path ? { path: input.path } : {}),
            depth,
            formatting: {
                hasBom: file.hasBom,
                eol: file.eol === '\r\n' ? 'CRLF' : 'LF',
                indent: xmlIndent,
                trailingNewline: file.trailingNewline,
            },
            structure: inspectXmlElement(targetElement, depth, 0),
            diagnostics: []
        }
    };
}

export async function queryStructuredDocument(input: IStructQueryParameters) {
    const file = await resolveAndReadStructuredFile(input.filePath);
    const returnMode = input.return ?? 'values';
    const limit = input.limit ?? 50;

    if (isJsonLikeFormat(file.format)) {
        const document = parseJsonDocumentWithFlavor(file.content, file.jsonFlavor);
        const matches = queryJson(document, input.expression);

        return {
            ...file,
            data: formatQueryResponse(file, input.expression, returnMode, matches, limit)
        };
    }

    const document = parseXmlDocument(file.content);
    const matches = queryXml(document, input.expression, input.namespaces);
    return {
        ...file,
        data: formatQueryResponse(file, input.expression, returnMode, matches, limit)
    };
}

export function queryJson(document: unknown, expression: string): IJsonQueryMatch[] {
    if (!expression.startsWith('$')) {
        throw new Error(`Invalid JSONPath expression: "${expression}". JSONPath expressions must start with "$".`);
    }

    // Fix @-prefixed keys in dot notation: $.@key → $["@key"]
    const fixedExpression = expression.replace(/\.(@[^.[]*)/g, '["$1"]');

    // jsonpath-plus cannot handle @-prefixed keys (even in bracket notation)
    // because @ is interpreted as the filter current-node operator.
    // For simple path expressions containing @-prefix keys, use manual traversal.
    if (containsAtPrefixKey(fixedExpression)) {
        const segments = parseSimpleJsonPath(fixedExpression);
        if (segments) {
            return queryJsonBySegments(document, segments, fixedExpression);
        }
        // Complex expression with @-prefix — cannot be handled
        throw new Error(
            `JSONPath expressions with @-prefixed keys are only supported for simple path access ` +
            `(e.g., $["@add"], $["@@locale"]). Filters and recursive descent on @-prefix keys are not supported.`
        );
    }

    const jsonInput = document as null | boolean | number | string | object | unknown[];
    const results = JSONPath({
        path: fixedExpression,
        json: jsonInput,
        wrap: true,
        resultType: 'all'
    }) as unknown as Array<{
        path: string;
        pointer?: string;
        value: unknown;
        parent: unknown;
        parentProperty: string | number | null;
    }>;

    return results.map(result => ({
        path: normalizeJsonPath(result.path),
        pointer: result.pointer,
        value: result.value,
        parent: result.parent,
        parentProperty: normalizeParentProperty(result.parent, result.parentProperty)
    }));
}

function containsAtPrefixKey(expression: string): boolean {
    // Check for @-prefix inside bracket notation: ["@..."] or ['@...']
    if (/\[['"]@/.test(expression)) {
        return true;
    }
    // Check for @-prefix in dot notation: $.@ (should have been converted already)
    if (/\.\@/.test(expression)) {
        return true;
    }
    return false;
}

function queryJsonBySegments(
    document: unknown,
    segments: Array<string | number>,
    expression: string,
): IJsonQueryMatch[] {
    const value = getValueAtPath(document, segments);
    if (value === undefined) {
        return [];
    }

    const pathStr = '$' + segments.map(seg =>
        typeof seg === 'number' ? `[${seg}]` : needsBracketNotation(seg) ? `["${seg}"]` : `.${seg}`,
    ).join('');

    const parent = segments.length > 0
        ? getValueAtPath(document, segments.slice(0, -1))
        : undefined;
    const parentProperty = segments.length > 0
        ? segments[segments.length - 1]
        : null;

    return [{
        path: pathStr,
        pointer: '/' + segments.map(seg =>
            typeof seg === 'number' ? String(seg) : seg.replace(/~/g, '~0').replace(/\//g, '~1'),
        ).join('/'),
        value,
        parent: parent ?? document,
        parentProperty: parentProperty ?? null,
    }];
}

function needsBracketNotation(key: string): boolean {
    return /[@.\[\]\s\-]/.test(key) || !/^[A-Za-z_$][\w$]*$/.test(key);
}

function jsonKeyToPathSegment(key: string): string {
    if (needsBracketNotation(key)) {
        return `["${key}"]`;
    }
    return `.${key}`;
}

export function queryXml(document: Document, expression: string, namespaces?: Record<string, string>): IXmlQueryMatch[] {
    const select = namespaces && Object.keys(namespaces).length > 0
        ? xpath.useNamespaces(namespaces)
        : xpath.select;
    const rawResults = select(expression, document) as Array<Node | string | number | boolean>;

    return rawResults.map(result => {
        if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
            return {
                path: expression,
                value: result,
                node: document
            };
        }

        return {
            path: buildXPath(result),
            value: serializeXmlNodeValue(result),
            node: result
        };
    });
}

function inspectJsonNode(value: unknown, name: string, currentPath: string, maxDepth: number, depth: number): unknown {
    if (Array.isArray(value)) {
        const sample = value.length > 0 && depth < maxDepth
            ? inspectJsonNode(value[0], '[0]', `${currentPath}[0]`, maxDepth, depth + 1)
            : null;

        return {
            name,
            path: currentPath,
            kind: 'array',
            length: value.length,
            sample
        };
    }

    if (value !== null && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        return {
            name,
            path: currentPath,
            kind: 'object',
            keyCount: entries.length,
            children: depth >= maxDepth
                ? []
                : entries.map(([key, child]) => inspectJsonNode(child, key, `${currentPath}${jsonKeyToPathSegment(key)}`, maxDepth, depth + 1))
        };
    }

    return {
        name,
        path: currentPath,
        kind: value === null ? 'null' : typeof value
    };
}

function inspectXmlElement(element: Element, maxDepth: number, depth: number): unknown {
    const childElements = getChildElements(element);
    const attributes = Array.from({ length: element.attributes.length }, (_, index) => {
        const attribute = element.attributes.item(index);
        return attribute ? { name: attribute.name, valueType: 'string' } : null;
    }).filter(Boolean);

    const hasTextNodes = Array.from(element.childNodes).some(
        node => node.nodeType === node.TEXT_NODE && (node.nodeValue ?? '').trim() !== ''
    );
    const hasMixedContent = hasTextNodes && childElements.length > 0;

    return {
        name: element.tagName,
        path: buildXPath(element),
        kind: 'element',
        ...(element.namespaceURI ? { namespaceURI: element.namespaceURI } : {}),
        ...(element.prefix ? { prefix: element.prefix } : {}),
        attributeCount: element.attributes.length,
        attributes,
        namespaces: Array.from({ length: element.attributes.length }, (_, index) => element.attributes.item(index))
            .filter((attribute): attribute is Attr => Boolean(attribute && attribute.name.startsWith('xmlns')))
            .map(attribute => ({ prefix: attribute.name === 'xmlns' ? '' : attribute.name.replace('xmlns:', ''), uri: attribute.value })),
        childCount: childElements.length,
        ...(hasMixedContent ? { hasMixedContent: true } : {}),
        children: depth >= maxDepth ? [] : childElements.map(child => inspectXmlElement(child, maxDepth, depth + 1))
    };
}

function formatQueryResponse(
    file: IResolvedFile,
    expression: string,
    returnMode: StructQueryReturnMode,
    matches: Array<IJsonQueryMatch | IXmlQueryMatch>,
    limit: number
) {
    const limitedMatches = matches.slice(0, limit);
    const mappedMatches = limitedMatches.map(match => ({
        path: match.path,
        value: match.value
    }));

    return {
        format: file.format,
        filePath: file.originalPath,
        expression,
        totalMatches: matches.length,
        truncated: returnMode === 'count' ? false : matches.length > limit,
        returnMode,
        results: returnMode === 'count'
            ? undefined
            : returnMode === 'paths'
                ? mappedMatches.map(match => match.path)
                : returnMode === 'values'
                    ? mappedMatches.map(match => match.value)
                    : mappedMatches,
        count: matches.length
    };
}

function normalizeParentProperty(parent: unknown, parentProperty: string | number | null | undefined): string | number | null {
    if (parentProperty === null || parentProperty === undefined) {
        return null;
    }

    if (Array.isArray(parent) && typeof parentProperty === 'string' && /^\d+$/.test(parentProperty)) {
        return Number(parentProperty);
    }

    return parentProperty;
}

function detectXmlIndent(content: string): string {
    if (isSingleLineContent(content)) {
        return 'minified';
    }

    const match = content.match(/\n(\s+)</);
    if (!match) {
        return 'unknown';
    }

    return match[1].includes('\t') ? 'tab' : `${match[1].length} spaces`;
}