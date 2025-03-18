import { ContextManager } from '../core/ContextManager';

export interface AgentContext {
  recentChats: string[];
  relevantExperiences: string[];
  commonPatterns: {
    tags: string[];
    topics: string[];
  };
}

export class HistoricalLoader {
  constructor(private contextManager: ContextManager) {}

  async loadForAgent(query: string, limit = 10): Promise<AgentContext> {
    try {
      // Get most relevant contexts based on the query
      const relevant = await this.contextManager.searchContexts({
        query,
        limit
      });

      // Extract tags for pattern recognition
      const tags = relevant.flatMap(ctx => ctx.metadata.tags || []);
      const tagCounts = new Map<string, number>();
      tags.forEach(tag => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));

      // Get most common tags
      const commonTags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

      return {
        recentChats: relevant
          .filter(ctx => ctx.metadata.source === 'chat')
          .map(ctx => ctx.content),
        relevantExperiences: relevant
          .filter(ctx => ctx.metadata.source !== 'chat')
          .map(ctx => ctx.content),
        commonPatterns: {
          tags: commonTags,
          topics: this.extractTopics(relevant.map(ctx => ctx.content))
        }
      };
    } catch (error) {
      console.error('Failed to load historical context:', error);
      return {
        recentChats: [],
        relevantExperiences: [],
        commonPatterns: { tags: [], topics: [] }
      };
    }
  }

  private extractTopics(contents: string[]): string[] {
    // Simple topic extraction based on common phrases
    const topics = new Set<string>();
    const commonPhrases = contents.join(' ').match(/(?:about|discussing|implementing|working on) ([^.!?]+)/g);
    
    commonPhrases?.forEach(phrase => {
      const topic = phrase.replace(/^(?:about|discussing|implementing|working on) /, '').trim();
      if (topic.length > 3 && topic.length < 50) {
        topics.add(topic);
      }
    });

    return Array.from(topics).slice(0, 5);
  }
} 