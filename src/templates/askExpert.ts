// Ask Expert Template - HTML template for the expert input dialog
export const getAskExpertTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expert Input</title>
    <style>
        :root {
            --animation-duration: 0.3s;
            --focus-glow: 0 0 0 2px var(--vscode-focusBorder);
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Variable', system-ui, Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
            animation: fadeIn var(--animation-duration) ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .header-icon {
            font-size: 20px;
        }
        
        .header-content h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .header-content .subtitle {
            display: none;
        }
        
        .context-badge {
            display: inline-block;
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 10px;
        }
        
        .question-section {
            background: linear-gradient(135deg, 
                var(--vscode-textBlockQuote-background) 0%, 
                var(--vscode-editor-background) 100%);
            border-left: 3px solid var(--vscode-textLink-foreground);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
        }
        
        .question-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, 
                var(--vscode-textLink-foreground) 0%,
                transparent 100%);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .question-label {
            display: none;
        }
        
        .question-content {
            font-size: 16px;
            line-height: 1.8;
        }
        
        .question-content code {
            background: var(--vscode-textCodeBlock-background);
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 14px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .question-content pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
            position: relative;
        }
        
        .question-content pre code {
            background: none;
            padding: 0;
            border: none;
        }
        
        .context-section {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .context-label {
            display: none;
        }
        
        .context-content {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
        }
        
        .previous-answer-section {
            background: var(--vscode-inputValidation-warningBackground);
            border: 1px solid var(--vscode-inputValidation-warningBorder);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .answer-section {
            margin-bottom: 15px;
        }
        
        .answer-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
            gap: 10px;
        }
        
        .char-counter {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-weight: normal;
            white-space: nowrap;
        }
        
        .answer-input {
            width: 100%;
            min-height: 150px;
            padding: 16px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 8px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
            resize: vertical;
            transition: all var(--animation-duration) ease;
        }
        
        .answer-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: var(--focus-glow);
            transform: translateY(-1px);
        }
        
        .answer-input::placeholder {
            color: var(--vscode-input-placeholderForeground);
            font-style: italic;
        }
        
        .quick-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            flex: 1;
        }
        
        .quick-action {
            padding: 6px 12px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .quick-action:hover {
            background: var(--vscode-button-secondaryHoverBackground);
            transform: translateY(-1px);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .button-group {
            display: flex;
            gap: 12px;
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
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
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
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
        
        .keyboard-shortcuts {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            padding: 10px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 6px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        
        .keyboard-shortcut {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .key {
            padding: 2px 6px;
            background: var(--vscode-button-secondaryBackground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 4px;
            font-family: monospace;
            font-size: 11px;
        }
        
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
            animation: fadeIn 0.3s ease;
        }
        
        .status-indicator.saving {
            background: var(--vscode-notificationsInfoIcon-foreground);
            color: white;
        }
        
        /* Attachments Section Styles */
        .attachments-section {
            margin-bottom: 15px;
        }
        
        .attachments-label {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-input-foreground);
            font-size: 12px;
        }
        
        .attachment-count {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            font-weight: normal;
        }
        
        .drop-zone {
            transition: all 0.2s ease;
        }
        
        .drop-zone-card {
            border: 2px dashed var(--vscode-input-border);
            border-radius: 4px;
            padding: 8px;
            text-align: center;
            background: var(--vscode-input-background);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            aspect-ratio: 1;
        }
        
        .drop-zone-card:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-textCodeBlock-background);
        }
        
        .drop-zone.drag-over,
        .drop-zone-card.drag-over {
            border-color: var(--vscode-textLink-foreground);
            background: var(--vscode-textBlockQuote-background);
            transform: scale(1.05);
        }
        
        .drop-zone-icon {
            font-size: 24px;
            margin: 0;
            color: var(--vscode-descriptionForeground);
        }
        
        .drop-zone-text {
            color: var(--vscode-descriptionForeground);
            font-size: 11px;
            margin: 0;
            font-weight: 500;
        }
        
        .drop-zone-hint {
            display: none;
        }
        
        .attachments-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 8px;
            margin-top: 10px;
        }
        
        .attachment-item {
            position: relative;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            overflow: hidden;
            background: var(--vscode-textCodeBlock-background);
            transition: all 0.2s ease;
        }
        
        .attachment-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .attachment-preview {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            display: block;
            cursor: pointer;
            border-radius: 4px;
        }
        
        .attachment-info {
            display: none;
        }
        
        .attachment-name {
            display: none;
        }
        
        .attachment-remove {
            position: absolute;
            top: 4px;
            right: 4px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            opacity: 0;
            pointer-events: none;
        }
        
        .attachment-item:hover .attachment-remove {
            opacity: 1;
            pointer-events: auto;
        }
        
        .attachment-remove:hover {
            background: var(--vscode-editorError-foreground);
            transform: scale(1.1);
        }
        
        .hidden-input {
            display: none;
        }
        
        .attachment-preview-modal {
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
        
        .attachment-preview-modal.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .preview-modal-content {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
            border-radius: 8px;
        }
        
        .preview-modal-close {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            font-size: 20px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .preview-modal-close:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 600px) {
            .header {
                flex-direction: column;
                text-align: center;
            }
            
            .button-container {
                flex-direction: column;
            }
            
            .button-group {
                justify-content: center;
            }
            
            .attachments-grid {
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🧠</div>
            <div class="header-content">
                <h1>GitHub Copilot Expert Input</h1>
                <div class="subtitle">Your expertise is needed to guide the AI assistant</div>
            </div>
        </div>
        
        <div class="question-section">
            <div class="question-label">COPILOT QUESTION</div>
            <div class="question-content" id="questionContent">
                <!-- Question will be loaded here -->
            </div>
        </div>
        
        <div id="contextSection" class="context-section" style="display: none;">
            <div class="context-label">ADDITIONAL CONTEXT</div>
            <div class="context-content" id="contextContent"></div>
        </div>
        
        <div id="previousAnswerSection" class="previous-answer-section" style="display: none;">
            <div class="context-label">⚠️ PREVIOUS ANSWER</div>
            <div class="context-content" id="previousAnswerContent"></div>
        </div>
        
        <div class="answer-section">
            <div class="answer-header">
                <div class="quick-actions">
                    <button class="quick-action" onclick="insertTemplate('needs-clarification')">Needs Clarification</button>
                    <button class="quick-action" onclick="insertTemplate('approve')">Approve</button>
                    <button class="quick-action" onclick="insertTemplate('reject')">Reject with Reason</button>
                    <button class="quick-action" onclick="insertTemplate('alternative')">Suggest Alternative</button>
                </div>
                <span class="char-counter" id="charCounter">0 characters</span>
            </div>
            
            <textarea 
                id="answerInput" 
                class="answer-input" 
                placeholder="Your response... (Paste images with Ctrl+V)"
                autofocus
            ></textarea>
        </div>
        
        <div class="attachments-section">
            <div class="attachments-label">
                📎 Attachments <span class="attachment-count" id="attachmentCount">(0)</span>
            </div>
            
            <input type="file" id="fileInput" class="hidden-input" multiple accept="image/*">
            
            <div class="attachments-grid" id="attachmentsGrid">
                <div class="drop-zone drop-zone-card" id="dropZone" onclick="document.getElementById('fileInput').click()">
                    <span class="drop-zone-icon">+</span>
                    <span class="drop-zone-text">Add</span>
                </div>
            </div>
        </div>
        
        <div id="previewModal" class="attachment-preview-modal" onclick="closePreviewModal()">
            <button class="preview-modal-close" onclick="closePreviewModal()">✕</button>
            <img id="previewImage" class="preview-modal-content" src="" alt="Preview">
        </div>
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">
                    Cancel
                </button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-secondary" onclick="skipQuestion()">
                    Skip
                </button>
                <button class="btn btn-secondary" onclick="needMoreInfo()">
                    Need More Info
                </button>
                <button class="btn btn-primary" onclick="submit()" id="submitBtn">
                    Submit Response
                </button>
            </div>
        </div>
        
        <div class="keyboard-shortcuts">
            <div class="keyboard-shortcut">
                <span class="key">Ctrl</span> + <span class="key">Enter</span>
                <span>Submit</span>
            </div>
            <div class="keyboard-shortcut">
                <span class="key">Esc</span>
                <span>Cancel</span>
            </div>
            <div class="keyboard-shortcut">
                <span class="key">Ctrl</span> + <span class="key">S</span>
                <span>Save Draft</span>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const previousAnswerSection = document.getElementById('previousAnswerSection');
        const previousAnswerContent = document.getElementById('previousAnswerContent');
        const charCounter = document.getElementById('charCounter');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const attachmentsGrid = document.getElementById('attachmentsGrid');
        const attachmentCount = document.getElementById('attachmentCount');
        const previewModal = document.getElementById('previewModal');
        const previewImage = document.getElementById('previewImage');
        
        // State management
        let state = vscode.getState() || {};
        
        // Attachments storage
        let attachments = [];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
        
        // Templates for quick actions
        const templates = {
            'needs-clarification': 'I need more information to provide accurate guidance. Specifically:\\n\\n1. ',
            'approve': 'This approach looks good. You can proceed with the implementation.',
            'reject': 'I would not recommend this approach because:\\n\\n1. ',
            'alternative': 'Instead of the current approach, I suggest:\\n\\n'
        };
        
        // Listen for messages
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                questionContent.innerHTML = marked.parse(message.question || '');
                
                if (message.context) {
                    contextContent.innerHTML = marked.parse(message.context);
                    contextSection.style.display = 'block';
                }
                
                if (message.previousAnswer) {
                    previousAnswerContent.textContent = message.previousAnswer;
                    previousAnswerSection.style.display = 'block';
                }
                
                // Restore saved draft if exists
                if (state.draft) {
                    answerInput.value = state.draft;
                    updateCharCounter();
                }
            }
        });
        
        // Send ready message
        vscode.postMessage({ command: 'ready' });
        
        // Character counter
        function updateCharCounter() {
            charCounter.textContent = answerInput.value.length + ' characters';
        }
        
        answerInput.addEventListener('input', () => {
            updateCharCounter();
            updateButtonStates();
            saveDraft();
        });
        
        // Button state management
        function updateButtonStates() {
            const hasText = answerInput.value.trim().length > 0;
            submitBtn.disabled = !hasText;
        }
        
        // Save draft to state
        function saveDraft() {
            state.draft = answerInput.value;
            vscode.setState(state);
        }
        
        // Template insertion
        function insertTemplate(templateName) {
            const template = templates[templateName];
            if (template) {
                answerInput.value = template;
                answerInput.focus();
                // Place cursor at the end
                answerInput.setSelectionRange(answerInput.value.length, answerInput.value.length);
                updateCharCounter();
                updateButtonStates();
                saveDraft();
            }
        }
        
        // Action handlers
        function submit() {
            const text = answerInput.value.trim();
            if (text || attachments.length > 0) {
                state.draft = ''; // Clear draft on submit
                vscode.setState(state);
                vscode.postMessage({
                    command: 'submit',
                    text: text || '[Attachments only]',
                    attachments: attachments.map(a => ({
                        data: a.data,
                        mimeType: a.mimeType,
                        name: a.name
                    }))
                });
            }
        }
        
        function cancel() {
            if ((answerInput.value.trim() || attachments.length > 0) && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                return;
            }
            vscode.postMessage({ command: 'cancel' });
        }
        
        function skipQuestion() {
            vscode.postMessage({
                command: 'submit',
                text: '[SKIPPED] Expert chose to skip this question',
                attachments: []
            });
        }
        
        function needMoreInfo() {
            vscode.postMessage({
                command: 'submit',
                text: '[NEEDS MORE INFO] Please provide additional context or clarification',
                attachments: []
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveDraft();
                // Show saved indicator
                const indicator = document.createElement('span');
                indicator.className = 'status-indicator saving';
                indicator.textContent = '✓ Draft saved';
                document.querySelector('.answer-label').appendChild(indicator);
                setTimeout(() => indicator.remove(), 2000);
            }
        });
        
        // Auto-resize textarea
        answerInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400) + 'px';
        });
        
        // Initial setup
        answerInput.focus();
        updateButtonStates();
        updateCharCounter();
        
        // =============================================
        // ATTACHMENTS HANDLING
        // =============================================
        
        // Update attachment count display
        function updateAttachmentCount() {
            attachmentCount.textContent = attachments.length + ' file' + (attachments.length !== 1 ? 's' : '');
            updateButtonStates();
        }
        
        // Process file and add to attachments
        function processFile(file) {
            if (!SUPPORTED_TYPES.includes(file.type)) {
                showNotification('Unsupported file type: ' + file.type, 'error');
                return;
            }
            
            if (file.size > MAX_FILE_SIZE) {
                showNotification('File too large: ' + file.name + ' (max 5MB)', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64 = e.target.result.split(',')[1]; // Remove data:...;base64, prefix
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
                showNotification('Added: ' + attachment.name, 'success');
            };
            reader.readAsDataURL(file);
        }
        
        // Render attachments grid
        function renderAttachments() {
            const dropZoneCard = \`
                <div class="drop-zone drop-zone-card" id="dropZone" onclick="document.getElementById('fileInput').click()">
                    <span class="drop-zone-icon">+</span>
                    <span class="drop-zone-text">Add</span>
                </div>
            \`;
            
            const attachmentCards = attachments.map(att => \`
                <div class="attachment-item" data-id="\${att.id}">
                    <img 
                        src="\${att.preview}" 
                        alt="\${att.name}" 
                        class="attachment-preview"
                        onclick="openPreview('\${att.preview}')"
                    >
                    <button class="attachment-remove" onclick="removeAttachment('\${att.id}')" title="Remove">✕</button>
                </div>
            \`).join('');
            
            attachmentsGrid.innerHTML = dropZoneCard + attachmentCards;
            
            // Re-attach event listeners to the new drop zone
            const newDropZone = document.getElementById('dropZone');
            if (newDropZone) {
                newDropZone.addEventListener('dragover', handleDragOver);
                newDropZone.addEventListener('dragleave', handleDragLeave);
                newDropZone.addEventListener('drop', handleDrop);
            }
        }
        
        // Remove attachment
        function removeAttachment(id) {
            attachments = attachments.filter(a => a.id !== id);
            renderAttachments();
            updateAttachmentCount();
        }
        
        // Open preview modal
        function openPreview(src) {
            previewImage.src = src;
            previewModal.classList.add('visible');
        }
        
        // Close preview modal
        function closePreviewModal() {
            previewModal.classList.remove('visible');
            previewImage.src = '';
        }
        
        // Show notification
        function showNotification(message, type) {
            const indicator = document.createElement('div');
            indicator.className = 'status-indicator ' + (type === 'error' ? '' : 'saving');
            indicator.textContent = (type === 'error' ? '❌ ' : '✓ ') + message;
            indicator.style.position = 'fixed';
            indicator.style.bottom = '20px';
            indicator.style.right = '20px';
            indicator.style.zIndex = '1000';
            document.body.appendChild(indicator);
            setTimeout(() => indicator.remove(), 3000);
        }
        
        // Drag and drop handlers as functions for re-use
        function handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('drag-over');
        }
        
        function handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('drag-over');
        }
        
        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    processFile(file);
                }
            });
        }
        
        // Initial drop zone listeners
        const initialDropZone = document.getElementById('dropZone');
        if (initialDropZone) {
            initialDropZone.addEventListener('dragover', handleDragOver);
            initialDropZone.addEventListener('dragleave', handleDragLeave);
            initialDropZone.addEventListener('drop', handleDrop);
        }
        
        // File input handler
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => processFile(file));
            fileInput.value = ''; // Reset for same file selection
        });
        
        // Paste handler for images - works globally including when typing in textarea
        document.addEventListener('paste', (e) => {
            // Check if clipboardData exists
            if (!e.clipboardData || !e.clipboardData.items) {
                return;
            }
            
            const items = Array.from(e.clipboardData.items);
            let hasImage = false;
            
            for (const item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    hasImage = true;
                    const file = item.getAsFile();
                    if (file) {
                        processFile(file);
                    }
                }
            }
            
            // Only prevent default if we handled an image
            // This allows text paste to work normally
            if (hasImage) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true); // Use capture phase to intercept before textarea
        
        // Also handle paste specifically on the drop zone
        dropZone.addEventListener('paste', (e) => {
            if (!e.clipboardData || !e.clipboardData.items) {
                return;
            }
            
            const items = Array.from(e.clipboardData.items);
            for (const item of items) {
                if (item.kind === 'file' && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        processFile(file);
                    }
                    e.preventDefault();
                }
            }
        });
        
        // Make drop zone focusable for paste events
        dropZone.setAttribute('tabindex', '0');
        
        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && previewModal.classList.contains('visible')) {
                e.preventDefault();
                e.stopPropagation();
                closePreviewModal();
                return;
            }
        });
        
        // Initial attachment count
        updateAttachmentCount();
    </script>
</body>
</html>`;

