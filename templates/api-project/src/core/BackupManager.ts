import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import extract from 'extract-zip';
import { Context } from '@/models/Context';
import { ContextHistory } from '@/models/ContextHistory';
import { config } from '@/config/env';
import logger from '@/utils/logger';

export interface IBackup {
  id: string;
  timestamp: Date;
  filename: string;
  contextCount: number;
  version: string;
}

export class BackupManager {
  private backupDir: string;

  constructor() {
    this.backupDir = path.resolve(process.cwd(), config.paths.backups);
    fs.ensureDirSync(this.backupDir);
  }

  async createBackup(name?: string): Promise<IBackup> {
    try {
      const timestamp = new Date();
      const backupId = name || `backup-${timestamp.getTime()}`;
      const filename = `${backupId}.zip`;
      const backupPath = path.join(this.backupDir, filename);

      // Create a write stream
      const output = fs.createWriteStream(backupPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // Pipe archive data to the file
      archive.pipe(output);

      // Get all contexts and their histories
      const contexts = await Context.find().lean();
      const histories = await ContextHistory.find().lean();

      // Add data to the archive
      archive.append(JSON.stringify(contexts, null, 2), { name: 'contexts.json' });
      archive.append(JSON.stringify(histories, null, 2), { name: 'context-histories.json' });

      await archive.finalize();

      const backup: IBackup = {
        id: backupId,
        timestamp,
        filename,
        contextCount: contexts.length,
        version: '1.0',
      };

      logger.info(`Created backup: ${backupId} with ${contexts.length} contexts`);
      return backup;
    } catch (error) {
      logger.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.zip`);
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup ${backupId} not found`);
      }

      const tempDir = path.join(this.backupDir, 'temp');
      await fs.ensureDir(tempDir);

      try {
        // Extract the backup
        await extract(backupPath, { dir: tempDir });

        // Read the backup data
        const contextsData = JSON.parse(
          await fs.readFile(path.join(tempDir, 'contexts.json'), 'utf-8')
        );
        const historiesData = JSON.parse(
          await fs.readFile(path.join(tempDir, 'context-histories.json'), 'utf-8')
        );

        // Clear existing data
        await Context.deleteMany({});
        await ContextHistory.deleteMany({});

        // Restore contexts and histories
        await Context.insertMany(contextsData);
        await ContextHistory.insertMany(historiesData);

        logger.info(`Restored backup: ${backupId} with ${contextsData.length} contexts`);
      } finally {
        // Clean up temp directory
        await fs.remove(tempDir);
      }
    } catch (error) {
      logger.error(`Error restoring backup ${backupId}:`, error);
      throw error;
    }
  }

  async listBackups(): Promise<IBackup[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: IBackup[] = [];

      for (const file of files) {
        if (file.endsWith('.zip')) {
          const stats = await fs.stat(path.join(this.backupDir, file));
          const backupId = file.replace('.zip', '');
          
          backups.push({
            id: backupId,
            timestamp: stats.birthtime,
            filename: file,
            contextCount: -1, // We'd need to read the zip file to get this
            version: '1.0',
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Error listing backups:', error);
      throw error;
    }
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, `${backupId}.zip`);
      if (!fs.existsSync(backupPath)) {
        return false;
      }

      await fs.remove(backupPath);
      logger.info(`Deleted backup: ${backupId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting backup ${backupId}:`, error);
      throw error;
    }
  }
} 