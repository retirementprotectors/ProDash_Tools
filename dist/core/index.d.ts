/**
 * ProDash_Tools Core
 *
 * This file re-exports core utilities to make them easily accessible.
 */
export { ContextManager } from './ContextManager';
export type { Context } from './ContextManager';
export { DEFAULT_PORTS, findAvailablePort, generatePortFromProjectName, getProjectName } from './PortConfig';
export { BackupManager } from './BackupManager';
export { GitIntegration } from './GitIntegration';
export { ContextCaptureService } from './ContextCaptureService';
export declare function getContextManager(): any;
export declare function getBackupManager(): any;
export declare function getGitIntegration(): any;
export declare function getContextCaptureService(): any;
