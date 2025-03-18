"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextRouter = createContextRouter;
exports.createBackupRouter = createBackupRouter;
exports.createHealthRouter = createHealthRouter;
const express_1 = require("express");
function createContextRouter(contextManager) {
    const router = (0, express_1.Router)();
    router.get('/', async (req, res) => {
        try {
            const contexts = await contextManager.getAllContexts();
            res.json(contexts);
        }
        catch (error) {
            console.error('Error getting contexts:', error);
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    router.post('/', async (req, res) => {
        const { content, metadata } = req.body;
        const context = await contextManager.addContext(content, metadata);
        res.json(context);
    });
    router.get('/:id', async (req, res) => {
        const context = await contextManager.getContext(req.params.id);
        if (!context) {
            res.status(404).json({ error: 'Context not found' });
            return;
        }
        res.json(context);
    });
    router.put('/:id', async (req, res) => {
        const { content, metadata } = req.body;
        const context = await contextManager.updateContext(req.params.id, content, metadata);
        if (!context) {
            res.status(404).json({ error: 'Context not found' });
            return;
        }
        res.json(context);
    });
    router.delete('/:id', async (req, res) => {
        const success = await contextManager.deleteContext(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Context not found' });
            return;
        }
        res.status(204).send();
    });
    return router;
}
function createBackupRouter(backupManager, contextManager) {
    const router = (0, express_1.Router)();
    router.post('/create', async (req, res) => {
        try {
            const contexts = await contextManager.getAllContexts();
            const backup = await backupManager.createBackup(contexts);
            res.json({ backupId: backup });
        }
        catch (error) {
            console.error('Error creating backup:', error);
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    router.get('/', async (req, res) => {
        try {
            const backups = await backupManager.listBackups();
            res.json(backups);
        }
        catch (error) {
            console.error('Error listing backups:', error);
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    router.post('/restore/:id', async (req, res) => {
        const success = await backupManager.restoreBackup(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Backup not found' });
            return;
        }
        res.status(204).send();
    });
    return router;
}
function createHealthRouter(monitoringService) {
    const router = (0, express_1.Router)();
    router.get('/', async (req, res) => {
        try {
            const status = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: {
                    monitoring: monitoringService.isInitialized() ? 'online' : 'offline'
                }
            };
            res.json(status);
        }
        catch (error) {
            console.error('Error getting health status:', error);
            res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
        }
    });
    return router;
}
