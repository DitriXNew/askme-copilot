// Read Image Tool - Read and analyze images from project files
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { BaseTool } from './baseTool';
import { IReadImageParameters } from '../types';
import { getLogger, ConfigurationManager } from '../utils';

// Dynamic import for Jimp (optional dependency)
let Jimp: any = null;

async function loadJimp(): Promise<boolean> {
    if (Jimp !== null) {
        return Jimp !== false;
    }
    try {
        const jimpModule = await import('jimp');
        Jimp = jimpModule.Jimp;
        return true;
    } catch {
        Jimp = false;
        return false;
    }
}

export class ReadImageTool extends BaseTool<IReadImageParameters> {
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IReadImageParameters>,
        token: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {
        const validationError = this.validateInput(options.input, ['filePath']);
        if (validationError) {
            return this.createErrorResult(validationError);
        }
        
        const { filePath, description, quality, maxWidth, maxHeight } = options.input;
        
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
            
            // Check file size (max 10MB for original)
            if (fileBuffer.length > 10 * 1024 * 1024) {
                return this.createErrorResult(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`);
            }
            
            let finalBytes: Uint8Array;
            let finalMimeType = mimeType;
            let compressionInfo = '';
            
            // Check if compression is disabled globally
            const disableCompression = ConfigurationManager.disableImageCompression;
            const needsProcessing = !disableCompression && (
                (quality !== undefined && quality < 100) ||
                maxWidth !== undefined ||
                maxHeight !== undefined
            );
            
            // Try to load Jimp for compression
            const jimpAvailable = needsProcessing ? await loadJimp() : false;
            
            if (needsProcessing && jimpAvailable && !mimeType.includes('svg') && !mimeType.includes('gif')) {
                try {
                    // Process image with Jimp
                    const image = await Jimp.read(fileBuffer);
                    const originalWidth = image.width;
                    const originalHeight = image.height;
                    
                    // Resize if needed
                    let resized = false;
                    if (maxWidth || maxHeight) {
                        // Calculate proportional resize
                        let newWidth = originalWidth;
                        let newHeight = originalHeight;
                        
                        if (maxWidth && originalWidth > maxWidth) {
                            newWidth = maxWidth;
                            newHeight = Math.round(originalHeight * (maxWidth / originalWidth));
                        }
                        
                        if (maxHeight && newHeight > maxHeight) {
                            newHeight = maxHeight;
                            newWidth = Math.round(newWidth * (maxHeight / newHeight));
                        }
                        
                        // Only resize if dimensions changed
                        if (newWidth !== originalWidth || newHeight !== originalHeight) {
                            image.resize({ w: newWidth, h: newHeight });
                            resized = true;
                        }
                    }
                    
                    // Set quality and get buffer
                    const finalQuality = quality !== undefined ? Math.max(1, Math.min(100, quality)) : 80;
                    
                    // Convert to PNG with quality
                    const processedBuffer = await image.getBuffer('image/png', { quality: finalQuality });
                    finalBytes = new Uint8Array(processedBuffer);
                    finalMimeType = 'image/png';
                    
                    compressionInfo = `\nCompressed: ${resized ? `${originalWidth}x${originalHeight} → ${image.width}x${image.height}, ` : ''}quality=${finalQuality}%, ${(fileBuffer.length / 1024).toFixed(1)}KB → ${(finalBytes.length / 1024).toFixed(1)}KB`;
                    
                    getLogger().info(`Image compressed: ${resolvedPath}${compressionInfo}`);
                } catch (compressError) {
                    getLogger().warn(`Image compression failed, using original: ${compressError}`);
                    finalBytes = new Uint8Array(fileBuffer);
                }
            } else {
                // No compression - use original
                finalBytes = new Uint8Array(fileBuffer);
                if (needsProcessing && !jimpAvailable) {
                    compressionInfo = '\n(Compression requested but jimp not available - using original)';
                } else if (disableCompression && (quality !== undefined || maxWidth !== undefined || maxHeight !== undefined)) {
                    compressionInfo = '\n(Compression disabled in settings)';
                }
            }
            
            getLogger().info(`Reading image: ${resolvedPath} (${finalMimeType}, ${finalBytes.length} bytes)`);
            
            // Build result with text description and image
            const resultParts: (vscode.LanguageModelTextPart | vscode.LanguageModelDataPart)[] = [
                new vscode.LanguageModelTextPart(
                    `Image loaded from: ${path.basename(resolvedPath)}${description ? `\nDescription: ${description}` : ''}\nSize: ${(finalBytes.length / 1024).toFixed(1)}KB, Type: ${finalMimeType}${compressionInfo}`
                ),
                vscode.LanguageModelDataPart.image(finalBytes, finalMimeType)
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
        const { filePath, description, quality, maxWidth, maxHeight } = options.input;
        const compressionParams = [];
        if (quality !== undefined) {compressionParams.push(`quality=${quality}%`);}
        if (maxWidth !== undefined) {compressionParams.push(`maxW=${maxWidth}`);}
        if (maxHeight !== undefined) {compressionParams.push(`maxH=${maxHeight}`);}
        
        return {
            invocationMessage: `🖼️ Reading image: ${filePath}${compressionParams.length ? ` (${compressionParams.join(', ')})` : ''}`,
            confirmationMessages: {
                title: 'Read Image File',
                message: new vscode.MarkdownString(`**File:** ${filePath}${description ? `\n**Purpose:** ${description}` : ''}${compressionParams.length ? `\n**Compression:** ${compressionParams.join(', ')}` : ''}`)
            }
        };
    }
}
