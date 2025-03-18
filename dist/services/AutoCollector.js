"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoCollector = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class AutoCollector {
    constructor(contextManager, backupDir = './.backups') {
        this.contextManager = contextManager;
        this.backupDir = backupDir;
        this.pollInterval = null;
        this.backupInterval = null;
        this.lastProcessedTimestamp = Date.now();
        this.sessionsDir = (0, path_1.join)(process.cwd(), '.context-keeper', 'sessions');
        // Ensure directories exist
        [this.backupDir, this.sessionsDir].forEach(dir => {
            if (!(0, fs_1.existsSync)(dir)) {
                (0, fs_1.mkdirSync)(dir, { recursive: true });
            }
        });
    }
    start() {
        // Poll every 30 seconds
        this.pollInterval = setInterval(() => this.pollNewChats(), 30000);
        // Backup every 5 minutes
        this.backupInterval = setInterval(() => this.createBackup(), 300000);
    }
    stop() {
        if (this.pollInterval)
            clearInterval(this.pollInterval);
        if (this.backupInterval)
            clearInterval(this.backupInterval);
    }
    async pollNewChats() {
        try {
            const currentTime = Date.now();
            const newChats = await this.getNewChats(this.lastProcessedTimestamp);
            for (const chat of newChats) {
                await this.contextManager.addContext({
                    content: chat.content,
                    metadata: {
                        timestamp: chat.timestamp,
                        source: 'chat',
                        tags: chat.tags || []
                    }
                });
            }
            this.lastProcessedTimestamp = currentTime;
        }
        catch (error) {
            console.error('Failed to poll chats:', error);
        }
    }
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = (0, path_1.join)(this.backupDir, `backup-${timestamp}.json`);
            const contexts = await this.contextManager.getAllContexts();
            await (0, promises_1.writeFile)(backupPath, JSON.stringify(contexts, null, 2));
        }
        catch (error) {
            console.error('Failed to create backup:', error);
        }
    }
    async restore(backupFile) {
        try {
            const data = await (0, promises_1.readFile)((0, path_1.join)(this.backupDir, backupFile), 'utf-8');
            const contexts = JSON.parse(data);
            // Clear existing contexts
            // Add contexts from backup
            for (const context of contexts) {
                await this.contextManager.addContext(context);
            }
            return true;
        }
        catch (error) {
            console.error('Failed to restore from backup:', error);
            return false;
        }
    }
    async getNewChats(since) {
        try {
            const files = (0, fs_1.readdirSync)(this.sessionsDir)
                .filter(f => f.endsWith('.json'))
                .map(f => (0, path_1.join)(this.sessionsDir, f));
            const newChats = [];
            for (const file of files) {
                const stats = await (0, promises_1.readFile)(file, 'utf-8')
                    .then(data => JSON.parse(data))
                    .catch(() => null);
                if (stats && stats.timestamp > since) {
                    // Extract relevant chat data
                    newChats.push({
                        content: stats.content || stats.message || stats.text || '',
                        timestamp: stats.timestamp,
                        tags: [
                            ...(stats.tags || []),
                            stats.type || 'chat',
                            stats.source || 'session'
                        ]
                    });
                }
            }
            return newChats;
        }
        catch (error) {
            console.error('Failed to read chat files:', error);
            return [];
        }
    }
}
exports.AutoCollector = AutoCollector;
