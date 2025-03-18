import express from 'express';
import { getContextManager, getBackupManager } from '../core';

async function startServer() {
  // Get service instances
  const contextManager = getContextManager();
  const backupManager = getBackupManager();

  // Initialize services
  await contextManager.initialize();
  await backupManager.initialize();

  // Create Express app
  const app = express();
  
  // Set up middleware
  app.use(express.json());
  
  // Define routes
  app.get('/', (req, res) => {
    res.json({ 
      status: 'online',
      message: 'ProDash Tools project is running!'
    });
  });
  
  app.get('/api/contexts', async (req, res) => {
    try {
      const contexts = await contextManager.getAllContexts();
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch contexts' });
    }
  });
  
  // Start server
  const port = 3000;
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('ProDash Tools project is running!');
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 