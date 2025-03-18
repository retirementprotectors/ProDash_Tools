import { ContextManager } from '../core/ContextManager';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

interface ChatData {
  content: string;
  timestamp: number;
  tags?: string[];
}

export class AutoCollector {
  private pollInterval: NodeJS.Timeout | null = null;
  private backupInterval: NodeJS.Timeout | null = null;
  private lastProcessedTimestamp = Date.now();
  private sessionsDir = join(process.cwd(), '.context-keeper', 'sessions');

  constructor(
    private contextManager: ContextManager,
    private backupDir: string = './.backups'
  ) {
    // Ensure directories exist
    [this.backupDir, this.sessionsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  start() {
    // Poll every 30 seconds
    this.pollInterval = setInterval(() => this.pollNewChats(), 30_000);
    
    // Backup every 5 minutes
    this.backupInterval = setInterval(() => this.createBackup(), 300_000);
  }

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.backupInterval) clearInterval(this.backupInterval);
  }

  private async pollNewChats() {
    try {
      const currentTime = Date.now();
      const newChats = await this.getNewChats(this.lastProcessedTimestamp);
      
      for (const chat of newChats) {
        await this.contextManager.addContext(
          chat.content,
          {
            timestamp: chat.timestamp,
            source: 'chat',
            tags: chat.tags || []
          }
        );
      }
      
      this.lastProcessedTimestamp = currentTime;
    } catch (error) {
      console.error('Failed to poll chats:', error);
    }
  }

  private async getNewChats(since: number): Promise<ChatData[]> {
    try {
      const files = readdirSync(this.sessionsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => join(this.sessionsDir, f));

      const newChats: ChatData[] = [];

      for (const file of files) {
        const stats = await readFile(file, 'utf-8')
          .then(data => JSON.parse(data))
          .catch(() => null);

        if (stats && stats.timestamp > since) {
          newChats.push({
            content: stats.content || stats.message || stats.text || '',
            timestamp: stats.timestamp,
            tags: [
              ...(stats.tags || []),
              stats.type || 'chat',
              stats.source || 'session'
            ]
          });
        }
      }

      return newChats;
    } catch (error) {
      console.error('Failed to read chat files:', error);
      return [];
    }
  }

  private async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = join(this.backupDir, `backup-${timestamp}.json`);
      
      const contexts = await this.contextManager.getAllContexts();
      await writeFile(backupPath, JSON.stringify(contexts, null, 2));
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  async restore(backupFile: string) {
    try {
      const data = await readFile(join(this.backupDir, backupFile), 'utf-8');
      const contexts = JSON.parse(data);
      
      await this.contextManager.clearAllContexts();
      for (const context of contexts) {
        await this.contextManager.addContext(
          context.content,
          context.metadata
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return false;
    }
  }
} 