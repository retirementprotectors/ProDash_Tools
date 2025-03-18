/**
 * ProDash Tools Main Entry Point
 */

import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { ContextManager } from './src/core/ContextManager.js';
import { BackupManager } from './src/core/BackupManager.js';
import { MonitoringService } from './src/core/MonitoringService.js';
import { GitIntegration } from './src/core/GitIntegration.js';
import { ContextCaptureService } from './src/core/ContextCaptureService.js';
import { DEFAULT_PORTS, findAvailablePort } from './src/core/PortConfig.js';
import { contextRoutes } from './src/api/contextRoutes.js';
import { backupRoutes } from './src/api/backupRoutes.js';
import { healthRoutes } from './src/api/healthRoutes.js';

// Load environment variables
config();

// Enable debug logging
const DEBUG = process.env.DEBUG === 'true';

function log(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

async function startServer() {
  try {
    log('Starting server initialization...');
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Initialize services in correct order with dependencies
    log('Initializing services...');
    const contextManager = new ContextManager();
    const backupManager = new BackupManager();
    const monitoringService = new MonitoringService();
    const gitIntegration = new GitIntegration();
    const contextCaptureService = new ContextCaptureService();

    // Calculate ports using environment variables or defaults
    log('Calculating ports...');
    const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || DEFAULT_PORTS.FRONTEND.toString());
    const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || DEFAULT_PORTS.BACKEND.toString());
    const DATABASE_PORT = parseInt(process.env.DATABASE_PORT || DEFAULT_PORTS.DATABASE.toString());

    log('Environment variables:', {
      FRONTEND_PORT: process.env.FRONTEND_PORT,
      BACKEND_PORT: process.env.BACKEND_PORT,
      DATABASE_PORT: process.env.DATABASE_PORT,
      NODE_ENV: process.env.NODE_ENV
    });

    // Find available ports
    log('Finding available port...');
    const actualBackendPort = await findAvailablePort(BACKEND_PORT);
    
    console.log('Port configuration:');
    console.log(`  Frontend: ${FRONTEND_PORT}`);
    console.log(`  Backend: ${actualBackendPort} (requested: ${BACKEND_PORT})`);
    console.log(`  Database: ${DATABASE_PORT}`);

    // Initialize the system
    console.log('Initializing Context Keeper...');

    try {
      // Initialize managers
      console.log('Initializing Context Manager...');
      await contextManager.initialize();

      console.log('Initializing Backup Manager...');
      await backupManager.initialize();
      console.log('Starting automatic backups every 60 minutes');

      console.log('Initializing Monitoring Service...');
      await monitoringService.initialize();
      console.log('Started health monitoring with interval of 15 minutes');

      console.log('Initializing Git Integration...');
      await gitIntegration.initialize();

      console.log('Initializing Context Capture Service...');
      await contextCaptureService.initialize();
      console.log('Starting automatic context capture every 5 minutes');
      console.log('Context Capture Service initialized');
    } catch (error) {
      console.error('Failed to initialize services:', error);
      throw error;
    }

    // Set up routes
    log('Setting up routes...');
    app.use('/api/contexts', contextRoutes(contextManager));
    app.use('/api/backups', backupRoutes(backupManager, contextManager));
    app.use('/api/health', healthRoutes(contextManager, backupManager));

    // Add error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start the server
    const server = app.listen(actualBackendPort, () => {
      console.log(`Server is running on port ${actualBackendPort}`);
      console.log(`API available at http://localhost:${actualBackendPort}/api`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${actualBackendPort} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server with proper error handling
startServer().catch(error => {
  console.error('Fatal error during server startup:', error);
  process.exit(1);
});
