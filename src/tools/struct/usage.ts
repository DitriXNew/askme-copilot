import { IMutationSummary } from './common';

export function createInspectUsage(): string {
    return 'struct_inspect({ filePath: "data/orders.json", depth: 2 })';
}

export function createQueryUsage(): string {
    return 'struct_query({ filePath: "data/orders.xml", expression: "//ns:order", namespaces: { ns: "http://example.com" }, return: "paths" })';
}

export function createMutateUsage(): string {
    return 'struct_mutate({ filePath: "data/orders.json", operations: [{ action: "set", target: "$.orders[0].status", value: "shipped" }] })';
}

export function createValidateUsage(): string {
    return 'struct_validate({ filePath: "data/orders.json", schema: "schemas/orders.schema.json", schemaType: "json_schema" })';
}

export function createDiffUsage(): string {
    return 'struct_diff({ filePathBefore: "before/orders.xml", filePathAfter: "after/orders.xml", ignoreWhitespace: true })';
}

export function summarizeMutationResult(result: { operationDetails: IMutationSummary[]; summary: string }): string {
    const lines = [result.summary];
    result.operationDetails.forEach((operation, index) => {
        lines.push(`${index + 1}. ${operation.action} on ${operation.target} -> changed ${operation.changed}, matched ${operation.matched}`);
    });
    return lines.join('\n');
}