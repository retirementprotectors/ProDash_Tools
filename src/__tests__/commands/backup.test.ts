import fs from 'fs-extra';
import path from 'path';
import mongoose from 'mongoose';
import { createBackup, restoreBackup, listBackups } from '../../cli/commands/backup';

describe('Backup Command', () => {
  const TEST_BACKUP_NAME = 'test-backup';
  const TEST_BACKUP_DIR = path.join(process.cwd(), 'data/test/backups');
  const TEST_DB_NAME = 'prodash_test_db';

  beforeEach(async () => {
    // Create test data in database
    const testDb = mongoose.connection.useDb(TEST_DB_NAME);
    const testCollection = testDb.collection('test');
    await testCollection.insertMany([
      { name: 'test1', value: 'value1' },
      { name: 'test2', value: 'value2' },
      { name: 'test3', value: 'value3' },
    ]);
  });

  describe('createBackup', () => {
    it('should create a backup with default name', async () => {
      // Create backup
      await createBackup();

      // Check if backup files exist
      const files = await fs.readdir(TEST_BACKUP_DIR);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.zip/);

      // Check backup metadata in database
      const backup = await mongoose.connection
        .collection('backups')
        .findOne({});
      expect(backup).toBeTruthy();
      expect(backup?.databases).toContain(TEST_DB_NAME);
    });

    it('should create a backup with custom name', async () => {
      // Create backup
      await createBackup(TEST_BACKUP_NAME);

      // Check if backup file exists
      const backupPath = path.join(TEST_BACKUP_DIR, `${TEST_BACKUP_NAME}.zip`);
      expect(await fs.pathExists(backupPath)).toBe(true);

      // Check backup metadata in database
      const backup = await mongoose.connection
        .collection('backups')
        .findOne({ name: TEST_BACKUP_NAME });
      expect(backup).toBeTruthy();
      expect(backup?.databases).toContain(TEST_DB_NAME);
    });

    it('should fail if backup name already exists', async () => {
      // Create first backup
      await createBackup(TEST_BACKUP_NAME);

      // Try to create backup with same name
      await expect(createBackup(TEST_BACKUP_NAME)).rejects.toThrow(
        'Backup already exists'
      );
    });
  });

  describe('restoreBackup', () => {
    beforeEach(async () => {
      // Create a backup to restore from
      await createBackup(TEST_BACKUP_NAME);

      // Clear test database
      const testDb = mongoose.connection.useDb(TEST_DB_NAME);
      await testDb.dropDatabase();
    });

    it('should restore from backup', async () => {
      // Restore backup
      await restoreBackup(TEST_BACKUP_NAME);

      // Check if data was restored
      const testDb = mongoose.connection.useDb(TEST_DB_NAME);
      const testCollection = testDb.collection('test');
      const docs = await testCollection.find().toArray();

      expect(docs).toHaveLength(3);
      expect(docs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'test1', value: 'value1' }),
          expect.objectContaining({ name: 'test2', value: 'value2' }),
          expect.objectContaining({ name: 'test3', value: 'value3' }),
        ])
      );
    });

    it('should fail if backup does not exist', async () => {
      await expect(restoreBackup('non-existent')).rejects.toThrow(
        'Backup not found'
      );
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      // Create test backups
      const backups = ['backup-1', 'backup-2', 'backup-3'];
      for (const name of backups) {
        await createBackup(name);
      }

      // Get backups from database
      const dbBackups = await mongoose.connection
        .collection('backups')
        .find()
        .toArray();

      // Check if all backups are listed
      expect(dbBackups).toHaveLength(3);
      for (const backup of dbBackups) {
        expect(backups).toContain(backup.name);
      }
    });

    it('should return empty list when no backups exist', async () => {
      const backups = await mongoose.connection
        .collection('backups')
        .find()
        .toArray();
      expect(backups).toHaveLength(0);
    });
  });
}); 