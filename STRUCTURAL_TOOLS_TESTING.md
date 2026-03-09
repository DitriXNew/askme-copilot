# Structural Tools Testing Guide

This guide tells an AI agent what to test, how to test it, and how to verify that the result is correct for the structural JSON/XML tools.

## Architecture Notes

The structural tools use the VS Code API for all file I/O and mutations:

- **Reading**: `vscode.workspace.openTextDocument()` + `doc.getText()` — respects open/dirty buffers,
  encoding, and VS Code's BOM/EOL handling. Never uses `fs.readFileSync` for production reads.
- **Writing**: `vscode.workspace.applyEdit(WorkspaceEdit)` with minimal line-based diff — supports
  undo/redo, dirty state, and avoids conflict dialogs. Never uses `fs.writeFileSync`.
- **Cancellation**: All mutation loops check `CancellationToken.isCancellationRequested`.
- **File size**: Files > 50MB are rejected before parsing (VS Code TextDocument limit).
- **BOM**: VS Code strips BOM from `getText()` and re-adds on save. Tools never add BOM to
  WorkspaceEdit text. The `hasBom` flag is detected from raw bytes for informational purposes.
- **EOL**: Read from `doc.eol` (CRLF or LF). Serialization uses the detected EOL.
  WorkspaceEdit does NOT auto-normalize line endings — tools must match EOL themselves.
- **Attribute quotes**: XML attribute quote style (single vs double) is detected and preserved
  per attribute using `detectXmlAttributeQuoteStyles()`.
- **Tool results**: All structured data is serialized into `LanguageModelTextPart` as JSON text
  (via `JSON.stringify`). The LLM cannot read `LanguageModelDataPart` — only text parts are visible.
- **JSONPath validation**: Expressions not starting with `$` are rejected with an explicit error
  because `jsonpath-plus` silently returns 0 matches for invalid input.
- **autoSave**: `mutate` has an optional `autoSave: boolean` parameter. When true (and `writeBack`
  is true), the file is saved to disk after applying mutations via `document.save()`. Default is
  false — changes stay in the VS Code buffer only (dirty state).
- **XML diff paths**: `struct_diff` uses XPath notation for XML documents (e.g., `/root[1]/item[1]/@status`)
  and JSON-like paths for JSON (e.g., `$.orders[0].status`). This matches the path notation used by
  `struct_inspect` and `struct_query` for consistency.
- **Mixed content detection**: `struct_inspect` reports `hasMixedContent: true` on XML elements that
  contain both element children and non-whitespace text nodes (e.g., `<p>text <b>bold</b> tail</p>`).
  `childCount` still counts only element children.
- **XML mutate content**: `struct_mutate` returns the serialized XML in the `content` field (same as
  JSON), not just `contentMimeType`. Both formats now consistently provide the full content.
- **schemaType errors**: Invalid `schemaType` values produce an error listing all allowed values.
- **Formatting metadata**: `struct_inspect` returns a `formatting` object with `hasBom`, `eol` (`CRLF`/`LF`),
  `indent` (e.g., `"2 spaces"`, `"tab"`, `"minified"`), and `trailingNewline` for both JSON and XML.
- **Namespace URI**: `struct_inspect` includes `namespaceURI` and `prefix` fields on XML elements that
  belong to a namespace. This helps users construct namespace maps for `struct_query`.
- **Copy operation**: `struct_mutate` supports `action: "copy"` which clones a node to a `destination`
  path without removing the original (unlike `move` which removes the source).
- **Batch operation ordering**: Operations in a single `mutate` call execute sequentially — each operation
  sees the result of previous operations. This is guaranteed by the in-memory tree architecture.

## Scope

Test these tools end to end:

- `struct_inspect`
- `struct_query`
- `struct_mutate`
- `struct_validate`
- `struct_diff`

Target data should include:

- JSON with and without BOM
- JSONC for VS Code configuration files
- JSON with spaces, tabs, CRLF, LF, and single-line formatting
- XML with and without BOM
- XML with spaces, tabs, CRLF, LF, and single-line formatting
- XML with multiple namespaces
- XML with repeated local names across different namespaces
- Deeply nested arrays/objects and nested XML sibling groups

