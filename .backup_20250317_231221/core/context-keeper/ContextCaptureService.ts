import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ContextManager } from './ContextManager';

interface CaptureConfig {
  enabled: boolean;
  autoCapture: boolean;
  captureInterval: number; // milliseconds
  minContentLength: number;
  maxSessionsToTrack: number;
}

interface ActiveSession {
  id: string;
  startTime: number;
  lastUpdateTime: number;
  content: string;
  captured: boolean;
  projectPath?: string;
}

export class ContextCaptureService {
  private contextManager: ContextManager;
  private initialized: boolean = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private activeSessions: Map<string, ActiveSession> = new Map();
  private sessionsPath: string;
  private config: CaptureConfig = {
    enabled: true,
    autoCapture: true,
    captureInterval: 5 * 60 * 1000, // 5 minutes
    minContentLength: 100, // Minimum content length to consider capturing
    maxSessionsToTrack: 10
  };

  constructor() {
    this.contextManager = new ContextManager();
    this.sessionsPath = join(process.cwd(), '.context-keeper', 'sessions');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize the context manager
      await this.contextManager.initialize();
      
      // Create sessions directory if it doesn't exist
      if (!existsSync(this.sessionsPath)) {
        mkdirSync(this.sessionsPath, { recursive: true });
      }
      
      // Load any existing sessions
      await this.loadSessions();

      // Start auto-capture if enabled
      if (this.config.enabled && this.config.autoCapture) {
        this.startAutoCapture();
      }

      this.initialized = true;
      console.log('Context Capture Service initialized');
    } catch (error) {
      console.error('Failed to initialize Context Capture Service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    // Clean up resources
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    // Save active sessions for persistence
    await this.saveSessions();
  }

  setConfig(config: Partial<CaptureConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update auto-capture behavior if initialized
    if (this.initialized) {
      // Stop existing auto-capture
      if (this.captureInterval) {
        clearInterval(this.captureInterval);
        this.captureInterval = null;
      }
      
      // Restart if enabled
      if (this.config.enabled && this.config.autoCapture) {
        this.startAutoCapture();
      }
    }
  }

  getConfig(): CaptureConfig {
    return { ...this.config };
  }

  /**
   * Register a new chat session to be tracked
   */
  registerSession(sessionId: string, initialContent: string = '', projectPath?: string): void {
    if (!this.config.enabled) return;
    
    console.log(`Registering new chat session: ${sessionId}`);
    
    const now = Date.now();
    this.activeSessions.set(sessionId, {
      id: sessionId,
      startTime: now,
      lastUpdateTime: now,
      content: initialContent,
      captured: false,
      projectPath
    });
    
    // If we're tracking too many sessions, remove the oldest ones
    if (this.activeSessions.size > this.config.maxSessionsToTrack) {
      const sessionsArray = Array.from(this.activeSessions.entries());
      // Sort by last update time (oldest first)
      sessionsArray.sort((a, b) => a[1].lastUpdateTime - b[1].lastUpdateTime);
      
      // Remove oldest sessions that exceed our limit
      const sessionsToRemove = sessionsArray.slice(0, this.activeSessions.size - this.config.maxSessionsToTrack);
      for (const [id] of sessionsToRemove) {
        this.activeSessions.delete(id);
      }
    }
    
    // Save updated sessions
    this.saveSessions();
  }

  /**
   * Update an existing session with new content
   */
  updateSession(sessionId: string, content: string): void {
    if (!this.config.enabled) return;
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      // Session doesn't exist, create it
      this.registerSession(sessionId, content);
      return;
    }
    
    // Update the session content and timestamp
    session.content = content;
    session.lastUpdateTime = Date.now();
    
    // Mark as not captured if content changed significantly
    if (session.captured && content.length > session.content.length * 1.2) {
      session.captured = false;
    }
    
    // Save updated sessions
    this.saveSessions();
  }

