// Base Template - Shared styles and components for all dialogs
// Uses CSS custom properties (tokens) for consistent theming

export const getBaseStyles = () => `
    :root {
        /* Animation tokens */
        --animation-duration: 0.2s;
        --animation-easing: ease;
        
        /* Spacing tokens */
        --spacing-xs: 4px;
        --spacing-sm: 8px;
        --spacing-md: 12px;
        --spacing-lg: 16px;
        --spacing-xl: 20px;
        --spacing-2xl: 24px;
        
        /* Border radius tokens */
        --radius-sm: 4px;
        --radius-md: 6px;
        --radius-lg: 8px;
        --radius-full: 50%;
        
        /* Shadow tokens */
        --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.1);
        --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.15);
        --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.2);
        
        /* Focus tokens */
        --focus-ring: 0 0 0 2px var(--vscode-focusBorder);
    }
    
    * {
        box-sizing: border-box;
    }
    
    body {
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif);
        font-size: var(--vscode-font-size, 13px);
        margin: 0;
        padding: 0;
        background: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        line-height: 1.5;
    }
    
    /* Container */
    .dialog-container {
        max-width: 900px;
        margin: 0 auto;
        padding: var(--spacing-xl);
    }
    
    /* Header */
    .dialog-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--vscode-panel-border);
    }
    
    .dialog-header-icon {
        font-size: 20px;
        flex-shrink: 0;
    }
    
    .dialog-header-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--vscode-foreground);
    }
    
    /* Question Section */
    .question-section {
        background: linear-gradient(135deg, 
            var(--vscode-textBlockQuote-background) 0%, 
            var(--vscode-editor-background) 100%);
        border-left: 3px solid var(--vscode-textLink-foreground);
        border-radius: var(--radius-md);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
    }
    
    .question-content {
        font-size: 15px;
        line-height: 1.7;
    }
    
    .question-content code {
        background: var(--vscode-textCodeBlock-background);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-family: var(--vscode-editor-font-family, monospace);
        font-size: 13px;
    }
    
    .question-content pre {
        background: var(--vscode-textCodeBlock-background);
        padding: var(--spacing-lg);
        border-radius: var(--radius-md);
        overflow-x: auto;
        border: 1px solid var(--vscode-panel-border);
    }
    
    .question-content pre code {
        background: none;
        padding: 0;
    }
    
    /* Context Section */
    .context-section {
        background: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: var(--radius-md);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        font-size: 13px;
        color: var(--vscode-descriptionForeground);
    }
    
    /* Answer Section */
    .answer-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .answer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
        gap: var(--spacing-md);
    }
    
    .answer-input {
        width: 100%;
        min-height: 120px;
        padding: var(--spacing-lg);
        border: 2px solid var(--vscode-input-border);
        border-radius: var(--radius-md);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-family: inherit;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        transition: border-color var(--animation-duration) var(--animation-easing),
                    box-shadow var(--animation-duration) var(--animation-easing);
    }
    
    .answer-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
        box-shadow: var(--focus-ring);
    }
    
    .answer-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }
    
    .char-counter {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
    }
    
    /* Quick Actions */
    .quick-actions {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
        flex: 1;
    }
    
    .quick-action {
        padding: 6px 12px;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: var(--radius-md);
        font-size: 12px;
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .quick-action:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    
    /* Buttons */
    .button-container {
        display: flex;
        gap: var(--spacing-md);
        justify-content: space-between;
        margin-top: var(--spacing-xl);
        padding-top: var(--spacing-lg);
        border-top: 1px solid var(--vscode-panel-border);
    }
    
    .button-group {
        display: flex;
        gap: var(--spacing-md);
    }
    
    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
        min-width: 90px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
    }
    
    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }
    
    .btn-primary:hover:not(:disabled) {
        background: var(--vscode-button-hoverBackground);
    }
    
    .btn-secondary {
        background: transparent;
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-button-border, var(--vscode-panel-border));
    }
    
    .btn-secondary:hover:not(:disabled) {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    
    .btn-danger {
        background: transparent;
        color: var(--vscode-editorError-foreground);
        border: 1px solid var(--vscode-editorError-foreground);
    }
    
    .btn-danger:hover:not(:disabled) {
        background: var(--vscode-editorError-foreground);
        color: var(--vscode-editor-background);
    }
    
    /* Keyboard Shortcuts */
    .keyboard-hints {
        display: flex;
        gap: var(--spacing-lg);
        margin-top: var(--spacing-lg);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--vscode-textCodeBlock-background);
        border-radius: var(--radius-md);
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
    }
    
    .keyboard-hint {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
    
    .kbd {
        padding: 2px 6px;
        background: var(--vscode-button-secondaryBackground);
        border: 1px solid var(--vscode-button-border, var(--vscode-panel-border));
        border-radius: var(--radius-sm);
        font-family: monospace;
        font-size: 10px;
    }
    
    /* Attachments Section */
    .attachments-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .attachments-label {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
        font-weight: 500;
        font-size: 12px;
    }
    
    .attachment-count {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        font-weight: normal;
    }
    
    .attachments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        gap: var(--spacing-sm);
    }
    
    .add-file-card {
        border: 2px dashed var(--vscode-input-border);
        border-radius: var(--radius-sm);
        padding: var(--spacing-sm);
        text-align: center;
        background: var(--vscode-input-background);
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-xs);
        aspect-ratio: 1;
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .add-file-card:hover {
        border-color: var(--vscode-focusBorder);
        background: var(--vscode-textCodeBlock-background);
    }
    
    .add-file-icon {
        font-size: 24px;
        color: var(--vscode-descriptionForeground);
    }
    
    .add-file-text {
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        font-weight: 500;
    }
    
    .attachment-item {
        position: relative;
        border: 1px solid var(--vscode-panel-border);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: var(--vscode-textCodeBlock-background);
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .attachment-item:hover {
        box-shadow: var(--shadow-md);
    }
    
    .attachment-preview {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        display: block;
        cursor: pointer;
    }
    
    .attachment-remove {
        position: absolute;
        top: var(--spacing-xs);
        right: var(--spacing-xs);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: var(--radius-full);
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity var(--animation-duration) var(--animation-easing);
    }
    
    .attachment-item:hover .attachment-remove {
        opacity: 1;
    }
    
    .attachment-remove:hover {
        background: var(--vscode-editorError-foreground);
    }
    
    /* File item (non-image) */
    .file-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        aspect-ratio: 1;
        padding: var(--spacing-sm);
    }
    
    .file-icon {
        font-size: 28px;
        margin-bottom: var(--spacing-xs);
    }
    
    .file-name {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        text-align: center;
        word-break: break-all;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        max-height: 2.4em;
    }

    /* Preview Modal */
    .preview-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .preview-modal.visible {
        opacity: 1;
        visibility: visible;
    }
    
    .preview-modal img {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: var(--radius-md);
    }
    
    .preview-modal-close {
        position: absolute;
        top: var(--spacing-xl);
        right: var(--spacing-xl);
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: none;
        border-radius: var(--radius-full);
        width: 40px;
        height: 40px;
        font-size: 20px;
        cursor: pointer;
    }
    
    .preview-modal-close:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    
    /* Hidden Input */
    .hidden-input {
        display: none;
    }
    
    /* Options (for SelectFromList) */
    .options-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .options-list {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }
    
    .option-item {
        display: flex;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--vscode-list-inactiveSelectionBackground);
        border: 2px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
        gap: var(--spacing-md);
    }
    
    .option-item:hover {
        background: var(--vscode-list-hoverBackground);
        border-color: var(--vscode-list-hoverBackground);
    }
    
    .option-item.selected {
        background: var(--vscode-list-activeSelectionBackground);
        border-color: var(--vscode-focusBorder);
    }
    
    .option-checkbox {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        cursor: pointer;
        accent-color: var(--vscode-focusBorder);
    }
    
    .option-index {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: var(--radius-full);
        font-size: 12px;
        font-weight: 600;
        flex-shrink: 0;
    }
    
    .option-text {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    }
    
    /* Code Section (for ReviewCode) */
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
        min-height: 200px;
        padding: var(--spacing-lg);
        border: 1px solid var(--vscode-panel-border);
        border-radius: 0 0 var(--radius-md) var(--radius-md);
        background: var(--vscode-textCodeBlock-background);
        color: var(--vscode-editor-foreground);
        font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', monospace);
        font-size: 13px;
        line-height: 1.5;
        resize: vertical;
        tab-size: 4;
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
    
    /* Template Chips Section */
    .templates-section {
        margin-bottom: var(--spacing-lg);
    }
    
    .templates-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--spacing-sm);
    }
    
    .templates-label {
        font-weight: 500;
        font-size: 13px;
        color: var(--vscode-foreground);
    }
    
    .templates-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-sm);
    }
    
    .template-chip {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 6px 12px;
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: 16px;
        font-size: 12px;
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
        user-select: none;
    }
    
    .template-chip:hover {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    
    .template-chip.active {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-color: var(--vscode-focusBorder);
    }
    
    .template-chip-check {
        font-size: 14px;
        font-weight: bold;
    }
    
    .template-chip-title {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    
    .templates-actions {
        display: flex;
        gap: var(--spacing-sm);
    }
    
    .edit-templates-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: 4px 10px;
        background: transparent;
        color: var(--vscode-textLink-foreground);
        border: 1px solid var(--vscode-textLink-foreground);
        border-radius: var(--radius-md);
        font-size: 11px;
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .edit-templates-btn:hover {
        background: var(--vscode-textLink-foreground);
        color: var(--vscode-editor-background);
    }
    
    /* Responsive */
    @media (max-width: 600px) {
        .dialog-container {
            padding: var(--spacing-md);
        }
        
        .button-container {
            flex-direction: column;
        }
        
        .button-group {
            justify-content: center;
        }
        
        .attachments-grid {
            grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        }
    }
`;

