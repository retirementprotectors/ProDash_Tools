/**
 * ProDash Tools Main Entry Point
 */

// Re-export from the new structure
export * from './prodash-tools/core/index';

// Main server function
import express from 'express';
import cors from 'cors';
import { ContextManager } from './core/ContextManager.js';
import { BackupManager } from './core/BackupManager.js';
import { MonitoringService } from './core/MonitoringService.js';
import { GitIntegration } from './core/GitIntegration.js';
import { ContextCaptureService } from './core/ContextCaptureService.js';
import { getProjectNameHash } from './dashboard/public/src/utils/portConfig.js';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Initialize services in correct order with dependencies
  const contextManager = new ContextManager();
  const backupManager = new BackupManager();
  const monitoringService = new MonitoringService(contextManager, backupManager);
  const gitIntegration = new GitIntegration();
  const contextCaptureService = new ContextCaptureService();

  // Calculate ports
  const projectName = 'prodash-tools';
  const portHash = getProjectNameHash(projectName);
  const FRONTEND_PORT = 53000 + portHash;
  const BACKEND_PORT = 54000 + portHash;
  const DATABASE_PORT = 55000 + portHash;

  console.log('Project name:', projectName);
  console.log('Generated port configuration:');
  console.log(`  Frontend: ${FRONTEND_PORT}`);
  console.log(`  Backend: ${BACKEND_PORT}`);
  console.log(`  Database: ${DATABASE_PORT}`);

  // Initialize the system
  console.log('Initializing Context Keeper...');

  // Initialize managers
  console.log('Initializing Context Manager...');
  await contextManager.initialize();

  console.log('Initializing Backup Manager...');
  await backupManager.initialize();
  console.log('Starting automatic backups every 60 minutes');

  console.log('Initializing Monitoring Service...');
  await monitoringService.initialize();
  console.log('Started health monitoring with interval of 15 minutes');

  // Initialize Git integration
  console.log('Initializing Git Integration...');
  if (await gitIntegration.initialize()) {
    console.log('Git repository detected.');
  }

  // Initialize context capture
  console.log('Initializing Context Capture Service...');
  await contextCaptureService.initialize();
  console.log('Starting automatic context capture every 5 minutes');
  console.log('Context Capture Service initialized');

  // Set up routes
  app.use('/api/contexts', contextManager.router);
  app.use('/api/backups', backupManager.router);
  app.use('/api/health', (req, res) => {
    const health = monitoringService.getHealth();
    res.json(health);
  });

  // Start the server
  console.log(`Starting Dashboard Server (attempting to use port ${BACKEND_PORT})...`);
  app.listen(BACKEND_PORT, () => {
    console.log(`Found available port: ${BACKEND_PORT}`);
    console.log(`Dashboard server running at http://localhost:${BACKEND_PORT}`);
    console.log('Context Keeper system is running!');
    console.log(`Access the dashboard at http://localhost:${FRONTEND_PORT}`);
  });
}

// Start the server
startServer().catch(console.error);