## Test Philosophy

Do not test only the success path.

For each case, verify four things:

1. The returned content is structurally correct.
2. The intended semantic change happened.
3. Formatting preservation rules were respected as far as supported.
4. Error messages are actionable and explain correct invocation.

For duplicate-key JSON, unsafe integers, and Unicode escape roundtrip risks,
the AI should also verify diagnostic reporting from non-mutating tools.
These cases should surface as structured warnings from `struct_inspect`
and `struct_validate`, even when the current architecture cannot fully preserve
the original lexical tokens.

## How To Test

### Unit tests (Mocha in VS Code host)

Tests live in `src/test/extension.test.ts` and run inside a VS Code Extension Host via
`@vscode/test-cli` + `@vscode/test-electron`. This is required because the tools depend on
`vscode.workspace.openTextDocument()` and `vscode.workspace.applyEdit()`.

```bash
# Compile first
npm run compile

# Run all tests (launches VS Code headless)
npm test
```

All struct test callbacks must be `async` since the underlying functions are async.
Pass a `vscode.CancellationToken` to `mutateStructuredDocument()`. The test file defines
a `mockToken` with `isCancellationRequested: false` for normal-path tests.

### Manual tool testing (via Copilot Chat)

1. Open a fixture file in the editor.
2. In Copilot Chat (agent mode), invoke a tool by describing the intent. For example:
   "Inspect the structure of xml_single_quotes.xml at depth 2."
3. For mutations, work on a **copy** of the fixture — never mutate the originals.
4. After a mutation, press Ctrl+Z to verify undo support (WorkspaceEdit).
5. Run `struct_validate` after every mutation to confirm the file is still well-formed.
6. Run `struct_diff` between the original and the mutated copy to document changes.

### What to verify after every mutation

- The document is dirty (unsaved) unless `autoSave: true` was passed.
- BOM, EOL, indentation, trailing newline, and attribute quote style are preserved.
- Ctrl+Z undoes the entire mutation as a single operation.
- Re-querying the mutated path returns the expected new value.
- XML mutate response includes `content` with the serialized XML string.

## Explicit Edge-Case Matrix

The AI should explicitly run tests for the following cases and mark each one as pass or fail.

### Mutation boundary cases

- Insert into an empty array `[]`
- Insert into an empty object `{}` when object insertion is supported by the current tool behavior
- `set` on a path with missing intermediate nodes such as `$.a.b.c.d`
- Delete the last element of an array and verify the array remains `[]`
- Attempt to delete the JSON root node `$` and verify the tool rejects it with "Deleting the JSON root is not allowed."
- Attempt to delete the XML root element and verify the tool rejects it with "Deleting the XML root element is not allowed."
- Rename a key to a name that already exists and verify the tool reports a conflict
- `bulk: true` with zero matches and verify it reports `matched: 0, changed: 0` instead of throwing an error
- Sequential operations in one batch where a later operation targets a node created or changed by an earlier operation
- `copy` clones a node to the destination without removing the source
- `move` removes the source and places it at the destination

### JSON and JSONC specific cases

- JSONC comments are preserved after mutation
- JSONC trailing commas remain valid after mutation
- `inspect` and `query` do not change the file bytes
- Large array query with `limit` truncates the payload but reports the full count
- Query with `return: "count"` always returns `truncated: false` regardless of limit
- Deep nesting with `depth` stops structure expansion where expected
- Invalid JSONPath expression (not starting with `$`) is rejected with an error, not silently treated as 0 matches
- Duplicate-key JSON input produces diagnostics that identify the affected object path and key name when possible
- Unsafe integers beyond JavaScript safe integer range produce diagnostics that identify the risky path or token location when possible
- Unicode escapes versus literal Unicode characters produce diagnostics when a future mutation could change lexical form without changing semantic value
- `inspect` and `validate` diagnostics stay non-destructive and do not rewrite the file bytes

