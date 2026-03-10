import Ajv, { AnySchema } from 'ajv';
import { XMLValidator } from 'fast-xml-parser';
import { IStructDiffParameters, IStructValidateParameters } from '../../types';
import { analyzeJsonLikeDiagnostics } from './diagnostics';
import { buildXPath, deepEqual, isJsonLikeFormat, isPlainObject, loadInlineOrFileSchema, schemaTypeLabel } from './common';
import { parseJsonDocumentWithFlavor, parseXmlDocument, resolveAndReadStructuredFile } from './file';

const jsonAjv = new Ajv({ allErrors: true, strict: false });

export async function validateStructuredDocument(input: IStructValidateParameters) {
    const file = await resolveAndReadStructuredFile(input.filePath);

    if (isJsonLikeFormat(file.format)) {
        const diagnostics = analyzeJsonLikeDiagnostics(file.content);
        let document: unknown;

        try {
            document = parseJsonDocumentWithFlavor(file.content, file.jsonFlavor);
        } catch (error) {
            return {
                ...file,
                data: {
                    valid: false,
                    format: file.format,
                    filePath: file.originalPath,
                    errors: [{ path: '$', message: String(error) }],
                    diagnostics
                }
            };
        }

        if (!input.schema) {
            return {
                ...file,
                data: { valid: true, format: file.format, filePath: file.originalPath, errors: [], diagnostics }
            };
        }

        if ((input.schemaType ?? 'json_schema') !== 'json_schema') {
            throw new Error('JSON files support schemaType="json_schema" only.');
        }

        const schema = loadInlineOrFileSchema(input.schema) as AnySchema;
        const validate = jsonAjv.compile(schema);
        const valid = validate(document);

        return {
            ...file,
            data: {
                valid: Boolean(valid),
                format: file.format,
                filePath: file.originalPath,
                errors: (validate.errors ?? []).map(error => ({
                    path: error.instancePath || '$',
                    message: error.message ?? 'Validation failed'
                })),
                diagnostics
            }
        };
    }

    const validation = XMLValidator.validate(file.content);
    if (validation !== true) {
        const err = validation.err;
        return {
            ...file,
            data: {
                valid: false,
                format: file.format,
                filePath: file.originalPath,
                errors: [{ path: `/line:${err.line}/column:${err.col}`, message: err.msg }],
                diagnostics: []
            }
        };
    }

    const schemaType = input.schemaType;

    // BUG FIX: Report unsupported schemaType even when no schema is provided
    if (schemaType) {
        if (schemaType === 'json_schema') {
            throw new Error('schemaType="json_schema" is not applicable to XML files. For XML validation, use schemaType="xsd", "dtd", or "relaxng" (not yet supported).');
        }
        if (schemaType === 'xsd' || schemaType === 'dtd' || schemaType === 'relaxng') {
            throw new Error(`schemaType="${schemaType}" is not supported yet in this build. Current XML validation supports well-formedness checking only.\nExample: struct_validate({ filePath: "${file.originalPath}", schema: "schema.xsd", schemaType: "xsd" }) — will be supported in a future release.`);
        }
        throw new Error(`Invalid schemaType "${schemaType}". Allowed values: "json_schema" (for JSON/JSONC), "xsd", "dtd", "relaxng" (XML, not yet supported).`);
    }

    // BUG FIX: Warn when schema is provided but schemaType is missing
    if (input.schema && !schemaType) {
        throw new Error('Field "schemaType" is required when "schema" is provided. For XML, use schemaType="xsd", "dtd", or "relaxng" (not yet supported). For JSON, use schemaType="json_schema".');
    }

    return {
        ...file,
        data: { valid: true, format: file.format, filePath: file.originalPath, errors: [], diagnostics: [] }
    };
}

