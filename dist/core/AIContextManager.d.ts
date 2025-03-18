interface AIContextConfig {
    autoSearchEnabled: boolean;
    relevanceThreshold: number;
    maxRelatedContexts: number;
    learningEnabled: boolean;
    embeddingModel: string;
    contextWindowSize: number;
    minRelevanceScore: number;
}
export interface EnhancedContext {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        type: string;
        topic?: string;
        confidence: number;
        usageCount: number;
        lastUsed: number;
        relatedContexts?: string[];
        parentContext?: string;
        contextType: 'solution' | 'explanation' | 'error' | 'success' | 'interaction';
        suggestedApproach?: string;
    };
}
export declare class AIContextManager {
    private contextManager;
    private captureService;
    private encoder;
    private classifier;
    private config;
    constructor();
    initialize(): Promise<void>;
    getConfig(): AIContextConfig;
    setConfig(config: Partial<AIContextConfig>): void;
    processUserQuery(query: string): Promise<{
        relatedContexts: EnhancedContext[];
        suggestedApproaches: string[];
        confidence: number;
    }>;
    captureResponse(sessionId: string, response: string, metadata: any): Promise<void>;
    private generateContextApproach;
    private generateEnhancedSuggestions;
    private learnFromInteraction;
    private cosineSimilarity;
    shutdown(): Promise<void>;
}
export {};
