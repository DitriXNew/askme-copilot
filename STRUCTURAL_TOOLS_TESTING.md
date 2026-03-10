# Structural Tools Testing Guide

This guide tells an AI agent what to test, how to test it, and how to verify that the result is correct for the structural JSON/XML tools.

## Architecture Notes

The structural tools use a **read-compute-return** architecture. They NEVER write to files directly.

- **Reading**: `vscode.workspace.openTextDocument()` + `doc.getText()` — respects open/dirty buffers.
  Never uses `fs.readFileSync` for production reads.
- **Mutations**: `struct_mutate` computes mutations in memory and returns compact **`editInstructions[]`**
  — line-based edit instructions that the LLM applies via its built-in file editing tools (e.g.,
  `replace_string_in_file`). This triggers VS Code's native inline diff UI with Keep/Undo buttons.
  The tool does NOT write to disk, does NOT use `WorkspaceEdit`, and does NOT call `fs.writeFileSync`.
- **Edit instruction format**: Each `EditInstruction` contains:
  - `line`: 1-based line number in the original file
  - `oldText`: exact text to find at that line
  - `newText`: replacement text
  - `endLine?`: for multi-line replacements
  - `action?`: `'replace'` (default), `'insertAfter'`, `'insertBefore'`, `'delete'`
- **Contiguous grouping**: `computeEditInstructions` groups consecutive changed lines into a single
  range instruction (`line` + `endLine`) instead of emitting per-line instructions. For example,
  renaming a key that only changes 1 line produces 1 instruction, not thousands.
- **Cancellation**: All mutation loops check `CancellationToken.isCancellationRequested`.
- **File size**: Files > 50MB are rejected before parsing (VS Code TextDocument limit).
- **Tool results**: All structured data is serialized into `LanguageModelTextPart` as JSON text
  (via `JSON.stringify`). The LLM cannot read `LanguageModelDataPart` — only text parts are visible.
- **JSONPath validation**: Expressions not starting with `$` are rejected with an explicit error
  because `jsonpath-plus` silently returns 0 matches for invalid input.
- **@-prefix keys**: Keys starting with `@` (common in ARB/Flutter localization files like `@@locale`,
  `@add`, etc.) are handled automatically. `normalizeJsonPath` preserves bracket notation for such keys,
  and `queryJson`/`parseSimpleJsonPath` auto-convert `$.@key` → `$["@key"]` before processing.
- **XML diff paths**: `struct_diff` uses XPath notation for XML documents (e.g., `/root[1]/item[1]/@status`)
  and JSON-like paths for JSON (e.g., `$.orders[0].status`).
- **Mixed content detection**: `struct_inspect` reports `hasMixedContent: true` on XML elements that
  contain both element children and non-whitespace text nodes.
- **struct_inspect path parameter**: Supports optional `path` (JSONPath for JSON, XPath for XML) and
  `namespaces` parameters to inspect a subtree instead of the whole document. Returns the structure
  rooted at the matched node.
- **Formatting metadata**: `struct_inspect` returns a `formatting` object with `hasBom`, `eol`,
  `indent`, and `trailingNewline`. This is informational only — the tool never writes files.
- **Namespace URI**: `struct_inspect` includes `namespaceURI` and `prefix` fields on XML elements.
- **Copy operation**: `struct_mutate` supports `action: "copy"` which clones a node to a `destination`
  path without removing the original (unlike `move` which removes the source).
- **Batch ordering**: Operations in a single `mutate` call execute sequentially — each operation
  sees the result of previous operations.
- **Rename key order**: `renameJsonMatch` preserves key order in the parent object — the renamed key
  occupies the same position as the original key, preventing unnecessary diffs.
- **No-op detection**: `set` operation checks if the new value equals the current value (via deep
  equality for JSON, text comparison for XML) and reports `changed: 0` without modifying the tree.

## Mutate Return Shape (`IMutateResult`)

When testing `struct_mutate`, the function returns an `IMutateResult` object:

```typescript
{
  success: boolean;
  file: string;
  editInstructions: Array<{
    line: number;
    oldText: string;
    newText: string;
    endLine?: number;
    action?: 'replace' | 'insertAfter' | 'insertBefore' | 'delete';
  }>;
  summary: string;
  warnings: string[];
  operationDetails: Array<{
    action: string;
    target: string;
    matched: number;
    changed: number;
    details?: string;
  }>;
  _serializedContent: string;  // INTERNAL: for tests only, stripped from LLM response
}
```

**Key testing notes:**
- **`editInstructions`**: What the LLM sees. Check that `line` numbers are correct and
  `oldText` matches the actual line content in the original file.
- **`_serializedContent`**: Full serialized content for unit test assertions. Stripped from
  LLM response. Use to verify the mutation result can be re-parsed.
