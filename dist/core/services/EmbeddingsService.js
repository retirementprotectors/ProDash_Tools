"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
class EmbeddingsService {
    constructor(apiKey, model = 'text-embedding-ada-002') {
        this.openai = new openai_1.default({ apiKey });
        this.model = model;
    }
    async getEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: this.model,
                input: text
            });
            if (!response.data[0]?.embedding) {
                throw new Error('No embedding returned from OpenAI API');
            }
            return response.data[0].embedding;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            (0, logger_1.logError)(err, { message: 'Failed to get embedding from OpenAI' });
            throw new errors_1.ServiceError(`Failed to get embedding: ${err.message}`);
        }
    }
    async getContextEmbedding(context) {
        const text = this.prepareContextText(context);
        return this.getEmbedding(text);
    }
    prepareContextText(context) {
        const parts = [context.content];
        if (context.metadata) {
            if (context.metadata.title) {
                parts.push(`Title: ${context.metadata.title}`);
            }
            if (context.metadata.description) {
                parts.push(`Description: ${context.metadata.description}`);
            }
            if (context.metadata.tags?.length) {
                parts.push(`Tags: ${context.metadata.tags.join(', ')}`);
            }
        }
        if (context.messages?.length) {
            const conversationText = context.messages
                .map(msg => `${msg.role}: ${msg.content}`)
                .join('\n');
            parts.push(`Conversation:\n${conversationText}`);
        }
        if (context.entities?.length) {
            const entitiesText = context.entities
                .map(entity => `${entity.type}: ${entity.name}`)
                .join('\n');
            parts.push(`Entities:\n${entitiesText}`);
        }
        if (context.learnings?.length) {
            const learningsText = context.learnings
                .map(learning => learning.content)
                .join('\n');
            parts.push(`Learnings:\n${learningsText}`);
        }
        return parts.join('\n\n');
    }
}
exports.EmbeddingsService = EmbeddingsService;
