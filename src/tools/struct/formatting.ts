import { XMLSerializer } from '@xmldom/xmldom';
import {
	buildXPath,
	escapeRegExp,
	escapeXmlAttribute,
	escapeXmlText,
	finalizeSerializedContent,
	finalizeSerializedContentForEdit,
	getChildElements,
	IXmlFormattingStyle,
	isSingleLineContent
} from './common';
import { parseXmlDocument } from './file';

export function stringifyJson(
	document: unknown,
	originalContent: string,
	eol: string,
	trailingNewline: boolean,
	hasBom: boolean
): string {
	const indent = detectJsonIndent(originalContent);
	return finalizeSerializedContent(JSON.stringify(document, null, indent), eol, trailingNewline, hasBom);
}

export function stringifyJsonForEdit(
	document: unknown,
	originalContent: string,
	eol: string,
	trailingNewline: boolean
): string {
	const indent = detectJsonIndent(originalContent);
	return finalizeSerializedContentForEdit(JSON.stringify(document, null, indent), eol, trailingNewline);
}

export function detectJsonIndent(content: string): number | string {
	if (isSingleLineContent(content)) {
		return 0;
	}

	const match = content.match(/\n(\s+)"/);
	if (!match) {
		return 2;
	}

	return match[1].includes('\t') ? '\t' : match[1].length;
}

export function stringifyXml(
	document: Document,
	originalContent: string,
	eol: string,
	trailingNewline: boolean,
	hasBom: boolean
): string {
	const style = detectXmlFormatting(originalContent, eol);
	const renderedNodes = renderXmlChildNodes(document, style, eol);
	const content = style.xmlDeclaration
		? style.singleLine
			? `${style.xmlDeclaration}${renderedNodes}`
			: `${style.xmlDeclaration}${eol}${renderedNodes}`
		: renderedNodes;

	return finalizeSerializedContent(content, eol, trailingNewline, hasBom);
}

export function stringifyXmlForEdit(
	document: Document,
	originalContent: string,
	eol: string,
	trailingNewline: boolean
): string {
	const style = detectXmlFormatting(originalContent, eol);
	const renderedNodes = renderXmlChildNodes(document, style, eol);
	const content = style.xmlDeclaration
		? style.singleLine
			? `${style.xmlDeclaration}${renderedNodes}`
			: `${style.xmlDeclaration}${eol}${renderedNodes}`
		: renderedNodes;

	return finalizeSerializedContentForEdit(content, eol, trailingNewline);
}

function renderXmlChildNodes(document: Document, style: IXmlFormattingStyle, eol: string): string {
	return Array.from(document.childNodes)
		.filter(node => {
			if (node.nodeType === node.DOCUMENT_TYPE_NODE && node.parentNode !== document) {
				return false;
			}
			// Skip the xml declaration PI — it is already prepended by the caller
			if (style.xmlDeclaration && node.nodeType === node.PROCESSING_INSTRUCTION_NODE) {
				const pi = node as ProcessingInstruction;
				if (pi.target === 'xml') {
					return false;
				}
			}
			return true;
		})
		.map(node => style.singleLine
			? renderXmlNodeCompact(node, style.emptyElementStyle, style.attributeQuoteStyles)
			: renderXmlNodePretty(node, '', style.indent, eol, style.emptyElementStyle, style.attributeQuoteStyles)
		)
		.filter(rendered => rendered.length > 0)
		.join(style.singleLine ? '' : eol);
}

function detectXmlFormatting(content: string, eol: string): IXmlFormattingStyle {
	const singleLine = isSingleLineContent(content);
	const xmlDeclarationMatch = content.match(/^\uFEFF?\s*(<\?xml[\s\S]*?\?>)/);
	const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[1] : null;
	const emptyElementStyle = detectEmptyXmlElementStyles(content);
	const attributeQuoteStyles = detectXmlAttributeQuoteStyles(content);

	if (singleLine) {
		return {
			singleLine,
			indent: '',
			xmlDeclaration,
			emptyElementStyle,
			attributeQuoteStyles
		};
	}

	const indentMatches = Array.from(content.matchAll(new RegExp(`${escapeRegExp(eol)}([ \t]+)<`, 'g')))
		.map(match => match[1])
		.filter(indent => indent.length > 0);
	const indent = indentMatches.length === 0
		? '  '
		: indentMatches.reduce((smallest, current) => current.length < smallest.length ? current : smallest, indentMatches[0]);

	return {
		singleLine,
		indent,
		xmlDeclaration,
		emptyElementStyle,
		attributeQuoteStyles
	};
}

function renderXmlNodePretty(
	node: Node,
	currentIndent: string,
	indentUnit: string,
	eol: string,
	emptyElementStyle: Map<string, 'selfClosing' | 'expanded'>,
	attributeQuoteStyles: Map<string, "'" | '"'>
): string {
	if (node.nodeType === node.DOCUMENT_TYPE_NODE) {
		return `${currentIndent}${new XMLSerializer().serializeToString(node)}`;
	}

	if (node.nodeType === node.TEXT_NODE) {
		return escapeXmlText((node.nodeValue ?? '').trim());
	}

	if (node.nodeType === node.CDATA_SECTION_NODE) {
		return `<![CDATA[${node.nodeValue ?? ''}]]>`;
	}

	if (node.nodeType === node.COMMENT_NODE) {
		return `${currentIndent}<!--${node.nodeValue ?? ''}-->`;
	}

	if (node.nodeType === node.PROCESSING_INSTRUCTION_NODE) {
		const instruction = node as ProcessingInstruction;
		return `${currentIndent}<?${instruction.target} ${instruction.data}?>`;
	}

	if (node.nodeType !== node.ELEMENT_NODE) {
		return `${currentIndent}${new XMLSerializer().serializeToString(node)}`;
	}

	const element = node as Element;
	const openTag = `${currentIndent}<${element.tagName}${serializeXmlAttributes(element, attributeQuoteStyles)}`;
	const meaningfulChildren = getMeaningfulXmlChildren(element);

	if (meaningfulChildren.length === 0) {
		return shouldRenderExpandedEmptyElement(element, emptyElementStyle)
			? `${openTag}></${element.tagName}>`
			: `${openTag}/>`;
	}

	const hasElementLikeChild = meaningfulChildren.some(child =>
		child.nodeType === child.ELEMENT_NODE ||
		child.nodeType === child.COMMENT_NODE ||
		child.nodeType === child.PROCESSING_INSTRUCTION_NODE
	);
	const hasTextChild = meaningfulChildren.some(child =>
		child.nodeType === child.TEXT_NODE || child.nodeType === child.CDATA_SECTION_NODE
	);

	if (hasTextChild && hasElementLikeChild) {
		return `${currentIndent}${renderXmlNodeCompact(element, emptyElementStyle, attributeQuoteStyles)}`;
	}

	if (hasTextChild) {
		const inline = meaningfulChildren.map(child => renderXmlNodeCompact(child, emptyElementStyle, attributeQuoteStyles)).join('');
		return `${openTag}>${inline}</${element.tagName}>`;
	}

	const nextIndent = `${currentIndent}${indentUnit}`;
	const renderedChildren = meaningfulChildren
		.map(child => renderXmlNodePretty(child, nextIndent, indentUnit, eol, emptyElementStyle, attributeQuoteStyles))
		.join(eol);

	return `${openTag}>${eol}${renderedChildren}${eol}${currentIndent}</${element.tagName}>`;
}

function renderXmlNodeCompact(node: Node, emptyElementStyle: Map<string, 'selfClosing' | 'expanded'>, attributeQuoteStyles: Map<string, "'" | '"'>): string {
	if (node.nodeType === node.DOCUMENT_TYPE_NODE) {
		return new XMLSerializer().serializeToString(node);
	}

	if (node.nodeType === node.TEXT_NODE) {
		return escapeXmlText(node.nodeValue ?? '');
	}

	if (node.nodeType === node.CDATA_SECTION_NODE) {
		return `<![CDATA[${node.nodeValue ?? ''}]]>`;
	}

	if (node.nodeType === node.COMMENT_NODE) {
		return `<!--${node.nodeValue ?? ''}-->`;
	}

	if (node.nodeType === node.PROCESSING_INSTRUCTION_NODE) {
		const instruction = node as ProcessingInstruction;
		return `<?${instruction.target} ${instruction.data}?>`;
	}

	if (node.nodeType !== node.ELEMENT_NODE) {
		return new XMLSerializer().serializeToString(node);
	}

	const element = node as Element;
	const meaningfulChildren = getMeaningfulXmlChildren(element);
	const openTag = `<${element.tagName}${serializeXmlAttributes(element, attributeQuoteStyles)}`;

	if (meaningfulChildren.length === 0) {
		return shouldRenderExpandedEmptyElement(element, emptyElementStyle)
			? `${openTag}></${element.tagName}>`
			: `${openTag}/>`;
	}

	const content = meaningfulChildren.map(child => renderXmlNodeCompact(child, emptyElementStyle, attributeQuoteStyles)).join('');
	return `${openTag}>${content}</${element.tagName}>`;
}

function shouldRenderExpandedEmptyElement(element: Element, emptyElementStyle: Map<string, 'selfClosing' | 'expanded'>): boolean {
	return emptyElementStyle.get(buildXPath(element)) === 'expanded';
}

function detectEmptyXmlElementStyles(content: string): Map<string, 'selfClosing' | 'expanded'> {
	const styleMap = new Map<string, 'selfClosing' | 'expanded'>();
	const document = parseXmlDocument(content);
	const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);

	walkXmlElements(document.documentElement, element => {
		if (getMeaningfulXmlChildren(element).length > 0) {
			return;
		}

		const lineNumber = (element as Element & { lineNumber?: number }).lineNumber;
		const columnNumber = (element as Element & { columnNumber?: number }).columnNumber;
		if (!lineNumber || !columnNumber) {
			return;
		}

		const line = lines[lineNumber - 1] ?? '';
		const slice = line.slice(Math.max(0, columnNumber - 1));
		const tagCloseIndex = slice.indexOf('>');
		if (tagCloseIndex === -1) {
			return;
		}

		const openingTagFragment = slice.slice(0, tagCloseIndex + 1);
		styleMap.set(buildXPath(element), openingTagFragment.includes('/>') ? 'selfClosing' : 'expanded');
	});

	return styleMap;
}

