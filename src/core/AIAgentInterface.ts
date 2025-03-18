import { AIContextManager } from './AIContextManager';
import { ContextManager } from './ContextManager';

interface AgentContext {
  sessionId: string;
  query: string;
  relatedContexts: any[];
  suggestedApproaches: string[];
}

export class AIAgentInterface {
  private contextManager: AIContextManager;
  private currentSession: AgentContext | null = null;

  constructor() {
    this.contextManager = new AIContextManager();
  }

  async initialize(): Promise<void> {
    await this.contextManager.initialize();
  }

  async startNewChat(): Promise<string> {
    const sessionId = Date.now().toString();
    this.currentSession = {
      sessionId,
      query: '',
      relatedContexts: [],
      suggestedApproaches: []
    };
    return sessionId;
  }

  async processUserMessage(message: string): Promise<{
    relatedContexts: any[];
    suggestedApproaches: string[];
  }> {
    if (!this.currentSession) {
      await this.startNewChat();
    }

    // Update current session
    this.currentSession!.query = message;

    // Process through context manager
    const result = await this.contextManager.processUserQuery(message);
    
    // Update session with results
    this.currentSession!.relatedContexts = result.relatedContexts;
    this.currentSession!.suggestedApproaches = result.suggestedApproaches;

    return result;
  }

  async getRelevantContext(topic: string): Promise<any[]> {
    // This would be the method I would use at the start of each response
    // to get relevant historical context
    return (await this.contextManager.processUserQuery(topic)).relatedContexts;
  }

  async saveResponse(response: string): Promise<void> {
    if (!this.currentSession) return;

    // Save my response as part of the context
    await this.contextManager.captureResponse(
      this.currentSession.sessionId,
      response,
      {
        type: 'ai_response',
        relatedContexts: this.currentSession.relatedContexts.map(c => c.id),
        originalQuery: this.currentSession.query
      }
    );
  }
} 