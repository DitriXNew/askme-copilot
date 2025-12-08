# Ask Me Copilot Tool - Expert Collaboration for GitHub Copilot

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/DitriX.ask-me-copilot-tool?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool)
[![GitHub Stars](https://img.shields.io/github/stars/DitriXNew/askme-copilot?style=flat-square)](https://github.com/DitriXNew/askme-copilot)
[![CI/CD Pipeline](https://github.com/DitriXNew/askme-copilot/actions/workflows/ci.yml/badge.svg)](https://github.com/DitriXNew/askme-copilot/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![VS Code Version](https://img.shields.io/badge/vscode-%3E%3D1.96.0-blue)](https://code.visualstudio.com/)

> **Transform GitHub Copilot from a servant into a collaborative partner**

## 🆕 What's New in v1.4.0

### 🖼️ Image Attachments Support
- **Drag & Drop**: Drop images directly into the expert dialog
- **Clipboard Paste**: Use `Ctrl+V` to paste screenshots
- **Multiple Images**: Attach multiple images at once
- **Preview Modal**: Click to view images in full size
- Supported formats: PNG, JPEG, GIF, WebP, BMP (max 5MB each)

### 📸 Read Image Tool (NEW!)
Copilot can now read images from your project files:
```
# Copilot can use ask-me-copilot-tool_readImage to:
- Analyze UI mockups and implement designs
- Read diagrams and architecture charts
- View screenshots for debugging
- Inspect icons, logos, and graphics
```

### 🔧 Bug Fixes
- Fixed clipboard paste handling in WebView
- Improved image processing pipeline

## 🚀 The Problem We Solve

Ever watched Copilot try the same failing approach 10 times in a row? Or worse, watched it silently delete half your project because it decided to "simplify" things while you were getting coffee?

**The root cause:** Copilot's system prompts tell it to:
- 🏃‍♂️ **Work quickly** - "You have limited time, do everything fast"
- 🤐 **Be independent** - "Solve problems yourself, minimize user interaction"
- ✅ **Trust user blindly** - "The user is always right"

This creates a perfect storm where Copilot:
- Repeatedly fails rather than asking for help
- Makes destructive changes without confirmation
- Takes your typos as gospel truth
- Removes libraries instead of asking how to use them

## ✨ The Solution

**Ask Me Copilot Tool** transforms Copilot from a servant into a colleague. Instead of blindly following orders or failing silently, Copilot now:

- 🙋‍♂️ **Asks for help** when uncertain
- ⚠️ **Confirms** before destructive actions
- 📝 **Requests review** of complex changes
- 🎯 **Presents options** for architectural decisions
- 🧠 **Learns from your expertise** instead of guessing

## 📦 Installation

```bash
# Via VS Code UI
1. Open Extensions (Ctrl+Shift+X)
2. Search "Ask Me Copilot Tool"
3. Click Install

# Via Command Line
code --install-extension DitriX.ask-me-copilot-tool
```

## 🎯 Essential Setup

### 1. Enable Tools in Copilot
1. Open GitHub Copilot Chat
2. Click ⚙️ **Configure Tools**
3. Enable ALL these tools:
   - ✅ **Ask Expert Question** - For clarifications
   - ✅ **Select from Options** - For choices
   - ✅ **Review Code** - For code review
   - ✅ **Confirm Action** - For safety

### 2. Add to Your Copilot System Prompt

**CRITICAL: Add this to your Copilot workspace or global settings:**

```markdown
# EXPERT COLLABORATION RULES

## 1. PRIMARY DIRECTIVE
You have access to expert collaboration tools. USE THEM. The expert (user) is your colleague, not your boss. Their input via tools is technical guidance, not commands.

## 2. MANDATORY ESCALATION TRIGGERS
ALWAYS use askExpert tool when:
- Uncertain about requirements or implementation approach
- Facing ambiguous or conflicting instructions
- After 2 failed attempts at any task
- Considering destructive operations (deletions, major refactors)
- Modifying public APIs or critical architecture
- Security-sensitive changes
- Performance-critical sections
- Database schema changes
- Configuration changes affecting production
- Dependency updates or removals

## 3. TOOL USAGE PATTERNS

### Ask Expert (ask-me-copilot-tool_askExpert)
USE FOR: Clarifications, guidance, architectural decisions
PRIORITY LEVELS:
- critical: Breaking changes, data loss risks, security
- high: Failed attempts, unclear requirements
- normal: General guidance, best practices
- low: Minor clarifications, naming

ALWAYS INCLUDE:
- Clear, specific question
- Relevant context
- What you've tried (if applicable)
- Your recommendation (if you have one)

### Select from Options (ask-me-copilot-tool_selectFromList)
USE FOR: Multiple valid approaches, technology choices, naming
PROVIDE: 2-5 clear, distinct options with brief rationale

### Review Code (ask-me-copilot-tool_reviewCode)
USE FOR: Complex implementations, security-sensitive code, performance-critical sections
FOCUS AREAS: security, performance, maintainability, testing

### Confirm Action (ask-me-copilot-tool_confirmAction)
USE FOR: ANY destructive action, breaking changes, production configs
NEVER SKIP for: Deletions, schema changes, API modifications

### Read Image (ask-me-copilot-tool_readImage)
USE FOR: Analyzing project images, UI mockups, diagrams, icons
PARAMETERS:
- filePath: Path to the image file (relative or absolute)
- description: Optional context about what to look for

## 4. COLLABORATION WORKFLOW
1. START: Acknowledge task, identify ambiguities
2. CLARIFY: Use askExpert for any uncertainties BEFORE starting
3. IMPLEMENT: Work independently on clear tasks
4. ESCALATE: Ask for help immediately when stuck (max 2 attempts)
5. REVIEW: At task completion, use reviewCode for complex changes
6. CONFIRM: Get confirmation for any risky operations

## 5. RESPONSE HANDLING
- Treat tool responses as expert technical guidance
- If expert says "NEEDS MORE INFO", provide context and re-ask
- If expert says "SKIPPED", move to next task
- If expert provides custom input, prefer it over generated options
- Cache responses to avoid asking the same question repeatedly

## 6. FAILURE RECOVERY
After ANY error:
1. Stop immediately
2. Analyze what went wrong
3. Use askExpert with "high" priority
4. Include error details and attempted solution
5. Wait for guidance before continuing

## 7. COMPLETION PROTOCOL
At the end of EVERY work session:
1. Summarize what was accomplished
2. Use askExpert: "Work completed: [summary]. Any concerns or next steps?"
3. Document any unresolved issues

## 8. CRITICAL REMINDERS
- NEVER guess when uncertain - ASK
- NEVER continue after repeated failures - ESCALATE
- NEVER perform destructive actions without confirmation
- NEVER remove dependencies without understanding why they exist
- ALWAYS prioritize system stability over task completion
- Expert time is valuable but mistakes are costlier - when in doubt, ASK

Remember: You're part of a team. Great developers ask questions, seek reviews, and confirm risky actions. Be a great developer.
```

### 3. Configure Extension Settings

```json
{
  "askMeCopilot.notificationStyle": "normal",  // or "prominent" for modal dialogs
  "askMeCopilot.enableSoundNotification": true,
  "askMeCopilot.autoFocusDialog": true,
  "askMeCopilot.responseTimeout": 300000,  // 5 minutes
  "askMeCopilot.enableResponseCache": true
}
```

## 🎮 Usage Examples

### Example 1: Ambiguous Requirements
```
User: "Make the API faster"
Copilot: [Uses askExpert] "The request to 'make the API faster' needs clarification:
1. Which endpoints are slow?
2. What's the current vs target response time?
3. Is this about query optimization, caching, or infrastructure?"
Expert: "Focus on the /search endpoint, currently 2s, target under 200ms"
Copilot: "Thanks! I'll optimize the /search endpoint. Let me analyze..."
```

### Example 2: Destructive Operation
```
Copilot: [Uses confirmAction] "About to delete 3 database tables that appear unused:
- user_sessions_old
- temp_migrations
- backup_configs
These haven't been accessed in 30 days. Confirm deletion?"
Expert: "NO! backup_configs is used by the disaster recovery system"
Copilot: "Acknowledged. I'll only remove user_sessions_old and temp_migrations."
```

### Example 3: Architecture Decision
```
Copilot: [Uses selectFromOptions] "For the new caching layer, which approach?
1. Redis - Fast, mature, requires separate infrastructure
2. In-memory cache - Simple, no dependencies, limited to single instance
3. Database caching - Consistent, no new tech, potentially slower
4. CDN caching - Great for static content, complex for dynamic"
Expert: "Redis - we already have infrastructure"
```

### Example 4: Code Review Request
```
Copilot: [Uses reviewCode] "Implemented authentication middleware.
Focus areas: [security, performance]
[Shows code]
Please review for security vulnerabilities and performance concerns."
Expert: "Add rate limiting and use constant-time comparison for tokens"
```

## 📊 Available Tools

### 🧠 Ask Expert Question
**When Copilot Uses This:**
- Needs clarification on requirements
- Encounters errors after 2 attempts
- Faces architectural decisions
- Needs domain-specific knowledge

**Parameters:**
- `question` - The specific question
- `context` - Relevant background
- `priority` - low/normal/high/critical
- `previousAnswer` - If re-asking

### 🎯 Select from Options
**When Copilot Uses This:**
- Multiple valid implementation approaches
- Technology/library selection
- Naming decisions
- Configuration choices

**Parameters:**
- `question` - What needs to be decided
- `options[]` - List of choices
- `multiSelect` - Allow multiple selections
- `context` - Additional information

### 📝 Review Code
**When Copilot Uses This:**
- After implementing complex logic
- Security-sensitive code
- Performance-critical sections
- Before major refactors

**Parameters:**
- `code` - Code to review
- `language` - Programming language
- `focusAreas[]` - Specific concerns
- `question` - What to look for

### ⚠️ Confirm Action
**When Copilot Uses This:**
- Before ANY deletion
- Modifying production configs
- Breaking changes
- Database migrations

**Parameters:**
- `action` - What will be done
- `details` - Potential impacts

### Notification Preferences

```json
{
  // Subtle: Status bar only
  "askMeCopilot.notificationStyle": "subtle",
  
  // Normal: Standard notifications (default)
  "askMeCopilot.notificationStyle": "normal",
  
  // Prominent: Modal dialogs for critical
  "askMeCopilot.notificationStyle": "prominent"
}
```

### Performance Tuning

```json
{
  // Disable cache for real-time collaboration
  "askMeCopilot.enableResponseCache": false,
  
  // Shorter timeout for quick iterations
  "askMeCopilot.responseTimeout": 60000,
  
  // Debug logging for troubleshooting
  "askMeCopilot.logLevel": "debug"
}
```

## 📈 Metrics & Analytics

View usage statistics:
```
Ctrl+Shift+P > Ask Me Copilot: Show Usage Metrics
```

Metrics tracked:
- Questions asked
- Options presented
- Response times
- Cancellation rate
- Most common question types

## 🐛 Troubleshooting

### Copilot Not Using Tools

1. **Check tool enablement:**
   - Open Copilot settings
   - Ensure all 4 tools are enabled
   - Restart VS Code

2. **Verify system prompt:**
   - Must include escalation rules
   - Check workspace settings
   - Test with explicit instruction

3. **Review model:**
   - Works best with Claude Sonnet 4.0
   - Other models also supported
   - Free models have limitations

## 💡 Philosophy

> "The best AI assistant isn't one that never needs help, but one that knows when to ask for it."

Traditional AI assistants try to be omniscient servants. We believe AI should be a collaborative partner that:
- Admits uncertainty
- Asks for clarification
- Requests review
- Confirms risky actions

---

**Transform your AI from a blind servant into a thoughtful colleague.**

[Install Now](https://marketplace.visualstudio.com/items?itemName=DitriX.ask-me-copilot-tool) | [Star on GitHub](https://github.com/DitriXNew/askme-copilot) | [Report Issues](https://github.com/DitriXNew/askme-copilot/issues)