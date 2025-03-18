import { ContextCaptureService } from './ContextCaptureService';
import { logInfo, logError } from './utils/logger';

export class SessionManager {
  private static instance: SessionManager;
  private captureService: ContextCaptureService;
  private currentSessionId: string | null = null;
  private conversationBuffer: string[] = [];

  private constructor() {
    this.captureService = new ContextCaptureService();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.captureService.initialize();
      logInfo('Session Manager initialized');
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to initialize Session Manager'));
      throw error;
    }
  }

  public startNewSession(): string {
    const sessionId = `session_${Date.now()}`;
    this.currentSessionId = sessionId;
    this.conversationBuffer = [];
    
    this.captureService.registerSession(sessionId, '', process.cwd());
    logInfo('New session started', { sessionId });
    
    return sessionId;
  }

  public addToConversation(userMessage: string, assistantMessage: string): void {
    if (!this.currentSessionId) {
      this.startNewSession();
    }

    this.conversationBuffer.push(
      `User: ${userMessage}\n\nAssistant: ${assistantMessage}\n\n---\n\n`
    );

    this.captureService.updateSession(
      this.currentSessionId!,
      this.conversationBuffer.join('')
    );
  }

  public async endSession(): Promise<void> {
    if (this.currentSessionId) {
      await this.captureService.endSession(this.currentSessionId, true);
      this.currentSessionId = null;
      this.conversationBuffer = [];
      logInfo('Session ended');
    }
  }

  public getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  public getConversationBuffer(): string[] {
    return [...this.conversationBuffer];
  }
} 