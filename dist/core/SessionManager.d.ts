export declare class SessionManager {
    private static instance;
    private captureService;
    private currentSessionId;
    private conversationBuffer;
    private constructor();
    static getInstance(): SessionManager;
    initialize(): Promise<void>;
    startNewSession(): string;
    addToConversation(userMessage: string, assistantMessage: string): void;
    endSession(): Promise<void>;
    getCurrentSessionId(): string | null;
    getConversationBuffer(): string[];
}
