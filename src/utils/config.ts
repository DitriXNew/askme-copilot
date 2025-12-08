// Configuration manager for Ask Me Copilot Tool
import * as vscode from 'vscode';
import { NotificationStyle } from '../types';

export class ConfigurationManager {
    private static readonly SECTION = 'askMeCopilot';
    
    static get notificationStyle(): NotificationStyle {
        return vscode.workspace.getConfiguration(this.SECTION).get('notificationStyle', 'normal');
    }
    
    static get enableSoundNotification(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('enableSoundNotification', true);
    }
    
    static get autoFocusDialog(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('autoFocusDialog', true);
    }
    
    static get responseTimeout(): number {
        return vscode.workspace.getConfiguration(this.SECTION).get('responseTimeout', 0); // 0 = no timeout
    }
    
    static get enableResponseCache(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('enableResponseCache', true);
    }
    
    static get cacheTimeToLive(): number {
        return vscode.workspace.getConfiguration(this.SECTION).get('cacheTimeToLive', 5 * 60 * 1000);
    }
    
    static get disableImageCompression(): boolean {
        return vscode.workspace.getConfiguration(this.SECTION).get('disableImageCompression', false);
    }
}
