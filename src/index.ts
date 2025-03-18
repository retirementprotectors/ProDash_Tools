// Core services
export { EnhancedContextService } from './core/services/EnhancedContextService';
export { DefaultVectorOperations } from './core/services/VectorOperations';
export { MongoContextStore } from './core/persistence/MongoContextStore';

// Types
export * from './core/types/Context';
export * from './core/types/Vector';

// Express routes
export { createContextRoutes } from './api/routes/contextRoutes';

import { ContextManager } from './core/ContextManager';
import { AutoCollector } from './services/AutoCollector';
import { HistoricalLoader } from './services/HistoricalLoader';
import { MLOptimizer } from './services/MLOptimizer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/context-keeper';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) {
  throw new Error('OPENAI_API_KEY is required');
}

// Initialize the system
const contextManager = new ContextManager(MONGO_URL, OPENAI_KEY);
const collector = new AutoCollector(contextManager);
const loader = new HistoricalLoader(contextManager);
const optimizer = new MLOptimizer(contextManager);

// Start the collection process
async function start() {
  try {
    await contextManager.connect();
    collector.start();
    console.log('Context keeper system started');
    console.log('- Auto-collecting chats every 30 seconds');
    console.log('- Creating backups every 5 minutes');
    console.log('- ML optimization will begin after 50 samples');
  } catch (error) {
    console.error('Failed to start context keeper:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  collector.stop();
  await contextManager.close();
  process.exit(0);
});

// Test HistoricalLoader
async function testHistoricalLoader() {
  try {
    const context = await loader.loadForAgent('test query');
    console.log('Loaded context:', context);
  } catch (error) {
    console.error('Failed to load historical context:', error);
  }
}

testHistoricalLoader();

start(); 