// Common JavaScript utilities for all templates
export const getBaseScript = () => `
    const vscode = acquireVsCodeApi();
    
    // State management
    let state = vscode.getState() || {};
    
    // Attachments storage
    let attachments = [];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
    
    // =============================================
    // ATTACHMENTS HANDLING
    // =============================================
    
    function updateAttachmentCount() {
        const countEl = document.getElementById('attachmentCount');
        if (countEl) {
            countEl.textContent = '(' + attachments.length + ')';
        }
    }
    
    function processFile(file) {
        if (!SUPPORTED_TYPES.includes(file.type)) {
            showToast('Unsupported file type: ' + file.type, 'error');
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            showToast('File too large (max 5MB)', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64 = e.target.result.split(',')[1];
            const attachment = {
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                data: base64,
                mimeType: file.type,
                name: file.name || 'pasted-image-' + Date.now() + '.png',
                preview: e.target.result
            };
            
            attachments.push(attachment);
            renderAttachments();
            updateAttachmentCount();
            showToast('Added: ' + attachment.name, 'success');
        };
        reader.readAsDataURL(file);
    }
    
    function renderAttachments() {
        const grid = document.getElementById('attachmentsGrid');
        if (!grid) return;
        
        const addFileCard = \`
            <div class="add-file-card" onclick="document.getElementById('fileInput').click()">
                <span class="add-file-icon">+</span>
                <span class="add-file-text">Add</span>
            </div>
        \`;
        
        const attachmentCards = attachments.map(att => {
            if (att.isFilePath) {
                // File path attachment (non-image)
                return \`
                    <div class="attachment-item file-item" data-id="\${att.id}" title="\${att.filePath || att.name}">
                        <div class="file-icon">📄</div>
                        <div class="file-name">\${att.name}</div>
                        <button class="attachment-remove" onclick="removeAttachment('\${att.id}')" title="Remove">✕</button>
                    </div>
                \`;
            } else {
                // Image attachment with preview
                return \`
                    <div class="attachment-item" data-id="\${att.id}">
                        <img 
                            src="\${att.preview}" 
                            alt="\${att.name}" 
                            class="attachment-preview"
                            onclick="openPreview('\${att.preview}')"
                        >
                        <button class="attachment-remove" onclick="removeAttachment('\${att.id}')" title="Remove">✕</button>
                    </div>
                \`;
            }
        }).join('');
        
        grid.innerHTML = addFileCard + attachmentCards;
    }
    
    function removeAttachment(id) {
        attachments = attachments.filter(a => a.id !== id);
        renderAttachments();
        updateAttachmentCount();
    }
    
    // Add file attachment by path (for non-images)
    function addFileAttachment(filePath, fileName) {
        const attachment = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            data: null,  // No data for file paths
            mimeType: 'application/octet-stream',
            name: fileName || filePath.split('/').pop() || filePath.split('\\\\').pop(),
            preview: null,
            filePath: filePath,
            isFilePath: true
        };
        
        attachments.push(attachment);
        renderAttachments();
        updateAttachmentCount();
        showToast('Attached: ' + attachment.name, 'success');
    }
    
    // Add image attachment with preview
    function addImageAttachment(data, mimeType, name, filePath) {
        const attachment = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            data: data.includes(',') ? data.split(',')[1] : data,
            mimeType: mimeType,
            name: name,
            preview: data.startsWith('data:') ? data : 'data:' + mimeType + ';base64,' + data,
            filePath: filePath,
            isFilePath: false
        };
        
        attachments.push(attachment);
        renderAttachments();
        updateAttachmentCount();
        showToast('Added: ' + attachment.name, 'success');
    }

    function openPreview(src) {
        const modal = document.getElementById('previewModal');
        const img = document.getElementById('previewImage');
        if (modal && img) {
            img.src = src;
            modal.classList.add('visible');
        }
    }
    
    function closePreviewModal() {
        const modal = document.getElementById('previewModal');
        const img = document.getElementById('previewImage');
        if (modal) {
            modal.classList.remove('visible');
        }
        if (img) {
            img.src = '';
        }
    }
    
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = \`
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 16px;
            background: \${type === 'error' ? 'var(--vscode-editorError-foreground)' : 'var(--vscode-notificationsInfoIcon-foreground)'};
            color: white;
            border-radius: 6px;
            font-size: 13px;
            z-index: 1001;
            animation: fadeIn 0.2s ease;
        \`;
        toast.textContent = (type === 'error' ? '❌ ' : '✓ ') + message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    // Global paste handler
    document.addEventListener('paste', (e) => {
        if (!e.clipboardData || !e.clipboardData.items) return;
        
        const items = Array.from(e.clipboardData.items);
        let hasImage = false;
        
        for (const item of items) {
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                hasImage = true;
                const file = item.getAsFile();
                if (file) processFile(file);
            }
        }
        
        if (hasImage) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, true);
    
    // File input handler
    document.addEventListener('DOMContentLoaded', () => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                files.forEach(file => processFile(file));
                fileInput.value = '';
            });
        }
        
        updateAttachmentCount();
    });
    
    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('previewModal');
        if (e.key === 'Escape' && modal && modal.classList.contains('visible')) {
            e.preventDefault();
            e.stopPropagation();
            closePreviewModal();
        }
    });
`;

