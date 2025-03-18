"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextRoutes = contextRoutes;
const express_1 = require("express");
function contextRoutes(contextManager) {
    const router = (0, express_1.Router)();
    // Get all contexts
    router.get('/', async (req, res) => {
        try {
            const contexts = await contextManager.getAllContexts();
            res.json(contexts);
        }
        catch (error) {
            console.error('Error getting all contexts:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Get a specific context by ID
    router.get('/:id', async (req, res) => {
        try {
            const context = await contextManager.getContext(req.params.id);
            if (!context) {
                return res.status(404).json({ error: 'Context not found' });
            }
            res.json(context);
        }
        catch (error) {
            console.error(`Error getting context ${req.params.id}:`, error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Create a new context
    router.post('/', async (req, res) => {
        try {
            const newContext = await contextManager.addContext(req.body);
            res.status(201).json(newContext);
        }
        catch (error) {
            console.error('Error creating context:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Update an existing context
    router.put('/:id', async (req, res) => {
        try {
            const updated = await contextManager.updateContext(req.params.id, req.body);
            if (!updated) {
                return res.status(404).json({ error: 'Context not found' });
            }
            res.json(updated);
        }
        catch (error) {
            console.error(`Error updating context ${req.params.id}:`, error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Delete a context
    router.delete('/:id', async (req, res) => {
        try {
            const success = await contextManager.deleteContext(req.params.id);
            if (!success) {
                return res.status(404).json({ error: 'Context not found' });
            }
            res.status(204).end();
        }
        catch (error) {
            console.error(`Error deleting context ${req.params.id}:`, error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    // Search contexts
    router.get('/search/:query', async (req, res) => {
        try {
            const query = req.params.query;
            const results = await contextManager.searchContexts(query);
            res.json(results);
        }
        catch (error) {
            console.error('Error searching contexts:', error);
            res.status(500).json({
                error: 'Failed to search contexts',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    return router;
}
