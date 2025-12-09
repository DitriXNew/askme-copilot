// Expert Monitor Panel Template
// Reuses base styles for consistency

import { getBaseStyles } from './base';

export const getExpertMonitorStyles = () => `
    ${getBaseStyles()}
    
    /* Expert Monitor specific styles */
    .monitor-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: var(--spacing-sm);
        gap: var(--spacing-sm);
    }
    
    /* Main layout - messages left, controls right */
    .main-layout {
        display: flex;
        gap: var(--spacing-sm);
        flex: 1;
        min-height: 0;
    }
    
    .left-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        min-width: 0;
    }
    
    .right-column {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        width: auto;
    }
    
    /* Controls Section - vertical on right */
    .controls-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--vscode-textCodeBlock-background);
        border-radius: var(--radius-md);
        border: 1px solid var(--vscode-panel-border);
    }
    
    .toggle-group {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }
    
    .toggle-label {
        font-size: 11px;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        white-space: nowrap;
    }
    
    .toggle-switch {
        position: relative;
        width: 32px;
        height: 16px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
        flex-shrink: 0;
    }
    
    .toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 10px;
        height: 10px;
        background: var(--vscode-descriptionForeground);
        border-radius: 50%;
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .toggle-switch.active {
        background: var(--vscode-button-background);
        border-color: var(--vscode-button-background);
    }
    
    .toggle-switch.active::after {
        left: 18px;
        background: var(--vscode-button-foreground);
    }
    
    .toggle-switch.pause.active {
        background: var(--vscode-editorWarning-foreground);
        border-color: var(--vscode-editorWarning-foreground);
    }
    
    .toggle-switch.ask-expert.active {
        background: var(--vscode-textLink-foreground);
        border-color: var(--vscode-textLink-foreground);
    }
    
    /* Messages Section */
    .messages-section {
        flex: 1;
        min-height: 60px;
        overflow-y: auto;
        background: var(--vscode-editor-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: var(--radius-md);
    }
    
    .messages-list {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }
    
    .message-item {
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--vscode-list-inactiveSelectionBackground);
        cursor: pointer;
        transition: all var(--animation-duration) var(--animation-easing);
        display: flex;
        align-items: flex-start;
        gap: var(--spacing-sm);
    }
    
    .message-item:hover {
        background: var(--vscode-list-hoverBackground);
    }
    
    .message-item.expanded {
        background: var(--vscode-list-activeSelectionBackground);
    }
    
    .message-status {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 5px;
    }
    
    .message-status.pending {
        background: var(--vscode-editorWarning-foreground);
    }
    
    .message-status.delivered {
        background: var(--vscode-testing-iconPassed);
    }
    
    .message-content {
        flex: 1;
        min-width: 0;
    }
    
    .message-text {
        font-size: 12px;
        line-height: 1.4;
        color: var(--vscode-foreground);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .message-item.expanded .message-text {
        -webkit-line-clamp: unset;
        overflow: visible;
    }
    
    .message-meta {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }
    
    .message-attachments {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-xs);
    }
    
    .message-attachment-badge {
        font-size: 10px;
        padding: 2px 6px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: var(--radius-sm);
    }
    
    .message-remove {
        flex-shrink: 0;
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 2px;
        opacity: 0;
        transition: opacity var(--animation-duration) var(--animation-easing);
    }
    
    .message-item:hover .message-remove {
        opacity: 1;
    }
    
    .message-remove:hover {
        color: var(--vscode-editorError-foreground);
    }
    
    .empty-messages {
        padding: var(--spacing-lg);
        text-align: center;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
    }
    
    /* Input Section */
    .input-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
        background: var(--vscode-textCodeBlock-background);
        border: 1px solid var(--vscode-panel-border);
        border-radius: var(--radius-md);
        padding: var(--spacing-sm);
    }
    
    .message-input {
        width: 100%;
        min-height: 50px;
        max-height: 100px;
        padding: var(--spacing-sm);
        border: 1px solid var(--vscode-input-border);
        border-radius: var(--radius-sm);
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        font-family: inherit;
        font-size: 12px;
        line-height: 1.4;
        resize: vertical;
        box-sizing: border-box;
    }
    
    .message-input:focus {
        outline: none;
        border-color: var(--vscode-focusBorder);
    }
    
    .message-input::placeholder {
        color: var(--vscode-input-placeholderForeground);
    }
    
    .attachment-badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
    }
    
    .attachment-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        padding: 2px 6px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
        border-radius: var(--radius-sm);
        max-width: 100%;
    }
    
    .attachment-badge-preview {
        width: 16px;
        height: 16px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
    }
    
    .attachment-badge-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 150px;
    }
    
    .attachment-badge-remove {
        background: none;
        border: none;
        color: var(--vscode-badge-foreground);
        cursor: pointer;
        padding: 0;
        font-size: 12px;
        line-height: 1;
        flex-shrink: 0;
    }
    
    .attachment-badge-remove:hover {
        color: var(--vscode-editorError-foreground);
    }
    
    /* Action Buttons Section */
    .action-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--vscode-textCodeBlock-background);
        border-radius: var(--radius-md);
        border: 1px solid var(--vscode-panel-border);
    }
    
    .btn-action {
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--vscode-button-secondaryBackground);
        color: var(--vscode-button-secondaryForeground);
        border: none;
        border-radius: var(--radius-sm);
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        white-space: nowrap;
        transition: all var(--animation-duration) var(--animation-easing);
    }
    
    .btn-action:hover:not(:disabled) {
        background: var(--vscode-button-secondaryHoverBackground);
    }
    
    .btn-action.btn-primary {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
    }
    
    .btn-action.btn-primary:hover:not(:disabled) {
        background: var(--vscode-button-hoverBackground);
    }
    
    .btn-action:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    /* Hidden file input */
    .hidden-input {
        display: none;
    }
`;

