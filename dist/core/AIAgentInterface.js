"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgentInterface = void 0;
const AIContextManager_1 = require("./AIContextManager");
class AIAgentInterface {
    constructor() {
        this.currentSession = null;
        this.contextManager = new AIContextManager_1.AIContextManager();
    }
    async initialize() {
        await this.contextManager.initialize();
    }
    async startNewChat() {
        const sessionId = Date.now().toString();
        this.currentSession = {
            sessionId,
            query: '',
            relatedContexts: [],
            suggestedApproaches: []
        };
        return sessionId;
    }
    async processUserMessage(message) {
        if (!this.currentSession) {
            await this.startNewChat();
        }
        // Update current session
        this.currentSession.query = message;
        // Process through context manager
        const result = await this.contextManager.processUserQuery(message);
        // Update session with results
        this.currentSession.relatedContexts = result.relatedContexts;
        this.currentSession.suggestedApproaches = result.suggestedApproaches;
        return result;
    }
    async getRelevantContext(topic) {
        // This would be the method I would use at the start of each response
        // to get relevant historical context
        return (await this.contextManager.processUserQuery(topic)).relatedContexts;
    }
    async saveResponse(response) {
        if (!this.currentSession)
            return;
        // Save my response as part of the context
        await this.contextManager.captureResponse(this.currentSession.sessionId, response, {
            type: 'ai_response',
            relatedContexts: this.currentSession.relatedContexts.map(c => c.id),
            originalQuery: this.currentSession.query
        });
    }
}
exports.AIAgentInterface = AIAgentInterface;
