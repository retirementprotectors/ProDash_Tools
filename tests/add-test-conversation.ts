import { ContextManager } from '../context-keeper/core/ContextManager';

async function addTestConversation() {
  console.log('Adding a test conversation with full metadata...');
  
  try {
    // Initialize the context manager
    const contextManager = new ContextManager();
    await contextManager.initialize();
    
    // Create a visually distinctive test conversation with full metadata
    const conversationContent = `
User: Can you help me understand how the Context Keeper dashboard works?
      `;

    // Add the conversation to the context manager
    await contextManager.addContext(conversationContent);

    console.log('Test conversation added successfully!');
  } catch (error) {
    console.error('Error adding test conversation:', error);
  }
}

addTestConversation(); 