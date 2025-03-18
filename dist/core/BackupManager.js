"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupManager = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class BackupManager {
    constructor() {
        this.VERSION = '1.0.0';
        this.initialized = false;
        this.backupInterval = null;
        this.config = {
            autoBackupEnabled: true,
            backupFrequencyMs: 60 * 60 * 1000, // 1 hour
            retentionPeriodDays: 30 // Keep backups for 30 days by default
        };
        this.backupPath = (0, path_1.join)(process.cwd(), '.context-keeper', 'backups');
    }
    // Method to check if the service is initialized
    isInitialized() {
        return this.initialized;
    }
    async initialize() {
        if (this.initialized)
            return;
        try {
            if (!(0, fs_1.existsSync)(this.backupPath)) {
                (0, fs_1.mkdirSync)(this.backupPath, { recursive: true });
                console.log(`Created backup directory: ${this.backupPath}`);
                // Create sample backups if directory is new
                await this.createSampleBackups();
            }
            this.initialized = true;
            // Start automatic backups if enabled
            if (this.config.autoBackupEnabled) {
                this.startAutomaticBackups();
            }
        }
        catch (error) {
            console.error('Failed to create backup directory:', error);
            this.initialized = true;
        }
    }
    async shutdown() {
        // Stop the automatic backup interval
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    }
    // Configure the backup settings
    setBackupConfig(config) {
        this.config = { ...this.config, ...config };
        // Restart automatic backups with new settings if needed
        if (this.initialized) {
            if (this.backupInterval) {
                clearInterval(this.backupInterval);
                this.backupInterval = null;
            }
            if (this.config.autoBackupEnabled) {
                this.startAutomaticBackups();
            }
        }
    }
    // Get the current backup configuration
    getBackupConfig() {
        return { ...this.config };
    }
    // Start the automatic backup process
    startAutomaticBackups() {
        // If there's already an interval running, don't start another one
        if (this.backupInterval) {
            console.log('Automatic backups already running. Skipping initialization.');
            return;
        }
        console.log(`Starting automatic backups every ${this.config.backupFrequencyMs / (60 * 1000)} minutes`);
        // Schedule the first backup to happen soon
        const initialBackupTimeout = setTimeout(() => {
            this.performAutomaticBackup();
            clearTimeout(initialBackupTimeout);
        }, 10000);
        // Set up regular interval for future backups
        this.backupInterval = setInterval(() => this.performAutomaticBackup(), this.config.backupFrequencyMs);
    }
    // Perform an automatic backup
    async performAutomaticBackup() {
        try {
            console.log('Performing automatic backup...');
            // Import and instantiate ContextManager only when needed
            // to avoid circular dependencies
            const { ContextManager } = require('./ContextManager');
            const contextManager = new ContextManager();
            await contextManager.initialize();
            const contexts = await contextManager.getAllContexts();
            const backupFile = await this.createBackup(contexts);
            console.log(`Automatic backup created: ${backupFile}`);
            // Clean up old backups
            await this.cleanupOldBackups();
        }
        catch (error) {
            console.error('Error during automatic backup:', error);
        }
    }
    // Remove backups older than the retention period
    async cleanupOldBackups() {
        try {
            if (!this.initialized)
                await this.initialize();
            const files = (0, fs_1.readdirSync)(this.backupPath);
            const retentionPeriodMs = this.config.retentionPeriodDays * 24 * 60 * 60 * 1000;
            const now = Date.now();
            let deletedCount = 0;
            for (const file of files) {
                if (!file.endsWith('.json'))
                    continue;
                const filePath = (0, path_1.join)(this.backupPath, file);
                const stats = (0, fs_1.statSync)(filePath);
                // Check file age based on file stats
                if (now - stats.mtimeMs > retentionPeriodMs) {
                    (0, fs_1.unlinkSync)(filePath);
                    deletedCount++;
                    console.log(`Deleted old backup: ${file}`);
                }
            }
            if (deletedCount > 0) {
                console.log(`Cleanup complete. Removed ${deletedCount} old backups.`);
            }
        }
        catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    }
    async createSampleBackups() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        // Create sample backup data
        const sampleBackups = [
            {
                timestamp: now - (7 * dayInMs), // 1 week ago
                contextCount: 5,
                version: this.VERSION
            },
            {
                timestamp: now - (3 * dayInMs), // 3 days ago
                contextCount: 8,
                version: this.VERSION
            },
            {
                timestamp: now - dayInMs, // 1 day ago
                contextCount: 10,
                version: this.VERSION
            }
        ];
        // Create sample context for the backups
        const sampleContexts = [
            {
                id: '1',
                content: 'Sample context 1',
                timestamp: now - (30 * dayInMs),
                metadata: { topic: 'Sample' }
            },
            {
                id: '2',
                content: 'Sample context 2',
                timestamp: now - (25 * dayInMs),
                metadata: { topic: 'Sample' }
            }
        ];
        // Save each sample backup
        for (const backup of sampleBackups) {
            const backupFileName = `backup-${backup.timestamp}.json`;
            const backupFilePath = (0, path_1.join)(this.backupPath, backupFileName);
            const backupData = {
                metadata: backup,
                contexts: sampleContexts
            };
            (0, fs_1.writeFileSync)(backupFilePath, JSON.stringify(backupData, null, 2));
        }
    }
    async createBackup(contexts) {
        if (!this.initialized)
            await this.initialize();
        const timestamp = Date.now();
        const backupFileName = `backup-${timestamp}.json`;
        const backupFilePath = (0, path_1.join)(this.backupPath, backupFileName);
        const backup = {
            metadata: {
                timestamp,
                contextCount: contexts.length,
                version: this.VERSION
            },
            contexts
        };
        try {
            if (!(0, fs_1.existsSync)(this.backupPath)) {
                (0, fs_1.mkdirSync)(this.backupPath, { recursive: true });
            }
            (0, fs_1.writeFileSync)(backupFilePath, JSON.stringify(backup, null, 2));
            return backupFileName;
        }
        catch (error) {
            console.error('Error creating backup:', error);
            throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async restoreBackup(backupFileName) {
        if (!this.initialized)
            await this.initialize();
        const backupFilePath = (0, path_1.join)(this.backupPath, backupFileName);
        try {
            if (!(0, fs_1.existsSync)(backupFilePath)) {
                throw new Error(`Backup file not found: ${backupFileName}`);
            }
            const backupData = (0, fs_1.readFileSync)(backupFilePath, 'utf8');
            const backup = JSON.parse(backupData);
            if (backup.metadata.version !== this.VERSION) {
                throw new Error(`Version mismatch: backup version ${backup.metadata.version} != current version ${this.VERSION}`);
            }
            return backup.contexts;
        }
        catch (error) {
            console.error('Error restoring backup:', error);
            throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async listBackups() {
        if (!this.initialized)
            await this.initialize();
        try {
            if (!(0, fs_1.existsSync)(this.backupPath)) {
                return [];
            }
            const files = (0, fs_1.readdirSync)(this.backupPath);
            const backupFiles = files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                try {
                    const data = (0, fs_1.readFileSync)((0, path_1.join)(this.backupPath, file), 'utf8');
                    const parsed = JSON.parse(data);
                    // Make sure we include the filename
                    return {
                        ...parsed.metadata,
                        filename: file
                    };
                }
                catch (error) {
                    console.error(`Error reading backup file ${file}:`, error);
                    return null;
                }
            })
                .filter((metadata) => metadata !== null);
            return backupFiles.sort((a, b) => b.timestamp - a.timestamp);
        }
        catch (error) {
            console.error('Failed to list backups:', error);
            return [];
        }
    }
}
exports.BackupManager = BackupManager;