- **The LLM never receives `_serializedContent`**.

## Scope

Test these tools end to end:

- `struct_inspect` — structure skeleton, depth limiting, path filtering
- `struct_query` — JSONPath/XPath queries, namespaces, return modes
- `struct_mutate` — set/insert/delete/rename/move/copy with editInstructions
- `struct_validate` — well-formedness, JSON Schema, error quality
- `struct_diff` — structural comparison between two files

## Test Philosophy

For each case, verify:

1. The returned content is structurally correct.
2. The intended semantic change happened.
3. Error messages are actionable and explain correct invocation.
4. For mutations: `editInstructions[]` are present, non-empty, and contain valid line numbers
   with `oldText` matching the original file content.
5. For mutations: `operationDetails` reports correct `matched`/`changed` counts.

## How To Test

### Unit tests (Mocha in VS Code host)

Tests live in `src/test/extension.test.ts` and run inside a VS Code Extension Host via
`@vscode/test-cli` + `@vscode/test-electron`.

```bash
npm run compile
npm test
```

All struct test callbacks must be `async`. Pass a `vscode.CancellationToken` to
`mutateStructuredDocument()`. Use `mockToken` with `isCancellationRequested: false`.

### Manual tool testing (via Copilot Chat)

1. Open a fixture file in the editor.
2. In Copilot Chat (agent mode), invoke a tool by describing the intent.
3. For mutations, the LLM applies `editInstructions` via its file editing tools.
   VS Code shows an inline diff — use Undo to revert if needed.
4. Run `struct_validate` after every mutation.
5. Run `struct_diff` between original and mutated copy to document changes.

## Explicit Edge-Case Matrix

### Mutation boundary cases

- Insert into an empty array `[]`
- Insert into an empty object `{}`
- `set` on a path with missing intermediate nodes such as `$.a.b.c.d`
- Delete the last element of an array and verify the array remains `[]`
- Delete the JSON root `$` — rejected with "Deleting the JSON root is not allowed."
- Delete the XML root element — rejected with appropriate error
- Rename a key to a name that already exists — reports conflict
- `bulk: true` with zero matches — reports `matched: 0, changed: 0` (no error)
- Sequential batch operations where later ops target nodes from earlier ops
- `copy` clones without removing source; `move` removes source
- `set` with the same value as current — reports `changed: 0` (no-op detection)
- `rename` preserves key order in parent object (no full-file diff)

### JSON and JSONC cases

- JSONC comments are preserved after mutation
- JSONC trailing commas remain valid
- `inspect` and `query` do not modify files
- Query with `limit` truncates payload but reports full count
- Query with `return: "count"` always returns `truncated: false`
- `depth` parameter limits structure expansion
- Invalid JSONPath (not starting with `$`) is rejected with an error
- Duplicate-key diagnostics in inspect
- Unsafe integer diagnostics in inspect
- **@-prefix keys** (e.g., `@@locale`, `@add`) work correctly in JSONPath queries,
  mutations, and inspect — auto-converted from `$.@key` to `$["@key"]`

### XML cases

- XML declaration survives mutation and appears exactly once (no duplication)
- DOCTYPE survives mutation
- Self-closing tags remain self-closing where possible
- Mixed content stays semantically intact
- `inspect` reports `hasMixedContent: true` correctly
- Namespace queries work with prefix maps
- Repeated local names across different namespaces are distinguished

### editInstructions cases

- Mutation returns `editInstructions[]` — NOT a `WorkspaceEdit`
- Each instruction has `line` (1-based), `oldText`, `newText`
- Consecutive changed lines are grouped into contiguous ranges (`endLine`)
- `oldText` matches exact original file content at that line
- For inserts: `action` is `'insertAfter'` or `'insertBefore'`
- For deletions: `action` is `'delete'`
- `_serializedContent` is stripped from LLM response
- CancellationToken aborts mid-batch without partial results

### Inspect path parameter cases

- `struct_inspect` with `path` returns subtree structure, not whole document
- JSON: `path: "$.store.books"` inspects only the books subtree
- XML: `path: "//catalog"` with `namespaces` inspects only the catalog element
- Missing path returns whole document (default behavior)
- Invalid path returns clear error

### Negative tests

- Missing `filePath`
- Missing `expression` for query
- Empty `operations` for mutate
- Invalid JSONPath / Invalid XPath
- Missing namespace map for prefixed XPath
- Invalid `schemaType` — error lists allowed values
- `schema` without `schemaType` for XML — error demands `schemaType`
- Diff between JSON and XML files
- Insert into non-array with array-only positioning
- File exceeding 50MB size limit

## Tool-Specific Test Plans

### 1. Inspect

