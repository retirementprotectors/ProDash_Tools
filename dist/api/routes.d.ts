import { ContextManager } from '../core/ContextManager';
import { BackupManager } from '../core/BackupManager';
import { MonitoringService } from '../core/MonitoringService';
export declare function createContextRouter(contextManager: ContextManager): import("express-serve-static-core").Router;
export declare function createBackupRouter(backupManager: BackupManager, contextManager: ContextManager): import("express-serve-static-core").Router;
export declare function createHealthRouter(monitoringService: MonitoringService): import("express-serve-static-core").Router;