export async function diffStructuredDocuments(input: IStructDiffParameters) {
    const before = await resolveAndReadStructuredFile(input.filePathBefore);
    const after = await resolveAndReadStructuredFile(input.filePathAfter);

    const beforeBase = isJsonLikeFormat(before.format) ? 'json' : before.format;
    const afterBase = isJsonLikeFormat(after.format) ? 'json' : after.format;
    if (beforeBase !== afterBase) {
        throw new Error(`Cannot diff different formats: ${before.format} vs ${after.format}`);
    }

    const changes: Array<{ path: string; type: 'added' | 'removed' | 'changed'; before?: unknown; after?: unknown }> = [];

    if (isJsonLikeFormat(before.format)) {
        const left = parseJsonDocumentWithFlavor(before.content, before.jsonFlavor);
        const right = parseJsonDocumentWithFlavor(after.content, after.jsonFlavor);
        collectDiff('$', left, right, changes);
    } else {
        const leftDoc = parseXmlDocument(before.content);
        const rightDoc = parseXmlDocument(after.content);
        const ignoreWhitespace = input.ignoreWhitespace ?? true;
        collectXmlDiff(leftDoc.documentElement, rightDoc.documentElement, changes, ignoreWhitespace);
    }

    return {
        format: before.format,
        filePathBefore: input.filePathBefore,
        filePathAfter: input.filePathAfter,
        changeCount: changes.length,
        changes
    };
}

function collectDiff(
    currentPath: string,
    before: unknown,
    after: unknown,
    changes: Array<{ path: string; type: 'added' | 'removed' | 'changed'; before?: unknown; after?: unknown }>
): void {
    if (deepEqual(before, after)) {
        return;
    }

    if (before === undefined) {
        changes.push({ path: currentPath, type: 'added', after });
        return;
    }

    if (after === undefined) {
        changes.push({ path: currentPath, type: 'removed', before });
        return;
    }

    if (Array.isArray(before) && Array.isArray(after)) {
        const maxLength = Math.max(before.length, after.length);
        for (let index = 0; index < maxLength; index += 1) {
            collectDiff(`${currentPath}[${index}]`, before[index], after[index], changes);
        }
        return;
    }

    if (isPlainObject(before) && isPlainObject(after)) {
        const keys = new Set([...Object.keys(before as Record<string, unknown>), ...Object.keys(after as Record<string, unknown>)]);
        keys.forEach(key => {
            const nextPath = currentPath === '$' ? `$.${key}` : `${currentPath}.${key}`;
            collectDiff(nextPath, (before as Record<string, unknown>)[key], (after as Record<string, unknown>)[key], changes);
        });
        return;
    }

    changes.push({ path: currentPath, type: 'changed', before, after });
}

