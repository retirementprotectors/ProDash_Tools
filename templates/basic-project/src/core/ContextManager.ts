import fs from 'fs-extra';
import path from 'path';

export interface Context {
  id: string;
  content: {
    content: string;
    metadata: Record<string, unknown>;
  };
  timestamp: number;
  metadata: Record<string, unknown>;
}

export class ContextManager {
  private contextsPath: string;
  private contexts: Map<string, Context>;

  constructor() {
    this.contextsPath = path.join(process.cwd(), '.context-keeper', 'contexts');
    this.contexts = new Map();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await fs.ensureDir(this.contextsPath);
    await this.loadContexts();
  }

  private async loadContexts(): Promise<void> {
    const files = await fs.readdir(this.contextsPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readJson(path.join(this.contextsPath, file));
        this.contexts.set(content.id, content);
      }
    }
  }

  async getAllContexts(): Promise<Context[]> {
    return Array.from(this.contexts.values());
  }

  async createContext(content: Omit<Context['content'], 'timestamp'>): Promise<Context> {
    const context: Context = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now(),
      metadata: {}
    };

    await fs.writeJson(
      path.join(this.contextsPath, `${context.id}.json`),
      context,
      { spaces: 2 }
    );

    this.contexts.set(context.id, context);
    return context;
  }

  async getContext(id: string): Promise<Context | null> {
    return this.contexts.get(id) || null;
  }

  async updateContext(id: string, content: Partial<Context['content']>): Promise<Context | null> {
    const context = this.contexts.get(id);
    if (!context) return null;

    const updatedContext: Context = {
      ...context,
      content: {
        ...context.content,
        ...content
      },
      timestamp: Date.now()
    };

    await fs.writeJson(
      path.join(this.contextsPath, `${id}.json`),
      updatedContext,
      { spaces: 2 }
    );

    this.contexts.set(id, updatedContext);
    return updatedContext;
  }

  async deleteContext(id: string): Promise<boolean> {
    const context = this.contexts.get(id);
    if (!context) return false;

    await fs.remove(path.join(this.contextsPath, `${id}.json`));
    this.contexts.delete(id);
    return true;
  }
} 