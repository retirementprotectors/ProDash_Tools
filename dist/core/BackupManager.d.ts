import { Context } from './ContextManager';
interface BackupMetadata {
    timestamp: number;
    contextCount: number;
    version: string;
}
interface BackupConfig {
    autoBackupEnabled: boolean;
    backupFrequencyMs: number;
    retentionPeriodDays: number;
}
export declare class BackupManager {
    private backupPath;
    private readonly VERSION;
    initialized: boolean;
    private backupInterval;
    private config;
    constructor();
    isInitialized(): boolean;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    setBackupConfig(config: Partial<BackupConfig>): void;
    getBackupConfig(): BackupConfig;
    private startAutomaticBackups;
    private performAutomaticBackup;
    private cleanupOldBackups;
    private createSampleBackups;
    createBackup(contexts: Context[]): Promise<string>;
    restoreBackup(backupFileName: string): Promise<Context[]>;
    listBackups(): Promise<BackupMetadata[]>;
}
export {};