### XML specific cases

- XML declaration survives mutation and appears exactly once (no duplication)
- DOCTYPE survives mutation
- Self-closing tags remain self-closing where possible
- Explicit empty tags such as `<tag></tag>` remain expanded where possible
- Mixed content such as `<p>text <b>bold</b> tail</p>` stays semantically intact
- `inspect` reports `hasMixedContent: true` for elements containing both element children and non-whitespace text nodes
- Default namespace plus prefixed namespace queries work in the same document
- Repeated local names across different namespaces are distinguished correctly
- Empty namespace reset cases such as `xmlns=""` are tested and the observed behavior is documented

### WorkspaceEdit and CancellationToken cases

- Mutation produces a `WorkspaceEdit` and applies it via `vscode.workspace.applyEdit()`, not `fs.writeFileSync()`
- After `applyEdit`, the document is dirty (unsaved) — the tool does not call `save()` automatically unless `autoSave: true`
- With `autoSave: true`, the file is saved to disk after applying the WorkspaceEdit
- The user can undo a mutation with Ctrl+Z because it went through WorkspaceEdit
- CancellationToken is checked between operations in a bulk mutation batch
- If the token is cancelled mid-batch, the tool aborts without applying partial edits
- Post-operation cancellation check in tool `invoke()` returns early without formatting the result

### Attribute quote preservation cases

- XML attributes originally in single quotes (`attr='value'`) stay single-quoted after mutation
- XML attributes originally in double quotes (`attr="value"`) stay double-quoted after mutation
- Mixed quote styles within the same element are preserved per-attribute
- Newly inserted attributes default to double quotes
- `xml_single_quotes.xml` fixture round-trips without changing attribute quote characters

### Trailing newline and EOL cases

- JSON files without a trailing newline remain without a trailing newline after mutation
- JSON files with a trailing newline keep the trailing newline after mutation
- CRLF files remain CRLF after mutation — tool serialization uses the detected EOL
- LF files remain LF after mutation
- `json_no_trailing_newline.json` fixture round-trips without gaining a trailing newline

### Non-mutating correctness cases

- `inspect` is idempotent and does not rewrite the file
- `query` is idempotent and does not rewrite the file
- Parse-serialize roundtrip without mutation is byte-identical where the current implementation claims that guarantee
- UTF-8 with BOM stays UTF-8 with BOM after mutation

### 1. Inspect

Use `struct_inspect` first on every fixture.

Verify:

- JSON returns key names, object/array kinds, and array sizes.
- XML returns element names, attributes, and namespace declarations.
- Depth limiting works.
- Large files do not require reading the raw file as plain text.
- JSON and JSONC diagnostics include structured warnings for duplicate keys,
  unsafe integers, and Unicode escape roundtrip risks when present.

Example:

```json
{
  "filePath": "src/test/fixtures/structured/xml_namespaces_same_tags.xml",
  "depth": 2
}
```

Expected checks:

- Root structure exists.
- Namespace declarations are present.
- Child element kinds are correct.

### 2. Query

Use `struct_query` with both JSONPath and XPath.

Verify:

- `return: "count"` reports the correct number of matches.
- `return: "paths"` produces stable, usable paths.
- `return: "paths+values"` contains both the address and the matched data.
- Namespace mapping works for default and prefixed namespaces.
- Repeated local names in different namespaces are distinguished correctly.

Example XPath case:

```json
{
  "filePath": "src/test/fixtures/structured/xml_namespaces_same_tags.xml",
  "expression": "//inv:item",
  "namespaces": {
    "c": "http://example.com/catalog",
    "inv": "http://example.com/inventory",
    "meta": "http://example.com/meta"
  },
  "return": "count"
}
```

Expected checks:

- `count` equals the number of `inv:item` nodes only.
- Querying `//c:item` does not return `inv:item` or `meta:item`.

### 3. Mutate

Use `struct_mutate` on copied fixtures, never on the original fixture file.

Verify:

