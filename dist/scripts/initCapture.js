"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SessionManager_1 = require("../core/SessionManager");
const logger_1 = require("../core/utils/logger");
async function main() {
    try {
        const sessionManager = SessionManager_1.SessionManager.getInstance();
        await sessionManager.initialize();
        // Start a new session for our conversation
        const sessionId = sessionManager.startNewSession();
        (0, logger_1.logInfo)('Started new conversation capture session', { sessionId });
        // Set up process handlers to ensure we capture the session on exit
        process.on('SIGINT', async () => {
            (0, logger_1.logInfo)('Received SIGINT, ending session...');
            await sessionManager.endSession();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            (0, logger_1.logInfo)('Received SIGTERM, ending session...');
            await sessionManager.endSession();
            process.exit(0);
        });
        (0, logger_1.logInfo)('Conversation capture initialized and ready');
    }
    catch (error) {
        (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to initialize conversation capture'));
        process.exit(1);
    }
}
main().catch(console.error);