// Attachments HTML section (reusable)
export const getAttachmentsSection = () => `
    <div class="attachments-section">
        <div class="attachments-label">
            📎 Attachments <span class="attachment-count" id="attachmentCount">(0)</span>
        </div>
        
        <input type="file" id="fileInput" class="hidden-input" multiple>
        
        <div class="attachments-grid" id="attachmentsGrid">
            <div class="add-file-card" onclick="document.getElementById('fileInput').click()">
                <span class="add-file-icon">+</span>
                <span class="add-file-text">Add</span>
            </div>
        </div>
    </div>
    
    <div id="previewModal" class="preview-modal" onclick="closePreviewModal()">
        <button class="preview-modal-close" onclick="closePreviewModal()">✕</button>
        <img id="previewImage" src="" alt="Preview">
    </div>
`;

// Keyboard hints section (reusable)
export const getKeyboardHints = () => `
    <div class="keyboard-hints">
        <div class="keyboard-hint">
            <span class="kbd">Ctrl</span> + <span class="kbd">Enter</span>
            <span>Submit</span>
        </div>
        <div class="keyboard-hint">
            <span class="kbd">Esc</span>
            <span>Cancel</span>
        </div>
    </div>
`;

// Templates section (reusable)
export const getTemplatesSection = () => `
    <div class="templates-section" id="templatesSection" style="display: none;">
        <div class="templates-header">
            <span class="templates-label">Templates:</span>
        </div>
        <div class="templates-chips" id="templatesChips">
            <!-- Template chips will be rendered here -->
        </div>
        <div class="templates-actions">
            <button class="edit-templates-btn" onclick="openTemplateSettings()">
                ⚙️ Edit Templates
            </button>
        </div>
    </div>
`;
