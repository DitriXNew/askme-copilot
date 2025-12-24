// Code Review Template - Uses base template components
import { getBaseStyles, getBaseScript, getAttachmentsSection, getKeyboardHints, getTemplatesSection } from './base';

export const getCodeReviewTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review</title>
    <style>
        ${getBaseStyles()}
        
        /* Code review specific styles */
        .code-section {
            margin-bottom: var(--spacing-lg);
        }
        
        .code-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--vscode-titleBar-activeBackground);
            border: 1px solid var(--vscode-panel-border);
            border-bottom: none;
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            font-size: 12px;
            font-weight: 500;
        }
        
        .code-input {
            width: 100%;
            min-height: 250px;
            max-height: 400px;
            padding: var(--spacing-lg);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 0 0 var(--radius-md) var(--radius-md);
            background: var(--vscode-textCodeBlock-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
            tab-size: 4;
            white-space: pre;
            overflow: auto;
        }
        
        .code-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .focus-badges {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-md);
        }
        
        .focus-badge {
            padding: var(--spacing-xs) var(--spacing-md);
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .review-question {
            margin-bottom: var(--spacing-md);
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="dialog-container">
        <div class="dialog-header">
            <div class="dialog-header-icon">📝</div>
            <h1 class="dialog-header-title">GitHub Copilot Code Review</h1>
        </div>
        
        <div id="focusAreas" class="focus-badges"></div>
        
        <div id="reviewQuestion" class="review-question" style="display: none;"></div>
        
        <div class="code-section">
            <div class="code-header">
                <span id="language">Code</span>
                <span style="font-size: 11px; color: var(--vscode-descriptionForeground);">
                    You can edit the code below
                </span>
            </div>
            <textarea 
                id="codeInput" 
                class="code-input" 
                spellcheck="false"
            ></textarea>
        </div>
        
        ${getTemplatesSection()}
        
        <div class="answer-section">
            <div class="answer-header">
                <span style="font-weight: 500; font-size: 13px;">Your Review:</span>
            </div>
            <textarea 
                id="reviewInput" 
                class="answer-input" 
                placeholder="Provide your code review feedback... (Paste images with Ctrl+V)"
            ></textarea>
        </div>
        
        ${getAttachmentsSection()}
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">Cancel</button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-secondary" onclick="approveCode()">✓ Approve</button>
                <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit Review</button>
            </div>
        </div>
        
        ${getKeyboardHints()}
    </div>

    <script>
        ${getBaseScript()}
        
        const codeInput = document.getElementById('codeInput');
        const reviewInput = document.getElementById('reviewInput');
        const focusAreasContainer = document.getElementById('focusAreas');
        const languageLabel = document.getElementById('language');
        const reviewQuestion = document.getElementById('reviewQuestion');
        const submitBtn = document.getElementById('submitBtn');
        const templatesSection = document.getElementById('templatesSection');
        const templatesChips = document.getElementById('templatesChips');
        
        let originalCode = '';
        let responseTemplates = [];
        let activeTemplateIndices = new Set();
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setCode') {
                originalCode = message.code || '';
                codeInput.value = originalCode;
                languageLabel.textContent = message.language || 'Code';
                
                if (message.question) {
                    reviewQuestion.textContent = message.question;
                    reviewQuestion.style.display = 'block';
                }
                
                if (message.focusAreas && message.focusAreas.length > 0) {
                    message.focusAreas.forEach(area => {
                        const badge = document.createElement('span');
                        badge.className = 'focus-badge';
                        badge.textContent = area;
                        focusAreasContainer.appendChild(badge);
                    });
                }
                
                // Handle templates
                if (message.templates && message.templates.length > 0) {
                    responseTemplates = message.templates;
                    if (message.defaultTemplateIndices) {
                        activeTemplateIndices = new Set(message.defaultTemplateIndices);
                    }
                    renderTemplateChips();
                    templatesSection.style.display = 'block';
                }
                
                updateButtonState();
            }
        });
        
        function renderTemplateChips() {
            if (!templatesChips) return;
            
            templatesChips.innerHTML = responseTemplates.map((template, index) => {
                const isActive = activeTemplateIndices.has(index);
                const title = template.title.length > 30 
                    ? template.title.substring(0, 27) + '...' 
                    : template.title;
                
                return \`
                    <div class="template-chip \${isActive ? 'active' : ''}" 
                         data-index="\${index}"
                         title="\${template.content}"
                         onclick="toggleTemplate(\${index})">
                        <span class="template-chip-check">\${isActive ? '✓' : ''}</span>
                        <span class="template-chip-title">\${title}</span>
                    </div>
                \`;
            }).join('');
        }
        
        function toggleTemplate(index) {
            if (activeTemplateIndices.has(index)) {
                activeTemplateIndices.delete(index);
            } else {
                activeTemplateIndices.add(index);
            }
            renderTemplateChips();
        }
        
        function openTemplateSettings() {
            vscode.postMessage({ command: 'openSettings' });
        }
        
        function updateButtonState() {
            const hasReview = reviewInput.value.trim().length > 0;
            const codeChanged = codeInput.value !== originalCode;
            submitBtn.disabled = !hasReview && !codeChanged && attachments.length === 0;
        }
        
        reviewInput.addEventListener('input', updateButtonState);
        codeInput.addEventListener('input', updateButtonState);
        
        function submit() {
            const review = reviewInput.value.trim();
            const codeChanged = codeInput.value !== originalCode;
            
            let response = '';
            
            if (review) {
                response = review;
            }
            
            if (codeChanged) {
                response += (response ? '\\n\\n' : '') + '--- MODIFIED CODE ---\\n' + codeInput.value;
            }
            
            if (response || attachments.length > 0) {
                // Collect active template contents
                const activeTemplates = Array.from(activeTemplateIndices)
                    .map(index => responseTemplates[index].content);
                
                vscode.postMessage({
                    command: 'submit',
                    text: response || '[Attachments only]',
                    attachments: attachments.map(a => ({
                        data: a.data,
                        mimeType: a.mimeType,
                        name: a.name
                    })),
                    activeTemplates: activeTemplates
                });
            }
        }
        
        function approveCode() {
            // Collect active template contents for approve action too
            const activeTemplates = Array.from(activeTemplateIndices)
                .map(index => responseTemplates[index].content);
            
            vscode.postMessage({
                command: 'submit',
                text: '✅ Code approved. Looks good!',
                attachments: [],
                activeTemplates: activeTemplates
            });
        }
        
        function cancel() {
            if ((reviewInput.value.trim() || codeInput.value !== originalCode) && !confirm('Discard changes?')) {
                return;
            }
            vscode.postMessage({ command: 'cancel' });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape' && !document.getElementById('previewModal').classList.contains('visible')) {
                e.preventDefault();
                cancel();
            }
        });
        
        // Tab handling in code textarea
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = codeInput.selectionStart;
                const end = codeInput.selectionEnd;
                codeInput.value = codeInput.value.substring(0, start) + '    ' + codeInput.value.substring(end);
                codeInput.selectionStart = codeInput.selectionEnd = start + 4;
            }
        });
        
        vscode.postMessage({ command: 'ready' });
        updateButtonState();
    </script>
</body>
</html>`;
