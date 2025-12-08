// Read Image Tool - Read and analyze images from project files
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BaseTool } from './baseTool';
import { IReadImageParameters } from '../types';
import { getLogger } from '../utils';

export class ReadImageTool extends BaseTool<IReadImageParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IReadImageParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { filePath, description } = options.input;
        
        if (token.isCancellationRequested) {
            return this.createCancelResult();
        }
        
        try {
            // Resolve the file path
            let resolvedPath = filePath;
            
            // Handle relative paths - resolve from workspace
            if (!path.isAbsolute(filePath)) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (workspaceFolders && workspaceFolders.length > 0) {
                    resolvedPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
                }
            }
            
            // Check if file exists
            if (!fs.existsSync(resolvedPath)) {
                return this.createErrorResult(`File not found: ${resolvedPath}`);
            }
            
            // Read file
            const fileBuffer = fs.readFileSync(resolvedPath);
            const bytes = new Uint8Array(fileBuffer);
            
            // Determine MIME type from extension
            const ext = path.extname(resolvedPath).toLowerCase();
            const mimeTypes: { [key: string]: string } = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon'
            };
            
            const mimeType = mimeTypes[ext];
            if (!mimeType) {
                return this.createErrorResult(`Unsupported image format: ${ext}. Supported: ${Object.keys(mimeTypes).join(', ')}`);
            }
            
            // Check file size (max 5MB)
            if (bytes.length > 5 * 1024 * 1024) {
                return this.createErrorResult(`File too large: ${(bytes.length / 1024 / 1024).toFixed(2)}MB. Maximum: 5MB`);
            }
            
            getLogger().info(`Reading image: ${resolvedPath} (${mimeType}, ${bytes.length} bytes)`);
            
            // Build result with text description and image
            const resultParts: (vscode.LanguageModelTextPart | vscode.LanguageModelDataPart)[] = [
                new vscode.LanguageModelTextPart(
                    `Image loaded from: ${path.basename(resolvedPath)}${description ? `\nDescription: ${description}` : ''}\nSize: ${(bytes.length / 1024).toFixed(1)}KB, Type: ${mimeType}`
                ),
                vscode.LanguageModelDataPart.image(bytes, mimeType)
            ];
            
            return new vscode.LanguageModelToolResult(resultParts);
            
        } catch (error) {
            return this.createErrorResult(`Failed to read image: ${error}`);
        }
    }
    
    prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IReadImageParameters>,
        _token: vscode.CancellationToken
    ): vscode.PreparedToolInvocation {
        return {
            invocationMessage: `🖼️ Reading image: ${options.input.filePath}`,
            confirmationMessages: {
                title: 'Read Image File',
                message: new vscode.MarkdownString(`**File:** ${options.input.filePath}${options.input.description ? `\n**Purpose:** ${options.input.description}` : ''}`)
            }
        };
    }
}
