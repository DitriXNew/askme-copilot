// Response cache for Ask Me Copilot Tool
import { ConfigurationManager } from './config';

export class ResponseCache {
    private cache = new Map<string, { response: string; timestamp: number }>();
    
    private get TTL(): number {
        return ConfigurationManager.cacheTimeToLive;
    }
    
    get(key: string): string | null {
        if (!ConfigurationManager.enableResponseCache) {
            return null;
        }
        
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        
        if (Date.now() - item.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        
        return item.response;
    }
    
    set(key: string, response: string) {
        if (!ConfigurationManager.enableResponseCache) {
            return;
        }
        this.cache.set(key, { response, timestamp: Date.now() });
    }
    
    clear() {
        this.cache.clear();
    }
}

// Global cache instance
export const responseCache = new ResponseCache();
