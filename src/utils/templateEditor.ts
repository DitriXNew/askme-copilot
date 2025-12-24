// Template Editor - WebView panel for editing response templates
import * as vscode from 'vscode';
import { IResponseTemplate } from '../types';

const CONFIG_SECTION = 'askMeCopilot';
const TEMPLATES_KEY = 'templates';

export class TemplateEditor {
    private static panel: vscode.WebviewPanel | undefined;

    /**
     * Open the template editor WebView panel
     */
    static async openEditor(): Promise<void> {
        // If panel already exists, reveal it
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        // Create new panel
        this.panel = vscode.window.createWebviewPanel(
            'templateEditor',
            '📝 Template Editor',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'ready':
                    // Send current templates to webview
                    const templates = this.getTemplates();
                    this.panel?.webview.postMessage({
                        command: 'loadTemplates',
                        templates
                    });
                    break;
                case 'save':
                    await this.saveTemplates(message.templates);
                    vscode.window.showInformationMessage('✅ Templates saved successfully!');
                    break;
                case 'close':
                    this.panel?.dispose();
                    break;
            }
        });

        // Clean up when panel is closed
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    /**
     * Get all templates from configuration
     */
    private static getTemplates(): IResponseTemplate[] {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        const templates = config.get<IResponseTemplate[]>(TEMPLATES_KEY, []);
        
        // Ensure we always have 5 slots
        while (templates.length < 5) {
            templates.push(this.createEmptyTemplate());
        }
        
        return templates.slice(0, 5);
    }

    /**
     * Save templates to configuration
     */
    private static async saveTemplates(templates: IResponseTemplate[]): Promise<void> {
        const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
        await config.update(TEMPLATES_KEY, templates, vscode.ConfigurationTarget.Workspace);
    }

    /**
     * Create an empty template
     */
    private static createEmptyTemplate(): IResponseTemplate {
        return {
            title: '',
            content: '',
            enabledByDefault: false,
            applyTo: {
                askExpert: true,
                selectFromList: true,
                reviewCode: true
            }
        };
    }

    /**
     * Generate WebView HTML content
     */
    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Editor</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background);
            --text-color: var(--vscode-editor-foreground);
            --input-bg: var(--vscode-input-background);
            --input-border: var(--vscode-input-border);
            --input-focus: var(--vscode-focusBorder);
            --button-bg: var(--vscode-button-background);
            --button-fg: var(--vscode-button-foreground);
            --button-hover: var(--vscode-button-hoverBackground);
            --secondary-bg: var(--vscode-button-secondaryBackground);
            --secondary-fg: var(--vscode-button-secondaryForeground);
            --border-color: var(--vscode-panel-border);
            --description-color: var(--vscode-descriptionForeground);
            --success-color: var(--vscode-terminal-ansiGreen);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background: var(--bg-color);
            color: var(--text-color);
            padding: 12px;
            line-height: 1.4;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .header h1 {
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .header-actions {
            display: flex;
            gap: 6px;
        }
        
        .template-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 8px;
        }
        
        .template-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .template-number {
            font-size: 13px;
            font-weight: 600;
            color: var(--button-bg);
        }
        
        .template-status {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 10px;
            background: var(--secondary-bg);
            color: var(--secondary-fg);
        }
        
        .template-status.active {
            background: var(--success-color);
            color: #000;
        }
        
        .form-group {
            margin-bottom: 8px;
        }
        
        .form-label {
            display: block;
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 2px;
            color: var(--text-color);
        }
        
        .form-sublabel {
            font-size: 10px;
            color: var(--description-color);
            margin-left: 4px;
        }
        
        input[type="text"],
        textarea {
            width: 100%;
            padding: 5px 8px;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 3px;
            color: var(--text-color);
            font-family: inherit;
            font-size: 12px;
        }
        
        input[type="text"]:focus,
        textarea:focus {
            outline: none;
            border-color: var(--input-focus);
        }
        
        textarea {
            min-height: 45px;
            resize: vertical;
        }
        
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        }
        
        .checkbox-item input[type="checkbox"] {
            width: 14px;
            height: 14px;
            cursor: pointer;
        }
        
        .checkbox-item label {
            font-size: 11px;
            cursor: pointer;
        }
        
        .char-count {
            font-size: 10px;
            color: var(--description-color);
            text-align: right;
            margin-top: 2px;
        }
        
        .char-count.warning {
            color: var(--vscode-editorWarning-foreground);
        }
        
        .char-count.error {
            color: var(--vscode-errorForeground);
        }
        
        .btn {
            padding: 5px 12px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        
        .btn-primary {
            background: var(--button-bg);
            color: var(--button-fg);
        }
        
        .btn-primary:hover {
            background: var(--button-hover);
        }
        
        .btn-secondary {
            background: var(--secondary-bg);
            color: var(--secondary-fg);
        }
        
        .btn-secondary:hover {
            opacity: 0.9;
        }
        
        .btn-clear {
            background: transparent;
            color: var(--vscode-errorForeground);
            border: 1px solid var(--vscode-errorForeground);
            padding: 4px 8px;
            font-size: 11px;
        }
        
        .btn-clear:hover {
            background: var(--vscode-errorForeground);
            color: var(--bg-color);
        }
        
        .apply-to-section {
            display: flex;
            align-items: center;
            gap: 24px;
        }
        
        .divider {
            width: 1px;
            height: 20px;
            background: var(--border-color);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📝 Response Templates</h1>
        <div class="header-actions">
            <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="save()">💾 Save All</button>
        </div>
    </div>
    
    <div id="templatesContainer">
        <!-- Templates will be rendered here -->
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let templates = [];
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'loadTemplates') {
                templates = message.templates;
                renderTemplates();
            }
        });
        
        // Tell extension we're ready
        vscode.postMessage({ command: 'ready' });
        
        function renderTemplates() {
            const container = document.getElementById('templatesContainer');
            container.innerHTML = templates.map((t, i) => renderTemplate(t, i)).join('');
            
            // Add event listeners
            templates.forEach((t, i) => {
                const titleInput = document.getElementById('title-' + i);
                const contentInput = document.getElementById('content-' + i);
                
                if (titleInput) {
                    titleInput.addEventListener('input', () => updateCharCount(i, 'title'));
                }
                if (contentInput) {
                    contentInput.addEventListener('input', () => updateCharCount(i, 'content'));
                }
            });
        }
        
        function renderTemplate(template, index) {
            const isConfigured = template.title && template.title.trim();
            const statusClass = template.enabledByDefault ? 'active' : '';
            const statusText = template.enabledByDefault ? 'Enabled by default' : 'Disabled';
            
            return \`
                <div class="template-card">
                    <div class="template-header">
                        <span class="template-number">Template \${index + 1}</span>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="template-status \${statusClass}">\${statusText}</span>
                            <button class="btn btn-clear" onclick="clearTemplate(\${index})">Clear</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Title <span class="form-sublabel">(max 30 characters)</span>
                        </label>
                        <input type="text" 
                               id="title-\${index}" 
                               value="\${escapeHtml(template.title)}" 
                               maxlength="30"
                               placeholder="e.g., Consult Expert After Task"
                               onchange="updateTemplate(\${index}, 'title', this.value)">
                        <div class="char-count" id="title-count-\${index}">\${template.title.length}/30</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Content <span class="form-sublabel">(max 500 characters)</span>
                        </label>
                        <textarea id="content-\${index}" 
                                  maxlength="500"
                                  placeholder="Instructions to append to your response..."
                                  onchange="updateTemplate(\${index}, 'content', this.value)">\${escapeHtml(template.content)}</textarea>
                        <div class="char-count" id="content-count-\${index}">\${template.content.length}/500</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Settings</label>
                        <div class="apply-to-section">
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" 
                                           id="enabled-\${index}" 
                                           \${template.enabledByDefault ? 'checked' : ''}
                                           onchange="updateTemplate(\${index}, 'enabledByDefault', this.checked)">
                                    <label for="enabled-\${index}">Enabled by default</label>
                                </div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="checkbox-group">
                                <div class="checkbox-item">
                                    <input type="checkbox" 
                                           id="askExpert-\${index}" 
                                           \${template.applyTo.askExpert ? 'checked' : ''}
                                           onchange="updateApplyTo(\${index}, 'askExpert', this.checked)">
                                    <label for="askExpert-\${index}">🧠 Ask Expert</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" 
                                           id="selectFromList-\${index}" 
                                           \${template.applyTo.selectFromList ? 'checked' : ''}
                                           onchange="updateApplyTo(\${index}, 'selectFromList', this.checked)">
                                    <label for="selectFromList-\${index}">🎯 Select</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" 
                                           id="reviewCode-\${index}" 
                                           \${template.applyTo.reviewCode ? 'checked' : ''}
                                           onchange="updateApplyTo(\${index}, 'reviewCode', this.checked)">
                                    <label for="reviewCode-\${index}">📝 Review</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
        
        function updateTemplate(index, field, value) {
            templates[index][field] = value;
        }
        
        function updateApplyTo(index, tool, value) {
            templates[index].applyTo[tool] = value;
        }
        
        function updateCharCount(index, field) {
            const input = document.getElementById(field + '-' + index);
            const counter = document.getElementById(field + '-count-' + index);
            if (input && counter) {
                const max = field === 'title' ? 30 : 500;
                const len = input.value.length;
                counter.textContent = len + '/' + max;
                counter.className = 'char-count';
                if (len >= max) {
                    counter.classList.add('error');
                } else if (len >= max * 0.9) {
                    counter.classList.add('warning');
                }
                templates[index][field] = input.value;
            }
        }
        
        function clearTemplate(index) {
            templates[index] = {
                title: '',
                content: '',
                enabledByDefault: false,
                applyTo: {
                    askExpert: true,
                    selectFromList: true,
                    reviewCode: true
                }
            };
            renderTemplates();
        }
        
        function save() {
            vscode.postMessage({
                command: 'save',
                templates: templates
            });
        }
        
        function cancel() {
            vscode.postMessage({ command: 'close' });
        }
    </script>
</body>
</html>`;
    }
}
