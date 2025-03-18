"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const ContextCaptureService_1 = require("./ContextCaptureService");
const logger_1 = require("./utils/logger");
class SessionManager {
    constructor() {
        this.currentSessionId = null;
        this.conversationBuffer = [];
        this.captureService = new ContextCaptureService_1.ContextCaptureService();
    }
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    async initialize() {
        try {
            await this.captureService.initialize();
            (0, logger_1.logInfo)('Session Manager initialized');
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to initialize Session Manager'));
            throw error;
        }
    }
    startNewSession() {
        const sessionId = `session_${Date.now()}`;
        this.currentSessionId = sessionId;
        this.conversationBuffer = [];
        this.captureService.registerSession(sessionId, '', process.cwd());
        (0, logger_1.logInfo)('New session started', { sessionId });
        return sessionId;
    }
    addToConversation(userMessage, assistantMessage) {
        if (!this.currentSessionId) {
            this.startNewSession();
        }
        this.conversationBuffer.push(`User: ${userMessage}\n\nAssistant: ${assistantMessage}\n\n---\n\n`);
        this.captureService.updateSession(this.currentSessionId, this.conversationBuffer.join(''));
    }
    async endSession() {
        if (this.currentSessionId) {
            await this.captureService.endSession(this.currentSessionId, true);
            this.currentSessionId = null;
            this.conversationBuffer = [];
            (0, logger_1.logInfo)('Session ended');
        }
    }
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    getConversationBuffer() {
        return [...this.conversationBuffer];
    }
}
exports.SessionManager = SessionManager;