export const getExpertMonitorTemplate = () => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expert Monitor</title>
    <style>${getExpertMonitorStyles()}</style>
</head>
<body>
    <div class="monitor-container">
        <!-- Main Layout: Messages/Input on left, Controls/Buttons on right -->
        <div class="main-layout">
            <div class="left-column">
                <!-- Messages Section -->
                <div class="messages-section">
                    <div id="messagesList" class="messages-list">
                        <div class="empty-messages">No messages yet. Send a message below to queue it for Copilot.</div>
                    </div>
                </div>
                
                <!-- Input Section -->
                <div class="input-section">
                    <textarea 
                        id="messageInput" 
                        class="message-input" 
                        placeholder="Type a message for Copilot... (Ctrl+Enter to send, Ctrl+V to paste image)"
                        rows="2"
                    ></textarea>
                    <div id="attachmentBadges" class="attachment-badges"></div>
                </div>
            </div>
            
            <div class="right-column">
                <!-- Controls Section -->
                <div class="controls-section">
                    <div class="toggle-group" title="Pause Copilot - blocks checkTaskStatus until resumed">
                        <label class="toggle-label" for="pauseToggle">⏸️</label>
                        <div id="pauseToggle" class="toggle-switch pause" role="switch" aria-checked="false" tabindex="0"></div>
                    </div>
                    <div class="toggle-group" title="Request Ask Expert - Copilot will call askExpert tool">
                        <label class="toggle-label" for="askExpertToggle">🧠</label>
                        <div id="askExpertToggle" class="toggle-switch ask-expert" role="switch" aria-checked="false" tabindex="0"></div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="action-buttons">
                    <button id="attachBtn" class="btn-action" title="Attach file (Ctrl+O)">📎 Attach</button>
                    <button id="sendBtn" class="btn-action btn-primary" disabled title="Send message (Ctrl+Enter)">➤ Send</button>
                </div>
            </div>
        </div>
        
        <input type="file" id="fileInput" class="hidden-input" multiple accept="image/*,.txt,.json,.md,.js,.ts,.py,.css,.html">
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // State
        let isPaused = false;
        let shouldAskExpert = false;
        let messages = [];
        let attachments = [];
        
        // Elements
        const pauseToggle = document.getElementById('pauseToggle');
        const askExpertToggle = document.getElementById('askExpertToggle');
        const messagesList = document.getElementById('messagesList');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const attachBtn = document.getElementById('attachBtn');
        const fileInput = document.getElementById('fileInput');
        const attachmentBadges = document.getElementById('attachmentBadges');
        
        // Initialize
        function init() {
            // Toggle handlers
            pauseToggle.addEventListener('click', () => togglePause());
            pauseToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePause();
                }
            });
            
            askExpertToggle.addEventListener('click', () => toggleAskExpert());
            askExpertToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleAskExpert();
                }
            });
            
            // Input handlers
            messageInput.addEventListener('input', updateSendButton);
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Paste handler for images
            messageInput.addEventListener('paste', handlePaste);
            
            sendBtn.addEventListener('click', sendMessage);
            attachBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleFileSelect);
            
            // Request initial state
            vscode.postMessage({ command: 'ready' });
        }
        
        function togglePause() {
            isPaused = !isPaused;
            pauseToggle.classList.toggle('active', isPaused);
            pauseToggle.setAttribute('aria-checked', isPaused);
            vscode.postMessage({ command: 'setPaused', value: isPaused });
        }
        
        function toggleAskExpert() {
            shouldAskExpert = !shouldAskExpert;
            askExpertToggle.classList.toggle('active', shouldAskExpert);
            askExpertToggle.setAttribute('aria-checked', shouldAskExpert);
            vscode.postMessage({ command: 'setShouldAskExpert', value: shouldAskExpert });
        }
        
        function updateSendButton() {
            const hasText = messageInput.value.trim().length > 0;
            sendBtn.disabled = !hasText;
        }
        
        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;
            
            vscode.postMessage({
                command: 'sendMessage',
                text: text,
                attachments: attachments
            });
            
            // Clear input
            messageInput.value = '';
            attachments = [];
            renderAttachmentBadges();
            updateSendButton();
        }
        
        function isAttachmentDuplicate(name, data) {
            return attachments.some(att => att.name === name || att.data === data);
        }
        
        function handlePaste(e) {
            const items = e.clipboardData?.items;
            if (!items) return;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const base64 = reader.result.split(',')[1];
                            
                            // Check for duplicate by data
                            if (isAttachmentDuplicate(null, base64)) {
                                return; // Skip duplicate image
                            }
                            
                            attachments.push({
                                name: 'pasted-image-' + Date.now() + '.png',
                                mimeType: item.type,
                                data: base64,
                                preview: reader.result // Full data URL for preview
                            });
                            renderAttachmentBadges();
                        };
                        reader.readAsDataURL(file);
                    }
                    break;
                }
            }
        }
        
        function handleFileSelect(e) {
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result.split(',')[1];
                    
                    // Check for duplicates
                    if (isAttachmentDuplicate(file.name, base64)) {
                        return; // Skip duplicate
                    }
                    
                    const isImage = file.type.startsWith('image/');
                    attachments.push({
                        name: file.name,
                        mimeType: file.type,
                        data: base64,
                        preview: isImage ? reader.result : null
                    });
                    renderAttachmentBadges();
                };
                reader.readAsDataURL(file);
            });
            
            fileInput.value = '';
        }
        
        function truncateFilename(name, maxLen = 50) {
            if (name.length <= maxLen) return name;
            
            // Always preserve extension
            const dotIndex = name.lastIndexOf('.');
            const hasExt = dotIndex > 0 && dotIndex < name.length - 1;
            const ext = hasExt ? name.substring(dotIndex) : '';
            const baseName = hasExt ? name.substring(0, dotIndex) : name;
            
            // Calculate available space for base name
            const ellipsis = '...';
            const availableLen = maxLen - ext.length - ellipsis.length;
            
            if (availableLen < 6) {
                // Not enough space, just truncate at end but keep extension
                return baseName.substring(0, maxLen - ext.length - 3) + ellipsis + ext;
            }
            
            // Split in the middle
            const startLen = Math.ceil(availableLen / 2);
            const endLen = Math.floor(availableLen / 2);
            return baseName.substring(0, startLen) + ellipsis + baseName.substring(baseName.length - endLen) + ext;
        }
        
        function renderAttachmentBadges() {
            attachmentBadges.innerHTML = attachments.map((att, i) => \`
                <div class="attachment-badge">
                    \${att.preview ? \`<img src="\${att.preview}" class="attachment-badge-preview" alt="">\` : ''}
                    <span class="attachment-badge-name" title="\${escapeHtml(att.name)}">\${escapeHtml(truncateFilename(att.name))}</span>
                    <button class="attachment-badge-remove" onclick="removeAttachment(\${i})">×</button>
                </div>
            \`).join('');
        }
        
        function removeAttachment(index) {
            attachments.splice(index, 1);
            renderAttachmentBadges();
        }
        
        function renderMessages() {
            if (messages.length === 0) {
                messagesList.innerHTML = '<div class="empty-messages">No messages yet. Send a message below to queue it for Copilot.</div>';
                return;
            }
            
            messagesList.innerHTML = messages.map(msg => \`
                <div class="message-item" data-id="\${msg.id}" onclick="toggleMessage('\${msg.id}')">
                    <div class="message-status \${msg.status}"></div>
                    <div class="message-content">
                        <div class="message-text">\${escapeHtml(msg.text)}</div>
                        <div class="message-meta">\${formatTime(msg.timestamp)} • \${msg.status}</div>
                        \${msg.attachments && msg.attachments.length > 0 ? \`
                            <div class="message-attachments">
                                \${msg.attachments.map(a => \`<span class="message-attachment-badge">📎 \${a.name}</span>\`).join('')}
                            </div>
                        \` : ''}
                    </div>
                    <button class="message-remove" onclick="event.stopPropagation(); removeMessage('\${msg.id}')" title="Remove">×</button>
                </div>
            \`).join('');
        }
        
        function toggleMessage(id) {
            const el = document.querySelector(\`.message-item[data-id="\${id}"]\`);
            if (el) {
                el.classList.toggle('expanded');
            }
        }
        
        function removeMessage(id) {
            vscode.postMessage({ command: 'removeMessage', id: id });
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function formatTime(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'updateState':
                    isPaused = message.isPaused;
                    shouldAskExpert = message.shouldAskExpert;
                    messages = message.messages || [];
                    
                    pauseToggle.classList.toggle('active', isPaused);
                    pauseToggle.setAttribute('aria-checked', isPaused);
                    askExpertToggle.classList.toggle('active', shouldAskExpert);
                    askExpertToggle.setAttribute('aria-checked', shouldAskExpert);
                    
                    renderMessages();
                    break;
            }
        });
        
        // Global functions for onclick handlers
        window.removeAttachment = removeAttachment;
        window.toggleMessage = toggleMessage;
        window.removeMessage = removeMessage;
        
        init();
    </script>
</body>
</html>
`;
