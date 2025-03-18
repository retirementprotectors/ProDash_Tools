import { MongoContextStore } from '../MongoContextStore';
import { MongoClient } from 'mongodb';
import { EnhancedContext } from '../../types/Context';

jest.mock('mongodb');

describe('MongoContextStore', () => {
  let store: MongoContextStore;
  const mockMongoClient = {
    connect: jest.fn(),
    db: jest.fn(),
    close: jest.fn()
  };
  const mockCollection = {
    createIndex: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    deleteOne: jest.fn()
  };
  const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
  };

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
      priority: 'medium' as const,
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
    jest.clearAllMocks();
    (MongoClient as unknown as jest.Mock).mockImplementation(() => mockMongoClient);
    mockMongoClient.db.mockReturnValue(mockDb);
    mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

    store = new MongoContextStore('mongodb://localhost:27017', 'test-db');
    await store.initialize();
  });

  afterEach(async () => {
    await store.close();
  });

  describe('Initialization', () => {
    it('should create indices on initialization', async () => {
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ 'metadata.project': 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ 'metadata.created': 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({ 'metadata.updated': 1 });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({
        'metadata.tags': 1,
        'metadata.priority': 1
      });
      expect(mockCollection.createIndex).toHaveBeenCalledWith({
        'conversation.thread.content': 'text',
        'conversation.summary': 'text',
        'knowledge.entities.description': 'text',
        'knowledge.learnings.description': 'text'
      });
    });
  });

  describe('Context Operations', () => {
    it('should upsert a context', async () => {
      mockCollection.updateOne.mockResolvedValueOnce({ acknowledged: true });

      await store.upsertContext(mockContext);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { id: mockContext.id },
        { $set: mockContext },
        { upsert: true }
      );
    });

    it('should retrieve a context by ID', async () => {
      mockCollection.findOne.mockResolvedValueOnce(mockContext);

      const result = await store.getContext(mockContext.id);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ id: mockContext.id });
      expect(result).toEqual(mockContext);
    });

    it('should return null for non-existent context', async () => {
      mockCollection.findOne.mockResolvedValueOnce(null);

      const result = await store.getContext('non-existent');

      expect(result).toBeNull();
    });

    it('should delete a context', async () => {
      mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });

      const result = await store.deleteContext(mockContext.id);

      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ id: mockContext.id });
      expect(result).toBe(true);
    });
  });

  describe('Search Operations', () => {
    it('should search contexts by text', async () => {
      const mockResults = [mockContext];
      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(mockResults)
      });

      const results = await store.searchContexts('test query');

      expect(mockCollection.find).toHaveBeenCalledWith({
        $text: { $search: 'test query' }
      });
      expect(results).toEqual(mockResults);
    });

    it('should find contexts by project', async () => {
      const mockResults = [mockContext];
      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(mockResults)
      });

      const results = await store.getContextsByProject('test-project');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.project': 'test-project'
      });
      expect(results).toEqual(mockResults);
    });

    it('should find contexts by tags', async () => {
      const mockResults = [mockContext];
      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(mockResults)
      });

      const results = await store.getContextsByTags(['test']);

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.tags': { $all: ['test'] }
      });
      expect(results).toEqual(mockResults);
    });

    it('should find contexts by time range', async () => {
      const mockResults = [mockContext];
      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(mockResults)
      });

      const start = Date.now() - 1000;
      const end = Date.now();

      const results = await store.getContextsByTimeRange(start, end);

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.updated': {
          $gte: start,
          $lte: end
        }
      });
      expect(results).toEqual(mockResults);
    });

    it('should find contexts by priority', async () => {
      const mockResults = [mockContext];
      mockCollection.find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(mockResults)
      });

      const results = await store.getContextsByPriority('high');

      expect(mockCollection.find).toHaveBeenCalledWith({
        'metadata.priority': 'high'
      });
      expect(results).toEqual(mockResults);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      const errorStore = new MongoContextStore('invalid-uri');
      mockMongoClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(errorStore.initialize()).rejects.toThrow('Connection failed');
    });

    it('should handle operation errors when not initialized', async () => {
      const uninitializedStore = new MongoContextStore('mongodb://localhost:27017');

      await expect(uninitializedStore.getContext('test')).rejects.toThrow();
    });
  });
}); 