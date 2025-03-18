import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

export interface Context {
  id: string;
  content: string;
  timestamp: number;
  metadata: Record<string, any>;
}

export class ContextManager extends EventEmitter {
  private contextsPath: string;
  private contexts: Map<string, Context> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();
    this.contextsPath = join(process.cwd(), '.context-keeper', 'contexts');
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure the directory exists
      const dir = dirname(this.contextsPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Try to load existing contexts
      if (existsSync(this.contextsPath)) {
        const files = readdirSync(this.contextsPath);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const data = readFileSync(join(this.contextsPath, file), 'utf8');
            const context = JSON.parse(data);
            this.contexts.set(context.id, context);
          }
        }
      } else {
        // Initialize with sample contexts if none exist
        await this.createSampleContexts();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing ContextManager:', error);
      // First run or no contexts yet
      this.contexts = new Map();
      this.initialized = true;
    }
  }

  async shutdown() {
    await this.saveContexts();
  }

  private async saveContexts() {
    try {
      const contexts = Array.from(this.contexts.values());
      const dir = dirname(this.contextsPath);
      
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      for (const context of contexts) {
        const filePath = join(this.contextsPath, `${context.id}.json`);
        writeFileSync(filePath, JSON.stringify(context, null, 2));
      }
    } catch (error) {
      console.error('Error saving contexts:', error);
    }
  }

  private async createSampleContexts() {
    const sampleContexts = [
      {
        id: '1682341200000',
        content: 'In this conversation, we discussed the implementation of a new feature that would allow users to export their data in multiple formats including CSV, JSON, and XML.',
        timestamp: 1682341200000, // April 24, 2023
        metadata: {
          topic: 'Feature Implementation',
          participants: ['User', 'Assistant'],
          tags: ['export', 'data', 'formats']
        }
      },
      {
        id: '1687536000000',
        content: 'The user asked about performance optimization techniques for their React application. We covered code splitting, memoization, virtualization for long lists, and proper state management.',
        timestamp: 1687536000000, // June 23, 2023
        metadata: {
          topic: 'Performance Optimization',
          participants: ['User', 'Assistant'],
          tags: ['react', 'performance', 'optimization']
        }
      },
      {
        id: '1693526400000',
        content: 'We discussed database schema design for a social media application, covering user profiles, posts, comments, likes, and relationships between these entities.',
        timestamp: 1693526400000, // September 1, 2023
        metadata: {
          topic: 'Database Design',
          participants: ['User', 'Assistant'],
          tags: ['database', 'schema', 'social media']
        }
      },
      {
        id: '1701388800000',
        content: 'The conversation was about implementing authentication and authorization using JWT tokens, including token refresh mechanisms and secure storage.',
        timestamp: 1701388800000, // December 1, 2023
        metadata: {
          topic: 'Authentication',
          participants: ['User', 'Assistant'],
          tags: ['jwt', 'auth', 'security']
        }
      },
      {
        id: '1706745600000',
        content: 'We worked on setting up a CI/CD pipeline using GitHub Actions for a Node.js project, including testing, building, and deployment to a cloud provider.',
        timestamp: 1706745600000, // February 1, 2024
        metadata: {
          topic: 'CI/CD Setup',
          participants: ['User', 'Assistant'],
          tags: ['github', 'ci/cd', 'automation']
        }
      }
    ];

    sampleContexts.forEach(context => {
      this.contexts.set(context.id, context);
    });

    await this.saveContexts();
  }

  async addContext(content: string, metadata: Record<string, any> = {}): Promise<Context> {
    if (!this.initialized) await this.initialize();
    
    const context: Context = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      metadata
    };

    this.contexts.set(context.id, context);
    await this.saveContexts();
    this.emit('context:added', context);
    return context;
  }

  async getContext(id: string): Promise<Context | undefined> {
    if (!this.initialized) await this.initialize();
    return this.contexts.get(id);
  }

  async getAllContexts(): Promise<Context[]> {
    if (!this.initialized) await this.initialize();
    return Array.from(this.contexts.values())
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp, newest first
  }

  async searchContexts(query: string): Promise<Context[]> {
    if (!this.initialized) await this.initialize();
    
    if (!query || query.trim() === '') {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase();
    const results: Context[] = [];
    
    // Simple search implementation - could be replaced with a more sophisticated search later
    for (const context of this.contexts.values()) {
      if (
        context.content.toLowerCase().includes(normalizedQuery) ||
        JSON.stringify(context.metadata || {}).toLowerCase().includes(normalizedQuery)
      ) {
        results.push(context);
      }
    }
    
    // Sort by relevance (simple implementation - newest first)
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getContextCount(): Promise<number> {
    if (!this.initialized) await this.initialize();
    return this.contexts.size;
  }

  async updateContext(id: string, content: string, metadata?: Record<string, any>): Promise<Context | null> {
    if (!this.initialized) await this.initialize();
    
    const existingContext = await this.getContext(id);
    if (!existingContext) {
      return null;
    }
    
    // Create updated context
    const updatedContext: Context = {
      ...existingContext,
      content,
      timestamp: Date.now(),
      metadata: metadata || existingContext.metadata || {}
    };
    
    // Save to memory and disk
    this.contexts.set(id, updatedContext);
    await this.saveContexts();
    
    return updatedContext;
  }

  async deleteContext(id: string): Promise<boolean> {
    if (!this.initialized) await this.initialize();
    
    const contextExists = this.contexts.has(id);
    if (!contextExists) {
      return false;
    }
    
    // Remove from memory
    this.contexts.delete(id);
    
    // Remove from disk
    try {
      const contextFilePath = join(this.contextsPath, `${id}.json`);
      if (existsSync(contextFilePath)) {
        unlinkSync(contextFilePath);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting context file for ID ${id}:`, error);
      return false;
    }
  }

  async clearAllContexts(): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    // Clear memory
    this.contexts.clear();
    
    // Clear disk files
    try {
      const files = readdirSync(this.contextsPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          unlinkSync(join(this.contextsPath, file));
        }
      }
    } catch (error) {
      console.error('Error clearing context files:', error);
      throw error;
    }
  }
} 