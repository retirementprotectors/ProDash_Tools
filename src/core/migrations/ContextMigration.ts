import { EnhancedContext, ContextMigration } from '../types/Context';
import { VECTOR_DIMENSIONS } from '../types/Vector';

interface LegacyContext {
  id: string;
  content: {
    content: string;
    metadata: {
      tags: string[];
      priority: string;
    };
  };
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * Migrates a legacy context to the enhanced format
 */
export const migrateLegacyContext: ContextMigration = async (legacyContext: LegacyContext): Promise<EnhancedContext> => {
  const now = Date.now();
  
  // Create a basic conversation message from the legacy content
  const conversationMessage = {
    id: `msg_${now}`,
    role: 'system' as const,
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
  const enhancedContext: EnhancedContext = {
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
      priority: (legacyContext.content.metadata.priority || 'medium') as any,
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
      semantic: new Array(VECTOR_DIMENSIONS.SEMANTIC).fill(0),
      conceptual: new Array(VECTOR_DIMENSIONS.CONCEPTUAL).fill(0),
      temporal: new Array(VECTOR_DIMENSIONS.TEMPORAL).fill(0),
      categorical: new Array(VECTOR_DIMENSIONS.CATEGORICAL).fill(0)
    },
    schema: {
      version: '1.0.0',
      compatibility: ['1.0.0'],
    }
  };

  return enhancedContext;
};

/**
 * Validates an enhanced context against the current schema
 */
export const validateContext = (context: EnhancedContext): boolean => {
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
  if (
    context.vectorIndices.semantic.length !== VECTOR_DIMENSIONS.SEMANTIC ||
    context.vectorIndices.conceptual.length !== VECTOR_DIMENSIONS.CONCEPTUAL ||
    context.vectorIndices.temporal.length !== VECTOR_DIMENSIONS.TEMPORAL ||
    context.vectorIndices.categorical.length !== VECTOR_DIMENSIONS.CATEGORICAL
  ) {
    return false;
  }

  return true;
};

/**
 * Updates an existing context to the latest schema version if needed
 */
export const ensureLatestSchema = async (context: any): Promise<EnhancedContext> => {
  // If it's a legacy context, migrate it
  if (!context.schema) {
    return migrateLegacyContext(context);
  }

  // If it's already an enhanced context but needs validation
  if (!validateContext(context)) {
    throw new Error(`Invalid context schema: ${context.id}`);
  }

  return context;
}; 