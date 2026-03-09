import { XMLBuilder } from 'fast-xml-parser';
import * as vscode from 'vscode';
import { IStructMutateOperation } from '../../types';
import { IMutationSummary } from './common';
import { parseXmlDocument } from './file';
import { queryXml } from './inspectQuery';

const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    suppressBooleanAttributes: false,
    preserveOrder: false,
    processEntities: true
});

export function applyXmlMutations(document: Document, operations: IStructMutateOperation[], token: vscode.CancellationToken): IMutationSummary[] {
    const summaries: IMutationSummary[] = [];
    for (const operation of operations) {
        if (token.isCancellationRequested) {
            throw new Error('Operation cancelled.');
        }
        summaries.push(applySingleXmlMutation(document, operation));
    }
    return summaries;
}

function applySingleXmlMutation(document: Document, operation: IStructMutateOperation): IMutationSummary {
    const matches = queryXml(document, operation.target, operation.namespaces);
    const selectedMatches = operation.bulk ? matches : matches.slice(0, 1);

    switch (operation.action) {
        case 'set':
            selectedMatches.forEach(match => setXmlNodeValue(document, match.node, operation.value));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        case 'delete':
            selectedMatches.forEach(match => deleteXmlNode(match.node));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        case 'rename': {
            if (typeof operation.value !== 'string' || !operation.value.trim()) {
                throw new Error('rename requires a non-empty string in value.');
            }

            selectedMatches.forEach(match => renameXmlNode(document, match.node, operation.value as string));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        }
        case 'insert':
            selectedMatches.forEach(match => insertXmlNode(document, match.node, operation));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        case 'move': {
            if (!operation.destination) {
                throw new Error('move requires destination.');
            }

            const source = selectedMatches[0]?.node;
            if (!source) {
                throw new Error(`No source matched for move: ${operation.target}`);
            }

            const destination = queryXml(document, operation.destination, operation.namespaces)[0]?.node;
            if (!destination) {
                throw new Error(`No destination matched for move: ${operation.destination}`);
            }

            moveXmlNode(source, destination, operation.position);
            return { action: operation.action, target: operation.target, matched: matches.length, changed: 1 };
        }
        case 'copy': {
            if (!operation.destination) {
                throw new Error('copy requires destination.');
            }

            const sourceNode = selectedMatches[0]?.node;
            if (!sourceNode) {
                throw new Error(`No source matched for copy: ${operation.target}`);
            }

            const destNode = queryXml(document, operation.destination, operation.namespaces)[0]?.node;
            if (!destNode) {
                throw new Error(`No destination matched for copy: ${operation.destination}`);
            }

            const clone = sourceNode.cloneNode(true);
            moveXmlNode(clone, destNode, operation.position);
            return { action: operation.action, target: operation.target, matched: matches.length, changed: 1 };
        }
        case 'set_attribute': {
            if (!operation.attribute) {
                throw new Error('set_attribute requires attribute.');
            }

            selectedMatches.forEach(match => setXmlAttribute(match.node, operation.attribute as string, operation.value));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        }
        case 'delete_attribute': {
            if (!operation.attribute) {
                throw new Error('delete_attribute requires attribute.');
            }

            selectedMatches.forEach(match => deleteXmlAttribute(match.node, operation.attribute as string));
            return { action: operation.action, target: operation.target, matched: matches.length, changed: selectedMatches.length };
        }
        default:
            throw new Error(`Action ${operation.action} is not supported for XML.`);
    }
}

function setXmlNodeValue(document: Document, node: Node, value: unknown): void {
    if (node.nodeType === node.ATTRIBUTE_NODE) {
        (node as Attr).value = String(value ?? '');
        return;
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
        node.textContent = String(value ?? '');
        return;
    }

    const element = node as Element;
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }

    const fragmentNodes = materializeXmlNodes(document, value);
    if (fragmentNodes.length === 0) {
        element.appendChild(document.createTextNode(String(value ?? '')));
        return;
    }

    fragmentNodes.forEach(fragmentNode => element.appendChild(fragmentNode));
}

function deleteXmlNode(node: Node): void {
    if (node.nodeType === node.ATTRIBUTE_NODE) {
        const ownerElement = (node as Attr).ownerElement;
        if (ownerElement) {
            ownerElement.removeAttributeNode(node as Attr);
        }
        return;
    }

    // Prevent deleting the document element (XML root)
    if (node.nodeType === node.ELEMENT_NODE && node.parentNode?.nodeType === node.DOCUMENT_NODE) {
        throw new Error('Deleting the XML root element is not allowed.');
    }

    node.parentNode?.removeChild(node);
}

