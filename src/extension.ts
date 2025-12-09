// Ask Me Copilot Tool - Main Extension Entry Point
// Transforms GitHub Copilot into a collaborative partner
import * as vscode from 'vscode';
import { initLogger, getLogger, analytics, responseCache } from './utils';
import { 
    AskExpertTool, 
    SelectFromListTool, 
    ReviewCodeTool, 
    ConfirmActionTool, 
    ReadImageTool,
    CheckTaskStatusTool
} from './tools';
import { ExpertMonitorViewProvider } from './views';

export function activate(context: vscode.ExtensionContext) {
    const logger = initLogger();
    logger.info('🚀 Activating Ask Me Copilot Tool extension');
    
    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('askMeCopilot')) {
                logger.info('Configuration changed, reloading settings');
            }
        })
    );
    
    // Register Expert Monitor View Provider
    const expertMonitorProvider = new ExpertMonitorViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ExpertMonitorViewProvider.viewType,
            expertMonitorProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );
    logger.info('✅ Registered Expert Monitor panel');
    
    // Register all tools
    const askExpertTool = new AskExpertTool(context);
    const selectFromListTool = new SelectFromListTool(context);
    const reviewCodeTool = new ReviewCodeTool(context);
    const confirmActionTool = new ConfirmActionTool(context);
    const readImageTool = new ReadImageTool(context);
    const checkTaskStatusTool = new CheckTaskStatusTool(context);
    
    context.subscriptions.push(
        vscode.lm.registerTool('ask-me-copilot-tool_askExpert', askExpertTool),
        vscode.lm.registerTool('ask-me-copilot-tool_selectFromList', selectFromListTool),
        vscode.lm.registerTool('ask-me-copilot-tool_reviewCode', reviewCodeTool),
        vscode.lm.registerTool('ask-me-copilot-tool_confirmAction', confirmActionTool),
        vscode.lm.registerTool('ask-me-copilot-tool_readImage', readImageTool),
        vscode.lm.registerTool('ask-me-copilot-tool_checkTaskStatus', checkTaskStatusTool)
    );
    
    logger.info('✅ Registered all language model tools');
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('askMeCopilot.showMetrics', () => {
            const metrics = analytics.getMetrics();
            vscode.window.showInformationMessage(
                `📊 Metrics: Questions: ${metrics.questionsAsked}, Selections: ${metrics.selectionsShown}, Avg Response Time: ${metrics.avgResponseTime}ms`
            );
        }),
        
        vscode.commands.registerCommand('askMeCopilot.clearCache', () => {
            responseCache.clear();
            vscode.window.showInformationMessage('🗑️ Response cache cleared');
        }),
        
        vscode.commands.registerCommand('askMeCopilot.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', '@ext:DitriX.ask-me-copilot-tool');
        })
    );
    
    logger.info('✅ Ask Me Copilot Tool activated successfully!');
}

export function deactivate() {
    const logger = getLogger();
    logger.info('🛑 Ask Me Copilot Tool deactivated');
    const metrics = analytics.getMetrics();
    logger.info('📊 Final metrics:', metrics);
}
