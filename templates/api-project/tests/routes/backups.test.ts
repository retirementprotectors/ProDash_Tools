import request from 'supertest';
import app from '@/app';
import { BackupManager } from '@/core/BackupManager';
import { ContextManager } from '@/core/ContextManager';

describe('Backups API', () => {
  let backupManager: BackupManager;
  let contextManager: ContextManager;

  beforeEach(async () => {
    backupManager = new BackupManager();
    contextManager = new ContextManager();
    // Clear test data before each test
    await contextManager.deleteAllContexts();
    await backupManager.deleteAllBackups();
  });

  describe('GET /api/backups', () => {
    it('should return an empty array when no backups exist', async () => {
      const response = await request(app).get('/api/backups');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all backups', async () => {
      // Create some test contexts
      await contextManager.createContext({
        content: { test: 'data' },
        metadata: { source: 'test' },
      });

      // Create a backup
      await backupManager.createBackup();

      const response = await request(app).get('/api/backups');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].contextCount).toBe(1);
    });
  });

  describe('POST /api/backups', () => {
    it('should create a new backup', async () => {
      // Create some test contexts first
      await contextManager.createContext({
        content: { test: 'data' },
        metadata: { source: 'test' },
      });

      const response = await request(app).post('/api/backups');
      expect(response.status).toBe(201);
      expect(response.body.contextCount).toBe(1);
      expect(response.body.id).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/backups/:id', () => {
    it('should download a specific backup', async () => {
      // Create test context and backup
      await contextManager.createContext({
        content: { test: 'data' },
        metadata: { source: 'test' },
      });
      const backup = await backupManager.createBackup();

      const response = await request(app).get(`/api/backups/${backup.id}`);
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.contexts).toBeDefined();
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app).get('/api/backups/nonexistent');
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('BACKUP_NOT_FOUND');
    });
  });

  describe('POST /api/backups/:id/restore', () => {
    it('should restore from a backup', async () => {
      // Create initial context and backup
      const testContext = {
        content: { test: 'data' },
        metadata: { source: 'test' },
      };
      await contextManager.createContext(testContext);
      const backup = await backupManager.createBackup();

      // Delete all contexts
      await contextManager.deleteAllContexts();

      // Restore from backup
      const response = await request(app).post(`/api/backups/${backup.id}/restore`);
      expect(response.status).toBe(200);

      // Verify contexts were restored
      const contexts = await contextManager.getAllContexts();
      expect(contexts).toHaveLength(1);
      expect(contexts[0].content).toEqual(testContext.content);
    });

    it('should return 404 for non-existent backup', async () => {
      const response = await request(app).post('/api/backups/nonexistent/restore');
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('BACKUP_NOT_FOUND');
    });
  });
}); 