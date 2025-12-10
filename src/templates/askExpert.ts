// Ask Expert Template - Uses base template components
import { getBaseStyles, getBaseScript, getAttachmentsSection, getKeyboardHints } from './base';

export const getAskExpertTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Expert Input</title>
    <style>
        ${getBaseStyles()}
    </style>
</head>
<body>
    <div class="dialog-container">
        <div class="dialog-header">
            <div class="dialog-header-icon">🧠</div>
            <h1 class="dialog-header-title">GitHub Copilot Expert Input</h1>
        </div>
        
        <div class="question-section">
            <div class="question-content" id="questionContent">
                <!-- Question will be loaded here -->
            </div>
        </div>
        
        <div id="contextSection" class="context-section" style="display: none;">
            <div id="contextContent"></div>
        </div>
        
        <div id="previousAnswerSection" class="context-section" style="display: none; border-left-color: var(--vscode-editorWarning-foreground);">
            <strong>⚠️ Previous Answer:</strong>
            <div id="previousAnswerContent" style="margin-top: 8px;"></div>
        </div>
        
        <div class="answer-section">
            <div class="answer-header">
                <div class="quick-actions">
                    <button class="quick-action" onclick="insertTemplate('needs-clarification')">Needs Clarification</button>
                    <button class="quick-action" onclick="insertTemplate('approve')">Approve</button>
                    <button class="quick-action" onclick="insertTemplate('reject')">Reject</button>
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
        
        ${getAttachmentsSection()}
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">Cancel</button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-secondary" onclick="skipQuestion()">Skip</button>
                <button class="btn btn-secondary" onclick="needMoreInfo()">Need More Info</button>
                <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit</button>
            </div>
        </div>
        
        ${getKeyboardHints()}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        // Debug logging for CSP issues
        console.log('[AskExpert] Script loaded');
        console.log('[AskExpert] marked available:', typeof marked !== 'undefined');
        if (typeof marked !== 'undefined') {
            console.log('[AskExpert] marked.parse:', typeof marked.parse);
        }
        
        ${getBaseScript()}
        
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const previousAnswerSection = document.getElementById('previousAnswerSection');
        const previousAnswerContent = document.getElementById('previousAnswerContent');
        const charCounter = document.getElementById('charCounter');
        
        // Templates for quick actions
        const templates = {
            'needs-clarification': 'I need more information. Specifically:\\n\\n1. ',
            'approve': 'This approach looks good. Proceed with implementation.',
            'reject': 'I would not recommend this because:\\n\\n1. ',
            'alternative': 'Instead, I suggest:\\n\\n'
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
                
                if (state.draft) {
                    answerInput.value = state.draft;
                    updateCharCounter();
                }
            }
        });
        
        vscode.postMessage({ command: 'ready' });
        
        function updateCharCounter() {
            charCounter.textContent = answerInput.value.length + ' characters';
        }
        
        function updateButtonState() {
            const hasText = answerInput.value.trim().length > 0;
            submitBtn.disabled = !hasText && attachments.length === 0;
        }
        
        function saveDraft() {
            state.draft = answerInput.value;
            vscode.setState(state);
        }
        
        answerInput.addEventListener('input', () => {
            updateCharCounter();
            updateButtonState();
            saveDraft();
        });
        
        function insertTemplate(templateName) {
            const template = templates[templateName];
            if (template) {
                answerInput.value = template;
                answerInput.focus();
                answerInput.setSelectionRange(answerInput.value.length, answerInput.value.length);
                updateCharCounter();
                updateButtonState();
                saveDraft();
            }
        }
        
        function submit() {
            const text = answerInput.value.trim();
            if (text || attachments.length > 0) {
                state.draft = '';
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
            if ((answerInput.value.trim() || attachments.length > 0) && !confirm('Discard changes?')) {
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
                text: '[NEEDS MORE INFO] Please provide additional context',
                attachments: []
            });
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
        
        // Auto-resize textarea
        answerInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 400) + 'px';
        });
        
        answerInput.focus();
        updateButtonState();
        updateCharCounter();
    </script>
</body>
</html>`;

