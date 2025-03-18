interface CaptureConfig {
    enabled: boolean;
    autoCapture: boolean;
    captureInterval: number;
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
export declare class ContextCaptureService {
    private contextManager;
    private initialized;
    private captureInterval;
    private activeSessions;
    private sessionsPath;
    private config;
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    setConfig(config: Partial<CaptureConfig>): void;
    getConfig(): CaptureConfig;
    /**
     * Register a new chat session to be tracked
     */
    registerSession(sessionId: string, initialContent?: string, projectPath?: string): void;
    /**
     * Update an existing session with new content
     */
    updateSession(sessionId: string, content: string): void;
    /**
     * Manually capture the content of a specific session
     */
    captureSession(sessionId: string, metadata?: Record<string, any>): Promise<boolean>;
    /**
     * Automatically capture all active sessions that haven't been captured yet
     */
    captureAllSessions(): Promise<number>;
    /**
     * Start auto-capturing sessions at regular intervals
     */
    private startAutoCapture;
    /**
     * Save active sessions to disk for persistence
     */
    private saveSessions;
    /**
     * Load active sessions from disk
     */
    private loadSessions;
    /**
     * Get all active sessions
     */
    getActiveSessions(): ActiveSession[];
    /**
     * Get a specific session by ID
     */
    getSession(sessionId: string): ActiveSession | undefined;
    /**
     * End a session and optionally capture its content
     */
    endSession(sessionId: string, captureContent?: boolean): Promise<boolean>;
}
export {};
