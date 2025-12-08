// Select From List Template - Uses base template components
import { getBaseStyles, getBaseScript, getAttachmentsSection, getKeyboardHints } from './base';

export const getSelectFromListTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selection Required</title>
    <style>
        ${getBaseStyles()}
        
        /* Additional styles for selection */
        .selected-summary {
            padding: var(--spacing-md);
            background: var(--vscode-textCodeBlock-background);
            border-radius: var(--radius-md);
            margin-top: var(--spacing-md);
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="dialog-container">
        <div class="dialog-header">
            <div class="dialog-header-icon">🎯</div>
            <h1 class="dialog-header-title">GitHub Copilot Selection</h1>
        </div>
        
        <div class="question-section">
            <div class="question-content" id="questionContent">
                <!-- Question will be loaded here -->
            </div>
        </div>
        
        <div id="contextSection" class="context-section" style="display: none;">
            <div id="contextContent"></div>
        </div>
        
        <div class="options-section">
            <div id="optionsContainer" class="options-list"></div>
        </div>
        
        <div id="selectedSummary" class="selected-summary" style="display: none;">
            <strong>Selected:</strong> <span id="selectedText"></span>
        </div>
        
        <div class="answer-section">
            <div class="answer-header">
                <span style="font-weight: 500; font-size: 13px;">Or provide a custom response:</span>
            </div>
            <textarea 
                id="customInput" 
                class="answer-input" 
                placeholder="Type your custom answer... (Paste images with Ctrl+V)"
                style="min-height: 80px;"
            ></textarea>
        </div>
        
        ${getAttachmentsSection()}
        
        <div class="button-container">
            <div class="button-group">
                <button class="btn btn-danger" onclick="cancel()">Cancel</button>
            </div>
            
            <div class="button-group">
                <button class="btn btn-primary" onclick="submit()" id="submitBtn" disabled>Submit</button>
            </div>
        </div>
        
        ${getKeyboardHints()}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        ${getBaseScript()}
        
        const customInput = document.getElementById('customInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const optionsContainer = document.getElementById('optionsContainer');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const selectedSummary = document.getElementById('selectedSummary');
        const selectedText = document.getElementById('selectedText');
        
        let multiSelect = false;
        let selectedOptions = new Set();
        let defaultSelection = null;
        
        // Listen for messages
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                questionContent.innerHTML = marked.parse(message.question || '');
                
                if (message.context) {
                    contextContent.innerHTML = marked.parse(message.context);
                    contextSection.style.display = 'block';
                }
                
                multiSelect = message.multiSelect || false;
                defaultSelection = message.defaultSelection;
                
                renderOptions(message.options || []);
            }
        });
        
        function renderOptions(options) {
            optionsContainer.innerHTML = '';
            
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-item';
                optionDiv.dataset.value = option;
                optionDiv.dataset.index = index;
                
                if (defaultSelection === index) {
                    optionDiv.classList.add('selected');
                    selectedOptions.add(option);
                }
                
                // Checkbox for multi-select
                if (multiSelect) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'option-checkbox';
                    checkbox.checked = defaultSelection === index;
                    optionDiv.appendChild(checkbox);
                }
                
                // Index badge
                const indexSpan = document.createElement('span');
                indexSpan.className = 'option-index';
                indexSpan.textContent = (index + 1).toString();
                optionDiv.appendChild(indexSpan);
                
                // Option text
                const textSpan = document.createElement('span');
                textSpan.className = 'option-text';
                textSpan.textContent = option;
                optionDiv.appendChild(textSpan);
                
                optionDiv.addEventListener('click', () => selectOption(optionDiv, option));
                
                optionsContainer.appendChild(optionDiv);
            });
            
            updateSelectedSummary();
            updateButtonState();
        }
        
        function selectOption(element, value) {
            if (multiSelect) {
                const checkbox = element.querySelector('.option-checkbox');
                checkbox.checked = !checkbox.checked;
                
                if (checkbox.checked) {
                    selectedOptions.add(value);
                    element.classList.add('selected');
                } else {
                    selectedOptions.delete(value);
                    element.classList.remove('selected');
                }
            } else {
                // Single select - clear previous
                document.querySelectorAll('.option-item').forEach(el => {
                    el.classList.remove('selected');
                });
                
                selectedOptions.clear();
                selectedOptions.add(value);
                element.classList.add('selected');
            }
            
            updateSelectedSummary();
            updateButtonState();
        }
        
        function updateSelectedSummary() {
            if (selectedOptions.size > 0) {
                selectedText.textContent = Array.from(selectedOptions).join(', ');
                selectedSummary.style.display = 'block';
            } else {
                selectedSummary.style.display = 'none';
            }
        }
        
        function updateButtonState() {
            const hasSelection = selectedOptions.size > 0 || customInput.value.trim();
            submitBtn.disabled = !hasSelection;
        }
        
        function submit() {
            let result = '';
            
            if (customInput.value.trim()) {
                result = customInput.value.trim();
            } else if (selectedOptions.size > 0) {
                result = multiSelect 
                    ? Array.from(selectedOptions).join(', ')
                    : Array.from(selectedOptions)[0];
            }
            
            if (result || attachments.length > 0) {
                vscode.postMessage({
                    command: 'submit',
                    text: result || '[Attachments only]',
                    attachments: attachments.map(a => ({
                        data: a.data,
                        mimeType: a.mimeType,
                        name: a.name
                    }))
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                submit();
            } else if (e.key === 'Escape' && !document.getElementById('previewModal').classList.contains('visible')) {
                e.preventDefault();
                cancel();
            } else if (e.key >= '1' && e.key <= '9' && document.activeElement !== customInput) {
                const index = parseInt(e.key) - 1;
                const option = document.querySelector('[data-index="' + index + '"]');
                if (option) {
                    option.click();
                }
            }
        });
        
        customInput.addEventListener('input', updateButtonState);
        
        vscode.postMessage({ command: 'ready' });
        updateButtonState();
    </script>
</body>
</html>`;
