import { SessionManager } from '../core/SessionManager';
import { logInfo, logError } from '../core/utils/logger';

async function main() {
  try {
    const sessionManager = SessionManager.getInstance();
    await sessionManager.initialize();

    // Start a new session for our conversation
    const sessionId = sessionManager.startNewSession();
    logInfo('Started new conversation capture session', { sessionId });

    // Set up process handlers to ensure we capture the session on exit
    process.on('SIGINT', async () => {
      logInfo('Received SIGINT, ending session...');
      await sessionManager.endSession();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logInfo('Received SIGTERM, ending session...');
      await sessionManager.endSession();
      process.exit(0);
    });

    logInfo('Conversation capture initialized and ready');
  } catch (error) {
    logError(error instanceof Error ? error : new Error('Failed to initialize conversation capture'));
    process.exit(1);
  }
}

main().catch(console.error); 