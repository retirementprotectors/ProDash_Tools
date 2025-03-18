"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContextRoutes = createContextRoutes;
const express_1 = require("express");
const EnhancedContextService_1 = require("../../core/services/EnhancedContextService");
const VectorOperations_1 = require("../../core/services/VectorOperations");
function createContextRoutes(mongoUri, openAiKey) {
    const router = (0, express_1.Router)();
    const vectorOps = new VectorOperations_1.DefaultVectorOperations();
    const contextService = new EnhancedContextService_1.EnhancedContextService(vectorOps, openAiKey, mongoUri);
    // Initialize the service
    contextService.initialize().catch(error => {
        console.error('Failed to initialize context service:', error);
        process.exit(1);
    });
    // Middleware to handle errors
    const asyncHandler = (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
    // Create or update a context
    router.post('/contexts', asyncHandler(async (req, res) => {
        const context = req.body;
        const result = await contextService.upsertContext(context);
        res.json(result);
    }));
    // Get a context by ID
    router.get('/contexts/:id', asyncHandler(async (req, res) => {
        const context = await contextService.getContext(req.params.id);
        if (!context) {
            res.status(404).json({ error: 'Context not found' });
            return;
        }
        res.json(context);
    }));
    // Add a message to a context
    router.post('/contexts/:id/messages', asyncHandler(async (req, res) => {
        const message = req.body;
        const result = await contextService.addMessage(req.params.id, message);
        res.json(result);
    }));
    // Add an entity to a context
    router.post('/contexts/:id/entities', asyncHandler(async (req, res) => {
        const entity = req.body;
        const result = await contextService.addEntity(req.params.id, entity);
        res.json(result);
    }));
    // Add a learning to a context
    router.post('/contexts/:id/learnings', asyncHandler(async (req, res) => {
        const learning = req.body;
        const result = await contextService.addLearning(req.params.id, learning);
        res.json(result);
    }));
    // Add an outcome to a context
    router.post('/contexts/:id/outcomes', asyncHandler(async (req, res) => {
        const outcome = req.body;
        const result = await contextService.addOutcome(req.params.id, outcome);
        res.json(result);
    }));
    // Find similar contexts
    router.get('/contexts/:id/similar', asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const results = await contextService.findSimilar(req.params.id, limit);
        res.json(results);
    }));
    // Search contexts by text
    router.get('/contexts/search/text', asyncHandler(async (req, res) => {
        const text = req.query.q;
        if (!text) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        const results = await contextService.searchContexts(text);
        res.json(results);
    }));
    // Get contexts by project
    router.get('/contexts/search/project/:project', asyncHandler(async (req, res) => {
        const results = await contextService.getContextsByProject(req.params.project);
        res.json(results);
    }));
    // Get contexts by tags
    router.get('/contexts/search/tags', asyncHandler(async (req, res) => {
        const tags = req.query.tags.split(',');
        const results = await contextService.getContextsByTags(tags);
        res.json(results);
    }));
    // Get contexts by time range
    router.get('/contexts/search/timerange', asyncHandler(async (req, res) => {
        const start = parseInt(req.query.start);
        const end = parseInt(req.query.end);
        if (isNaN(start) || isNaN(end)) {
            res.status(400).json({ error: 'Invalid time range' });
            return;
        }
        const results = await contextService.getContextsByTimeRange(start, end);
        res.json(results);
    }));
    // Get contexts by priority
    router.get('/contexts/search/priority/:priority', asyncHandler(async (req, res) => {
        const results = await contextService.getContextsByPriority(req.params.priority);
        res.json(results);
    }));
    // Link contexts
    router.post('/contexts/:sourceId/link/:targetId', asyncHandler(async (req, res) => {
        const { type, strength } = req.body;
        await contextService.linkContexts(req.params.sourceId, req.params.targetId, type, strength);
        res.json({ success: true });
    }));
    // Delete a context
    router.delete('/contexts/:id', asyncHandler(async (req, res) => {
        const success = await contextService.deleteContext(req.params.id);
        if (!success) {
            res.status(404).json({ error: 'Context not found' });
            return;
        }
        res.json({ success: true });
    }));
    // Export all contexts
    router.get('/contexts/export/all', asyncHandler(async (req, res) => {
        const contexts = await contextService.exportContexts();
        res.json(contexts);
    }));
    // Import contexts
    router.post('/contexts/import', asyncHandler(async (req, res) => {
        const contexts = req.body;
        await contextService.importContexts(contexts);
        res.json({ success: true });
    }));
    // Error handling middleware
    router.use((err, req, res, next) => {
        console.error('API Error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: err.message
        });
    });
    return router;
}
