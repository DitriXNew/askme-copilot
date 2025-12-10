// Check Task Status Tool - Allows Copilot to check for expert messages and pause state
import * as vscode from 'vscode';
import { BaseTool } from './baseTool';
import { ICheckTaskStatusParameters } from '../types';
import { getLogger, expertMonitorState } from '../utils';

export class CheckTaskStatusTool extends BaseTool<ICheckTaskStatusParameters> {
    
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<ICheckTaskStatusParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const { reason } = options.input || {};
        
        getLogger().info(`[CheckTaskStatus] Checking status, reason: ${reason || 'routine check'}`);
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        try {
            // Wait if paused - this will block until pause is released
            await expertMonitorState.waitIfPaused();
            
            if (token.isCancellationRequested) {
                return this.createCancelResult();
            }
            
            // Collect status
            const shouldAskExpert = expertMonitorState.consumeShouldAskExpert();
            const pendingMessages = expertMonitorState.consumePendingMessages();
            const isPaused = expertMonitorState.isPaused; // Should be false after waitIfPaused
            
            getLogger().info(`[CheckTaskStatus] Status: paused=${isPaused}, askExpert=${shouldAskExpert}, messages=${pendingMessages.length}`);
            
            // Build response
            const responseParts: string[] = [];
            
            if (shouldAskExpert) {
                responseParts.push('🧠 **Expert wants to be consulted!** Please use the askExpert tool to get input before continuing.');
            }
            
            if (pendingMessages.length > 0) {
                responseParts.push(`📨 **${pendingMessages.length} message(s) from expert:**`);
                pendingMessages.forEach((msg, i) => {
                    responseParts.push(`\n${i + 1}. "${msg.text}"`);
                    if (msg.attachments && msg.attachments.length > 0) {
                        responseParts.push(`   (with ${msg.attachments.length} attachment(s))`);
                    }
                });
            }
            
            if (responseParts.length === 0) {
                responseParts.push('✅ No pending actions from expert. Continue with your task.');
            }
            
            // Build result parts
            const resultParts: (vscode.LanguageModelTextPart | vscode.LanguageModelDataPart)[] = [
                new vscode.LanguageModelTextPart(responseParts.join('\n'))
            ];
            
            // Add image attachments if any
            for (const msg of pendingMessages) {
                if (msg.attachments) {
                    for (const attachment of msg.attachments) {
                        try {
                            if (attachment.data && attachment.mimeType.startsWith('image/')) {
                                const binaryData = Buffer.from(attachment.data, 'base64');
                                const bytes = new Uint8Array(binaryData);
                                resultParts.push(
                                    vscode.LanguageModelDataPart.image(bytes, attachment.mimeType)
                                );
                                getLogger().info(`[CheckTaskStatus] Added image attachment: ${attachment.name}`);
                            }
                        } catch (err) {
                            getLogger().warn(`[CheckTaskStatus] Failed to process attachment ${attachment.name}:`, err);
                        }
                    }
                }
            }
            
            return new vscode.LanguageModelToolResult(resultParts);
            
        } catch (error) {
            return this.createErrorResult(`Failed to check task status: ${error}`);
        }
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<ICheckTaskStatusParameters>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.PreparedToolInvocation> {
        const hasPending = expertMonitorState.getPendingMessages().length > 0;
        const shouldAsk = expertMonitorState.shouldAskExpert;
        const isPaused = expertMonitorState.isPaused;
        
        let message = 'Checking task status...';
        if (isPaused) {
            message = '⏸️ Waiting for expert to release pause...';
        } else if (shouldAsk || hasPending) {
            message = '📨 Processing expert feedback...';
        }
        
        return {
            invocationMessage: message
        };
    }
}
