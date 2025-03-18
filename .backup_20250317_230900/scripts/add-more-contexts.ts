import { ContextManager } from '../context-keeper/core/ContextManager';

async function addMoreContexts() {
  try {
    console.log('Initializing Context Manager...');
    const contextManager = new ContextManager();
    await contextManager.initialize();

    console.log('Adding more diverse context examples...');
    
    // Context 1: Technical implementation conversation
    await contextManager.addContext(
      `User: Could you help me implement a port conflict resolution feature for our Context Keeper system?
      
Assistant: I'll help you implement a robust port conflict resolution feature. We'll create a function that tries to find an available port when the default port is in use.

User: That sounds perfect. How would we implement the findAvailablePort function?`
    );
  } catch (error) {
    console.error('Error adding more contexts:', error);
  }
}

addMoreContexts(); 