  /**
   * Manually capture the content of a specific session
   */
  async captureSession(sessionId: string, metadata: Record<string, any> = {}): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return false;
    }
    
    // Don't capture if content is too short
    if (session.content.length < this.config.minContentLength) {
      console.log(`Session ${sessionId} content too short for capture`);
      return false;
    }
    
    try {
      // Add project path to metadata if available
      if (session.projectPath) {
        metadata.projectPath = session.projectPath;
      }
      
      // Add session metadata
      metadata.sessionId = session.id;
      metadata.sessionStartTime = session.startTime;
      metadata.captureTime = Date.now();
      
      // Save to context manager
      await this.contextManager.addContext(session.content, metadata);
      
      // Mark as captured
      session.captured = true;
      
      console.log(`Captured context from session ${sessionId}`);
      return true;
    } catch (error) {
      console.error(`Error capturing session ${sessionId}:`, error);
      return false;
    }
  }

  /**
   * Automatically capture all active sessions that haven't been captured yet
   */
  async captureAllSessions(): Promise<number> {
    if (!this.initialized) await this.initialize();
    
    if (!this.config.enabled) return 0;
    
    let capturedCount = 0;
    
    for (const [id, session] of this.activeSessions.entries()) {
      // Skip if already captured or too short
      if (session.captured || session.content.length < this.config.minContentLength) {
        continue;
      }
      
      // Calculate time since last update
      const timeSinceUpdate = Date.now() - session.lastUpdateTime;
      
      // Only capture if session hasn't been updated recently (conversation may have ended)
      // or if the session is very old (capture in progress conversations too)
      if (timeSinceUpdate > 60 * 1000 || (Date.now() - session.startTime) > 30 * 60 * 1000) {
        const success = await this.captureSession(id);
        if (success) capturedCount++;
      }
    }
    
    if (capturedCount > 0) {
      console.log(`Auto-captured ${capturedCount} sessions`);
    }
    
    return capturedCount;
  }

  /**
   * Start auto-capturing sessions at regular intervals
   */
  private startAutoCapture(): void {
    if (this.captureInterval) {
      console.log('Auto-capture already running. Skipping initialization.');
      return;
    }
    
    console.log(`Starting automatic context capture every ${this.config.captureInterval / (60 * 1000)} minutes`);
    
    // Perform an initial capture
    const initialCaptureTimeout = setTimeout(() => {
      this.captureAllSessions();
      clearTimeout(initialCaptureTimeout);
    }, 30000); // Wait 30 seconds for initial capture
    
    // Set up regular interval for future captures
    this.captureInterval = setInterval(
      () => this.captureAllSessions(),
      this.config.captureInterval
    );
  }

  /**
   * Save active sessions to disk for persistence
   */
  private async saveSessions(): Promise<void> {
    try {
      const sessionsFile = join(this.sessionsPath, 'active-sessions.json');
      const sessionsData = JSON.stringify(Array.from(this.activeSessions.entries()));
      writeFileSync(sessionsFile, sessionsData);
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  }

  /**
   * Load active sessions from disk
   */
  private async loadSessions(): Promise<void> {
    try {
      const sessionsFile = join(this.sessionsPath, 'active-sessions.json');
      
      if (existsSync(sessionsFile)) {
        const sessionsData = readFileSync(sessionsFile, 'utf8');
        const sessions = JSON.parse(sessionsData) as [string, ActiveSession][];
        
        this.activeSessions = new Map(sessions);
        console.log(`Loaded ${this.activeSessions.size} active sessions`);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Start with an empty map if there's an error
      this.activeSessions = new Map();
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get a specific session by ID
   */
  getSession(sessionId: string): ActiveSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * End a session and optionally capture its content
   */
  async endSession(sessionId: string, captureContent: boolean = true): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    let captured = false;
    
    // Capture content if requested and not already captured
    if (captureContent && !session.captured) {
      captured = await this.captureSession(sessionId);
    }
    
    // Remove the session
    this.activeSessions.delete(sessionId);
    
    // Save updated sessions
    this.saveSessions();
    
    return captured;
  }
} 