function collectXmlDiff(
    before: Element | null,
    after: Element | null,
    changes: Array<{ path: string; type: 'added' | 'removed' | 'changed'; before?: unknown; after?: unknown }>,
    ignoreWhitespace: boolean
): void {
    if (!before && !after) {
        return;
    }
    if (!before && after) {
        changes.push({ path: buildXPath(after), type: 'added', after: serializeElementSummary(after) });
        return;
    }
    if (before && !after) {
        changes.push({ path: buildXPath(before), type: 'removed', before: serializeElementSummary(before) });
        return;
    }

    const left = before!;
    const right = after!;
    const basePath = buildXPath(left);

    // Compare tag names
    if (left.tagName !== right.tagName) {
        changes.push({ path: basePath, type: 'changed', before: left.tagName, after: right.tagName });
        return; // Different elements — no deeper comparison
    }

    // Compare attributes
    const leftAttrs = getAttributeMap(left);
    const rightAttrs = getAttributeMap(right);
    const allAttrNames = new Set([...leftAttrs.keys(), ...rightAttrs.keys()]);

    for (const name of allAttrNames) {
        const attrPath = `${basePath}/@${name}`;
        const leftValue = leftAttrs.get(name);
        const rightValue = rightAttrs.get(name);

        if (leftValue === undefined) {
            changes.push({ path: attrPath, type: 'added', after: rightValue });
        } else if (rightValue === undefined) {
            changes.push({ path: attrPath, type: 'removed', before: leftValue });
        } else if (leftValue !== rightValue) {
            changes.push({ path: attrPath, type: 'changed', before: leftValue, after: rightValue });
        }
    }

    // Compare child nodes
    const leftChildren = getSignificantChildren(left, ignoreWhitespace);
    const rightChildren = getSignificantChildren(right, ignoreWhitespace);

    const maxLen = Math.max(leftChildren.length, rightChildren.length);
    for (let i = 0; i < maxLen; i++) {
        const lc = leftChildren[i];
        const rc = rightChildren[i];

        if (!lc && rc) {
            if (rc.type === 'element') {
                changes.push({ path: buildXPath(rc.element!), type: 'added', after: serializeElementSummary(rc.element!) });
            } else {
                changes.push({ path: `${basePath}/text()[${i + 1}]`, type: 'added', after: rc.text });
            }
            continue;
        }

        if (lc && !rc) {
            if (lc.type === 'element') {
                changes.push({ path: buildXPath(lc.element!), type: 'removed', before: serializeElementSummary(lc.element!) });
            } else {
                changes.push({ path: `${basePath}/text()[${i + 1}]`, type: 'removed', before: lc.text });
            }
            continue;
        }

        if (lc!.type === 'element' && rc!.type === 'element') {
            collectXmlDiff(lc!.element!, rc!.element!, changes, ignoreWhitespace);
        } else if (lc!.type === 'text' && rc!.type === 'text') {
            if (lc!.text !== rc!.text) {
                changes.push({ path: `${basePath}/text()[${i + 1}]`, type: 'changed', before: lc!.text, after: rc!.text });
            }
        } else if (lc!.type === 'comment' && rc!.type === 'comment') {
            if (lc!.text !== rc!.text) {
                changes.push({ path: `${basePath}/comment()[${i + 1}]`, type: 'changed', before: lc!.text, after: rc!.text });
            }
        } else {
            // Type mismatch (element vs text, etc.)
            const leftDesc = lc!.type === 'element' ? serializeElementSummary(lc!.element!) : lc!.text;
            const rightDesc = rc!.type === 'element' ? serializeElementSummary(rc!.element!) : rc!.text;
            changes.push({ path: `${basePath}/node()[${i + 1}]`, type: 'changed', before: leftDesc, after: rightDesc });
        }
    }
}

interface ISignificantChild {
    type: 'element' | 'text' | 'comment';
    element?: Element;
    text?: string;
}

function getSignificantChildren(element: Element, ignoreWhitespace: boolean): ISignificantChild[] {
    const result: ISignificantChild[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes[i]!;
        if (node.nodeType === node.ELEMENT_NODE) {
            result.push({ type: 'element', element: node as Element });
        } else if (node.nodeType === node.TEXT_NODE) {
            const text = node.nodeValue ?? '';
            if (ignoreWhitespace && text.trim() === '') {
                continue;
            }
            result.push({ type: 'text', text: ignoreWhitespace ? text.trim() : text });
        } else if (node.nodeType === node.COMMENT_NODE) {
            result.push({ type: 'comment', text: node.nodeValue ?? '' });
        }
    }
    return result;
}

function getAttributeMap(element: Element): Map<string, string> {
    const map = new Map<string, string>();
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i);
        if (attr) {
            map.set(attr.name, attr.value);
        }
    }
    return map;
}

function serializeElementSummary(element: Element): string {
    const attrs = getAttributeMap(element);
    if (attrs.size === 0) {
        return `<${element.tagName}>`;
    }
    const attrStr = Array.from(attrs.entries()).map(([name, value]) => `${name}="${value}"`).join(' ');
    return `<${element.tagName} ${attrStr}>`;
}

export { schemaTypeLabel };