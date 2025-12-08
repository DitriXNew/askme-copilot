// Select From List Template - HTML template for option selection dialog
export const getSelectFromListTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selection Required</title>
    <style>
        :root {
            --animation-duration: 0.3s;
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            animation: fadeIn var(--animation-duration) ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        
        .header-icon {
            font-size: 48px;
            animation: rotate 4s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .header-content h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        
        .header-content .subtitle {
            margin-top: 5px;
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr 380px;
            gap: 30px;
        }
        
        .question-panel {
            background: linear-gradient(135deg,
                var(--vscode-textBlockQuote-background) 0%,
                var(--vscode-editor-background) 100%);
            border-radius: 12px;
            padding: 25px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .question-content {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 25px;
        }
        
        .context-section {
            background: var(--vscode-textCodeBlock-background);
            border-left: 3px solid var(--vscode-textLink-foreground);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .options-panel {
            background: var(--vscode-sideBar-background);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            max-height: calc(100vh - 200px);
            overflow-y: auto;
        }
        
        .options-title {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .option-item {
            display: flex;
            align-items: center;
            padding: 14px 16px;
            margin-bottom: 12px;
            background: var(--vscode-list-inactiveSelectionBackground);
            border: 2px solid transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }
        
        .option-item:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-list-hoverBackground);
            transform: translateX(4px);
        }
        
        .option-item.selected {
            background: var(--vscode-list-activeSelectionBackground);
            border-color: var(--vscode-focusBorder);
        }
        
        .option-item.selected::before {
            content: '✓';
            position: absolute;
            left: -25px;
            color: var(--vscode-terminal-ansiGreen);
            font-weight: bold;
        }
        
        .option-checkbox {
            margin-right: 12px;
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        
        .option-text {
            flex: 1;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .option-index {
            display: inline-block;
            width: 24px;
            height: 24px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
        }
        
        .custom-input-section {
            background: var(--vscode-input-background);
            border-radius: 12px;
            padding: 20px;
            margin-top: 25px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .custom-input-label {
            display: block;
            margin-bottom: 12px;
            font-weight: 600;
            color: var(--vscode-input-foreground);
        }
        
        .custom-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
            transition: all 0.2s ease;
        }
        
        .custom-input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
            box-shadow: 0 0 0 2px var(--vscode-focusBorder);
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
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
        
        .selected-summary {
            padding: 12px;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        @media (max-width: 900px) {
            .main-content {
                grid-template-columns: 1fr;
            }
            
            .options-panel {
                max-height: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">🎯</div>
            <div class="header-content">
                <h1>GitHub Copilot Selection</h1>
                <div class="subtitle">Select the best option to proceed</div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="left-section">
                <div class="question-panel">
                    <div class="question-content" id="questionContent"></div>
                    
                    <div id="contextSection" class="context-section" style="display: none;">
                        <div style="font-weight: 600; margin-bottom: 8px;">Context:</div>
                        <div id="contextContent"></div>
                    </div>
                </div>
                
                <div class="custom-input-section">
                    <label class="custom-input-label" for="customInput">
                        Or provide a custom response:
                    </label>
                    <input 
                        type="text" 
                        id="customInput" 
                        class="custom-input" 
                        placeholder="Type your custom answer..."
                    />
                </div>
                
                <div id="selectedSummary" class="selected-summary" style="display: none;">
                    <strong>Selected:</strong> <span id="selectedText"></span>
                </div>
                
                <div class="button-container">
                    <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
                    <button class="btn btn-primary" onclick="submit()" id="submitBtn">Submit</button>
                </div>
            </div>
            
            <div class="options-panel">
                <div class="options-title">
                    <span>Available Options</span>
                    <span id="optionCount" style="font-size: 12px; color: var(--vscode-descriptionForeground);"></span>
                </div>
                <div id="optionsContainer"></div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const customInput = document.getElementById('customInput');
        const submitBtn = document.getElementById('submitBtn');
        const questionContent = document.getElementById('questionContent');
        const optionsContainer = document.getElementById('optionsContainer');
        const contextSection = document.getElementById('contextSection');
        const contextContent = document.getElementById('contextContent');
        const selectedSummary = document.getElementById('selectedSummary');
        const selectedText = document.getElementById('selectedText');
        const optionCount = document.getElementById('optionCount');
        
        let multiSelect = false;
        let selectedOptions = new Set();
        let defaultSelection = null;
        
        // Listen for messages
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setData') {
                // Render question
                questionContent.innerHTML = marked.parse(message.question || '');
                
                // Show context if provided
                if (message.context) {
                    contextContent.innerHTML = marked.parse(message.context);
                    contextSection.style.display = 'block';
                }
                
                // Set multi-select mode
                multiSelect = message.multiSelect || false;
                defaultSelection = message.defaultSelection;
                
                // Render options
                renderOptions(message.options || []);
                
                // Update option count
                optionCount.textContent = '(' + (message.options?.length || 0) + ' options)';
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
                
                if (multiSelect) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'option-checkbox';
                    checkbox.checked = defaultSelection === index;
                    optionDiv.appendChild(checkbox);
                }
                
                const indexSpan = document.createElement('span');
                indexSpan.className = 'option-index';
                indexSpan.textContent = (index + 1).toString();
                optionDiv.appendChild(indexSpan);
                
                const textSpan = document.createElement('span');
                textSpan.className = 'option-text';
                textSpan.textContent = option;
                optionDiv.appendChild(textSpan);
                
                optionDiv.addEventListener('click', () => selectOption(optionDiv, option));
                
                optionsContainer.appendChild(optionDiv);
            });
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
                // Single select - clear previous selection
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
            
            if (result) {
                vscode.postMessage({
                    command: 'submit',
                    text: result
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                submit();
            } else if (e.key === 'Escape') {
                cancel();
            } else if (e.key >= '1' && e.key <= '9' && !customInput.matches(':focus')) {
                const index = parseInt(e.key) - 1;
                const option = document.querySelector('[data-index="' + index + '"]');
                if (option) {
                    option.click();
                }
            }
        });
        
        // Update button state on custom input
        customInput.addEventListener('input', updateButtonState);
        
        // Send ready message
        vscode.postMessage({ command: 'ready' });
        
        // Initial button state
        updateButtonState();
    </script>
</body>
</html>`;

