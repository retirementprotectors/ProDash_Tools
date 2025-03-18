"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLOptimizer = void 0;
class MLOptimizer {
    constructor(contextManager) {
        this.contextManager = contextManager;
        this.usageHistory = [];
        this.HISTORY_LIMIT = 1000; // Keep last 1000 interactions
        this.MIN_SAMPLES = 50; // Min samples before applying optimizations
    }
    /**
     * Record when a context was used and if it was relevant
     */
    recordUsage(contextId, query, wasRelevant) {
        this.usageHistory.push({
            contextId,
            queryUsed: query,
            timestamp: Date.now(),
            wasRelevant
        });
        // Keep history size manageable
        if (this.usageHistory.length > this.HISTORY_LIMIT) {
            this.usageHistory = this.usageHistory.slice(-this.HISTORY_LIMIT);
        }
        // If we have enough samples, trigger optimization
        if (this.usageHistory.length >= this.MIN_SAMPLES) {
            this.optimize();
        }
    }
    /**
     * Apply learned patterns to improve context retrieval
     */
    async optimize() {
        try {
            // Group by contextId to find most/least relevant contexts
            const contextStats = new Map();
            this.usageHistory.forEach(metric => {
                const stats = contextStats.get(metric.contextId) || { relevant: 0, total: 0, queries: [] };
                if (metric.wasRelevant)
                    stats.relevant++;
                stats.total++;
                stats.queries.push(metric.queryUsed);
                contextStats.set(metric.contextId, stats);
            });
            // Update context tags based on relevance
            for (const [contextId, stats] of contextStats) {
                const relevanceScore = stats.relevant / stats.total;
                const context = await this.contextManager.getContext(contextId);
                if (context) {
                    // Add relevance score and common query terms as tags
                    const commonTerms = this.extractCommonTerms(stats.queries);
                    await this.contextManager.updateContext(contextId, {
                        metadata: {
                            ...context.metadata,
                            tags: [
                                ...(context.metadata.tags || []),
                                `relevance:${relevanceScore.toFixed(2)}`,
                                ...commonTerms.map(term => `query:${term}`)
                            ]
                        }
                    });
                }
            }
            // Clear history after optimization
            this.usageHistory = [];
        }
        catch (error) {
            console.error('Failed to optimize contexts:', error);
        }
    }
    /**
     * Extract common terms from queries that led to relevant results
     */
    extractCommonTerms(queries) {
        const terms = new Map();
        queries.forEach(query => {
            query.toLowerCase()
                .split(/\W+/)
                .filter(word => word.length > 3) // Skip short words
                .forEach(word => {
                terms.set(word, (terms.get(word) || 0) + 1);
            });
        });
        return Array.from(terms.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([term]) => term);
    }
}
exports.MLOptimizer = MLOptimizer;
