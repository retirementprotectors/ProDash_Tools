"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoContextStore = void 0;
const mongodb_1 = require("mongodb");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class MongoContextStore {
    constructor(mongoUri) {
        this.mongoUri = mongoUri;
        this.client = new mongodb_1.MongoClient(mongoUri);
    }
    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db('prodash');
            this.collection = this.db.collection('contexts');
            // Create indexes for optimized queries
            await this.collection.createIndex({ id: 1 }, { unique: true });
            await this.collection.createIndex({ embedding: '2dsphere' });
            await this.collection.createIndex({ 'metadata.project': 1 });
            await this.collection.createIndex({ 'metadata.tags': 1 });
            await this.collection.createIndex({ 'metadata.priority': 1 });
            await this.collection.createIndex({ 'metadata.created': 1 });
            await this.collection.createIndex({ 'metadata.updated': 1 });
            (0, logger_1.logInfo)('Connected to MongoDB');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to connect to MongoDB' });
            throw new errors_1.DatabaseError(`Failed to connect to MongoDB: ${err.message}`);
        }
    }
    async addContext(context) {
        try {
            await this.collection.insertOne(context);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to add context: ${context.id}` });
            throw new errors_1.DatabaseError(`Failed to add context: ${err.message}`);
        }
    }
    async updateContext(id, context) {
        try {
            const result = await this.collection.replaceOne({ id }, context);
            if (result.matchedCount === 0) {
                throw new errors_1.DatabaseError(`Context not found: ${id}`);
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to update context: ${id}` });
            throw new errors_1.DatabaseError(`Failed to update context: ${err.message}`);
        }
    }
    async getContext(id) {
        try {
            return await this.collection.findOne({ id });
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to get context: ${id}` });
            throw new errors_1.DatabaseError(`Failed to get context: ${err.message}`);
        }
    }
    async getAllContexts() {
        try {
            return await this.collection.find().toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to get all contexts' });
            throw new errors_1.DatabaseError(`Failed to get all contexts: ${err.message}`);
        }
    }
    async searchSimilar(queryVector) {
        try {
            return await this.collection.find({
                embedding: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: queryVector
                        },
                        $maxDistance: 0.5 // Adjust this threshold as needed
                    }
                }
            }).toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to search similar contexts' });
            throw new errors_1.DatabaseError(`Failed to search similar contexts: ${err.message}`);
        }
    }
    async getContextsByProject(project) {
        try {
            return await this.collection.find({
                'metadata.project': project
            }).toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to get contexts by project: ${project}` });
            throw new errors_1.DatabaseError(`Failed to get contexts by project: ${err.message}`);
        }
    }
    async getContextsByTags(tags) {
        try {
            return await this.collection.find({
                'metadata.tags': { $in: tags }
            }).toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to get contexts by tags: ${tags.join(', ')}` });
            throw new errors_1.DatabaseError(`Failed to get contexts by tags: ${err.message}`);
        }
    }
    async getContextsByTimeRange(start, end) {
        try {
            return await this.collection.find({
                'metadata.created': {
                    $gte: start,
                    $lte: end
                }
            }).toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to get contexts by time range: ${start} - ${end}` });
            throw new errors_1.DatabaseError(`Failed to get contexts by time range: ${err.message}`);
        }
    }
    async getContextsByPriority(priority) {
        try {
            return await this.collection.find({
                'metadata.priority': priority
            }).toArray();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to get contexts by priority: ${priority}` });
            throw new errors_1.DatabaseError(`Failed to get contexts by priority: ${err.message}`);
        }
    }
    async deleteContext(id) {
        try {
            const result = await this.collection.deleteOne({ id });
            if (result.deletedCount === 0) {
                throw new errors_1.DatabaseError(`Context not found: ${id}`);
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: `Failed to delete context: ${id}` });
            throw new errors_1.DatabaseError(`Failed to delete context: ${err.message}`);
        }
    }
    async close() {
        try {
            await this.client.close();
            (0, logger_1.logInfo)('Closed MongoDB connection');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to close MongoDB connection' });
            throw new errors_1.DatabaseError(`Failed to close MongoDB connection: ${err.message}`);
        }
    }
}
exports.MongoContextStore = MongoContextStore;
