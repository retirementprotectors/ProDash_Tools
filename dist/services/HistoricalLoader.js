"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalLoader = void 0;
class HistoricalLoader {
    constructor(contextManager) {
        this.contextManager = contextManager;
    }
    async loadForAgent(query, limit = 10) {
        try {
            // Get most relevant contexts based on the query
            const relevant = await this.contextManager.searchContexts({
                query,
                limit
            });
            // Extract tags for pattern recognition
            const tags = relevant.flatMap(ctx => ctx.metadata.tags || []);
            const tagCounts = new Map();
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
        }
        catch (error) {
            console.error('Failed to load historical context:', error);
            return {
                recentChats: [],
                relevantExperiences: [],
                commonPatterns: { tags: [], topics: [] }
            };
        }
    }
    extractTopics(contents) {
        // Simple topic extraction based on common phrases
        const topics = new Set();
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
exports.HistoricalLoader = HistoricalLoader;
