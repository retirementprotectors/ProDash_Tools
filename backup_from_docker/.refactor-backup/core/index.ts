/**
 * ProDash_Tools Core
 * 
 * This file re-exports core utilities to make them easily accessible.
 */

// Context Management
export { ContextManager } from './context-keeper/ContextManager';
export type { Context } from './context-keeper/ContextManager';

// Port Management
export { 
  findAvailablePort, 
  DEFAULT_PORTS,
  generatePortFromProjectName,
  getProjectName
} from './utils/PortConfig';

// Backup Management
export { BackupManager } from './context-keeper/BackupManager';

// Git Integration
export { GitIntegration } from './context-keeper/GitIntegration';

// Context Capture
export { ContextCaptureService } from './context-keeper/ContextCaptureService';

/**
 * Get a single context manager instance
 * @returns A singleton ContextManager instance
 */
let contextManagerInstance: any = null;
export function getContextManager() {
  if (!contextManagerInstance) {
    const { ContextManager } = require('./context-keeper/ContextManager');
    contextManagerInstance = new ContextManager();
    contextManagerInstance.initialize().catch(console.error);
  }
  return contextManagerInstance;
}

/**
 * Get a single backup manager instance
 * @returns A singleton BackupManager instance
 */
let backupManagerInstance: any = null;
export function getBackupManager() {
  if (!backupManagerInstance) {
    const { BackupManager } = require('./context-keeper/BackupManager');
    backupManagerInstance = new BackupManager();
    backupManagerInstance.initialize().catch(console.error);
  }
  return backupManagerInstance;
}

/**
 * Get a single git integration instance
 * @returns A singleton GitIntegration instance
 */
let gitIntegrationInstance: any = null;
export function getGitIntegration() {
  if (!gitIntegrationInstance) {
    const { GitIntegration } = require('./context-keeper/GitIntegration');
    gitIntegrationInstance = new GitIntegration();
    gitIntegrationInstance.initialize().catch(console.error);
  }
  return gitIntegrationInstance;
}

/**
 * Get a single context capture service instance
 * @returns A singleton ContextCaptureService instance
 */
let contextCaptureServiceInstance: any = null;
export function getContextCaptureService() {
  if (!contextCaptureServiceInstance) {
    const { ContextCaptureService } = require('./context-keeper/ContextCaptureService');
    contextCaptureServiceInstance = new ContextCaptureService();
    contextCaptureServiceInstance.initialize().catch(console.error);
  }
  return contextCaptureServiceInstance;
} 