import { ContextManager } from '../core/ContextManager';
export interface AgentContext {
    recentChats: string[];
    relevantExperiences: string[];
    commonPatterns: {
        tags: string[];
        topics: string[];
    };
}
export declare class HistoricalLoader {
    private contextManager;
    constructor(contextManager: ContextManager);
    loadForAgent(query: string, limit?: number): Promise<AgentContext>;
    private extractTopics;
}
