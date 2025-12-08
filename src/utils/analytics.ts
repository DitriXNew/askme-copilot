// Analytics collector for Ask Me Copilot Tool (privacy-friendly, local only)

export class AnalyticsCollector {
    private metrics = {
        questionsAsked: 0,
        selectionsShown: 0,
        responsesProvided: 0,
        responseTime: [] as number[],
        canceledRequests: 0
    };
    
    trackQuestion() {
        this.metrics.questionsAsked++;
    }
    
    trackSelection() {
        this.metrics.selectionsShown++;
    }
    
    trackResponse(startTime: number) {
        this.metrics.responsesProvided++;
        this.metrics.responseTime.push(Date.now() - startTime);
    }
    
    trackCancellation() {
        this.metrics.canceledRequests++;
    }
    
    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.length > 0
            ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
            : 0;
        
        return {
            ...this.metrics,
            avgResponseTime: Math.round(avgResponseTime)
        };
    }
}

// Global analytics instance
export const analytics = new AnalyticsCollector();
