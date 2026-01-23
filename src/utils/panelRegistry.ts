// Panel Registry - Manages active tool panels for live updates
import * as vscode from 'vscode';
import { TemplateManager } from './templateManager';

type ToolType = 'askExpert' | 'selectFromList' | 'reviewCode' | 'questionnaire';

interface RegisteredPanel {
    panel: vscode.WebviewPanel;
    toolType: ToolType;
    createdAt: number;
}

class PanelRegistryService {
    private panels: Map<string, RegisteredPanel> = new Map();
    private configListener: vscode.Disposable | undefined;
    private idCounter = 0;
    private onPanelCountChangedEmitter = new vscode.EventEmitter<number>();
    
    /**
     * Event fired when the number of active panels changes
     */
    readonly onPanelCountChanged = this.onPanelCountChangedEmitter.event;

    /**
     * Initialize the registry with configuration change listener
     */
    initialize(context: vscode.ExtensionContext): void {
        this.configListener = vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('askMeCopilot.templates')) {
                this.notifyAllPanels();
            }
        });
        context.subscriptions.push(this.configListener);
        context.subscriptions.push(this.onPanelCountChangedEmitter);
    }

    /**
     * Register a panel for live updates
     */
    register(panel: vscode.WebviewPanel, toolType: ToolType): string {
        const id = `panel-${++this.idCounter}`;
        this.panels.set(id, { panel, toolType, createdAt: Date.now() });
        
        // Update context for showing/hiding the button
        this.updateHasActivePanelContext();

        panel.onDidDispose(() => {
            this.panels.delete(id);
            this.updateHasActivePanelContext();
        });

        return id;
    }
    
    /**
     * Get the count of active panels
     */
    getActivePanelCount(): number {
        return this.panels.size;
    }
    
    /**
     * Check if there are any active panels
     */
    hasActivePanels(): boolean {
        return this.panels.size > 0;
    }
    
    /**
     * Focus the most recent active panel
     * Returns true if a panel was focused
     */
    focusMostRecentPanel(): boolean {
        if (this.panels.size === 0) {
            return false;
        }
        
        // Find the most recently created panel
        let mostRecent: RegisteredPanel | null = null;
        let mostRecentTime = 0;
        
        this.panels.forEach((registered) => {
            if (registered.createdAt > mostRecentTime) {
                mostRecentTime = registered.createdAt;
                mostRecent = registered;
            }
        });
        
        if (mostRecent) {
            try {
                (mostRecent as RegisteredPanel).panel.reveal(vscode.ViewColumn.Active);
                return true;
            } catch (error) {
                // Panel might be disposed
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Update the context key for showing/hiding editor title button
     */
    private updateHasActivePanelContext(): void {
        vscode.commands.executeCommand('setContext', 'askMeCopilot.hasActivePanel', this.panels.size > 0);
        this.onPanelCountChangedEmitter.fire(this.panels.size);
    }

    /**
     * Notify all registered panels about template changes
     */
    private notifyAllPanels(): void {
        this.panels.forEach(({ panel, toolType }) => {
            try {
                const templates = TemplateManager.getTemplatesForTool(toolType);
                const templatesForDisplay = TemplateManager.prepareTemplatesForDisplay(templates);
                const defaultIndices = TemplateManager.getDefaultEnabledIndices(toolType);

                panel.webview.postMessage({
                    command: 'updateTemplates',
                    templates: templatesForDisplay,
                    defaultTemplateIndices: defaultIndices
                });
            } catch (error) {
                // Panel might be disposed, ignore errors
            }
        });
    }
}

export const panelRegistry = new PanelRegistryService();
