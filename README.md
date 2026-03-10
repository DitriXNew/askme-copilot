# Ask Me Copilot Tool

[![VS Marketplace](https://img.shields.io/visual-studio-marketplace/v/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)

> Transform Copilot into a collaborative partner that asks for help instead of guessing.

## The Problem

Copilot's default behavior causes issues:

| Problem | Why It Happens |
|---------|----------------|
| 🔄 **Repeats same failures** | System prompt says "work fast, minimize interaction" |
| 💥 **Destructive changes** | No confirmation before deletions |
| 🤷 **Guesses instead of asking** | Trained to solve problems independently |
| ✅ **Takes typos literally** | Trusts user input blindly |

**Result:** Copilot removes libraries, deletes files, and fails repeatedly instead of asking for help.

## The Solution

This extension adds **12 tools** for Copilot to communicate with you:

| Tool | When Copilot Uses It |
|------|---------------------|
| 🧠 **Ask Expert** | Clarifications, stuck after 2 attempts, architectural decisions |
| 🎯 **Select Options** | Present 2-5 choices for decisions |
| 📝 **Review Code** | Security-sensitive or complex implementations |
| ⚠️ **Confirm Action** | Before deletions, schema changes, breaking changes |
| 🖼️ **Read Image** | Analyze mockups, diagrams, icons in your project |
| 📊 **Check Task Status** | Get messages from expert, respect pause, check if consultation needed |
| 📋 **Questionnaire** | Multi-field forms for structured data collection |
| 🧱 **Struct Inspect** | Inspect JSON/JSONC/XML structure without reading raw text |
| 🔎 **Struct Query** | Run JSONPath/XPath with paths, values, counts, namespaces |
| 🛠️ **Struct Mutate** | Compute atomic structural edits and return edit instructions for the LLM to apply |
| ✅ **Struct Validate** | Validate well-formedness and JSON Schema after edits |
| 🧮 **Struct Diff** | Compare two JSON/JSONC/XML files semantically instead of line by line |

### 🧠 Ask Expert

Copilot asks you questions when uncertain:

<details>
<summary>Screenshot</summary>

![Ask Expert Dialog](docs/AskExpert.png)

</details>

### 🎯 Select Options

Choose from multiple options presented by Copilot:

<details>
<summary>Screenshot</summary>

![Select Options Dialog](docs/Selection.png)

</details>

### ⚠️ Confirm Action

Confirm dangerous operations before Copilot proceeds:

<details>
<summary>Screenshot</summary>

![Confirm Action Dialog](docs/Question.png)

</details>

### 📝 Review Code

Review and edit code suggested by Copilot:

<details>
<summary>Screenshot</summary>

![Code Review Dialog](docs/CodeReview.png)

</details>

### 🖼️ Read Image

Copilot analyzes images from your project with compression support:

<details>
<summary>Screenshot</summary>

![Read Image Tool](docs/ImageReader.png)

</details>

### 📋 Questionnaire (v1.8.0)

Collect structured data via multi-field forms when Copilot needs multiple related pieces of information:

<details>
<summary>Screenshot</summary>

![Questionnaire Form](docs/Form.png)

</details>

**Field Types:**
- **Text** - Single-line text input (project name, file path, etc.)
- **Textarea** - Multi-line text input (descriptions, comments, code snippets)
- **Number** - Numeric input with validation (port number, count, etc.)
- **Checkbox** - Yes/No toggle (enable feature, use strict mode)
- **Radio** - Single choice from options (pick one from list)
- **Select** - Dropdown selection (choose from many options)

**Powerful Features:**
- **Conditional fields** - Show/hide fields based on other field values using `showWhen`. For example, show "Strict Mode" options only when "Use TypeScript" is checked
- **Field comments** - Each field has a "+ add comment" link allowing you to provide extra context or notes
- **Sections** - Group related fields with titles and descriptions for better organization
- **Required/Optional fields** - Mark fields as required to ensure Copilot gets all necessary information
- **Attachments** - Add files/images to your response
- **Templates** - Use response templates like in other tools

**When Copilot uses it:**
- Configuring a new project with multiple options
- Setting up database schema with various properties
- Gathering user preferences for code generation
- Collecting feature requirements in structured format

**Example call:**
```typescript
{
  title: "Project Configuration",
  sections: [
    {
      title: "Basic Info",
      fields: [
        { type: "text", name: "projectName", label: "Project Name", required: true },
        { type: "checkbox", name: "useTypescript", label: "Use TypeScript?" },
        { 
          type: "radio", 
          name: "strictMode", 
          label: "Strict Mode",
          options: ["strict", "moderate", "relaxed"],
          showWhen: { field: "useTypescript", value: true }
        }
      ]
    }
  ]
}
```

### 🧱 Structural JSON/JSONC/XML Tools

These tools solve a recurring limitation of LLMs: raw string edits are fragile for JSON and XML.

**Architecture:** The tools **never write to disk**. `struct_mutate` computes mutations on an in-memory tree and returns compact `editInstructions[]` — line-based edit operations (`line`, `oldText`, `newText`) that the LLM applies via its built-in file editing tools. This triggers VS Code's native inline diff UI with Keep/Undo buttons, giving you full control over every change.

**Why this design?**
- LLM sees exactly what changed (no hidden side effects)
- VS Code diff UI lets you accept/reject edits individually
- No risk of silent file corruption — human always reviews
- Works with unsaved/modified buffers

**Format support:**
- **JSON** — standard JSON files
- **JSONC** — JSON with Comments (VS Code settings, tsconfig, etc.) — comments and trailing commas are preserved through mutations
- **XML** — with namespace support, mixed content, self-closing tags

**Available structural tools:**

| Tool | Purpose |
|------|---------|
| `struct_inspect` | Document skeleton: key names, types, array sizes, XML attributes, namespaces. Supports `path` parameter for subtree inspection |
| `struct_query` | Query with JSONPath or XPath. Returns values, paths, counts, or both. Supports XML namespace prefixes |
| `struct_mutate` | Compute `set`, `insert`, `delete`, `rename`, `move`, `copy`, `set_attribute`, `delete_attribute` — returns `editInstructions[]` |
| `struct_validate` | Verify well-formedness + JSON Schema validation. Schema types: `json_schema`, `xsd`/`dtd`/`relaxng` (XML, planned) |
| `struct_diff` | Semantic diff by path — additions, removals, changes. Cross-format: JSON ↔ JSONC files can be compared |

**Key details:**
- **@-prefix keys** (ARB/Flutter l10n files like `@@locale`, `@title`): fully supported. JSONPath queries use bracket notation `$["@@locale"]` — the tools bypass jsonpath-plus for these keys due to a parser limitation
- **Bracket notation**: Keys with dots, spaces, or special characters get proper JSONPath bracket notation in `inspect` output (e.g., `$["editor.tabSize"]` instead of invalid `$.editor.tabSize`)
- **Edit instructions grouping**: Consecutive changed lines are grouped into single edit instructions for efficiency

**Example — inspect:**
```typescript
{
  filePath: 'orders.json',
  depth: 2
}
```

**Example — query with namespaces:**
```typescript
{
  filePath: 'orders.xml',
  expression: '//ns:order[@status="pending"]',
  namespaces: { ns: 'http://example.com/orders' },
  return: 'paths+values'
}
```

**Example — mutate (returns editInstructions, does NOT write to file):**
```typescript
{
  filePath: 'orders.json',
  operations: [
    {
      action: 'set',
      target: '$.orders[0].status',
      value: 'shipped'
    }
  ]
}
```

### 🤖 Focus Expert Panel Button (v1.8.4)

A button in the editor title bar to quickly focus the active expert dialog:

<details>
<summary>Screenshot</summary>

![Pin Button in Editor](docs/pinned.png)

</details>

- **Appears only** when there's an active expert panel open
- **One-click focus** - instantly switch to the expert dialog from any editor
- **Custom robot icon** - easily recognizable in the editor title area

### 📊 Expert Monitor Panel (v1.6.0)

A **persistent panel** (next to Terminal) for real-time communication with Copilot:

<details>
<summary>Screenshots</summary>

![Expert Monitor Panel](docs/Expert%20Monitor.png)

![Expert Monitor with Pause](docs/Pause.png)

</details>

**Controls:**
- **⏸️ Pause Toggle** - Blocks Copilot execution until you're ready. When active, Copilot will wait at the next `checkTaskStatus` call until you unpause
- **🧠 Ask Expert Toggle** - Signals Copilot to call `askExpert` tool on next status check
- **📎 Attach Button** - Add files/images to your message (or use Ctrl+V to paste from clipboard)
- **➤ Send Button** - Queue message for Copilot (Ctrl+Enter)

**Message Queue:**
- Messages are stored and delivered when Copilot calls `checkTaskStatus`
- After delivery, messages are cleared from the queue
- Yellow dot = pending, Green dot = delivered

**⚠️ Important Limitation:**

This feature works **when Copilot periodically polls** the `checkTaskStatus` tool. However, AI agents can "forget" to call it regularly. There are two workarounds:

1. **Add to your prompt** (see Recommended Prompt below) instructions to check status every 10-20 seconds
2. **Manually ask Copilot** to "check task status" or "update status" - this triggers the tool call and delivers your queued messages

**Use cases:**
- See Copilot going wrong direction? → Pause + send correction
- Have a new idea mid-task? → Queue message for next check
- Need to review changes? → Pause to catch up
- Want to add context? → Write tasks/notes, then ask Copilot to "check status"

## Quick Start

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
2. Enable tools in Copilot Chat (⚙️ Configure Tools)
3. Open **Expert Monitor** panel (View → Open View → Expert Monitor)
4. Add to `.github/copilot-instructions.md` (see Recommended Prompt below)

## Recommended Prompt

Add this to your `.github/copilot-instructions.md` for best results:

```markdown
### 0. MAIN RULE
ALWAYS escalate (ask expert via tools) IF uncertain, AMBIGUOUS, or CONFLICTING instructions, OR repeated failures, OR destructive edits, OR public API changes, OR architecture uncertainty, OR need to delete/refactor public API. Never guess silently. Never continue after 2 failed attempts without escalation.

ALWAYS WHEN YOU ARE UNSURE, ASK FOR HELP.
ALWAYS ESCALATE EARLY.
ALWAYS AT THE END OF YOUR WORK ASK EXPERT ABOUT WHAT YOU HAVE DONE AND FOLLOW HIS INSTRUCTIONS.
EACH TIME ADD CONSIDERATIONS WITH EXPERT IN ALL YOURS TODO LIST IN BEGINNING AND IN THE END OF ANY JOB.

EACH 10-20 second OF YOUR WORK, CHECK TASK STATUS WITH checkTaskStatus TOOL AND FOLLOW ITS INSTRUCTIONS.
```

## Features

### Response Templates (v1.7.0)

Automatically append predefined instructions to your responses:

- **Up to 5 reusable templates** per workspace
- **One-click toggle** via chips in tool dialogs
- **Per-tool configuration** (askExpert, selectFromList, reviewCode)
- **Default template included**: "Consult Expert After Task"

**How it works:**
1. Templates appear as toggleable chips in Ask Expert, Select Options, and Code Review dialogs
2. Active templates are appended to your response in a structured format
3. Configure templates in Settings → Extensions → Ask Me Copilot → Templates

### File Attachments
- **Click +** to add files to expert dialog
- **Ctrl+V** to paste images from clipboard
- Supports images (PNG, JPEG, GIF, WebP, BMP) and other file types

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `notificationStyle` | `normal` | `subtle`/`normal`/`prominent` |
| `enableSoundNotification` | `true` | Play sound on request |
| `responseTimeout` | `0` | 0 = wait indefinitely |
| `enableResponseCache` | `true` | Cache identical questions |
| `cacheTimeToLive` | `300000` | Cache duration (5 min) |
| `disableImageCompression` | `false` | Disable all image compression |
| `templates` | 1 default | Up to 5 response templates with title, content, and per-tool applicability |

## Commands

- `Ask Me Copilot: Show Metrics` - View usage stats
- `Ask Me Copilot: Clear Cache` - Clear response cache
- `Ask Me Copilot: Open Settings` - Configure extension

## License

MIT

[Install](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool) | [GitHub](https://github.com/DitriXNew/askme-copilot) | [Issues](https://github.com/DitriXNew/askme-copilot/issues)