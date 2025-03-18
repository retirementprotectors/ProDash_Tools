import fs from 'fs-extra';
import path from 'path';

export interface Backup {
  timestamp: number;
  filename: string;
  contextCount: number;
  version: string;
}

export class BackupManager {
  private backupsPath: string;
  private contextsPath: string;
  private readonly version = '1.0.0';

  constructor() {
    this.backupsPath = path.join(process.cwd(), '.context-keeper', 'backups');
    this.contextsPath = path.join(process.cwd(), '.context-keeper', 'contexts');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await fs.ensureDir(this.backupsPath);
  }

  async listBackups(): Promise<Backup[]> {
    const files = await fs.readdir(this.backupsPath);
    const backups: Backup[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const stats = await fs.stat(path.join(this.backupsPath, file));
        const backup: Backup = {
          timestamp: parseInt(file.split('-')[1].split('.')[0]),
          filename: file,
          contextCount: 0,
          version: this.version
        };

        try {
          const content = await fs.readJson(path.join(this.backupsPath, file));
          backup.contextCount = content.contexts.length;
        } catch (error) {
          console.warn(`Failed to read backup file ${file}:`, error);
        }

        backups.push(backup);
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  async createBackup(): Promise<Backup> {
    const timestamp = Date.now();
    const filename = `backup-${timestamp}.json`;
    const contexts = await fs.readdir(this.contextsPath);
    
    const contextData = await Promise.all(
      contexts
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const content = await fs.readJson(path.join(this.contextsPath, file));
          return content;
        })
    );

    const backup: Backup = {
      timestamp,
      filename,
      contextCount: contextData.length,
      version: this.version
    };

    await fs.writeJson(
      path.join(this.backupsPath, filename),
      {
        ...backup,
        contexts: contextData
      },
      { spaces: 2 }
    );

    return backup;
  }

  async restoreBackup(filename: string): Promise<boolean> {
    const backupFile = path.join(this.backupsPath, filename);
    if (!await fs.pathExists(backupFile)) {
      return false;
    }

    try {
      const backup = await fs.readJson(backupFile);
      await fs.emptyDir(this.contextsPath);

      for (const context of backup.contexts) {
        await fs.writeJson(
          path.join(this.contextsPath, `${context.id}.json`),
          context,
          { spaces: 2 }
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }
} 