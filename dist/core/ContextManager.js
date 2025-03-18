"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const mongodb_1 = require("mongodb");
const openai_1 = __importDefault(require("openai"));
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
class ContextManager {
    constructor(mongoUrl, openaiKey) {
        this.mongoUrl = mongoUrl;
        this.openaiKey = openaiKey;
        this.initialized = false;
        this.openai = new openai_1.default({ apiKey: openaiKey });
    }
    async initialize() {
        if (this.initialized)
            return;
        await this.connect();
        this.initialized = true;
    }
    async connect() {
        try {
            this.client = await mongodb_1.MongoClient.connect(this.mongoUrl);
            this.db = this.client.db('prodash_master');
            this.collection = this.db.collection('contexts');
            // Create indexes for common queries
            await this.collection.createIndex({ 'metadata.tags': 1 });
            await this.collection.createIndex({ 'metadata.timestamp': 1 });
            await this.collection.createIndex({ embedding: '2dsphere' });
            logger.info('Connected to MongoDB');
        }
        catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }
    async close() {
        await this.client?.close();
    }
    async getEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text
            });
            return response.data[0].embedding;
        }
        catch (error) {
            logger.error('Failed to get embedding:', error);
            return [];
        }
    }
    async addContext(content, metadata = {}) {
        try {
            const newContext = {
                id: Date.now().toString(),
                content,
                metadata: {
                    timestamp: Date.now(),
                    ...metadata
                },
                embedding: await this.getEmbedding(content)
            };
            await this.collection.insertOne(newContext);
            logger.info(`Added context with ID: ${newContext.id}`);
            return newContext;
        }
        catch (error) {
            logger.error('Failed to add context:', error);
            throw error;
        }
    }
    async getContext(id) {
        return this.collection.findOne({ id });
    }
    async getAllContexts() {
        try {
            return this.collection.find({}).toArray();
        }
        catch (error) {
            logger.error('Failed to get all contexts:', error);
            throw error;
        }
    }
    async getContextCount() {
        return this.collection.countDocuments();
    }
    async updateContext(id, update) {
        try {
            const result = await this.collection.findOneAndUpdate({ id }, { $set: update }, { returnDocument: 'after' });
            return result;
        }
        catch (error) {
            logger.error(`Failed to update context ${id}:`, error);
            throw error;
        }
    }
    async deleteContext(id) {
        try {
            const result = await this.collection.deleteOne({ id });
            return result.deletedCount > 0;
        }
        catch (error) {
            logger.error(`Failed to delete context ${id}:`, error);
            throw error;
        }
    }
    async clearAllContexts() {
        try {
            await this.collection.deleteMany({});
        }
        catch (error) {
            logger.error('Failed to clear contexts:', error);
            throw error;
        }
    }
    async searchContexts(options) {
        try {
            const query = {};
            if (typeof options === 'string') {
                const embedding = await this.getEmbedding(options);
                if (embedding.length) {
                    query.embedding = {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: embedding
                            }
                        }
                    };
                }
            }
            else {
                if (options.tags?.length) {
                    query['metadata.tags'] = { $in: options.tags };
                }
                if (options.query) {
                    const embedding = await this.getEmbedding(options.query);
                    if (embedding.length) {
                        query.embedding = {
                            $near: {
                                $geometry: {
                                    type: 'Point',
                                    coordinates: embedding
                                }
                            }
                        };
                    }
                }
            }
            return this.collection
                .find(query)
                .limit(typeof options === 'object' ? options.limit || 10 : 10)
                .toArray();
        }
        catch (error) {
            logger.error('Failed to search contexts:', error);
            throw error;
        }
    }
    isInitialized() {
        return this.initialized;
    }
}
exports.ContextManager = ContextManager;
