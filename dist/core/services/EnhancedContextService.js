"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedContextService = void 0;
const EmbeddingsService_1 = require("./EmbeddingsService");
const MongoContextStore_1 = require("../persistence/MongoContextStore");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class EnhancedContextService {
    constructor(vectorOps, mongoUri) {
        this.mongoUri = mongoUri;
        this.contexts = new Map();
        this.vectorOps = vectorOps;
        this.store = new MongoContextStore_1.MongoContextStore(mongoUri);
        this.embeddingsService = new EmbeddingsService_1.EmbeddingsService(process.env.OPENAI_API_KEY || '');
    }
    /**
     * Initializes the service
     */
    async initialize() {
        try {
            await this.store.connect();
            (0, logger_1.logInfo)('EnhancedContextService initialized');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to initialize EnhancedContextService' });
            throw error;
        }
    }
    /**
     * Creates a new context or updates an existing one
     */
    async addContext(context) {
        try {
            const embedding = await this.embeddingsService.getContextEmbedding({
                content: context.content,
                metadata: {
                    title: context.metadata.title,
                    description: context.metadata.description,
                    tags: context.metadata.tags
                },
                messages: context.conversation.messages,
                entities: context.knowledge.entities,
                learnings: context.knowledge.learnings
            });
            const contextWithEmbedding = {
                ...context,
                embedding
            };
            await this.store.addContext(contextWithEmbedding);
            (0, logger_1.logInfo)(`Added context with ID: ${context.id}`);
            return contextWithEmbedding;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to add context with ID: ${context.id}` });
            throw error;
        }
    }
    /**
     * Adds a message to an existing context
     */
    async addMessage(contextId, message) {
        const context = await this.getContext(contextId);
        if (!context) {
            throw new Error(`Context not found: ${contextId}`);
        }
        context.conversation.thread.push(message);
        context.metadata.updated = Date.now();
        // Update vectors based on new message
        await this.updateVectors(context);
        return this.addContext(context);
    }
    /**
     * Adds an entity to the knowledge base
     */
    async addEntity(contextId, entity) {
        const context = await this.getContext(contextId);
        if (!context) {
            throw new Error(`Context not found: ${contextId}`);
        }
        context.knowledge.entities.push(entity);
        context.metadata.updated = Date.now();
        // Update conceptual vectors
        await this.updateVectors(context);
        return this.addContext(context);
    }
    /**
     * Adds a learning to the knowledge base
     */
    async addLearning(contextId, learning) {
        const context = await this.getContext(contextId);
        if (!context) {
            throw new Error(`Context not found: ${contextId}`);
        }
        context.knowledge.learnings.push(learning);
        context.metadata.updated = Date.now();
        // Update vectors based on new learning
        await this.updateVectors(context);
        return this.addContext(context);
    }
    /**
     * Records an outcome in the context
     */
    async addOutcome(contextId, outcome) {
        const context = await this.getContext(contextId);
        if (!context) {
            throw new Error(`Context not found: ${contextId}`);
        }
        context.metadata.outcomes.push(outcome);
        context.metadata.updated = Date.now();
        return this.addContext(context);
    }
    /**
     * Updates vectors for the context
     */
    async updateVectors(context) {
        await this.embeddingsService.updateContextVectors(context);
    }
    /**
     * Finds similar contexts based on vector similarity
     */
    async findSimilar(contextId, limit = 5) {
        const sourceContext = await this.getContext(contextId);
        if (!sourceContext) {
            throw new Error(`Context not found: ${contextId}`);
        }
        const results = Array.from(this.contexts.values())
            .filter(c => c.id !== contextId)
            .map(context => ({
            context,
            similarity: this.vectorOps.similarity(context.vectorIndices.semantic, sourceContext.vectorIndices.semantic)
        }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
        return results;
    }
    /**
     * Retrieves a context by ID
     */
    async getContext(id) {
        return this.store.getContext(id);
    }
    /**
     * Updates specific fields in a context
     */
    async updateContext(id, update) {
        try {
            const context = await this.getContext(id);
            if (!context) {
                throw new Error(`Context not found: ${id}`);
            }
            const updatedContext = {
                ...context,
                ...update,
                metadata: {
                    ...context.metadata,
                    ...update.metadata,
                    updated: Date.now()
                }
            };
            if (update.content) {
                updatedContext.embedding = await this.embeddingsService.getContextEmbedding({
                    content: updatedContext.content,
                    metadata: {
                        title: updatedContext.metadata.title,
                        description: updatedContext.metadata.description,
                        tags: updatedContext.metadata.tags
                    },
                    messages: updatedContext.conversation.messages,
                    entities: updatedContext.knowledge.entities,
                    learnings: updatedContext.knowledge.learnings
                });
            }
            await this.store.updateContext(id, updatedContext);
            (0, logger_1.logInfo)(`Updated context with ID: ${id}`);
            return updatedContext;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to update context with ID: ${id}` });
            throw error;
        }
    }
    /**
     * Links two contexts together by creating a relationship
     */
    async linkContexts(sourceId, targetId, relationType, strength) {
        const source = await this.getContext(sourceId);
        const target = await this.getContext(targetId);
        if (!source || !target) {
            throw new Error('One or both contexts not found');
        }
        source.knowledge.relationships.push({
            source: sourceId,
            target: targetId,
            type: relationType,
            strength
        });
        await this.upsertContext(source);
    }
    /**
     * Exports all contexts for backup
     */
    async exportContexts() {
        try {
            return await this.store.getAllContexts();
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to export contexts'));
            throw error;
        }
    }
    /**
     * Imports contexts from a backup
     */
    async importContexts(contexts) {
        for (const context of contexts) {
            await this.upsertContext(context);
        }
    }
    /**
     * Searches contexts by text content
     */
    async searchContexts(query) {
        try {
            const queryVector = await this.embeddingsService.getEmbedding(query);
            return this.store.searchSimilar(queryVector);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to search contexts' });
            throw error;
        }
    }
    /**
     * Gets contexts by project
     */
    async getContextsByProject(project) {
        try {
            const contexts = await this.store.getContextsByProject(project);
            contexts.forEach(context => {
                this.contexts.set(context.id, context);
            });
            return contexts;
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to get contexts by project'));
            throw error;
        }
    }
    /**
     * Gets contexts by tags
     */
    async getContextsByTags(tags) {
        try {
            return this.store.getContextsByTags(tags);
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to get contexts by tags'));
            throw error;
        }
    }
    /**
     * Gets contexts by time range
     */
    async getContextsByTimeRange(start, end) {
        try {
            return this.store.getContextsByTimeRange(start, end);
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to get contexts by time range'));
            throw error;
        }
    }
    /**
     * Gets contexts by priority
     */
    async getContextsByPriority(priority) {
        try {
            return this.store.getContextsByPriority(priority);
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to get contexts by priority'));
            throw error;
        }
    }
    /**
     * Deletes a context
     */
    async deleteContext(contextId) {
        try {
            await this.store.deleteContext(contextId);
            this.contexts.delete(contextId);
            (0, logger_1.logInfo)('Context deleted', { contextId });
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to delete context'));
            throw error;
        }
    }
    /**
     * Closes all connections
     */
    async close() {
        await this.store.close();
    }
    async updateContextVectors(context) {
        try {
            // Update semantic vector
            const text = this.getContextText(context);
            context.vectors.semantic = await this.vectorOps.textToVector(text);
            // Update categorical vector
            context.vectors.categorical = await this.vectorOps.categoriesToVector([
                context.metadata.project,
                ...context.metadata.tags,
                context.metadata.priority
            ]);
        }
        catch (error) {
            (0, logger_1.logError)(error instanceof Error ? error : new Error('Failed to update context vectors'));
            throw error;
        }
    }
    getContextText(context) {
        return [
            context.metadata.title,
            context.metadata.description,
            ...context.conversation.thread.map(msg => msg.content),
            ...context.knowledge.entities.map(entity => `${entity.name}: ${entity.description}`),
            ...context.knowledge.learnings.map(learning => learning.content),
            ...context.knowledge.outcomes.map(outcome => outcome.description)
        ].join(' ');
    }
    validateContext(context) {
        if (!context.id)
            throw new errors_1.ValidationError('Context ID is required');
        if (!context.metadata.project)
            throw new errors_1.ValidationError('Project is required');
        if (!context.metadata.title)
            throw new errors_1.ValidationError('Title is required');
        if (!Array.isArray(context.metadata.tags))
            throw new errors_1.ValidationError('Tags must be an array');
        if (!context.metadata.priority)
            throw new errors_1.ValidationError('Priority is required');
    }
    async getAllContexts() {
        return this.store.getAllContexts();
    }
    matchesQuery(context, query) {
        const searchText = query.toLowerCase();
        const content = context.content.toLowerCase();
        const title = context.metadata.title.toLowerCase();
        const description = context.metadata.description.toLowerCase();
        const tags = context.metadata.tags.map(tag => tag.toLowerCase());
        return (content.includes(searchText) ||
            title.includes(searchText) ||
            description.includes(searchText) ||
            tags.includes(searchText));
    }
}
exports.EnhancedContextService = EnhancedContextService;
