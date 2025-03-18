import { ContextManager } from '../core/ContextManager';

interface UsageMetric {
  contextId: string;
  queryUsed: string;
  timestamp: number;
  wasRelevant: boolean;
}

export class MLOptimizer {
  private usageHistory: UsageMetric[] = [];
  private readonly HISTORY_LIMIT = 1000; // Keep last 1000 interactions
  private readonly MIN_SAMPLES = 50;     // Min samples before applying optimizations

  constructor(private contextManager: ContextManager) {}

  /**
   * Record when a context was used and if it was relevant
   */
  recordUsage(contextId: string, query: string, wasRelevant: boolean) {
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
  private async optimize() {
    try {
      // Group by contextId to find most/least relevant contexts
      const contextStats = new Map<string, { 
        relevant: number, 
        total: number,
        queries: string[] 
      }>();

      this.usageHistory.forEach(metric => {
        const stats = contextStats.get(metric.contextId) || { relevant: 0, total: 0, queries: [] };
        if (metric.wasRelevant) stats.relevant++;
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
    } catch (error) {
      console.error('Failed to optimize contexts:', error);
    }
  }

  /**
   * Extract common terms from queries that led to relevant results
   */
  private extractCommonTerms(queries: string[]): string[] {
    const terms = new Map<string, number>();
    
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