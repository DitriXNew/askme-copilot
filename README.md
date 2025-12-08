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

This extension adds **5 tools** for Copilot to communicate with you:

| Tool | When Copilot Uses It |
|------|---------------------|
| 🧠 **Ask Expert** | Clarifications, stuck after 2 attempts, architectural decisions |
| 🎯 **Select Options** | Present 2-5 choices for decisions |
| 📝 **Review Code** | Security-sensitive or complex implementations |
| ⚠️ **Confirm Action** | Before deletions, schema changes, breaking changes |
| 🖼️ **Read Image** | Analyze mockups, diagrams, icons in your project |

### 🖼️ Read Image Tool (NEW in v1.4.0)

Copilot can now **analyze images from your project files**:
- UI mockups → implement designs
- Architecture diagrams → understand system
- Screenshots → debug visual issues
- Icons/logos → inspect graphics

## Quick Start

1. Install from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
2. Enable tools in Copilot Chat (⚙️ Configure Tools)
3. Add to `.github/copilot-instructions.md`:

```markdown
ALWAYS use askExpert tool when:
- Uncertain about requirements
- After 2 failed attempts
- Before destructive operations
- For architectural decisions

At end of work, ask expert for confirmation.
```

## Features

### Image Attachments
- **Drag & Drop** images into expert dialog
- **Ctrl+V** to paste screenshots
- Supported: PNG, JPEG, GIF, WebP, BMP (max 5MB)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `notificationStyle` | `normal` | `subtle`/`normal`/`prominent` |
| `enableSoundNotification` | `true` | Play sound on request |
| `responseTimeout` | `0` | 0 = wait indefinitely |
| `enableResponseCache` | `true` | Cache identical questions |
| `cacheTimeToLive` | `300000` | Cache duration (5 min) |

## Commands

- `Ask Me Copilot: Show Metrics` - View usage stats
- `Ask Me Copilot: Clear Cache` - Clear response cache
- `Ask Me Copilot: Open Settings` - Configure extension

## License

MIT

[Install](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool) | [GitHub](https://github.com/DitriXNew/askme-copilot) | [Issues](https://github.com/DitriXNew/askme-copilot/issues)