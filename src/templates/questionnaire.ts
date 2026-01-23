// Questionnaire Template - Dynamic form with multiple field types
import { getBaseStyles, getBaseScript, getAttachmentsSection, getKeyboardHints, getTemplatesSection } from './base';

export const getQuestionnaireTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Questionnaire</title>
    <style>
        ${getBaseStyles()}
        
        /* Questionnaire specific styles */
        .questionnaire-description {
            margin-bottom: var(--spacing-lg);
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.6;
        }
        
        .sections-container {
            margin-bottom: var(--spacing-lg);
        }
        
        .section {
            margin-bottom: var(--spacing-xl);
            padding: var(--spacing-lg);
            background: var(--vscode-textBlockQuote-background);
            border-radius: var(--radius-md);
            border-left: 3px solid var(--vscode-textLink-foreground);
        }
        
        .section-title {
            margin: 0 0 var(--spacing-sm) 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .section-description {
            margin-bottom: var(--spacing-md);
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .fields-container {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        
        .field-wrapper {
            transition: opacity 0.2s ease, max-height 0.3s ease;
        }
        
        .field-wrapper.hidden {
            opacity: 0;
            max-height: 0;
            overflow: hidden;
            margin: 0;
            padding: 0;
        }
        
        .field-label {
            display: block;
            margin-bottom: var(--spacing-xs);
            font-size: 13px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        /* Text input */
        .field-text,
        .field-number {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--vscode-input-border);
            border-radius: var(--radius-sm);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 13px;
        }
        
        .field-text:focus,
        .field-number:focus,
        .field-textarea:focus,
        .field-select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: var(--focus-ring);
        }
        
        .field-text::placeholder,
        .field-textarea::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
        
        /* Number input */
        .field-number {
            max-width: 150px;
        }
        
        /* Textarea */
        .field-textarea {
            width: 100%;
            min-height: 80px;
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--vscode-input-border);
            border-radius: var(--radius-sm);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 13px;
            line-height: 1.5;
            resize: vertical;
        }
        
        /* Select */
        .field-select {
            padding: var(--spacing-sm) var(--spacing-md);
            border: 1px solid var(--vscode-input-border);
            border-radius: var(--radius-sm);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 13px;
            cursor: pointer;
            min-width: 200px;
        }
        
        /* Checkbox */
        .field-checkbox-wrapper {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            cursor: pointer;
        }
        
        .field-checkbox {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--vscode-focusBorder);
        }
        
        .field-checkbox-label {
            font-size: 13px;
            color: var(--vscode-foreground);
            user-select: none;
        }
        
        /* Radio group */
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        
        .radio-option {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            cursor: pointer;
        }
        
        .field-radio {
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: var(--vscode-focusBorder);
        }
        
        .radio-label {
            font-size: 13px;
            color: var(--vscode-foreground);
            user-select: none;
        }
        
        /* Field header with add comment link */
        .field-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-xs);
        }
        
        .add-comment-link {
            font-size: 11px;
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            user-select: none;
            text-decoration: none;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }
        
        .add-comment-link:hover {
            opacity: 1;
            text-decoration: underline;
        }
        
        .add-comment-link.active {
            opacity: 1;
            color: var(--vscode-notificationsInfoIcon-foreground);
        }
        
        /* Field comment section */
        .field-comment-section {
            margin-top: var(--spacing-sm);
            padding: var(--spacing-sm);
            background: var(--vscode-textCodeBlock-background);
            border-radius: var(--radius-sm);
            border-left: 2px solid var(--vscode-textLink-foreground);
            display: none;
        }
        
        .field-comment-section.visible {
            display: block;
        }
        
        .field-comment-input {
            width: 100%;
            min-height: 50px;
            padding: var(--spacing-sm);
            border: 1px solid var(--vscode-input-border);
            border-radius: var(--radius-sm);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 12px;
            line-height: 1.4;
            resize: vertical;
        }
        
        .field-comment-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: var(--focus-ring);
        }
        
        .field-comment-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }
        
        /* Answer section styling */
        .comment-section {
            margin-bottom: var(--spacing-lg);
        }
        
        .comment-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-sm);
            gap: var(--spacing-md);
        }
    </style>
