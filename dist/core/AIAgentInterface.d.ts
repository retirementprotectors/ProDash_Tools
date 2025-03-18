export declare class AIAgentInterface {
    private contextManager;
    private currentSession;
    constructor();
    initialize(): Promise<void>;
    startNewChat(): Promise<string>;
    processUserMessage(message: string): Promise<{
        relatedContexts: any[];
        suggestedApproaches: string[];
    }>;
    getRelevantContext(topic: string): Promise<any[]>;
    saveResponse(response: string): Promise<void>;
}
