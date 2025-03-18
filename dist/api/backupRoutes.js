"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRoutes = backupRoutes;
const express_1 = require("express");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function backupRoutes(backupManager, contextManager) {
    const router = (0, express_1.Router)();
    // Get all backups
    router.get('/', async (req, res) => {
        try {
            const backups = await backupManager.listBackups();
            res.json(backups);
        }
        catch (error) {
            console.error('Error listing backups:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Create a backup
    router.post('/', async (req, res) => {
        try {
            // Get all contexts to back up
            const contexts = await contextManager.getAllContexts();
            const backup = await backupManager.createBackup(contexts);
            res.status(201).json({ backupFile: backup });
        }
        catch (error) {
            console.error('Error creating backup:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Restore from a backup
    router.post('/restore', async (req, res) => {
        try {
            const { backupFile } = req.body;
            if (!backupFile) {
                return res.status(400).json({ error: 'Backup file is required' });
            }
            const contexts = await backupManager.restoreBackup(backupFile);
            // Replace all existing contexts with the ones from the backup
            await contextManager.clearAllContexts();
            // Add each context from the backup
            let contextCount = 0;
            for (const context of contexts) {
                // Since we don't know the exact structure required by addContext,
                // we'll pass the entire context object and let the manager handle it
                await contextManager.addContext(context);
                contextCount++;
            }
            res.json({
                message: 'Backup restored successfully',
                contextCount
            });
        }
        catch (error) {
            console.error('Error restoring from backup:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Delete a backup
    router.delete('/:filename', async (req, res) => {
        try {
            const { filename } = req.params;
            // Check if the file exists before trying to delete it
            const backups = await backupManager.listBackups();
            const exists = Array.isArray(backups) && backups.some((backup) => typeof backup === 'string' && backup.indexOf(filename) >= 0);
            if (!exists) {
                return res.status(404).json({ error: 'Backup not found' });
            }
            // Use filesystem module to delete the file since BackupManager doesn't have deleteFile
            const backupDir = path.resolve(process.cwd(), '.context-keeper', 'backups');
            const backupPath = path.join(backupDir, filename);
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
                res.json({ message: 'Backup deleted successfully' });
            }
            else {
                res.status(404).json({ error: 'Backup file not found' });
            }
        }
        catch (error) {
            console.error('Error deleting backup:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Get backup configuration
    router.get('/config', (req, res) => {
        try {
            const config = backupManager.getBackupConfig();
            res.json(config);
        }
        catch (error) {
            console.error('Error getting backup configuration:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Update backup configuration
    router.put('/config', async (req, res) => {
        try {
            backupManager.setBackupConfig(req.body);
            const updatedConfig = backupManager.getBackupConfig();
            res.json(updatedConfig);
        }
        catch (error) {
            console.error('Error updating backup configuration:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return router;
}
