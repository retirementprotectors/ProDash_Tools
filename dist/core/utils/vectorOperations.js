"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultVectorOperations = void 0;
const openai_1 = __importDefault(require("openai"));
const logger_1 = require("./logger");
const errors_1 = require("./errors");
class DefaultVectorOperations {
    constructor(apiKey, model = 'text-embedding-ada-002') {
        this.openai = new openai_1.default({ apiKey });
        this.model = model;
    }
    async textToVector(text) {
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
            (0, logger_1.logError)(err, { message: 'Failed to convert text to vector' });
            throw new errors_1.ServiceError(`Failed to convert text to vector: ${err.message}`);
        }
    }
    similarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have the same length');
        }
        const dotProduct = a.reduce((sum, value, i) => sum + value * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }
        return dotProduct / (magnitudeA * magnitudeB);
    }
}
exports.DefaultVectorOperations = DefaultVectorOperations;
