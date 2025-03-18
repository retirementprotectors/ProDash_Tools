import { ContextManager } from '../core/ContextManager';
export declare class MLOptimizer {
    private contextManager;
    private usageHistory;
    private readonly HISTORY_LIMIT;
    private readonly MIN_SAMPLES;
    constructor(contextManager: ContextManager);
    /**
     * Record when a context was used and if it was relevant
     */
    recordUsage(contextId: string, query: string, wasRelevant: boolean): void;
    /**
     * Apply learned patterns to improve context retrieval
     */
    private optimize;
    /**
     * Extract common terms from queries that led to relevant results
     */
    private extractCommonTerms;
}
