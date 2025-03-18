import request from 'supertest';
import app from '@/app';
import { ContextManager } from '@/core/ContextManager';
import fs from 'fs-extra';
import path from 'path';

describe('Contexts API', () => {
  const testDataDir = path.join(process.cwd(), 'data');
  const contextsDir = path.join(testDataDir, 'contexts');
  const historyDir = path.join(testDataDir, 'history');

  beforeEach(async () => {
    await fs.ensureDir(contextsDir);
    await fs.ensureDir(historyDir);
  });

  afterEach(async () => {
    await fs.remove(testDataDir);
  });

  let contextManager: ContextManager;

  beforeEach(async () => {
    contextManager = new ContextManager();
    // Clear test contexts before each test
    await contextManager.deleteAllContexts();
  });

  describe('GET /api/contexts', () => {
    it('should return an empty array when no contexts exist', async () => {
      const response = await request(app).get('/api/contexts');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all contexts', async () => {
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };
      await contextManager.createContext(testContext);

      const response = await request(app).get('/api/contexts');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].content).toEqual(testContext.content);
    });
  });

  describe('POST /api/contexts', () => {
    it('should create a new context', async () => {
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };

      const response = await request(app)
        .post('/api/contexts')
        .send(testContext);

      expect(response.status).toBe(201);
      expect(response.body.content).toEqual(testContext.content);
      expect(response.body.metadata).toEqual(testContext.metadata);
      expect(response.body.id).toBeDefined();
    });

    it('should return 400 when content is missing', async () => {
      const response = await request(app)
        .post('/api/contexts')
        .send({ metadata: { source: 'test' } });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/contexts/:id', () => {
    it('should return a specific context', async () => {
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };
      const created = await contextManager.createContext(testContext);

      const response = await request(app).get(`/api/contexts/${created.id}`);
      expect(response.status).toBe(200);
      expect(response.body.content).toEqual(testContext.content);
      expect(response.body.id).toBe(created.id);
    });

    it('should return 404 for non-existent context', async () => {
      const response = await request(app).get('/api/contexts/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('CONTEXT_NOT_FOUND');
    });
  });

  describe('PUT /api/contexts/:id', () => {
    it('should update an existing context', async () => {
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };
      const created = await contextManager.createContext(testContext);

      const updatedData = {
        content: { test: 'updated' },
        metadata: { source: 'test', updated: true },
      };

      const response = await request(app)
        .put(`/api/contexts/${created.id}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.content).toEqual(updatedData.content);
      expect(response.body.metadata).toEqual(updatedData.metadata);
    });
  });

  describe('DELETE /api/contexts/:id', () => {
    it('should delete an existing context', async () => {
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };
      const created = await contextManager.createContext(testContext);

      const response = await request(app).delete(`/api/contexts/${created.id}`);
      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/api/contexts/${created.id}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('POST /api/contexts/search', () => {
    it('should search contexts by query', async () => {
      const context1 = {
        id: 'test1',
        content: 'Hello world',
        timestamp: new Date().toISOString(),
        metadata: { tag: 'greeting' }
      };
      const context2 = {
        id: 'test2',
        content: 'Goodbye world',
        timestamp: new Date().toISOString(),
        metadata: { tag: 'farewell' }
      };

      const contextManager = new ContextManager();
      await contextManager.createContext(context1);
      await contextManager.createContext(context2);

      const response = await request(app)
        .post('/api/contexts/search')
        .send({ query: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('test1');
    });

    it('should search contexts by metadata', async () => {
      const context1 = {
        id: 'test1',
        content: 'Hello world',
        timestamp: new Date().toISOString(),
        metadata: { tag: 'greeting' }
      };
      const context2 = {
        id: 'test2',
        content: 'Goodbye world',
        timestamp: new Date().toISOString(),
        metadata: { tag: 'farewell' }
      };

      const contextManager = new ContextManager();
      await contextManager.createContext(context1);
      await contextManager.createContext(context2);

      const response = await request(app)
        .post('/api/contexts/search')
        .send({ metadata: { tag: 'greeting' } });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe('test1');
    });
  });

  describe('POST /api/contexts/batch', () => {
    it('should create multiple contexts', async () => {
      const contexts = [
        {
          id: 'test1',
          content: 'Hello world',
          timestamp: new Date().toISOString()
        },
        {
          id: 'test2',
          content: 'Goodbye world',
          timestamp: new Date().toISOString()
        }
      ];

      const response = await request(app)
        .post('/api/contexts/batch')
        .send(contexts);

      expect(response.status).toBe(201);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].id).toBe('test1');
      expect(response.body[1].id).toBe('test2');
    });
  });

  describe('GET /api/contexts/:id/history', () => {
    it('should return context version history', async () => {
      const contextManager = new ContextManager();
      const context = {
        id: 'test1',
        content: 'Initial content',
        timestamp: new Date().toISOString()
      };

      await contextManager.createContext(context);
      await contextManager.updateContext('test1', {
        ...context,
        content: 'Updated content',
        timestamp: new Date().toISOString()
      });

      const response = await request(app)
        .get('/api/contexts/test1/history');

      expect(response.status).toBe(200);
      expect(response.body.versions).toHaveLength(2);
      expect(response.body.versions[0].content).toBe('Initial content');
      expect(response.body.versions[1].content).toBe('Updated content');
    });

    it('should return 404 for non-existent context history', async () => {
      const response = await request(app)
        .get('/api/contexts/nonexistent/history');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/contexts/:id/restore/:version', () => {
    it('should restore context to specific version', async () => {
      const contextManager = new ContextManager();
      const context = {
        id: 'test1',
        content: 'Initial content',
        timestamp: new Date().toISOString()
      };

      await contextManager.createContext(context);
      await contextManager.updateContext('test1', {
        ...context,
        content: 'Updated content',
        timestamp: new Date().toISOString()
      });

      const history = await contextManager.getContextHistory('test1');
      const version = history!.versions[0].version;

      const response = await request(app)
        .post(`/api/contexts/test1/restore/${version}`);

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Initial content');
      expect(response.body.version).toBe(version);
    });

    it('should return 404 for non-existent version', async () => {
      const contextManager = new ContextManager();
      const context = {
        id: 'test1',
        content: 'Initial content',
        timestamp: new Date().toISOString()
      };

      await contextManager.createContext(context);

      const response = await request(app)
        .post('/api/contexts/test1/restore/999');

      expect(response.status).toBe(404);
    });
  });
}); 