- `set` changes exactly the intended target.
- `insert` respects `before`, `after`, `prepend`, `append`, or `at:N`.
- `bulk: true` updates all intended matches.
- `bulk: false` updates only the first match.
- XML attribute actions work with namespaced queries.
- The returned summary reports matched and changed nodes correctly.

Formatting checks after mutate:

- BOM stays if the source had BOM (BOM is preserved by VS Code on save, not re-added by the tool).
- CRLF stays CRLF if the source used CRLF.
- LF stays LF if the source used LF.
- Tab indentation stays tabs if the source used tabs.
- Space indentation stays the same width when supported (2, 4, etc.).
- Single-line files remain single-line, allowing an optional final line ending.
- XML sibling ordering remains semantically correct.
- XML attribute quote style (single vs double) is preserved per-attribute.
- Trailing newline presence/absence is preserved as-is.
- Mutation is applied via `WorkspaceEdit` — document is left dirty (unsaved) for undo support.

Example mutate case:

```json
{
  "filePath": "src/test/fixtures/structured/xml_namespaces_tabs_bom_crlf.xml",
  "operations": [
    {
      "action": "insert",
      "target": "/c:catalog[1]",
      "position": "append",
      "value": "<inv:item inv:id=\"inventory-2\"><inv:name>Spare Cable</inv:name></inv:item>",
      "namespaces": {
        "c": "http://example.com/catalog",
        "inv": "http://example.com/inventory",
        "meta": "http://example.com/meta"
      }
    }
  ],
  "writeBack": true
}
```

Expected checks:

- Inserted node exists and is queryable afterward.
- File still has BOM.
- File still uses CRLF.
- New sibling indentation matches surrounding siblings.

### 4. Validate

Use `struct_validate` after every non-trivial mutation.

Verify:

- Well-formed JSON/XML returns `valid: true` when correct.
- Broken JSON/XML returns `valid: false` or a clear error.
- JSON Schema validation reports paths and messages.
- Unsupported XML schema engines fail with an explicit limitation message.
- JSON and JSONC diagnostics are returned alongside validation results instead of being dropped.
- Diagnostic entries distinguish parse failures from lossless-roundtrip risks.

Expected error quality:

- The error must describe what is wrong.
- The error must describe how to call the tool correctly.
- The error must provide at least one valid example invocation.

### 5. Diff

Use `struct_diff` between original and mutated copies.

Verify:

- Added nodes appear as `added`.
- Removed nodes appear as `removed`.
- Value changes appear as `changed`.
- XML whitespace-only noise does not dominate the result when ignored.
- JSON diff paths use JSON-like notation: `$.key`, `$.array[0]`.
- XML diff paths use XPath notation: `/root[1]/item[1]/@attr`, `/root[1]/text()[1]`.
- Path notation matches the notation used by `struct_inspect` and `struct_query` for the same format.

## Required Negative Tests

The AI should also test invalid input and verify the error quality.

Required invalid cases:

- Missing `filePath`
- Missing `expression` for query
- Empty `operations` or malformed operation objects
- Invalid JSONPath
- Invalid XPath
- Missing namespace map for prefixed XPath expressions
- Invalid schema type for JSON
- Invalid schemaType value (e.g., `"jsonschema"`) — error should list allowed values
- Diff between JSON and XML files
- Insert into a non-array JSON target with array-only positioning
- XML attribute mutation against a non-element node

Also record current behavior for these high-risk cases even if they are not fully solved yet:

- Duplicate JSON keys in invalid or ambiguous JSON input
- Numbers beyond JavaScript safe integer range
- Unicode escape preservation such as `\u0410` versus the literal character form
- XML entity references and custom DOCTYPE entities
- Empty default namespace resets such as `xmlns=""`

Each negative test should verify:

- The tool does not silently continue.
- The tool does not corrupt the file.
- The error text explains correct invocation.

For diagnostic-only cases that are not hard errors, also verify:

- The tool returns a structured diagnostics collection.
- Each diagnostic has a stable kind such as `duplicate-key`, `unsafe-integer`, or `unicode-escape-risk`.
- The diagnostic severity is appropriate for a non-fatal lossless-roundtrip risk.
- The diagnostic includes enough location context for a follow-up mutation or manual review.

