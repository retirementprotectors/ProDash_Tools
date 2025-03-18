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
exports.AIContextManager = void 0;
const ContextManager_1 = require("./ContextManager");
const ContextCaptureService_1 = require("./ContextCaptureService");
const tf = __importStar(require("@tensorflow/tfjs-node"));
const transformers_1 = require("@xenova/transformers");
const sentence_transformers_1 = require("sentence-transformers");
class AIContextManager {
    constructor() {
        this.config = {
            autoSearchEnabled: true,
            relevanceThreshold: 0.7,
            maxRelatedContexts: 5,
            learningEnabled: true,
            embeddingModel: 'all-MiniLM-L6-v2',
            contextWindowSize: 2048,
            minRelevanceScore: 0.6
        };
        this.contextManager = new ContextManager_1.ContextManager();
        this.captureService = new ContextCaptureService_1.ContextCaptureService();
    }
    async initialize() {
        await this.contextManager.initialize();
        await this.captureService.initialize();
        // Initialize NLP models
        this.encoder = new sentence_transformers_1.SentenceTransformer(this.config.embeddingModel);
        this.classifier = await (0, transformers_1.pipeline)('zero-shot-classification');
        console.log('AI Context Manager initialized with NLP capabilities');
    }
    getConfig() {
        return { ...this.config };
    }
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    async processUserQuery(query) {
        // Generate query embedding
        const queryEmbedding = await this.encoder.encode(query);
        // Get all potentially relevant contexts
        const contexts = await this.contextManager.searchContexts(query);
        // Calculate semantic similarity with embeddings
        const enhancedContexts = await Promise.all(contexts.map(async (context) => {
            const contextEmbedding = await this.encoder.encode(context.content);
            const similarity = this.cosineSimilarity(queryEmbedding, contextEmbedding);
            // Classify the context type
            const classification = await this.classifier(context.content, [
                'solution', 'explanation', 'error', 'success', 'interaction'
            ]);
            // Generate a suggested approach based on context type
            const suggestedApproach = await this.generateContextApproach(context.content, classification.labels[0]);
            return {
                id: context.id,
                content: context.content,
                embedding: contextEmbedding,
                metadata: {
                    type: context.metadata?.type || 'unknown',
                    topic: context.metadata?.topic,
                    confidence: similarity,
                    usageCount: context.metadata?.usageCount || 0,
                    lastUsed: context.metadata?.lastUsed || Date.now(),
                    relatedContexts: context.metadata?.relatedContexts || [],
                    parentContext: context.metadata?.parentContext,
                    contextType: classification.labels[0],
                    suggestedApproach
                }
            };
        }));
        // Filter and sort by relevance
        const relatedContexts = enhancedContexts
            .filter(context => context.metadata.confidence > this.config.minRelevanceScore)
            .sort((a, b) => b.metadata.confidence - a.metadata.confidence)
            .slice(0, this.config.maxRelatedContexts);
        // Generate approaches using context patterns
        const suggestedApproaches = await this.generateEnhancedSuggestions(query, relatedContexts);
        // Calculate overall confidence
        const confidence = relatedContexts.reduce((acc, ctx) => acc + ctx.metadata.confidence, 0) / (relatedContexts.length || 1);
        // Learn from this interaction
        if (this.config.learningEnabled) {
            await this.learnFromInteraction(query, relatedContexts, confidence);
        }
        return {
            relatedContexts,
            suggestedApproaches,
            confidence
        };
    }
    async captureResponse(sessionId, response, metadata) {
        if (!this.config.learningEnabled)
            return;
        // Generate embedding for the response
        const embedding = await this.encoder.encode(response);
        // Classify response type and topic
        const classification = await this.classifier(response, [
            'solution', 'explanation', 'question', 'error', 'success'
        ]);
        // Capture the AI's response with enhanced metadata
        await this.contextManager.addContext(response, {
            ...metadata,
            sessionId,
            timestamp: Date.now(),
            type: 'ai_response',
            embedding,
            classification: classification.labels[0],
            confidence: classification.scores[0],
            usageMetrics: {
                created: Date.now(),
                lastUsed: Date.now(),
                usageCount: 1
            }
        });
        // Update the session
        await this.captureService.updateSession(sessionId, response);
    }
    async generateContextApproach(content, contextType) {
        // Use zero-shot classification to determine the best approach
        const approaches = {
            solution: ['implement', 'modify', 'configure', 'setup'],
            explanation: ['understand', 'analyze', 'describe', 'compare'],
            error: ['debug', 'fix', 'resolve', 'prevent'],
            success: ['optimize', 'enhance', 'improve', 'extend'],
            interaction: ['discuss', 'clarify', 'explore', 'plan']
        };
        const classification = await this.classifier(content, approaches[contextType] || approaches.interaction);
        return `${classification.labels[0]} - ${content.substring(0, 100)}...`;
    }
    async generateEnhancedSuggestions(query, contexts) {
        return contexts.map(context => {
            const { confidence, contextType, suggestedApproach } = context.metadata;
            const relevanceNote = confidence > 0.8 ? 'highly relevant' : 'potentially relevant';
            return `${relevanceNote} ${contextType}: ${suggestedApproach || context.content.substring(0, 100)}... (${(confidence * 100).toFixed(1)}%)`;
        });
    }
    async learnFromInteraction(query, usedContexts, confidence) {
        // Update usage metrics for used contexts
        for (const context of usedContexts) {
            const updatedContext = {
                ...context,
                metadata: {
                    ...context.metadata,
                    usageCount: context.metadata.usageCount + 1,
                    lastUsed: Date.now()
                }
            };
            await this.contextManager.updateContext(context.id, updatedContext);
        }
        // Store the interaction pattern
        const interactionContext = {
            id: Date.now().toString(),
            content: JSON.stringify({ query, usedContextIds: usedContexts.map(c => c.id) }),
            embedding: await this.encoder.encode(query),
            metadata: {
                type: 'interaction_pattern',
                confidence,
                usageCount: 1,
                lastUsed: Date.now(),
                contextType: 'interaction',
                topic: 'query_pattern'
            }
        };
        await this.contextManager.addContext(interactionContext.id, interactionContext);
    }
    cosineSimilarity(a, b) {
        const dotProduct = tf.dot(a, b);
        const normA = tf.norm(a);
        const normB = tf.norm(b);
        return dotProduct.div(normA.mul(normB)).dataSync()[0];
    }
    async shutdown() {
        await this.captureService.shutdown();
    }
}
exports.AIContextManager = AIContextManager;
