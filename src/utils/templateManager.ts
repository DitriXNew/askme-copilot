// Template Manager - Handles response template loading and formatting
import * as vscode from 'vscode';
import { IResponseTemplate } from '../types';

export type ToolType = 'askExpert' | 'selectFromList' | 'reviewCode';

export class TemplateManager {
    private static readonly CONFIG_SECTION = 'askMeCopilot';
    private static readonly TEMPLATES_KEY = 'templates';
    
    /**
     * Get all templates from workspace configuration
     */
    static getTemplates(): IResponseTemplate[] {
        const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
        const templates = config.get<IResponseTemplate[]>(this.TEMPLATES_KEY, []);
        return templates;
    }
    
    /**
     * Get templates applicable to a specific tool type
     * Filters out empty templates (empty title or content)
     */
    static getTemplatesForTool(toolType: ToolType): IResponseTemplate[] {
        const allTemplates = this.getTemplates();
        return allTemplates.filter(template => {
            // Filter out empty templates
            if (!template.title || !template.title.trim() || !template.content || !template.content.trim()) {
                return false;
            }
            // Filter by tool type
            return template.applyTo && template.applyTo[toolType] === true;
        });
    }
    
    /**
     * Get template indices that should be enabled by default for a tool
     */
    static getDefaultEnabledIndices(toolType: ToolType): number[] {
        const templates = this.getTemplatesForTool(toolType);
        const indices: number[] = [];
        
        templates.forEach((template, index) => {
            if (template.enabledByDefault) {
                indices.push(index);
            }
        });
        
        return indices;
    }
    
    /**
     * Format a response with active templates
     * @param userResponse The user's typed response
     * @param activeTemplates Array of active template contents
     * @returns Formatted response with templates appended
     */
    static formatResponseWithTemplates(userResponse: string, activeTemplates: string[]): string {
        // If no templates are active, return only the user's response
        if (!activeTemplates || activeTemplates.length === 0) {
            return userResponse;
        }
        
        // Build the formatted response
        let formattedResponse = userResponse;
        
        // Add separator and additional instructions
        formattedResponse += '\n\n---\n**Additional Instructions:**';
        
        // Add each template as a bullet point
        activeTemplates.forEach(templateContent => {
            formattedResponse += `\n- ${templateContent}`;
        });
        
        return formattedResponse;
    }
    
    /**
     * Truncate template title for display (max 30 chars, add "..." if truncated)
     */
    static truncateTitle(title: string, maxLength: number = 30): string {
        // Handle edge cases
        if (maxLength < 3) {
            return title.substring(0, maxLength);
        }
        
        if (title.length <= maxLength) {
            return title;
        }
        return title.substring(0, maxLength - 3) + '...';
    }
    
    /**
     * Prepare templates for webview display (truncate titles)
     */
    static prepareTemplatesForDisplay(templates: IResponseTemplate[]): Array<IResponseTemplate & { displayTitle: string }> {
        return templates.map(template => ({
            ...template,
            displayTitle: this.truncateTitle(template.title)
        }));
    }
}
