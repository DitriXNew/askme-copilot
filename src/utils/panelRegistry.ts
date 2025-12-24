// Panel Registry - Manages active tool panels for live updates
import * as vscode from 'vscode';
import { TemplateManager } from './templateManager';

type ToolType = 'askExpert' | 'selectFromList' | 'reviewCode';

interface RegisteredPanel {
    panel: vscode.WebviewPanel;
    toolType: ToolType;
}

class PanelRegistryService {
    private panels: Map<string, RegisteredPanel> = new Map();
    private configListener: vscode.Disposable | undefined;
    private idCounter = 0;

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
    }

    /**
     * Register a panel for live updates
     */
    register(panel: vscode.WebviewPanel, toolType: ToolType): string {
        const id = `panel-${++this.idCounter}`;
        this.panels.set(id, { panel, toolType });

        panel.onDidDispose(() => {
            this.panels.delete(id);
        });

        return id;
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
