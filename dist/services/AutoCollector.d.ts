import { ContextManager } from '../core/ContextManager';
export declare class AutoCollector {
    private contextManager;
    private backupDir;
    private pollInterval;
    private backupInterval;
    private lastProcessedTimestamp;
    private sessionsDir;
    constructor(contextManager: ContextManager, backupDir?: string);
    start(): void;
    stop(): void;
    private pollNewChats;
    private createBackup;
    restore(backupFile: string): Promise<boolean>;
    private getNewChats;
}
