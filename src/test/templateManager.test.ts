import * as assert from 'assert';
import { TemplateManager } from '../utils/templateManager';

declare function suite(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;

suite('Template Manager Tests', () => {
    suite('formatResponseWithTemplates', () => {
        test('should return only user response when no templates are active', () => {
            const userResponse = 'Use Redis for caching';
            const activeTemplates: string[] = [];
            
            const result = TemplateManager.formatResponseWithTemplates(userResponse, activeTemplates);
            
            assert.strictEqual(result, 'Use Redis for caching');
        });
        
        test('should format response with one active template', () => {
            const userResponse = 'Use Redis for caching';
            const activeTemplates = [
                'After completing the task - consult with the expert. Update your to-do list if the task requires it, and as the last item, schedule a consultation with the expert.'
            ];
            
            const result = TemplateManager.formatResponseWithTemplates(userResponse, activeTemplates);
            
            const expected = `Use Redis for caching

---
**Additional Instructions:**
- After completing the task - consult with the expert. Update your to-do list if the task requires it, and as the last item, schedule a consultation with the expert.`;
            
            assert.strictEqual(result, expected);
        });
        
        test('should format response with multiple active templates', () => {
            const userResponse = 'Refactor authentication to OAuth2';
            const activeTemplates = [
                'After completing the task - consult with the expert.',
                'Update all relevant documentation files.'
            ];
            
            const result = TemplateManager.formatResponseWithTemplates(userResponse, activeTemplates);
            
            const expected = `Refactor authentication to OAuth2

---
**Additional Instructions:**
- After completing the task - consult with the expert.
- Update all relevant documentation files.`;
            
            assert.strictEqual(result, expected);
        });
        
        test('should handle empty user response with templates', () => {
            const userResponse = '';
            const activeTemplates = ['Consult with the expert.'];
            
            const result = TemplateManager.formatResponseWithTemplates(userResponse, activeTemplates);
            
            const expected = `

---
**Additional Instructions:**
- Consult with the expert.`;
            
            assert.strictEqual(result, expected);
        });
    });
    
    suite('truncateTitle', () => {
        test('should not truncate title shorter than max length', () => {
            const title = 'Short Title';
            const result = TemplateManager.truncateTitle(title, 30);
            
            assert.strictEqual(result, 'Short Title');
        });
        
        test('should truncate title longer than max length', () => {
            const title = 'This is a very long template title that exceeds the maximum length';
            const result = TemplateManager.truncateTitle(title, 30);
            
            assert.strictEqual(result, 'This is a very long templat...');
            assert.strictEqual(result.length, 30);
        });
        
        test('should handle title exactly at max length', () => {
            const title = '123456789012345678901234567890'; // exactly 30 chars
            const result = TemplateManager.truncateTitle(title, 30);
            
            assert.strictEqual(result, title);
        });
        
        test('should use default max length of 30', () => {
            const title = 'This is a very long template title that exceeds thirty characters';
            const result = TemplateManager.truncateTitle(title);
            
            assert.strictEqual(result.length, 30);
            assert(result.endsWith('...'));
        });
    });
    
    suite('prepareTemplatesForDisplay', () => {
        test('should add displayTitle for short titles', () => {
            const templates = [
                { 
                    title: 'Short', 
                    content: 'Content',
                    enabledByDefault: false,
                    applyTo: { askExpert: true, selectFromList: true, reviewCode: true }
                }
            ];
            
            const result = TemplateManager.prepareTemplatesForDisplay(templates);
            
            assert.strictEqual(result[0].displayTitle, 'Short');
            assert.strictEqual(result[0].title, 'Short');
            assert.strictEqual(result[0].content, 'Content');
        });
        
        test('should truncate long titles in displayTitle', () => {
            const templates = [
                { 
                    title: 'This is a very long template title that exceeds the limit', 
                    content: 'Content',
                    enabledByDefault: false,
                    applyTo: { askExpert: true, selectFromList: true, reviewCode: true }
                }
            ];
            
            const result = TemplateManager.prepareTemplatesForDisplay(templates);
            
            assert.strictEqual(result[0].displayTitle.length, 30);
            assert(result[0].displayTitle.endsWith('...'));
            assert.strictEqual(result[0].title, 'This is a very long template title that exceeds the limit');
        });
        
        test('should handle empty array', () => {
            const result = TemplateManager.prepareTemplatesForDisplay([]);
            
            assert.deepStrictEqual(result, []);
        });
        
        test('should handle multiple templates', () => {
            const templates = [
                { 
                    title: 'First', 
                    content: 'Content 1',
                    enabledByDefault: false,
                    applyTo: { askExpert: true, selectFromList: true, reviewCode: true }
                },
                { 
                    title: 'Second', 
                    content: 'Content 2',
                    enabledByDefault: true,
                    applyTo: { askExpert: true, selectFromList: false, reviewCode: true }
                }
            ];
            
            const result = TemplateManager.prepareTemplatesForDisplay(templates);
            
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].displayTitle, 'First');
            assert.strictEqual(result[1].displayTitle, 'Second');
        });
    });
});