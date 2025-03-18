/**
 * ProDash_Tools Core
 * 
 * This file re-exports core utilities to make them easily accessible.
 */

// Core services
export { ContextManager } from './ContextManager';
export type { Context } from './ContextManager';

// Port configuration
export {
  DEFAULT_PORTS,
  findAvailablePort,
  generatePortFromProjectName,
  getProjectName
} from './PortConfig';

// Backup management
export { BackupManager } from './BackupManager';

// Git integration
export { GitIntegration } from './GitIntegration';

// Context capture
export { ContextCaptureService } from './ContextCaptureService';

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