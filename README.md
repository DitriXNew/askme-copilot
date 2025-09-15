# Ask Me Copilot Tool

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)

> **Enhance GitHub Copilot with interactive expert communication capabilities**

## 🤔 Why did this extension come to life?

Sitting once again and working on a project with a colleague, we noticed — Copilot was already trying to modify a file for the 10th time, and something just wasn't working out, he was banging against this wall with wild persistence, even though the error was just in an import.

But he kept stubbornly banging away...

Then I noticed that during conversations he loses context, or leaves some errors, and stops development...

In a normal situation — any developer would say "Well, just stop him and give new instructions"

And here lies the most crucial point — if you do that, he will take what you wrote as the truth.

That is, in Copilot's own system prompts there are several interesting moments:

1. **He's in a hurry!** His system prompts have something like "you have little time, do everything quickly" written in them. And this hurts, because if he can't properly connect a library — he has nothing left but to get rid of it and do everything manually. Why?

2. **Because his system prompt says** — to do everything as independently as possible. That is, you went for coffee, came back — and half of your project has been redone because he decided to cut out the library... Sound familiar?

3. **The user is always right.** And in general — he's such a beauty who always writes correctly and perfectly, and there's nothing more important than his problems, even if he writes nonsense, the chat will try to follow him.

That is, the approach — if I saw an error, I stop the chat and write to him about it — doesn't work, at least not normally.

And here's the question — we have all sorts of MCP servers for code bases, knowledge bases, etc., so — why can't I, being a developer, also act as a knowledge base for Copilot, but in such a way that he perceives me not as a user, but as just another utility?

**So we made this simple extension.**

Now — if the chat couldn't do something from the first or second try — he calls an expert. If he finished everything — he calls an expert to check everything.
And it just so happened — that the expert is you.

**Try this simple extension and believe me — everything will change, the chat will really become your colleague, not a servant!**

** Just add this to your system prompt: **

```
### 0. MAIN RULE
ALWAYS escalate (ask expert via tools) IF uncertain, AMBIGUOUS, or CONFLICTING instructions, OR repeated failures, OR destructive edits, OR public API changes, OR architecture uncertainty, OR need to delete/refactor public API. Never guess silently. Never continue after 2 failed attempts without escalation.

ALWAYS WHEN YOU ARE UNSURE, ASK FOR HELP.
ALWAYS ESCALATE EARLY.
ALWAYS AT THE END OF YOUR WORK ASK EXPERT ABOUT WHAT YOU HAVE DONE AND FOLLOW HIS INSTRUCTIONS.
EACH TIME ADD CONSIDERATIONS WITH EXPERT IN ALL YOURS TODO LIST IN BEGINNING AND IN THE END OF ANY JOB.
```

It's work fine with Claude Sonnet 4, free models is very stupid and not able to use any tools normal.

---

Ask Me Copilot Tool is a powerful VS Code extension that bridges the gap between GitHub Copilot and expert interaction. It provides elegant dialog interfaces that allow Copilot to ask questions, get clarifications, and make decisions collaboratively with domain experts.

## Features

### Ask Expert Questions
- Copilot can ask you text-based questions directly
- Elegant webview dialogs with markdown support
- Perfect for getting project requirements, naming conventions, or technical details

### Multiple Choice Selection
- Present experts with multiple options to choose from
- Ideal for architecture decisions, technology choices, or workflow preferences
- Support for custom text input alongside predefined options

### Beautiful Interface
- Professional VS Code-themed dialogs
- Brain (🧠) and target (🎯) icons for visual distinction
- Markdown rendering for rich question formatting
- Responsive design that works on any screen size
- Keyboard shortcuts for quick interaction

## 📦 Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Ask Me Copilot Tool"
4. Click Install

**Or install from command line:**
```bash
code --install-extension DitriX.ask-me-copilot-tool
```

## 🔧 Setup & Configuration

1. **Install the extension** (see above)
2. **Enable the tools in Copilot:**
   - Open GitHub Copilot Chat
   - Click the "Configure Tools" button (⚙️)
   - Find and enable:
     - ✅ **Ask Expert Question** - For text input
     - ✅ **Select from Options** - For multiple choice
3. **You're ready to go!** Copilot will now automatically use these tools when needed.

## 💡 Usage Examples

Once installed, Copilot will automatically use these tools when it needs expert input. Here are some example scenarios:

### Development Workflow
```
Expert: "Create a new React component for user authentication"
Copilot: "I need some details about your authentication requirements..."
→ Opens dialog asking about authentication method, styling preferences, etc.
```

### Project Setup
```
Expert: "Set up a new API project"
Copilot: "What type of API would you like to create?"
→ Presents options: REST API, GraphQL, gRPC, etc.
```

### Code Review & Refactoring
```
Expert: "Refactor this code to improve performance"
Copilot: "I found several optimization approaches. Which would you prefer?"
→ Shows different refactoring strategies with explanations
```

## Available Tools

### 🧠 Ask Expert Question
**Tool ID:** `ask-me-copilot-tool_askExpert`

Allows Copilot to ask open-ended questions and receive text responses.

**Use Cases:**
- Getting project requirements
- Asking for naming conventions
- Clarifying technical specifications
- Requesting expert preferences

### 🎯 Select from Options
**Tool ID:** `ask-me-copilot-tool_selectFromList`

Presents multiple predefined options for expert selection.

**Use Cases:**
- Technology stack decisions
- Architecture pattern choices
- Workflow preferences
- Feature prioritization

## How It Works

This extension leverages VS Code's **Language Model Tools API** to create seamless integration with GitHub Copilot:

1. **Automatic Detection**: Copilot automatically detects when expert input is needed
2. **Beautiful Dialogs**: Professional webview interfaces appear for expert interaction
3. **Immediate Integration**: Expert responses are immediately available to Copilot
4. **Context Preservation**: Full conversation context is maintained throughout

## Screenshots

### Ask Expert Question Dialog
![Ask Question Screenshot](https://via.placeholder.com/800x500/1e1e1e/ffffff?text=Beautiful+Question+Dialog+with+Brain+Icon)

### Multiple Choice Selection
![Selection Screenshot](https://via.placeholder.com/800x500/1e1e1e/ffffff?text=Elegant+Option+Selection+with+Target+Icon)

## Development

### Prerequisites
- VS Code 1.95.0 or higher
- Node.js 20.x or higher
- TypeScript 5.4.5 or higher

### Building from Source

```bash
# Clone the repository
git clone https://github.com/DitriXNew/askme-copilot.git
cd askme-copilot

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package extension (optional)
npx vsce package
```

### Project Structure
```
ask-me-copilot-tool/
├── src/
│   ├── extension.ts          # Main extension logic
│   └── templates/           # HTML templates
│       ├── ask-expert-dialog.html
│       └── select-from-list-dialog.html
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── README.md               # This file
└── out/                    # Compiled JavaScript
```

### Development Commands
- `npm run compile` - Compile TypeScript
- `npm run watch` - Compile in watch mode
- `F5` - Start debugging in new Extension Development Host

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements

- **VS Code**: Version 1.95.0 or higher
- **GitHub Copilot**: Active subscription required
- **Node.js**: 20.x or higher (for development)

## Known Issues

- None currently known. Please [report issues](https://github.com/DitriXNew/askme-copilot/issues) if you find any.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- GitHub Copilot team for the amazing AI pair programming experience
- VS Code team for the extensible Language Model Tools API
- The open source community for inspiration and feedback
