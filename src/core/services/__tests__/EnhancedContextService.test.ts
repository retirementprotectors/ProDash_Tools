import { EnhancedContextService } from '../EnhancedContextService';
import { DefaultVectorOperations } from '../VectorOperations';
import { EnhancedContext, ConversationMessage, Entity, Learning } from '../../types/Context';
import { MongoContextStore } from '../../persistence/MongoContextStore';

// Mock MongoDB store
jest.mock('../../persistence/MongoContextStore');

// Mock OpenAI embeddings service
jest.mock('../EmbeddingsService');

describe('EnhancedContextService', () => {
  let service: EnhancedContextService;
  let vectorOps: DefaultVectorOperations;
  
  const mockContext: EnhancedContext = {
    id: 'test-context-1',
    session: {
      id: 'test-session-1',
      startTime: Date.now(),
      endTime: Date.now(),
      projectState: {
        files: [],
        gitHash: '',
        environment: {},
        dependencies: {},
        configState: {},
        systemMetrics: {
          memory: 0,
          cpu: 0,
          timestamp: Date.now()
        }
      }
    },
    conversation: {
      thread: [],
      summary: 'Test context',
      keyPoints: [],
      sentiment: 0
    },
    knowledge: {
      entities: [],
      learnings: [],
      relationships: []
    },
    metadata: {
      tags: ['test'],
      priority: 'medium',
      project: 'test-project',
      domain: [],
      capabilities: [],
      outcomes: [],
      version: '1.0.0',
      created: Date.now(),
      updated: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    },
    vectorIndices: {
      semantic: [],
      conceptual: [],
      temporal: [],
      categorical: []
    },
    schema: {
      version: '1.0.0',
      compatibility: ['1.0.0']
    }
  };

  beforeEach(async () => {
    vectorOps = new DefaultVectorOperations();
    service = new EnhancedContextService(
      vectorOps,
      'test-openai-key',
      'mongodb://localhost:27017',
      'test-db'
    );
    await service.initialize();
  });

  afterEach(async () => {
    await service.close();
    jest.clearAllMocks();
  });

  describe('Context Management', () => {
    it('should create and retrieve a context', async () => {
      const result = await service.upsertContext(mockContext);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockContext.id);

      const retrieved = await service.getContext(mockContext.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(mockContext.id);
      expect(retrieved?.metadata.accessCount).toBe(1);
    });

    it('should update an existing context', async () => {
      await service.upsertContext(mockContext);
      
      const updatedContext = {
        ...mockContext,
        metadata: {
          ...mockContext.metadata,
          tags: [...mockContext.metadata.tags, 'updated'],
          priority: 'high' as const
        }
      };

      const result = await service.upsertContext(updatedContext);
      expect(result.metadata.tags).toContain('updated');
      expect(result.metadata.priority).toBe('high');
    });

    it('should delete a context', async () => {
      await service.upsertContext(mockContext);
      const success = await service.deleteContext(mockContext.id);
      expect(success).toBe(true);

      const deleted = await service.getContext(mockContext.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Conversation Management', () => {
    it('should add a message to a context', async () => {
      await service.upsertContext(mockContext);

      const message: ConversationMessage = {
        id: 'test-message-1',
        role: 'user',
        content: 'Test message',
        timestamp: Date.now(),
        references: {
          files: [],
          codeBlocks: [],
          previousContexts: [],
          externalResources: []
        },
        actions: [],
        metadata: {}
      };

      const result = await service.addMessage(mockContext.id, message);
      expect(result.conversation.thread).toHaveLength(1);
      expect(result.conversation.thread[0].content).toBe(message.content);
    });
  });

  describe('Knowledge Management', () => {
    it('should add an entity to a context', async () => {
      await service.upsertContext(mockContext);

      const entity: Entity = {
        id: 'test-entity-1',
        type: 'function',
        name: 'testFunction',
        description: 'A test function',
        relationships: [],
        properties: {},
        version: '1.0.0',
        created: Date.now(),
        updated: Date.now()
      };

      const result = await service.addEntity(mockContext.id, entity);
      expect(result.knowledge.entities).toHaveLength(1);
      expect(result.knowledge.entities[0].name).toBe(entity.name);
    });

    it('should add a learning to a context', async () => {
      await service.upsertContext(mockContext);

      const learning: Learning = {
        id: 'test-learning-1',
        type: 'pattern',
        description: 'A test learning',
        confidence: 0.9,
        evidence: [],
        applicabilityConditions: [],
        impact: {
          positive: [],
          negative: []
        },
        usage: {
          successCount: 0,
          failureCount: 0,
          lastUsed: Date.now()
        },
        version: '1.0.0'
      };

      const result = await service.addLearning(mockContext.id, learning);
      expect(result.knowledge.learnings).toHaveLength(1);
      expect(result.knowledge.learnings[0].description).toBe(learning.description);
    });
  });

  describe('Search and Similarity', () => {
    it('should find similar contexts', async () => {
      const context1 = { ...mockContext, id: 'context-1' };
      const context2 = { 
        ...mockContext, 
        id: 'context-2',
        metadata: { ...mockContext.metadata, project: 'other-project' }
      };

      await service.upsertContext(context1);
      await service.upsertContext(context2);

      const results = await service.findSimilar(context1.id, 5);
      expect(results).toHaveLength(1); // Should find context2
      expect(results[0].context.id).toBe(context2.id);
    });

    it('should find contexts by project', async () => {
      await service.upsertContext(mockContext);
      
      const results = await service.getContextsByProject(mockContext.metadata.project);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(mockContext.id);
    });

    it('should find contexts by tags', async () => {
      await service.upsertContext(mockContext);
      
      const results = await service.getContextsByTags(mockContext.metadata.tags);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(mockContext.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent context', async () => {
      const result = await service.getContext('non-existent');
      expect(result).toBeNull();
    });

    it('should handle invalid context updates', async () => {
      await expect(service.addMessage('non-existent', {
        id: 'test',
        role: 'user',
        content: 'test',
        timestamp: Date.now(),
        references: { files: [], codeBlocks: [], previousContexts: [], externalResources: [] },
        actions: [],
        metadata: {}
      })).rejects.toThrow('Context not found');
    });
  });
}); 