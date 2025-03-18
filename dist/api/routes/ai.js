"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutes = aiRoutes;
const express_1 = require("express");
const AIContextManager_1 = require("@/core/AIContextManager");
function aiRoutes() {
    const router = (0, express_1.Router)();
    const aiContextManager = new AIContextManager_1.AIContextManager();
    // Initialize the AI Context Manager
    aiContextManager.initialize().catch(console.error);
    // Process a query with context awareness
    router.post('/process', async (req, res) => {
        try {
            const { query } = req.body;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    error: 'Invalid query. Must provide a string query.'
                });
            }
            const result = await aiContextManager.processUserQuery(query);
            res.json(result);
        }
        catch (error) {
            console.error('Error processing AI query:', error);
            res.status(500).json({
                error: 'Failed to process query',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Get configuration
    router.get('/config', (req, res) => {
        res.json(aiContextManager.getConfig());
    });
    // Update configuration
    router.put('/config', (req, res) => {
        try {
            aiContextManager.setConfig(req.body);
            res.json(aiContextManager.getConfig());
        }
        catch (error) {
            res.status(400).json({
                error: 'Invalid configuration',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return router;
}