## Realistic Scenarios To Cover

The AI should not stop at toy examples. Add real-world cases like:

- Large order feeds with hundreds of repeated items
- Configuration files with nested arrays and optional fields
- XML build manifests with default namespaces and prefixed namespaces
- SVG files where element names repeat across nested groups
- SOAP-like XML with multiple namespaces and repeated `item`, `name`, or `value` local names
- Mixed-content XML where some elements contain text and child elements
- Files with a final newline and files without a final newline
- Configuration files with mixed single/double-quoted XML attributes (e.g., Maven POM, Ant builds)
- Bulk mutations on large files: verify cancellation support and WorkspaceEdit efficiency
- Multi-operation batches where operations target the same subtree (order-dependent correctness)

## Suggested Fixture Matrix

At minimum, keep fixtures for:

- `json_spaces_2.json` — 2-space indented JSON with trailing newline
- `json_oneline.json` — single-line minified JSON without trailing newline
- `json_tabs_bom_crlf.json` — tab-indented JSON with UTF-8 BOM and CRLF line endings
- `json_comments.jsonc` — JSONC with line comments and trailing commas
- `json_deeply_nested.json` — 5+ levels of nesting for depth-limiting tests
- `json_large_array.json` — 1200-element array for query limit/truncation tests
- `json_no_trailing_newline.json` — multi-line JSON that does NOT end with a newline
- `xml_spaces_2.xml` — 2-space indented XML
- `xml_spaces_4.xml` — 4-space indented XML
- `xml_oneline.xml` — single-line minified XML
- `xml_tabs_bom_crlf.xml` — tab-indented XML with UTF-8 BOM and CRLF line endings
- `xml_namespaces_same_tags.xml` — XML with repeated local names across different namespaces
- `xml_namespaces_tabs_bom_crlf.xml` — namespaced XML with tabs, BOM, and CRLF
- `xml_mixed_content.xml` — XML with interleaved text and element nodes
- `xml_self_closing.xml` — XML with self-closing tags, expanded empty tags, declaration, and DOCTYPE
- `xml_single_quotes.xml` — XML with mixed single-quoted and double-quoted attributes

## How To Decide The Result Is Correct

A test is correct only if all of the following are true:

- The semantic result matches the requested mutation/query.
- The file can still be parsed after mutation.
- The changed nodes can be re-queried successfully.
- The formatting policy of the source file is preserved as expected.
- The tool response includes enough structured information for follow-up tool calls.

If any of these fails, the case is not complete.

## Additional Cases Worth Adding Later

- Invalid JSON with duplicate keys, to document parser behavior explicitly
- Duplicate keys inside nested objects where only one branch is later mutated
- Unsafe integers embedded in arrays, objects, and string-like scientific notation edge cases
- Unicode escape risks in keys, values, and mixed escaped/literal representations within one file
- JSON5-style inputs, if support is added in the future
- Namespace-aware attribute creation with prefixed attribute names
- XML comments and processing instructions around inserted nodes
- CDATA preservation in set/insert operations
- JSON arrays with sparse indexes or numeric-key objects
- Diff behavior on reordered XML siblings
- Very large files where query limits and truncation behavior matter
- Files that use a default namespace only, with no explicit prefix in source
- WorkspaceEdit conflict detection when the document has been edited externally between read and apply
- Multi-tab editing scenarios where the same file is mutated by two consecutive tool calls
- CancellationToken timing: verify that a cancellation between the N-th and (N+1)-th operation leaves zero edits applied
- Attribute quote style for attributes with special characters (e.g., `attr='value with "quotes"'`)
- Round-trip stability test: mutate → undo → compare bytes to original

## Deferred Feature Requests

The following features are documented but not yet implemented:

- **XSD/DTD/RelaxNG schema validation**: Only well-formedness checking is available for XML. JSON Schema validation works.
- **Streaming/chunked processing**: Very large files (>50 MB) are rejected. No streaming parser support.