function renameXmlNode(document: Document, node: Node, newName: string): void {
    if (node.nodeType === node.ATTRIBUTE_NODE) {
        const attribute = node as Attr;
        const owner = attribute.ownerElement;
        if (!owner) {
            throw new Error('Cannot rename detached XML attribute.');
        }

        const value = attribute.value;
        owner.removeAttributeNode(attribute);
        owner.setAttribute(newName, value);
        return;
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
        throw new Error('rename works only for XML elements or attributes.');
    }

    const element = node as Element;
    const replacement = document.createElement(newName);

    Array.from({ length: element.attributes.length }, (_, index) => element.attributes.item(index))
        .filter((attribute): attribute is Attr => Boolean(attribute))
        .forEach(attribute => replacement.setAttribute(attribute.name, attribute.value));

    while (element.firstChild) {
        replacement.appendChild(element.firstChild);
    }

    element.parentNode?.replaceChild(replacement, element);
}

function insertXmlNode(document: Document, target: Node, operation: IStructMutateOperation): void {
    const nodesToInsert = materializeXmlNodes(document, operation.value);
    if (nodesToInsert.length === 0) {
        throw new Error('insert requires XML content or a serializable object in value.');
    }

    if (operation.position === 'before') {
        nodesToInsert.forEach(node => target.parentNode?.insertBefore(node, target));
        return;
    }

    if (operation.position === 'after') {
        const parent = target.parentNode;
        if (!parent) {
            throw new Error('Cannot insert after a node without parent.');
        }

        const reference = target.nextSibling;
        nodesToInsert.forEach(node => parent.insertBefore(node, reference));
        return;
    }

    if (target.nodeType !== target.ELEMENT_NODE) {
        throw new Error('XML prepend/append/at:N require an element target.');
    }

    const element = target as Element;
    if (!operation.position || operation.position === 'append') {
        nodesToInsert.forEach(node => element.appendChild(node));
        return;
    }

    if (operation.position === 'prepend') {
        const firstChild = element.firstChild;
        nodesToInsert.forEach(node => element.insertBefore(node, firstChild));
        return;
    }

    if (operation.position.startsWith('at:')) {
        const index = Number(operation.position.slice(3));
        if (!Number.isInteger(index) || index < 0) {
            throw new Error(`Invalid insert position: ${operation.position}`);
        }

        const children = Array.from(element.childNodes).filter(child => child.nodeType === child.ELEMENT_NODE || child.nodeType === child.TEXT_NODE);
        const reference = children[index] ?? null;
        nodesToInsert.forEach(node => element.insertBefore(node, reference));
        return;
    }

    throw new Error(`Unsupported XML insert position: ${operation.position}`);
}

function moveXmlNode(source: Node, destination: Node, position = 'append'): void {
    if (position === 'before' || position === 'after') {
        const parent = destination.parentNode;
        if (!parent) {
            throw new Error('Cannot move relative to destination without parent.');
        }

        if (position === 'before') {
            parent.insertBefore(source, destination);
            return;
        }

        parent.insertBefore(source, destination.nextSibling);
        return;
    }

    if (destination.nodeType !== destination.ELEMENT_NODE) {
        throw new Error('XML move append/prepend requires an element destination.');
    }

    const element = destination as Element;
    if (position === 'prepend') {
        element.insertBefore(source, element.firstChild);
        return;
    }

    element.appendChild(source);
}

function setXmlAttribute(node: Node, attributeName: string, value: unknown): void {
    if (node.nodeType !== node.ELEMENT_NODE) {
        throw new Error('set_attribute requires element targets.');
    }

    (node as Element).setAttribute(attributeName, String(value ?? ''));
}

function deleteXmlAttribute(node: Node, attributeName: string): void {
    if (node.nodeType !== node.ELEMENT_NODE) {
        throw new Error('delete_attribute requires element targets.');
    }

    (node as Element).removeAttribute(attributeName);
}

function materializeXmlNodes(document: Document, value: unknown): Node[] {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('<')) {
            const wrapped = parseXmlDocument(`<root>${trimmed}</root>`);
            return Array.from(wrapped.documentElement.childNodes).map(node => node.cloneNode(true));
        }
        return [];
    }

    if (value !== null && typeof value === 'object') {
        const xml = xmlBuilder.build(value);
        const wrapped = parseXmlDocument(`<root>${xml}</root>`);
        return Array.from(wrapped.documentElement.childNodes).map(node => node.cloneNode(true));
    }

    return [];
}