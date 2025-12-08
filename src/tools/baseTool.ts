// Base class for all tools
import * as vscode from 'vscode';
import { getLogger } from '../utils/logger';

export abstract class BaseTool<T> implements vscode.LanguageModelTool<T> {
    protected context: vscode.ExtensionContext;
    protected pendingRequests = new Map<string, vscode.CancellationTokenSource>();
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    protected generateRequestId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }
    
    protected validateInput(input: any, requiredFields: string[]): string | null {
        if (!input || typeof input !== 'object') {
            return 'Invalid input parameters. Expected an object.';
        }
        
        for (const field of requiredFields) {
            if (!(field in input)) {
                return `Missing required field: "${field}"`;
            }
            
            const value = input[field];
            if (value === null || value === undefined) {
                return `Field "${field}" cannot be null or undefined`;
            }
            
            if (typeof value === 'string' && value.trim() === '') {
                return `Field "${field}" cannot be empty`;
            }
            
            if (Array.isArray(value) && value.length === 0) {
                return `Field "${field}" cannot be an empty array`;
            }
        }
        
        return null;
    }
    
    protected createErrorResult(message: string): vscode.LanguageModelToolResult {
        getLogger().error(message);
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart(`❌ Error: ${message}`)
        ]);
    }
    
    protected createCancelResult(): vscode.LanguageModelToolResult {
        return new vscode.LanguageModelToolResult([
            new vscode.LanguageModelTextPart('🚫 Operation cancelled by user')
        ]);
    }
    
    abstract invoke(
        options: vscode.LanguageModelToolInvocationOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.LanguageModelToolResult>;
    
    abstract prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<T>,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.PreparedToolInvocation>;
}
