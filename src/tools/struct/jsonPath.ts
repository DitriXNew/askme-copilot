import { IJsonQueryMatch } from './common';
import { isPlainObject } from './common';

export function orderJsonMatchesForDeletion(matches: IJsonQueryMatch[]): IJsonQueryMatch[] {
    return [...matches].sort((left, right) => {
        const leftPath = parseSimpleJsonPath(left.path) ?? [];
        const rightPath = parseSimpleJsonPath(right.path) ?? [];
        if (leftPath.length !== rightPath.length) {
            return rightPath.length - leftPath.length;
        }

        const leftLast = leftPath[leftPath.length - 1];
        const rightLast = rightPath[rightPath.length - 1];
        if (typeof leftLast === 'number' && typeof rightLast === 'number') {
            return rightLast - leftLast;
        }

        return 0;
    });
}

export function getValueAtPath(root: unknown, pathSegments: Array<string | number>): unknown {
    let current = root;
    for (const segment of pathSegments) {
        if (typeof segment === 'number') {
            if (!Array.isArray(current)) {
                return undefined;
            }
            current = current[segment];
            continue;
        }

        if (!isPlainObject(current)) {
            return undefined;
        }

        current = (current as Record<string, unknown>)[segment];
    }

    return current;
}

export function resolveArrayInsertionIndex(length: number, position?: string): number {
    if (!position || position === 'append') {
        return length;
    }

    if (position === 'prepend') {
        return 0;
    }

    if (position.startsWith('at:')) {
        const index = Number(position.slice(3));
        if (!Number.isInteger(index) || index < 0 || index > length) {
            throw new Error(`Invalid insert position: ${position}`);
        }
        return index;
    }

    throw new Error(`Unsupported JSON/JSONC insert position: ${position}`);
}

export function getPropertyInsertionIndex(parent: Record<string, unknown>, oldKey: string, newKey: string): number {
    const keys = Object.keys(parent);
    const existingIndex = keys.indexOf(oldKey);
    if (existingIndex === -1 || newKey === oldKey) {
        return keys.length;
    }
    return existingIndex;
}

export function setJsonAtPath(root: unknown, target: string, value: unknown): boolean {
    const segments = parseSimpleJsonPath(target);
    if (!segments) {
        return false;
    }

    let current = root as Record<string, unknown> | unknown[];
    for (let index = 0; index < segments.length - 1; index += 1) {
        const segment = segments[index];
        const nextSegment = segments[index + 1];

        if (typeof segment === 'number') {
            if (!Array.isArray(current)) {
                return false;
            }

            if (current[segment] === undefined) {
                current[segment] = typeof nextSegment === 'number' ? [] : {};
            }
            current = current[segment] as Record<string, unknown> | unknown[];
            continue;
        }

        if (Array.isArray(current)) {
            return false;
        }

        if (current[segment] === undefined) {
            current[segment] = typeof nextSegment === 'number' ? [] : {};
        }
        current = current[segment] as Record<string, unknown> | unknown[];
    }

    const last = segments[segments.length - 1];
    if (typeof last === 'number') {
        if (!Array.isArray(current)) {
            return false;
        }
        current[last] = value;
        return true;
    }

    if (Array.isArray(current)) {
        return false;
    }

    current[last] = value;
    return true;
}

export function parseSimpleJsonPath(target: string): Array<string | number> | null {
    if (!target.startsWith('$')) {
        return null;
    }

    const normalized = target.trim();
    if (normalized === '$') {
        return [];
    }

    const segments: Array<string | number> = [];
    const regex = /(?:\.([A-Za-z_$][\w$-]*))|(?:\[(\d+)\])|(?:\[['"]([^'"\]]+)['"]\])/g;
    let match: RegExpExecArray | null;
    let consumed = '$';

    while ((match = regex.exec(normalized)) !== null) {
        consumed += match[0];
        if (match[1]) {
            segments.push(match[1]);
        } else if (match[2]) {
            segments.push(Number(match[2]));
        } else if (match[3]) {
            segments.push(match[3]);
        }
    }

    return consumed === normalized ? segments : null;
}