// Code Review Template - HTML template for code review dialog
export const getCodeReviewTemplate = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
    <style>
        /* Base styles similar to other templates */
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
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
        }
        
        .code-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .code-section {
            background: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .code-header {
            padding: 10px 15px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            font-weight: 600;
        }
        
        .code-content {
            padding: 15px;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
        
        pre {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
        }
        
        .review-section {
            background: var(--vscode-input-background);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .review-input {
            width: 100%;
            min-height: 200px;
            padding: 15px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            font-size: 14px;
            resize: vertical;
        }
        
        .focus-areas {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .focus-badge {
            padding: 4px 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 12px;
            font-size: 12px;
        }
        
        .button-container {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-secondary {
            background: transparent;
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-icon">📝</div>
            <div class="header-content">
                <h1>Code Review Request</h1>
                <div class="subtitle">Please review the following code</div>
            </div>
        </div>
        
        <div id="focusAreas" class="focus-areas"></div>
        
        <div class="code-container">
            <div class="code-section">
                <div class="code-header">
                    <span id="language">Code</span>
                </div>
                <div class="code-content">
                    <pre><code id="codeContent"></code></pre>
                </div>
            </div>
        </div>
        
        <div class="review-section">
            <label style="font-weight: 600; display: block; margin-bottom: 10px;">
                Your Review:
            </label>
            <textarea 
                id="reviewInput" 
                class="review-input" 
                placeholder="Provide your code review feedback..."
            ></textarea>
        </div>
        
        <div class="button-container">
            <button class="btn btn-secondary" onclick="cancel()">Cancel</button>
            <button class="btn btn-primary" onclick="submit()">Submit Review</button>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const codeContent = document.getElementById('codeContent');
        const reviewInput = document.getElementById('reviewInput');
        const focusAreasContainer = document.getElementById('focusAreas');
        const languageLabel = document.getElementById('language');
        
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.command === 'setCode') {
                codeContent.textContent = message.code;
                languageLabel.textContent = message.language || 'Code';
                
                // Add focus areas if provided
                if (message.focusAreas && message.focusAreas.length > 0) {
                    message.focusAreas.forEach(area => {
                        const badge = document.createElement('span');
                        badge.className = 'focus-badge';
                        badge.textContent = area;
                        focusAreasContainer.appendChild(badge);
                    });
                }
                
                // Apply syntax highlighting
                Prism.highlightElement(codeContent);
            }
        });
        
        function submit() {
            const review = reviewInput.value.trim();
            if (review) {
                vscode.postMessage({
                    command: 'submit',
                    text: review
                });
            }
        }
        
        function cancel() {
            vscode.postMessage({ command: 'cancel' });
        }
        
        vscode.postMessage({ command: 'ready' });
    </script>
</body>
</html>`;