</head>
<body>
    <div class="dialog-container">
        <div class="dialog-header">
            <div class="dialog-header-icon">📋</div>
            <h1 class="dialog-header-title" id="questionnaireTitle">Questionnaire</h1>
        </div>
        
        <div id="questionnaireDescription" class="questionnaire-description" style="display: none;"></div>
        
        <div id="sectionsContainer" class="sections-container">
            <!-- Sections will be rendered here -->
        </div>
        
        <div class="comment-section">
            <div class="comment-header">
                <span style="font-weight: 500; font-size: 13px;">Additional Comment (optional):</span>
                ${getTemplatesSection()}
            </div>
            <textarea 
                id="commentInput" 
                class="answer-input" 
                placeholder="Add any additional comments or notes... (Paste images with Ctrl+V)"
            ></textarea>
        </div>
        
        ${getAttachmentsSection()}
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">Cancel</button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit</button>
            </div>
        </div>
        
        ${getKeyboardHints()}
    </div>

    <script>
        ${getBaseScript()}
        
        const sectionsContainer = document.getElementById('sectionsContainer');
        const commentInput = document.getElementById('commentInput');
        const titleElement = document.getElementById('questionnaireTitle');
        const descriptionElement = document.getElementById('questionnaireDescription');
        const templatesChips = document.getElementById('templatesChips');
        
        let formData = {};
        let fieldComments = {}; // Map of fieldName -> comment text
        let sections = [];
        let fieldConditions = {}; // Map of fieldName -> { field, value }
        let responseTemplates = [];
        let activeTemplateIndices = new Set();
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                titleElement.textContent = message.title || 'Questionnaire';
                
                if (message.description) {
                    descriptionElement.textContent = message.description;
                    descriptionElement.style.display = 'block';
                }
                
                sections = message.sections || [];
                renderSections();
                
                // Handle templates
                if (message.templates && message.templates.length > 0) {
                    responseTemplates = message.templates;
                    if (message.defaultTemplateIndices) {
                        activeTemplateIndices = new Set(message.defaultTemplateIndices);
                    }
                    renderTemplateChips();
                }
            }
            
            // Handle live template updates
            if (message.command === 'updateTemplates') {
                responseTemplates = message.templates || [];
                if (message.defaultTemplateIndices) {
                    activeTemplateIndices = new Set(message.defaultTemplateIndices);
                }
                renderTemplateChips();
            }
        });
        
        function renderSections() {
            sectionsContainer.innerHTML = sections.map((section, sIdx) => \`
                <div class="section">
                    <h2 class="section-title">\${escapeHtml(section.title)}</h2>
                    \${section.description ? \`<div class="section-description">\${escapeHtml(section.description)}</div>\` : ''}
                    <div class="fields-container">
                        \${section.fields.map((field, fIdx) => renderField(field, sIdx, fIdx)).join('')}
                    </div>
                </div>
            \`).join('');
            
            // Initialize form data with defaults
            sections.forEach(section => {
                section.fields.forEach(field => {
                    if (field.defaultValue !== undefined) {
                        formData[field.name] = field.defaultValue;
                    } else if (field.type === 'checkbox') {
                        formData[field.name] = false;
                    } else {
                        formData[field.name] = '';
                    }
                    
                    // Track conditions
                    if (field.showWhen) {
                        fieldConditions[field.name] = field.showWhen;
                    }
                });
            });
            
            // Initial visibility update
            updateFieldVisibility();
        }
        
        function renderField(field, sIdx, fIdx) {
            const fieldId = 'field_' + field.name;
            const hasCondition = field.showWhen ? 'data-condition="true"' : '';
            const conditionData = field.showWhen ? \`data-depends-on="\${field.showWhen.field}" data-depends-value="\${field.showWhen.value}"\` : '';
            
            switch (field.type) {
                case 'text':
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-label" for="\${fieldId}">\${escapeHtml(field.label)}</label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <input 
                                type="text" 
                                id="\${fieldId}" 
                                name="\${field.name}"
                                class="field-text"
                                placeholder="\${escapeHtml(field.placeholder || '')}"
                                value="\${escapeHtml(String(field.defaultValue || ''))}"
                                onchange="updateFormData('\${field.name}', this.value)"
                                oninput="updateFormData('\${field.name}', this.value)"
                            >
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                case 'number':
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-label" for="\${fieldId}">\${escapeHtml(field.label)}</label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <input 
                                type="number" 
                                id="\${fieldId}" 
                                name="\${field.name}"
                                class="field-number"
                                placeholder="\${escapeHtml(field.placeholder || '')}"
                                value="\${field.defaultValue || ''}"
                                onchange="updateFormData('\${field.name}', parseFloat(this.value) || 0)"
                                oninput="updateFormData('\${field.name}', parseFloat(this.value) || 0)"
                            >
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                case 'textarea':
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-label" for="\${fieldId}">\${escapeHtml(field.label)}</label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <textarea 
                                id="\${fieldId}" 
                                name="\${field.name}"
                                class="field-textarea"
                                placeholder="\${escapeHtml(field.placeholder || '')}"
                                onchange="updateFormData('\${field.name}', this.value)"
                                oninput="updateFormData('\${field.name}', this.value)"
                            >\${escapeHtml(String(field.defaultValue || ''))}</textarea>
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                case 'checkbox':
                    const isChecked = field.defaultValue === true ? 'checked' : '';
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-checkbox-wrapper">
                                    <input 
                                        type="checkbox" 
                                        id="\${fieldId}" 
                                        name="\${field.name}"
                                        class="field-checkbox"
                                        \${isChecked}
                                        onchange="updateFormData('\${field.name}', this.checked)"
                                    >
                                    <span class="field-checkbox-label">\${escapeHtml(field.label)}</span>
                                </label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                case 'radio':
                    const options = field.options || [];
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-label">\${escapeHtml(field.label)}</label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <div class="radio-group">
                                \${options.map((opt, i) => {
                                    const isDefault = field.defaultValue === opt ? 'checked' : '';
                                    return \`
                                        <label class="radio-option">
                                            <input 
                                                type="radio" 
                                                name="\${field.name}"
                                                class="field-radio"
                                                value="\${escapeHtml(opt)}"
                                                \${isDefault}
                                                onchange="updateFormData('\${field.name}', '\${escapeHtml(opt)}')"
                                            >
                                            <span class="radio-label">\${escapeHtml(opt)}</span>
                                        </label>
                                    \`;
                                }).join('')}
                            </div>
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                case 'select':
                    const selectOptions = field.options || [];
                    return \`
                        <div class="field-wrapper" id="wrapper_\${field.name}" \${hasCondition} \${conditionData}>
                            <div class="field-header">
                                <label class="field-label" for="\${fieldId}">\${escapeHtml(field.label)}</label>
                                <a class="add-comment-link" id="commentLink_\${field.name}" onclick="toggleFieldComment('\${field.name}')">+ add comment</a>
                            </div>
                            <select 
                                id="\${fieldId}" 
                                name="\${field.name}"
                                class="field-select"
                                onchange="updateFormData('\${field.name}', this.value)"
                            >
                                <option value="">-- Select --</option>
                                \${selectOptions.map(opt => {
                                    const isSelected = field.defaultValue === opt ? 'selected' : '';
                                    return \`<option value="\${escapeHtml(opt)}" \${isSelected}>\${escapeHtml(opt)}</option>\`;
                                }).join('')}
                            </select>
                            <div class="field-comment-section" id="commentSection_\${field.name}">
                                <textarea 
                                    id="commentInput_\${field.name}"
                                    class="field-comment-input"
                                    placeholder="Add your comment for this field..."
                                    oninput="updateFieldComment('\${field.name}', this.value)"
                                ></textarea>
                            </div>
                        </div>
                    \`;
                    
                default:
                    return '';
            }
        }
        
        function escapeHtml(text) {
            if (typeof text !== 'string') return text;
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        
        function updateFormData(fieldName, value) {
            formData[fieldName] = value;
            updateFieldVisibility();
        }
        
        function toggleFieldComment(fieldName) {
            const section = document.getElementById('commentSection_' + fieldName);
            const link = document.getElementById('commentLink_' + fieldName);
            const input = document.getElementById('commentInput_' + fieldName);
            
            if (!section || !link) return;
            
            const isVisible = section.classList.contains('visible');
            
            if (isVisible) {
                section.classList.remove('visible');
                link.classList.remove('active');
                link.textContent = '+ add comment';
            } else {
                section.classList.add('visible');
                link.classList.add('active');
                link.textContent = '− hide comment';
                // Focus the input
                if (input) {
                    setTimeout(() => input.focus(), 50);
                }
            }
        }
        
        function updateFieldComment(fieldName, value) {
            if (value && value.trim()) {
                fieldComments[fieldName] = value.trim();
            } else {
                delete fieldComments[fieldName];
            }
        }
        
        function updateFieldVisibility() {
            // Check each field with conditions
            Object.keys(fieldConditions).forEach(fieldName => {
                const condition = fieldConditions[fieldName];
                const wrapper = document.getElementById('wrapper_' + fieldName);
                if (!wrapper) return;
                
                const dependsOnValue = formData[condition.field];
                let shouldShow = false;
                
                // Handle different value types
                if (typeof condition.value === 'boolean') {
                    shouldShow = dependsOnValue === condition.value;
                } else {
                    shouldShow = String(dependsOnValue) === String(condition.value);
                }
                
                if (shouldShow) {
                    wrapper.classList.remove('hidden');
                } else {
                    wrapper.classList.add('hidden');
                }
            });
        }
        
        function renderTemplateChips() {
            if (!templatesChips) return;
            
            templatesChips.innerHTML = responseTemplates.map((template, index) => {
                const isActive = activeTemplateIndices.has(index);
                const title = template.displayTitle || template.title;
                
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
        
        function submit() {
            // Collect active template contents
            const activeTemplates = Array.from(activeTemplateIndices)
                .map(index => responseTemplates[index].content);
            
            vscode.postMessage({
                command: 'submit',
                values: formData,
                fieldComments: fieldComments,
                comment: commentInput.value.trim(),
                attachments: attachments.map(a => ({
                    data: a.data,
                    mimeType: a.mimeType,
                    name: a.name,
                    filePath: a.filePath,
                    isFilePath: a.isFilePath
                })),
                activeTemplates: activeTemplates
            });
        }
        
        function cancel() {
            const hasData = Object.values(formData).some(v => v !== '' && v !== false);
            const hasComments = Object.keys(fieldComments).length > 0;
            if ((hasData || hasComments || commentInput.value.trim()) && !confirm('Discard all entries?')) {
                return;
            }
            vscode.postMessage({ command: 'cancel' });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape' && !document.getElementById('previewModal').classList.contains('visible')) {
                e.preventDefault();
                cancel();
            }
        });
        
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
