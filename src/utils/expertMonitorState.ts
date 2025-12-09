// Expert Monitor State - Singleton for managing monitor panel state
import * as vscode from 'vscode';
import { IMonitorMessage, IAttachment } from '../types';
import { getLogger } from './logger';

/**
 * Singleton class to manage Expert Monitor state
 * Shared between the panel UI and the checkTaskStatus tool
 */
class ExpertMonitorStateManager {
    private static _instance: ExpertMonitorStateManager;
    
    private _messages: IMonitorMessage[] = [];
    private _isPaused: boolean = false;
    private _shouldAskExpert: boolean = false;
    
    // Pause mechanism
    private _pauseResolve: (() => void) | null = null;
    private _pausePromise: Promise<void> | null = null;
    
    // Event emitters for UI updates
    private _onStateChanged = new vscode.EventEmitter<void>();
    public readonly onStateChanged = this._onStateChanged.event;
    
    private constructor() {}
    
    public static getInstance(): ExpertMonitorStateManager {
        if (!ExpertMonitorStateManager._instance) {
            ExpertMonitorStateManager._instance = new ExpertMonitorStateManager();
        }
        return ExpertMonitorStateManager._instance;
    }
    
    // ==================== Messages ====================
    
    public addMessage(text: string, attachments?: IAttachment[]): IMonitorMessage {
        const message: IMonitorMessage = {
            id: this.generateId(),
            text,
            timestamp: Date.now(),
            status: 'pending',
            attachments
        };
        this._messages.push(message);
        getLogger().info(`[ExpertMonitor] Message added: ${text.substring(0, 50)}...`);
        this._onStateChanged.fire();
        return message;
    }
    
    public getMessages(): IMonitorMessage[] {
        return [...this._messages];
    }
    
    public getPendingMessages(): IMonitorMessage[] {
        return this._messages.filter(m => m.status === 'pending');
    }
    
    /**
     * Mark messages as delivered and remove them from the list
     */
    public consumePendingMessages(): IMonitorMessage[] {
        const pending = this.getPendingMessages();
        if (pending.length === 0) {
            return [];
        }
        
        // Mark as delivered
        pending.forEach(m => m.status = 'delivered');
        
        // Remove all delivered messages (including the ones just marked)
        this._messages = this._messages.filter(m => m.status === 'pending');
        
        getLogger().info(`[ExpertMonitor] Consumed ${pending.length} messages, remaining: ${this._messages.length}`);
        
        // Fire state change immediately
        this._onStateChanged.fire();
        
        // Also fire after a short delay to ensure UI updates
        setTimeout(() => {
            this._onStateChanged.fire();
        }, 100);
        
        return pending;
    }
    
    public removeMessage(id: string): boolean {
        const index = this._messages.findIndex(m => m.id === id);
        if (index !== -1) {
            this._messages.splice(index, 1);
            getLogger().info(`[ExpertMonitor] Message removed: ${id}`);
            this._onStateChanged.fire();
            return true;
        }
        return false;
    }
    
    public clearMessages(): void {
        this._messages = [];
        getLogger().info('[ExpertMonitor] All messages cleared');
        this._onStateChanged.fire();
    }
    
    // ==================== Pause ====================
    
    public get isPaused(): boolean {
        return this._isPaused;
    }
    
    public setPaused(paused: boolean): void {
        if (this._isPaused === paused) return;
        
        this._isPaused = paused;
        getLogger().info(`[ExpertMonitor] Pause state: ${paused}`);
        
        if (paused) {
            // Create a promise that will block until resume
            this._pausePromise = new Promise<void>((resolve) => {
                this._pauseResolve = resolve;
            });
        } else {
            // Resolve the pause promise to unblock
            if (this._pauseResolve) {
                this._pauseResolve();
                this._pauseResolve = null;
                this._pausePromise = null;
            }
        }
        
        this._onStateChanged.fire();
    }
    
    /**
     * Wait if paused. Returns immediately if not paused.
     * Used by checkTaskStatus tool to block execution.
     */
    public async waitIfPaused(): Promise<void> {
        if (this._isPaused && this._pausePromise) {
            getLogger().info('[ExpertMonitor] Waiting for pause to be released...');
            await this._pausePromise;
            getLogger().info('[ExpertMonitor] Pause released, continuing');
        }
    }
    
    // ==================== Ask Expert Flag ====================
    
    public get shouldAskExpert(): boolean {
        return this._shouldAskExpert;
    }
    
    public setShouldAskExpert(value: boolean): void {
        if (this._shouldAskExpert === value) return;
        
        this._shouldAskExpert = value;
        getLogger().info(`[ExpertMonitor] shouldAskExpert: ${value}`);
        this._onStateChanged.fire();
    }
    
    /**
     * Consume the shouldAskExpert flag (reset to false after reading)
     */
    public consumeShouldAskExpert(): boolean {
        const value = this._shouldAskExpert;
        if (value) {
            this._shouldAskExpert = false;
            this._onStateChanged.fire();
        }
        return value;
    }
    
    // ==================== State Summary ====================
    
    public getStateSummary(): string {
        const parts: string[] = [];
        
        if (this._isPaused) {
            parts.push('⏸️ PAUSED - Expert requested a pause');
        }
        
        if (this._shouldAskExpert) {
            parts.push('🧠 Expert wants to be consulted');
        }
        
        const pendingCount = this.getPendingMessages().length;
        if (pendingCount > 0) {
            parts.push(`📨 ${pendingCount} pending message(s) from expert`);
        }
        
        if (parts.length === 0) {
            return '✅ No pending actions from expert';
        }
        
        return parts.join('\n');
    }
    
    // ==================== Helpers ====================
    
    private generateId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    public dispose(): void {
        this._messages = [];
        this._isPaused = false;
        this._shouldAskExpert = false;
        if (this._pauseResolve) {
            this._pauseResolve();
        }
        this._onStateChanged.dispose();
    }
}

// Export singleton instance
export const expertMonitorState = ExpertMonitorStateManager.getInstance();
