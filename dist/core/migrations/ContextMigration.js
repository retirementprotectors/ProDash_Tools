"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureLatestSchema = exports.validateContext = exports.migrateLegacyContext = void 0;
const Vector_1 = require("../types/Vector");
/**
 * Migrates a legacy context to the enhanced format
 */
const migrateLegacyContext = async (legacyContext) => {
    const now = Date.now();
    // Create a basic conversation message from the legacy content
    const conversationMessage = {
        id: `msg_${now}`,
        role: 'system',
        content: legacyContext.content.content,
        timestamp: legacyContext.timestamp,
        references: {
            files: [],
            codeBlocks: [],
            previousContexts: [],
            externalResources: []
        },
        actions: [],
        metadata: {}
    };
    // Create the enhanced context
    const enhancedContext = {
        id: legacyContext.id,
        session: {
            id: `session_${now}`,
            startTime: legacyContext.timestamp,
            endTime: now,
            projectState: {
                files: [],
                gitHash: '',
                environment: {},
                dependencies: {},
                configState: {},
                systemMetrics: {
                    memory: 0,
                    cpu: 0,
                    timestamp: now
                }
            }
        },
        conversation: {
            thread: [conversationMessage],
            summary: legacyContext.content.content,
            keyPoints: [],
            sentiment: 0
        },
        knowledge: {
            entities: [],
            learnings: [],
            relationships: []
        },
        metadata: {
            tags: legacyContext.content.metadata.tags || [],
            priority: (legacyContext.content.metadata.priority || 'medium'),
            project: '',
            domain: [],
            capabilities: [],
            outcomes: [],
            version: '1.0.0',
            created: legacyContext.timestamp,
            updated: now,
            accessCount: 0,
            lastAccessed: now
        },
        vectorIndices: {
            semantic: new Array(Vector_1.VECTOR_DIMENSIONS.SEMANTIC).fill(0),
            conceptual: new Array(Vector_1.VECTOR_DIMENSIONS.CONCEPTUAL).fill(0),
            temporal: new Array(Vector_1.VECTOR_DIMENSIONS.TEMPORAL).fill(0),
            categorical: new Array(Vector_1.VECTOR_DIMENSIONS.CATEGORICAL).fill(0)
        },
        schema: {
            version: '1.0.0',
            compatibility: ['1.0.0'],
        }
    };
    return enhancedContext;
};
exports.migrateLegacyContext = migrateLegacyContext;
/**
 * Validates an enhanced context against the current schema
 */
const validateContext = (context) => {
    // Basic validation checks
    if (!context.id || !context.session || !context.conversation || !context.knowledge) {
        return false;
    }
    // Version compatibility check
    const currentVersion = '1.0.0';
    if (!context.schema.compatibility.includes(currentVersion)) {
        return false;
    }
    // Vector dimensions validation
    if (context.vectorIndices.semantic.length !== Vector_1.VECTOR_DIMENSIONS.SEMANTIC ||
        context.vectorIndices.conceptual.length !== Vector_1.VECTOR_DIMENSIONS.CONCEPTUAL ||
        context.vectorIndices.temporal.length !== Vector_1.VECTOR_DIMENSIONS.TEMPORAL ||
        context.vectorIndices.categorical.length !== Vector_1.VECTOR_DIMENSIONS.CATEGORICAL) {
        return false;
    }
    return true;
};
exports.validateContext = validateContext;
/**
 * Updates an existing context to the latest schema version if needed
 */
const ensureLatestSchema = async (context) => {
    // If it's a legacy context, migrate it
    if (!context.schema) {
        return (0, exports.migrateLegacyContext)(context);
    }
    // If it's already an enhanced context but needs validation
    if (!(0, exports.validateContext)(context)) {
        throw new Error(`Invalid context schema: ${context.id}`);
    }
    return context;
};
exports.ensureLatestSchema = ensureLatestSchema;
