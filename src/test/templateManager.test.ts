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
            
            assert.strictEqual(result, 'This is a very long templa...');
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
});
