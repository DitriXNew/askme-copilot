// Notification utilities for Ask Me Copilot Tool
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { Priority } from '../types';
import { ConfigurationManager } from './config';
import { getLogger } from './logger';

export async function playNotificationSound(context?: vscode.ExtensionContext) {
    const logger = getLogger();
    try {
        if (!context) {
            logger.debug('No extension context provided for sound notification');
            return;
        }

        // Check if sound file exists
        const soundFilePath = path.join(context.extensionPath, 'media', 'notification_soft.wav');
        if (!fs.existsSync(soundFilePath)) {
            logger.debug('Sound file not found:', soundFilePath);
            // Fallback to VS Code notification
            vscode.window.showInformationMessage('🔔 Copilot needs your attention!');
            return;
        }

        // Use cross-platform system commands to play sound
        const platform = os.platform();
        let command: string | null = null;
        
        // Normalize path for different platforms
        const normalizedPath = soundFilePath.replace(/\\/g, '/');
        
        if (platform === 'darwin') {
            // macOS
            command = `afplay "${normalizedPath}" 2>/dev/null &`;
        } else if (platform === 'linux') {
            // Linux - try multiple players
            command = `if command -v aplay &> /dev/null; then
                aplay "${normalizedPath}" 2>/dev/null &
            elif command -v paplay &> /dev/null; then
                paplay "${normalizedPath}" 2>/dev/null &
            fi`;
        } else if (platform === 'win32') {
            // Windows - escape path properly for PowerShell
            const escapedPath = soundFilePath.replace(/'/g, "''");
            command = `powershell -Command "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()" 2>$null`;
        }
        
        if (command) {
            exec(command, { timeout: 5000 }, (error) => {
                if (error) {
                    logger.debug('Failed to play sound via system command:', error.message);
                    // Fallback notification
                    vscode.window.showInformationMessage('🔔 Copilot needs your attention!');
                } else {
                    logger.debug('Sound notification played successfully');
                }
            });
        } else {
            logger.debug('Unsupported platform for sound notification:', platform);
            // Fallback notification
            vscode.window.showInformationMessage('🔔 Copilot needs your attention!');
        }
        
        // Also focus on Problems panel to draw attention
        await vscode.commands.executeCommand('workbench.action.problems.focus');
        
    } catch (error) {
        logger.debug('Failed to play notification sound:', error);
        // Fallback notification
        vscode.window.showInformationMessage('🔔 Copilot needs your attention!');
    }
}

export async function showNotification(
    message: string, 
    priority: Priority = 'normal', 
    context?: vscode.ExtensionContext
): Promise<boolean> {
    const style = ConfigurationManager.notificationStyle;
    
    // Simple audio notification - just log that sound was requested
    if (ConfigurationManager.enableSoundNotification && priority !== 'low') {
        await playNotificationSound(context);
    }
    
    const iconMap: Record<Priority, string> = {
        low: '💭',
        normal: '🤖',
        high: '⚡',
        critical: '🚨'
    };
    
    const icon = iconMap[priority];
    const fullMessage = `${icon} Copilot needs your input: ${message}`;
    
    if (style === 'prominent' || priority === 'critical') {
        const action = await vscode.window.showInformationMessage(
            fullMessage,
            { modal: priority === 'critical' },
            'Answer Now',
            'Later'
        );
        return action === 'Answer Now';
    } else if (style === 'normal') {
        vscode.window.showInformationMessage(fullMessage);
        return true;
    } else {
        vscode.window.setStatusBarMessage(fullMessage, 5000);
        return true;
    }
}