function walkXmlElements(element: Element | null, visitor: (element: Element) => void): void {
	if (!element) {
		return;
	}

	visitor(element);
	getChildElements(element).forEach(child => walkXmlElements(child, visitor));
}

function getMeaningfulXmlChildren(element: Element): Node[] {
	return Array.from(element.childNodes).filter(child => {
		if (child.nodeType !== child.TEXT_NODE) {
			return true;
		}

		return (child.nodeValue ?? '').trim().length > 0;
	});
}

function serializeXmlAttributes(element: Element, attributeQuoteStyles: Map<string, "'" | '"'>): string {
	return Array.from({ length: element.attributes.length }, (_, index) => element.attributes.item(index))
		.filter((attribute): attribute is Attr => Boolean(attribute))
		.map(attribute => {
			const key = `${buildXPath(element)}/@${attribute.name}`;
			const quote = attributeQuoteStyles.get(key) ?? '"';
			const escaped = quote === "'"
				? escapeXmlText(attribute.value).replace(/'/g, '&apos;')
				: escapeXmlAttribute(attribute.value);
			return ` ${attribute.name}=${quote}${escaped}${quote}`;
		})
		.join('');
}

function detectXmlAttributeQuoteStyles(content: string): Map<string, "'" | '"'> {
	const quoteMap = new Map<string, "'" | '"'>();

	try {
		const document = parseXmlDocument(content);
		const attrRegex = /(\w[\w:.-]*)=(['"])/g;
		const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);

		walkXmlElements(document.documentElement, element => {
			const lineNumber = (element as Element & { lineNumber?: number }).lineNumber;
			if (!lineNumber) {
				return;
			}

			const elementPath = buildXPath(element);
			// Scan from the element's line to find attribute quote styles
			for (let lineIdx = lineNumber - 1; lineIdx < lines.length; lineIdx++) {
				const line = lines[lineIdx];
				// Stop if we hit a closing > for this tag
				if (lineIdx > lineNumber - 1 && /^\s*[^=]/.test(line) && !line.includes('=')) {
					break;
				}

				let match: RegExpExecArray | null;
				attrRegex.lastIndex = 0;
				while ((match = attrRegex.exec(line)) !== null) {
					const attrName = match[1];
					const quote = match[2] as "'" | '"';
					quoteMap.set(`${elementPath}/@${attrName}`, quote);
				}

				if (line.includes('>')) {
					break;
				}
			}
		});
	} catch {
		// If parsing fails, return empty map — will default to double quotes
	}

	return quoteMap;
}

