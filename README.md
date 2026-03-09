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
| 🧱 **Struct Inspect** | Inspect JSON/XML structure without reading raw text |
| 🔎 **Struct Query** | Run JSONPath/XPath with paths, values, counts, namespaces |
| 🛠️ **Struct Mutate** | Apply atomic structural edits to JSON/XML and return updated content |
| ✅ **Struct Validate** | Validate well-formedness and JSON Schema after edits |
| 🧮 **Struct Diff** | Compare two JSON/XML files semantically instead of line by line |

### 🧠 Ask Expert

Copilot asks you questions when uncertain:

![Ask Expert Dialog](docs/AskExpert.png)

### 🎯 Select Options

Choose from multiple options presented by Copilot:

![Select Options Dialog](docs/Selection.png)

### ⚠️ Confirm Action

Confirm dangerous operations before Copilot proceeds:

![Confirm Action Dialog](docs/Question.png)

### 📝 Review Code

Review and edit code suggested by Copilot:

![Code Review Dialog](docs/CodeReview.png)

### 🖼️ Read Image

Copilot analyzes images from your project with compression support:

![Read Image Tool](docs/ImageReader.png)

### 📋 Questionnaire (v1.8.0)

Collect structured data via multi-field forms when Copilot needs multiple related pieces of information:

![Questionnaire Form](docs/Form.png)

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

### 🧱 Structural JSON/XML Tools

These tools solve a recurring limitation of LLMs: raw string edits are fragile for JSON and XML.

**What they add:**
- **Structure inspection** before editing large documents
- **Precise querying** with JSONPath or XPath instead of string search
- **Atomic mutations** on one in-memory tree instead of many brittle replacements
- **Validation** after edits
- **Semantic diff** between before/after files

**Available structural tools:**
- **`struct_inspect`** - return the document skeleton with key names, array sizes, XML attributes, and namespaces
- **`struct_query`** - return values, paths, counts, or both using JSONPath/XPath
- **`struct_mutate`** - apply `set`, `insert`, `delete`, `rename`, `move`, `set_attribute`, `delete_attribute`
- **`struct_validate`** - verify JSON/XML parsing and JSON Schema validation
- **`struct_diff`** - return structural additions, removals, and changes by path

**Example calls:**
```typescript
{
  filePath: 'orders.json',
  depth: 2
}
```

```typescript
{
  filePath: 'orders.xml',
  expression: '//ns:order[@status="pending"]',
  namespaces: { ns: 'http://example.com/orders' },
  return: 'paths+values'
}
```

```typescript
{
  filePath: 'orders.json',
  operations: [
    {
      action: 'set',
      target: '$.orders[0].status',
      value: 'shipped'
    }
  ],
  writeBack: true
}
```

### 🤖 Focus Expert Panel Button (v1.8.4)

A button in the editor title bar to quickly focus the active expert dialog:

![Pin Button in Editor](docs/pinned.png)

- **Appears only** when there's an active expert panel open
- **One-click focus** - instantly switch to the expert dialog from any editor
- **Custom robot icon** - easily recognizable in the editor title area

### 📊 Expert Monitor Panel (v1.6.0)

A **persistent panel** (next to Terminal) for real-time communication with Copilot:

![Expert Monitor Panel](docs/Expert%20Monitor.png)

![Expert Monitor with Pause](docs/Pause.png)

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