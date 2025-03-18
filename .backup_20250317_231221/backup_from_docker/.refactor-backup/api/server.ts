import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { ContextManager } from '../core/context-keeper/ContextManager';
import { BackupManager } from '../core/context-keeper/BackupManager';
import { GitIntegration } from '../core/context-keeper/GitIntegration';
import { ContextCaptureService } from '../core/context-keeper/ContextCaptureService';
import { DEFAULT_PORTS, findAvailablePort } from '../core/utils/PortConfig';

// API routes
import { contextRoutes } from './routes/contextRoutes';
import { backupRoutes } from './routes/backupRoutes';
import { healthRoutes } from './routes/healthRoutes';
import { gitRoutes } from './routes/gitRoutes';
import { captureRoutes } from './routes/captureRoutes';

// Managers
const contextManager = new ContextManager();
const backupManager = new BackupManager();
const gitIntegration = new GitIntegration();
const captureService = new ContextCaptureService();

async function startServer() {
  console.log('Initializing ProDash Tools Server...');

  try {
    // Initialize services
    console.log('Initializing Context Manager...');
    await contextManager.initialize();

    console.log('Initializing Backup Manager...');
    await backupManager.initialize();
    
    console.log('Initializing Git Integration...');
    await gitIntegration.initialize();
    
    console.log('Initializing Context Capture Service...');
    await captureService.initialize();

    // Create Express app
    const app = express();
    
    // Set up middleware
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    
    // Set up API routes
    app.use('/api/contexts', contextRoutes(contextManager));
    app.use('/api/backups', backupRoutes(backupManager, contextManager));
    app.use('/api/health', healthRoutes(contextManager, backupManager));
    app.use('/api/git', gitRoutes(gitIntegration));
    app.use('/api/capture', captureRoutes(captureService));

    // Serve static files from the dashboard
    app.use(express.static(join(__dirname, '..', 'dashboard', 'public', 'dist')));
    
    // Catch-all route to serve the dashboard for client-side routing
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, '..', 'dashboard', 'public', 'dist', 'index.html'));
    });

    // Try to use the default port, but find an available one if that's not possible
    console.log(`Starting Server (attempting to use port ${DEFAULT_PORTS.BACKEND})...`);
    const port = await findAvailablePort(DEFAULT_PORTS.BACKEND);
    
    // Save the actual port so frontend can access it
    app.set('port', port);
    
    // Start server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log('ProDash Tools system is running!');
      console.log(`Access the dashboard at http://localhost:${port}`);
    });

    // Set up graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down ProDash Tools...');
      
      // Perform cleanup
      await backupManager.shutdown();
      await gitIntegration.shutdown();
      await captureService.shutdown();
      
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start ProDash Tools:', error);
    process.exit(1);
  }
}

// Export for testing
export { startServer };

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
} 