- JSON returns key names, object/array kinds, array sizes
- XML returns element names, attributes, namespace declarations
- Depth limiting works
- `path` parameter returns subtree for both JSON and XML
- Formatting metadata is present (`hasBom`, `eol`, `indent`, `trailingNewline`)
- Diagnostics for duplicate keys, unsafe integers

### 2. Query

- `return: "count"` → correct count
- `return: "paths"` → stable, usable paths
- `return: "paths+values"` → both address and data
- Namespace mapping works for default and prefixed namespaces
- @-prefix keys work in JSONPath expressions

### 3. Mutate

- `set` changes exactly the intended target
- `insert` respects `before`, `after`, `prepend`, `append`, `at:N`
- `bulk: true` updates all matches; `bulk: false` updates first only
- Summary reports matched and changed correctly
- `editInstructions[]` accurately describe changes
- Rename preserves key order (no O(n) instructions)

### 4. Validate

- Well-formed JSON/XML returns `valid: true`
- Broken JSON/XML returns `valid: false` with clear error
- JSON Schema validation reports paths and messages
- Unsupported XML schema types fail with explicit error
- Diagnostics accompany validation results

### 5. Diff

- Added nodes: `added`
- Removed nodes: `removed`
- Value changes: `changed`
- JSON paths use JSON notation: `$.key`, `$.array[0]`
- XML paths use XPath notation: `/root[1]/item[1]/@attr`

## Suggested Fixture Matrix

- `json_spaces_2.json` — 2-space indented JSON
- `json_oneline.json` — single-line minified JSON
- `json_tabs_bom_crlf.json` — tab-indented JSON with BOM and CRLF
- `json_comments.jsonc` — JSONC with comments and trailing commas
- `json_deeply_nested.json` — 5+ levels for depth-limiting tests
- `json_large_array.json` — 1200-element array for limit/truncation tests
- `xml_spaces_2.xml` — 2-space indented XML
- `xml_spaces_4.xml` — 4-space indented XML
- `xml_oneline.xml` — single-line minified XML
- `xml_tabs_bom_crlf.xml` — tab-indented XML with BOM and CRLF
- `xml_namespaces_same_tags.xml` — repeated local names across namespaces
- `xml_namespaces_tabs_bom_crlf.xml` — namespaced XML with tabs, BOM, CRLF
- `xml_mixed_content.xml` — interleaved text and element nodes
- `xml_self_closing.xml` — self-closing tags, declaration, DOCTYPE

## How To Decide The Result Is Correct

A test passes only if:

- The semantic result matches the request
- The `_serializedContent` can be re-parsed as valid JSON/XML
- Changed nodes can be re-queried successfully
- `editInstructions[]` is non-empty for mutations, `success` is `true`
- `operationDetails` reports correct `matched`/`changed` counts
- Error messages explain correct invocation

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
- The returned `editInstructions[]` accurately describe the changes needed to transform the original file.

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
  ]
}
```

Expected checks:

- The tool returns `editInstructions[]` with the correct line-based changes.
- Applying the instructions produces content that still has BOM (when applicable).
- Applying the instructions produces content that still uses CRLF.
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

## Realistic Scenarios

- Large localization files (2000+ keys, @-prefixed metadata keys)
- Configuration files with nested arrays and optional fields
- XML build manifests with default and prefixed namespaces
- Multi-namespace XML with repeated local names
- Mixed-content XML with text and child elements
- Multi-operation batches targeting the same subtree
- Bulk mutations on large files: verify editInstructions compactness

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
- The file can still be parsed after mutation (verify via `_serializedContent`).
- The changed nodes can be re-queried successfully.
- The formatting policy of the source file is preserved as expected.
- The tool response includes enough structured information for follow-up tool calls.
- For mutations: `editInstructions[]` is non-empty, `success` is `true`, and `operationDetails`
  reports correct `matched`/`changed` counts.
- For mutations: `_serializedContent` can be parsed as valid JSON/XML.
- For mutations: applying `editInstructions` to the original content would produce `_serializedContent`.

If any of these fails, the case is not complete.


- Very large files where query limits and truncation behavior matter
- Files that use a default namespace only, with no explicit prefix in source
- Conflict detection when the document has been edited externally between tool read and LLM edit apply
- Multi-tab editing scenarios where the same file is mutated by two consecutive tool calls
- CancellationToken timing: verify that a cancellation between the N-th and (N+1)-th operation leaves zero edits applied
- Attribute quote style for attributes with special characters (e.g., `attr='value with "quotes"'`)
- Round-trip stability test: mutate → undo → compare bytes to original

## Deferred Feature Requests

The following features are documented but not yet implemented:

- **XSD/DTD/RelaxNG schema validation**: Only well-formedness checking is available for XML. JSON Schema validation works.
- **Streaming/chunked processing**: Very large files (>50 MB) are rejected. No streaming parser support.