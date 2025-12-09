// Expert Monitor View Provider - WebviewViewProvider for the panel
import * as vscode from 'vscode';
import { getExpertMonitorTemplate } from '../templates';
import { expertMonitorState, getLogger } from '../utils';
import { IAttachment } from '../types';

export class ExpertMonitorViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'askMeCopilot.expertMonitor';
    
    private _view?: vscode.WebviewView;
    private _disposables: vscode.Disposable[] = [];
    
    constructor(private readonly _extensionUri: vscode.Uri) {
        // Subscribe to state changes
        this._disposables.push(
            expertMonitorState.onStateChanged(() => {
                this.updateWebview();
            })
        );
    }
    
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        
        webviewView.webview.html = getExpertMonitorTemplate();
        
        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            message => this.handleMessage(message),
            undefined,
            this._disposables
        );
        
        // Handle visibility changes
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this.updateWebview();
            }
        });
        
        getLogger().info('[ExpertMonitorView] View resolved');
    }
    
    private handleMessage(message: any): void {
        getLogger().debug('[ExpertMonitorView] Received message:', message);
        
        switch (message.command) {
            case 'ready':
                this.updateWebview();
                break;
                
            case 'setPaused':
                expertMonitorState.setPaused(message.value);
                break;
                
            case 'setShouldAskExpert':
                expertMonitorState.setShouldAskExpert(message.value);
                break;
                
            case 'sendMessage':
                this.addMessage(message.text, message.attachments);
                break;
                
            case 'removeMessage':
                expertMonitorState.removeMessage(message.id);
                break;
        }
    }
    
    private addMessage(text: string, attachments?: any[]): void {
        const convertedAttachments: IAttachment[] | undefined = attachments?.map(a => ({
            data: a.data,
            mimeType: a.mimeType,
            name: a.name
        }));
        
        expertMonitorState.addMessage(text, convertedAttachments);
        getLogger().info(`[ExpertMonitorView] Message added: ${text.substring(0, 50)}...`);
    }
    
    private updateWebview(): void {
        if (!this._view) {
            return;
        }
        
        const messages = expertMonitorState.getMessages();
        const isPaused = expertMonitorState.isPaused;
        const shouldAskExpert = expertMonitorState.shouldAskExpert;
        
        this._view.webview.postMessage({
            command: 'updateState',
            messages,
            isPaused,
            shouldAskExpert
        });
        
        // Update badge to show pending message count
        const pendingCount = expertMonitorState.getPendingMessages().length;
        if (pendingCount > 0 || isPaused || shouldAskExpert) {
            this._view.badge = {
                tooltip: expertMonitorState.getStateSummary(),
                value: pendingCount || (isPaused ? 1 : (shouldAskExpert ? 1 : 0))
            };
        } else {
            this._view.badge = undefined;
        }
    }
    
    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
