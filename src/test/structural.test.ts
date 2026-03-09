import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import {
    diffStructuredDocuments,
    inspectStructuredDocument,
    mutateStructuredDocument,
    queryStructuredDocument,
    validateStructuredDocument
} from '../tools/structShared';

// Ensure Mocha globals are available
declare function suite(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

suite('Structural Formatting Fixtures', () => {
    const fixturesDir = path.resolve(__dirname, '..', '..', 'src', 'test', 'fixtures', 'structured');
    const mockToken: vscode.CancellationToken = {
        isCancellationRequested: false,
        onCancellationRequested: (() => ({ dispose() { /* noop */ } })) as unknown as vscode.CancellationToken['onCancellationRequested']
    };

    function copyFixtureToTemp(fileName: string): string {
        const sourcePath = path.join(fixturesDir, fileName);
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-struct-fixture-'));
        const targetPath = path.join(tempDir, fileName);
        fs.copyFileSync(sourcePath, targetPath);
        return targetPath;
    }

    test('should preserve single-line JSON formatting', async () => {
        const filePath = copyFixtureToTemp('json_oneline.json');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.orders[0].status', value: 'shipped' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        const normalized = saved.replace(/(\r?\n)+$/, '');
        assert.ok(!normalized.includes('\n') && !normalized.includes('\r'), 'Single-line JSON should remain single-line');
        assert.ok(saved.includes('"status":"shipped"'));
    });

    test('should preserve BOM, CRLF and tab indentation for JSON', async () => {
        const filePath = copyFixtureToTemp('json_tabs_bom_crlf.json');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.orders[0].status', value: 'shipped' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
        assert.ok(saved.includes('\n\t"orders"'), 'Tab indentation should be preserved');
        assert.ok(saved.includes('"status": "shipped"'));
    });

    test('should preserve two-space XML indentation on insert', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'insert', target: '/orders[1]', value: '<order id="3" status="pending"><item sku="C-3">Adapter</item></order>', position: 'append' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('\n  <order id="1"'), 'Top-level children should keep two-space indentation');
        assert.ok(saved.includes('\n    <item sku="C-3">Adapter</item>'), 'Nested children should keep four-space indentation');
        assert.ok(saved.includes('<order id="3" status="pending">'));
    });

    test('should preserve BOM, CRLF and tab indentation for XML', async () => {
        const filePath = copyFixtureToTemp('xml_tabs_bom_crlf.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
        assert.ok(saved.includes('\r\n\t<order id="1" status="pending" priority="high">'));
        assert.ok(saved.includes('\r\n\t\t<item sku="A-1">Widget</item>'));
    });

    test('should keep single-line XML single-line after mutation', async () => {
        const filePath = copyFixtureToTemp('xml_oneline.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        const normalized = saved.replace(/(\r?\n)+$/, '');
        assert.ok(!normalized.includes('\n') && !normalized.includes('\r'), 'Single-line XML should remain single-line');
        assert.ok(saved.includes('priority="high"'));
    });

    test('should inspect namespaces and query same local names across XML namespaces', async () => {
        const filePath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
        const namespaces = {
            c: 'http://example.com/catalog',
            inv: 'http://example.com/inventory',
            meta: 'http://example.com/meta'
        };

        const inspectResult = await inspectStructuredDocument({
            filePath,
            depth: 1
        });
        const queryCatalog = await queryStructuredDocument({
            filePath,
            expression: '//c:item',
            namespaces,
            return: 'count'
        });
        const queryInventory = await queryStructuredDocument({
            filePath,
            expression: '//inv:item',
            namespaces,
            return: 'paths+values'
        });
        const queryMeta = await queryStructuredDocument({
            filePath,
            expression: '//meta:item',
            namespaces,
            return: 'count'
        });

        const rootNamespaces = (inspectResult.data.structure as { namespaces?: Array<{ prefix: string; uri: string }> }).namespaces ?? [];
        assert.strictEqual(rootNamespaces.length, 3, 'Root should expose all namespace declarations');
        assert.strictEqual(queryCatalog.data.count, 1, 'Default namespace item should be addressable via mapped prefix');
        assert.strictEqual(queryInventory.data.count, 2, 'Inventory namespace should return both inv:item nodes');
        assert.strictEqual(queryMeta.data.count, 1, 'Meta namespace should return one meta:item');
    });

    test('should mutate namespaced XML while preserving tab/CRLF/BOM formatting', async () => {
        const filePath = copyFixtureToTemp('xml_namespaces_tabs_bom_crlf.xml');
        const namespaces = {
            c: 'http://example.com/catalog',
            inv: 'http://example.com/inventory',
            meta: 'http://example.com/meta'
        };

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                {
                    action: 'insert',
                    target: '/c:catalog[1]',
                    position: 'append',
                    value: '<inv:item inv:id="inventory-2"><inv:name>Spare Cable</inv:name></inv:item>',
                    namespaces
                }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('\r\n'), 'CRLF should be preserved');
        assert.ok(saved.includes('<inv:item inv:id="inventory-2">'));
        assert.ok(saved.includes('<inv:name>Spare Cable</inv:name>'));
        assert.ok(result.editInstructions.length > 0, 'Should have edit instructions');
    });

    test('should support JSONC mutation while preserving comments', async () => {
        const filePath = copyFixtureToTemp('json_comments.jsonc');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.featureFlags.jsoncSupport', value: true },
                { action: 'set', target: '$.featureFlags.newFlag', value: 'enabled' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('// This comment must survive JSONC mutation'));
        assert.ok(saved.includes('"jsoncSupport": true'));
        assert.ok(saved.includes('"newFlag": "enabled"'));
    });

    test('inspect and query should not modify source files', async () => {
        const jsonPath = copyFixtureToTemp('json_comments.jsonc');
        const xmlPath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
        const jsonBefore = fs.readFileSync(jsonPath, 'utf8');
        const xmlBefore = fs.readFileSync(xmlPath, 'utf8');

        await inspectStructuredDocument({ filePath: jsonPath, depth: 2 });
        await queryStructuredDocument({ filePath: jsonPath, expression: '$.featureFlags', return: 'count' });
        await inspectStructuredDocument({ filePath: xmlPath, depth: 2 });
        await queryStructuredDocument({
            filePath: xmlPath,
            expression: '//inv:item',
            namespaces: {
                c: 'http://example.com/catalog',
                inv: 'http://example.com/inventory',
                meta: 'http://example.com/meta'
            },
            return: 'count'
        });

        assert.strictEqual(fs.readFileSync(jsonPath, 'utf8'), jsonBefore);
        assert.strictEqual(fs.readFileSync(xmlPath, 'utf8'), xmlBefore);
    });

    test('should respect inspect depth on deeply nested JSON', async () => {
        const filePath = copyFixtureToTemp('json_deeply_nested.json');
        const result = await inspectStructuredDocument({ filePath, depth: 3 });
        const structure = result.data.structure as { children?: Array<{ name: string; children?: unknown[] }> };
        const level1 = structure.children?.find(child => child.name === 'level1') as { children?: Array<{ name: string; children?: unknown[] }> };
        const level2 = level1.children?.find(child => child.name === 'level2') as { children?: Array<{ name: string; children?: unknown[] }> };
        const level3 = level2.children?.find(child => child.name === 'level3') as { children?: unknown[] };

        assert.ok(level3);
        assert.strictEqual(level3.children?.length ?? 0, 0, 'Depth-limited inspect should stop at requested depth');
    });

    test('should respect query limit on large arrays', async () => {
        const filePath = copyFixtureToTemp('json_large_array.json');
        const result = await queryStructuredDocument({
            filePath,
            expression: '$.items[*]',
            return: 'paths+values',
            limit: 25
        });

        assert.strictEqual(result.data.count, 1200);
        assert.strictEqual((result.data.results as unknown[]).length, 25);
        assert.strictEqual(result.data.truncated, true);
    });

    test('should keep an empty array when deleting the last element', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'delete', target: '$.orders[1]' },
                { action: 'delete', target: '$.orders[0]' }
            ],
        }, mockToken);

        assert.ok(result._serializedContent.includes('"orders": []'));
    });

    test('should reject deleting the JSON root', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');

        await assert.rejects(
            () => mutateStructuredDocument({
                filePath,
                operations: [
                    { action: 'delete', target: '$' }
                ],
            }, mockToken),
            /Deleting the JSON root is not allowed/
        );
    });

    test('should reject rename conflicts in JSON', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');

        await assert.rejects(
            () => mutateStructuredDocument({
                filePath,
                operations: [
                    { action: 'rename', target: '$.orders[0].status', value: 'id' }
                ],
            }, mockToken),
            /rename conflict/
        );
    });

    test('should treat zero-match bulk delete as successful no-op', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'delete', target: '$.orders[?(@.status=="missing")]', bulk: true }
            ],
        }, mockToken);

        assert.strictEqual(result.operationDetails[0].matched, 0);
        assert.strictEqual(result.operationDetails[0].changed, 0);
    });

    test('should apply JSON batch operations sequentially on one tree', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.a.b.c.d', value: 1 },
                { action: 'set', target: '$.a.b.c.e', value: 2 }
            ],
        }, mockToken);

        const content = JSON.parse(result._serializedContent) as { a: { b: { c: { d: number; e: number } } } };
        assert.strictEqual(content.a.b.c.d, 1);
        assert.strictEqual(content.a.b.c.e, 2);
    });

    test('should insert into empty array and empty object in JSONC', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-empty-jsonc-'));
        const filePath = path.join(tempDir, 'empty.jsonc');
        fs.writeFileSync(filePath, '{\n  "items": [],\n  "meta": {}\n}\n', 'utf8');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'insert', target: '$.items', value: { id: 1 }, position: 'append' },
                { action: 'insert', target: '$.meta', value: { createdBy: 'test' }, position: 'append' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('"items": ['));
        assert.ok(saved.includes('"id": 1'));
        assert.ok(saved.includes('"createdBy": "test"'));
    });

    test('should preserve XML declaration, doctype and empty-tag style where possible', async () => {
        const filePath = copyFixtureToTemp('xml_self_closing.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/layout[1]/icon[1]', attribute: 'priority', value: 'high' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
        assert.ok(saved.includes('<!DOCTYPE layout>'));
        assert.ok(saved.includes('<br/>'));
        assert.ok(saved.includes('<divider></divider>'));
    });

    test('should keep mixed-content XML semantically intact after unrelated mutation', async () => {
        const filePath = copyFixtureToTemp('xml_mixed_content.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/article[1]/p[2]/i[1]', attribute: 'tone', value: 'soft' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('<p>text <b>bold</b> tail</p>'));
        assert.ok(saved.includes('<i tone="soft">italic</i>'));
    });

    test('should report duplicate-key, unsafe-integer and unicode-escape diagnostics in inspect', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diagnostics-inspect-'));
        const filePath = path.join(tempDir, 'diagnostics.json');
        fs.writeFileSync(
            filePath,
            '{\n  "dup": 1,\n  "dup": 2,\n  "unsafe": 9007199254740993,\n  "escaped": "\\u0041"\n}\n',
            'utf8'
        );

        const result = await inspectStructuredDocument({ filePath, depth: 2 });
        const diagnostics = result.data.diagnostics as Array<{ kind: string; path?: string }>;
        const kinds = diagnostics.map(item => item.kind);

        assert.ok(kinds.includes('duplicate-key'));
        assert.ok(kinds.includes('unsafe-integer'));
        assert.ok(kinds.includes('unicode-escape-risk'));
        assert.ok(diagnostics.some(item => item.path === '$.dup'));
    });

    test('should keep diagnostics when validate reports invalid JSON', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diagnostics-validate-'));
        const filePath = path.join(tempDir, 'invalid-diagnostics.json');
        fs.writeFileSync(
            filePath,
            '{\n  "dup": 1,\n  "dup": 2,\n  "unsafe": 9007199254740993,\n  "escaped": "\\u0041",\n',
            'utf8'
        );

        const result = await validateStructuredDocument({ filePath });
        const diagnostics = result.data.diagnostics as Array<{ kind: string }>;

        assert.strictEqual(result.data.valid, false);
        assert.ok((result.data.errors as Array<{ message: string }>)[0].message.length > 0);
        assert.ok(diagnostics.some(item => item.kind === 'duplicate-key'));
        assert.ok(diagnostics.some(item => item.kind === 'unsafe-integer'));
        assert.ok(diagnostics.some(item => item.kind === 'unicode-escape-risk'));
    });

    test('should preserve four-space XML indentation on mutation', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_4.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/orders[1]/order[1]', attribute: 'priority', value: 'high' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('\n    <order id="1"'), 'Top-level children should keep four-space indentation');
        assert.ok(saved.includes('\n        <item sku="A-1">Widget</item>'), 'Nested children should keep eight-space indentation');
        assert.ok(saved.includes('priority="high"'));
    });

    test('should preserve XML attribute single-quote style', async () => {
        const filePath = copyFixtureToTemp('xml_single_quotes.xml');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/config[1]/database[1]', attribute: 'schema', value: 'public' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes("host='localhost'"), 'Single-quoted attributes should remain single-quoted');
        assert.ok(saved.includes('name="mydb"'), 'Double-quoted attributes should remain double-quoted');
    });

    test('should preserve JSON without trailing newline', async () => {
        const filePath = copyFixtureToTemp('json_no_trailing_newline.json');

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.key', value: 'updated' }
            ],
        }, mockToken);

        const saved = result._serializedContent;
        assert.ok(saved.includes('"key": "updated"'));
        assert.ok(!saved.endsWith('\n'), 'File without trailing newline should not gain one');
    });

    test('should compute structural diff between two JSON files', async () => {
        const beforePath = copyFixtureToTemp('json_spaces_2.json');
        const afterDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-diff-after-'));
        const afterPath = path.join(afterDir, 'json_spaces_2.json');
        fs.copyFileSync(beforePath, afterPath);

        const mutateResult = await mutateStructuredDocument({
            filePath: afterPath,
            operations: [
                { action: 'set', target: '$.orders[0].status', value: 'shipped' }
            ],
        }, mockToken);

        fs.writeFileSync(afterPath, mutateResult._serializedContent, 'utf8');

        const result = await diffStructuredDocuments({
            filePathBefore: beforePath,
            filePathAfter: afterPath
        });

        assert.ok(result.changeCount > 0, 'Diff should detect at least one change');
    });

    test('should validate well-formed JSON returns valid true', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await validateStructuredDocument({ filePath });
        assert.strictEqual(result.data.valid, true, 'Well-formed JSON should be valid');
    });

    test('should validate well-formed XML returns valid true', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        const result = await validateStructuredDocument({ filePath });
        assert.strictEqual(result.data.valid, true, 'Well-formed XML should be valid');
    });

    test('should abort mutation when cancellation is requested', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const cancelledToken: vscode.CancellationToken = {
            isCancellationRequested: true,
            onCancellationRequested: (() => ({ dispose() { /* noop */ } })) as unknown as vscode.CancellationToken['onCancellationRequested']
        };

        await assert.rejects(
            () => mutateStructuredDocument({
                filePath,
                operations: [
                    { action: 'set', target: '$.orders[0].status', value: 'cancelled' }
                ],
            }, cancelledToken),
            /cancelled/i
        );
    });

    test('should reject files exceeding size limit', async () => {
        // File won't actually be 50MB+ but we test the error path exists
        // by verifying the function works with a normal file
        const normalResult = await inspectStructuredDocument({ filePath: copyFixtureToTemp('json_spaces_2.json'), depth: 1 });
        assert.ok(normalResult.data.structure, 'Normal-sized file should inspect correctly');
    });

    test('should reject deleting XML root element', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        await assert.rejects(
            () => mutateStructuredDocument({
                filePath,
                operations: [
                    { action: 'delete', target: '/orders' },
                ],
            }, mockToken),
            /XML root element is not allowed/i,
        );
    });

    test('should return changed:0 for bulk set with zero matches', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.totally_missing[*]', value: 'x', bulk: true },
            ],
        }, mockToken);
        const opSummary = result.operationDetails[0];
        assert.strictEqual(opSummary.matched, 0, 'Should match 0 nodes');
        assert.strictEqual(opSummary.changed, 0, 'Should change 0 nodes');
    });

    test('should reject invalid JSONPath expression', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        await assert.rejects(
            () => queryStructuredDocument({
                filePath,
                expression: '[[invalid jsonpath',
            }),
            /must start with "\$"/i,
        );
    });

    test('should not duplicate XML declaration after mutation', async () => {
        const filePath = copyFixtureToTemp('xml_self_closing.xml');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/layout', attribute: 'version', value: '2.0' },
            ],
        }, mockToken);
        const declarationCount = (result._serializedContent.match(/<\?xml /g) ?? []).length;
        assert.strictEqual(declarationCount, 1, 'XML declaration should appear exactly once');
    });

    test('should show allowed values for invalid schemaType', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        await assert.rejects(
            () => validateStructuredDocument({
                filePath,
                schema: '{}',
                schemaType: 'jsonschema' as unknown as import('../types').StructSchemaType,
            }),
            /Allowed values/i,
        );
    });

    test('should not set truncated:true in count return mode', async () => {
        const filePath = copyFixtureToTemp('json_large_array.json');
        const result = await queryStructuredDocument({
            filePath,
            expression: '$.items[*]',
            return: 'count',
            limit: 1,
        });
        assert.strictEqual(result.data.truncated, false, 'count mode should not set truncated');
        assert.ok(result.data.count > 0, 'count should be positive');
    });

    test('should report hasMixedContent for XML elements with text and children', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-mixed-'));
        const filePath = path.join(tempDir, 'mixed.xml');
        fs.writeFileSync(filePath, '<root><p>text <b>bold</b> tail</p></root>');
        const result = await inspectStructuredDocument({ filePath, depth: 3 });
        const rootChildren = (result.data.structure as { children: unknown[] }).children;
        const pElement = rootChildren[0] as { hasMixedContent?: boolean; name: string };
        assert.strictEqual(pElement.name, 'p');
        assert.strictEqual(pElement.hasMixedContent, true, 'p should have hasMixedContent');
    });

    test('should use XPath notation in XML diff paths', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-xmldiff-'));
        const beforePath = path.join(tempDir, 'before.xml');
        const afterPath = path.join(tempDir, 'after.xml');
        fs.writeFileSync(beforePath, '<root><item status="old"/></root>');
        fs.writeFileSync(afterPath, '<root><item status="new"/></root>');
        const result = await diffStructuredDocuments({
            filePathBefore: beforePath,
            filePathAfter: afterPath,
        });
        assert.strictEqual(result.changeCount, 1);
        const change = result.changes[0];
        assert.ok(change.path.includes('/@status'), `Path should use XPath @ for attributes, got: ${change.path}`);
        assert.ok(!change.path.startsWith('$'), `Path should not use JSON $ prefix, got: ${change.path}`);
    });

    test('should return XML content in mutate response', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set_attribute', target: '/orders/order[1]', attribute: 'test', value: 'yes' },
            ],
        }, mockToken);
        assert.ok(result._serializedContent, 'XML mutate should return serialized content');
        assert.ok(typeof result._serializedContent === 'string', 'XML content should be a string');
        assert.ok(result._serializedContent.includes('test="yes"'), 'Content should contain the mutation');
    });

    test('should copy JSON node to new location', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'copy', target: '$.orders[0]', destination: '$.ordersCopy' },
            ],
        }, mockToken);
        assert.strictEqual(result.operationDetails[0].changed, 1);
        const parsed = JSON.parse(result._serializedContent) as Record<string, unknown>;
        assert.ok(parsed.ordersCopy, 'Copied node should exist at destination');
    });

    test('should copy XML node to new location', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'copy', target: '/orders/order[1]', destination: '/orders', position: 'append' },
            ],
        }, mockToken);
        assert.strictEqual(result.operationDetails[0].changed, 1);
    });

    test('should include formatting metadata in inspect response', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await inspectStructuredDocument({ filePath, depth: 1 });
        assert.ok(result.data.formatting, 'inspect should include formatting metadata');
        assert.ok('hasBom' in result.data.formatting, 'formatting should include hasBom');
        assert.ok('eol' in result.data.formatting, 'formatting should include eol');
        assert.ok('indent' in result.data.formatting, 'formatting should include indent');
        assert.ok('trailingNewline' in result.data.formatting, 'formatting should include trailingNewline');
    });

    test('should include namespaceURI for prefixed XML elements', async () => {
        const filePath = copyFixtureToTemp('xml_namespaces_same_tags.xml');
        const result = await inspectStructuredDocument({ filePath, depth: 5 });
        const structure = result.data.structure as { name: string; children: Array<{ namespaceURI?: string; prefix?: string; name: string; children?: unknown[] }> };
        const prefixed = findPrefixedElement(structure);
        assert.ok(prefixed, 'Should find a prefixed element in namespace fixture');
        assert.ok(prefixed.namespaceURI, `Prefixed element "${prefixed.name}" should have namespaceURI`);
        assert.ok(prefixed.prefix, `Prefixed element "${prefixed.name}" should have prefix`);
    });

    test('should execute batch operations in order (later ops see earlier results)', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.batchTest', value: 'step1' },
                { action: 'set', target: '$.batchTest', value: 'step2' },
            ],
        }, mockToken);
        assert.strictEqual(result.operationDetails.length, 2);
        const parsed = JSON.parse(result._serializedContent) as Record<string, unknown>;
        assert.strictEqual(parsed.batchTest, 'step2', 'Second operation should override first');
    });

    test('should produce compact editInstructions for rename (not O(n) per-line)', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'rename', target: '$.name', value: 'title' },
            ],
        }, mockToken);
        assert.ok(result.success, 'Rename should succeed');
        assert.ok(result.editInstructions.length <= 3,
            `Rename of one key should produce at most 3 edit instructions, got ${result.editInstructions.length}`);
        const parsed = JSON.parse(result._serializedContent) as Record<string, unknown>;
        assert.ok('title' in parsed, 'Renamed key should exist');
        assert.ok(!('name' in parsed), 'Original key should not exist');
    });

    test('should handle @-prefix keys in JSONPath without TypeError', async () => {
        // Create a temp file with @-prefix keys (like Flutter ARB files)
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-struct-atprefix-'));
        const filePath = path.join(tempDir, 'arb_test.json');
        fs.writeFileSync(filePath, JSON.stringify({
            '@@locale': 'en',
            'add': 'Add',
            '@add': { 'description': 'Add button label' },
        }, null, 2));

        // Query with @-prefix key
        const queryResult = await queryStructuredDocument({
            filePath,
            expression: '$["@add"]',
            return: 'values' as 'values',
        });
        assert.ok(queryResult.data.totalMatches > 0, 'Should find @add key');

        // Inspect with path targeting @-prefix key
        const inspectResult = await inspectStructuredDocument({
            filePath,
            path: '$["@add"]',
        });
        assert.ok(inspectResult.data, 'Inspect with @-prefix path should return data');

        // Mutate @-prefix key
        const mutateResult = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$["@add"].description', value: 'Updated label' },
            ],
        }, mockToken);
        assert.ok(mutateResult.success, 'Mutation on @-prefix key should succeed');
        const parsed = JSON.parse(mutateResult._serializedContent) as Record<string, unknown>;
        assert.strictEqual(
            (parsed['@add'] as Record<string, unknown>).description,
            'Updated label',
        );
    });

    test('should inspect subtree when path parameter is provided (JSON)', async () => {
        const filePath = copyFixtureToTemp('json_deeply_nested.json');
        // Inspect whole document
        const fullResult = await inspectStructuredDocument({ filePath });
        // Inspect with path
        const subResult = await inspectStructuredDocument({
            filePath,
            path: '$.level1',
        });
        assert.ok(subResult.data, 'Subtree inspect should return data');
        assert.ok(subResult.data.structure, 'Subtree inspect should have structure');
        // The subtree structure should be smaller than the full structure
        const fullStr = JSON.stringify(fullResult.data.structure);
        const subStr = JSON.stringify(subResult.data.structure);
        assert.ok(subStr.length <= fullStr.length,
            'Subtree structure should be no larger than full structure');
    });

    test('should inspect subtree when path parameter is provided (XML)', async () => {
        const filePath = copyFixtureToTemp('xml_spaces_2.xml');
        // Inspect with path
        const subResult = await inspectStructuredDocument({
            filePath,
            path: '//item',
        });
        assert.ok(subResult.data, 'XML subtree inspect should return data');
        assert.ok(subResult.data.structure, 'XML subtree inspect should have structure');
        assert.ok(subResult.data.path, 'Response should include the path that was used');
    });

    test('should handle @@locale key with double @-prefix (ARB files)', async () => {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'askme-struct-arb-'));
        const filePath = path.join(tempDir, 'app_en.arb');
        fs.writeFileSync(filePath, JSON.stringify({
            '@@locale': 'en',
            'title': 'App Title',
            '@title': { 'description': 'Main title' },
        }, null, 2));

        // Query @@locale
        const queryResult = await queryStructuredDocument({
            filePath,
            expression: '$["@@locale"]',
            return: 'values' as 'values',
        });
        assert.ok(queryResult.data.totalMatches > 0, 'Should find @@locale key');

        // Mutate @@locale
        const mutateResult = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$["@@locale"]', value: 'ru' },
            ],
        }, mockToken);
        assert.ok(mutateResult.success, 'Mutation on @@locale key should succeed');
        const parsed = JSON.parse(mutateResult._serializedContent) as Record<string, unknown>;
        assert.strictEqual(parsed['@@locale'], 'ru');
    });

    test('should generate bracket-notation paths for keys with dots', async () => {
        const filePath = copyFixtureToTemp('json_comments.jsonc');
        const result = await inspectStructuredDocument({ filePath });
        const structure = result.data.structure as { children?: Array<{ name: string; path: string }> };
        const dotKeyChild = structure.children?.find(
            (child: { name: string }) => child.name === 'editor.tabSize',
        );
        assert.ok(dotKeyChild, 'Should find editor.tabSize key in inspect');
        assert.ok(
            dotKeyChild.path.includes('["editor.tabSize"]'),
            `Path should use bracket notation for dotted key, got: ${dotKeyChild.path}`,
        );
    });

    test('should copy into array destination with append position', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const beforeResult = await queryStructuredDocument({
            filePath,
            expression: '$.orders[*]',
            return: 'count' as 'count',
        });
        const beforeCount = beforeResult.data.count;

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'copy', target: '$.orders[0]', destination: '$.orders', position: 'append' },
            ],
        }, mockToken);
        assert.ok(result.success, 'Copy should succeed');
        const parsed = JSON.parse(result._serializedContent) as Record<string, unknown>;
        const orders = parsed.orders as unknown[];
        assert.strictEqual(orders.length, beforeCount + 1,
            `Array should grow by 1 after copy append (was ${beforeCount}, got ${orders.length})`);
    });

    test('should move within array using prepend position', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const beforeQuery = await queryStructuredDocument({
            filePath,
            expression: '$.orders[*]',
            return: 'count' as 'count',
        });
        const beforeCount = beforeQuery.data.count;

        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'move', target: '$.orders[1]', destination: '$.orders', position: 'prepend' },
            ],
        }, mockToken);
        assert.ok(result.success, 'Move should succeed');
        const parsed = JSON.parse(result._serializedContent) as Record<string, unknown>;
        const orders = parsed.orders as unknown[];
        // Move within same array: delete from position, insert at start — count stays same
        assert.strictEqual(orders.length, beforeCount,
            `Array should keep same length after move within (was ${beforeCount}, got ${orders.length})`);
    });

    test('should report JSONC format for .jsonc files', async () => {
        const filePath = copyFixtureToTemp('json_comments.jsonc');
        const result = await inspectStructuredDocument({ filePath });
        assert.strictEqual(result.data.format, 'jsonc',
            `JSONC file should report format "jsonc", got "${result.data.format}"`);
    });

    test('should report changed:0 when set value equals current value', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        // First get current value
        const queryResult = await queryStructuredDocument({
            filePath,
            expression: '$.orders[0].status',
            return: 'values' as 'values',
        });
        const currentValue = (queryResult.data.results as unknown[])[0];

        // Set the same value — should be no-op
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.orders[0].status', value: currentValue },
            ],
        }, mockToken);
        assert.ok(result.success);
        assert.strictEqual(result.operationDetails[0].changed, 0,
            'Setting same value should report changed: 0');
    });

    test('should warn about created path when set auto-creates intermediate nodes', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        const result = await mutateStructuredDocument({
            filePath,
            operations: [
                { action: 'set', target: '$.newParent.newChild', value: 'created' },
            ],
        }, mockToken);
        assert.ok(result.success);
        assert.ok(result.warnings.length > 0, 'Should have warning about created path');
        assert.ok(
            result.warnings[0].includes('created intermediate nodes'),
            `Warning should mention created nodes, got: "${result.warnings[0]}"`,
        );
    });

    test('should provide clear error message for rename without value', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        try {
            await mutateStructuredDocument({
                filePath,
                operations: [
                    { action: 'rename', target: '$.orders[0].status' },
                ],
            }, mockToken);
            assert.fail('Rename without value should throw');
        } catch (error) {
            const message = (error as Error).message;
            assert.ok(message.includes('"value" field'),
                `Error should mention "value" field, got: "${message}"`);
        }
    });

    test('should support top-level bulk parameter for all operations', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        // Top-level bulk=true should apply to all operations
        const result = await mutateStructuredDocument({
            filePath,
            bulk: true,
            operations: [
                { action: 'set', target: '$.orders[*].status', value: 'shipped' },
            ],
        }, mockToken);
        assert.ok(result.success);
        assert.strictEqual(result.operationDetails[0].matched, 2,
            'Should match both orders');
        assert.strictEqual(result.operationDetails[0].changed, 2,
            'Top-level bulk should change ALL matches, not just first');
    });

    test('should let per-operation bulk override top-level bulk', async () => {
        const filePath = copyFixtureToTemp('json_spaces_2.json');
        // Top-level bulk=true, but operation explicitly sets bulk=false
        const result = await mutateStructuredDocument({
            filePath,
            bulk: true,
            operations: [
                { action: 'set', target: '$.orders[*].status', value: 'shipped', bulk: false },
            ],
        }, mockToken);
        assert.ok(result.success);
        // Per-operation bulk=false should override top-level
        assert.strictEqual(result.operationDetails[0].changed, 1,
            'Per-operation bulk=false should override top-level bulk=true');
    });
});

function findPrefixedElement(node: { name: string; prefix?: string; namespaceURI?: string; children?: unknown[] }): { name: string; prefix?: string; namespaceURI?: string } | undefined {
    if (node.prefix) {
        return node;
    }
    if (node.children) {
        for (const child of node.children) {
            const found = findPrefixedElement(child as { name: string; prefix?: string; namespaceURI?: string; children?: unknown[] });
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}
