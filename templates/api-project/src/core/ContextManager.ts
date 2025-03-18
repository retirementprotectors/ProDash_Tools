import { Context, IContext } from '@/models/Context';
import { ContextHistory } from '@/models/ContextHistory';
import logger from '@/utils/logger';

export class ContextManager {
  async listContexts(query: Record<string, any> = {}): Promise<IContext[]> {
    try {
      return await Context.find(query).sort({ timestamp: -1 });
    } catch (error) {
      logger.error('Error listing contexts:', error);
      throw error;
    }
  }

  async getContext(id: string): Promise<IContext | null> {
    try {
      return await Context.findOne({ id });
    } catch (error) {
      logger.error(`Error getting context ${id}:`, error);
      throw error;
    }
  }

  async createContext(contextData: Partial<IContext>): Promise<IContext> {
    try {
      const context = new Context({
        ...contextData,
        timestamp: new Date(),
        version: 1,
      });

      await context.save();
      await this.saveToHistory(context);
      return context;
    } catch (error) {
      logger.error('Error creating context:', error);
      throw error;
    }
  }

  async updateContext(id: string, contextData: Partial<IContext>): Promise<IContext | null> {
    try {
      const context = await Context.findOne({ id });
      if (!context) return null;

      // Increment version
      const newVersion = (context.version || 1) + 1;
      
      // Save current version to history
      await this.saveToHistory(context);

      // Update context
      Object.assign(context, {
        ...contextData,
        version: newVersion,
        timestamp: new Date(),
      });

      await context.save();
      return context;
    } catch (error) {
      logger.error(`Error updating context ${id}:`, error);
      throw error;
    }
  }

  async deleteContext(id: string): Promise<boolean> {
    try {
      const result = await Context.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting context ${id}:`, error);
      throw error;
    }
  }

  async searchContexts(searchParams: {
    query?: string;
    metadata?: Record<string, unknown>;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<IContext[]> {
    try {
      const { query, metadata, fromDate, toDate } = searchParams;
      const searchQuery: any = {};

      if (query) {
        searchQuery.$text = { $search: query };
      }

      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          searchQuery[`metadata.${key}`] = value;
        });
      }

      if (fromDate || toDate) {
        searchQuery.timestamp = {};
        if (fromDate) searchQuery.timestamp.$gte = fromDate;
        if (toDate) searchQuery.timestamp.$lte = toDate;
      }

      return await Context.find(searchQuery).sort({ timestamp: -1 });
    } catch (error) {
      logger.error('Error searching contexts:', error);
      throw error;
    }
  }

  async getContextHistory(id: string): Promise<IContext[]> {
    try {
      return await ContextHistory.find({ contextId: id }).sort({ version: -1 });
    } catch (error) {
      logger.error(`Error getting context history for ${id}:`, error);
      throw error;
    }
  }

  async restoreVersion(id: string, version: number): Promise<IContext | null> {
    try {
      const historicalContext = await ContextHistory.findOne({ contextId: id, version });
      if (!historicalContext) return null;

      const context = await Context.findOne({ id });
      if (!context) return null;

      // Save current version to history
      await this.saveToHistory(context);

      // Restore from historical version
      Object.assign(context, {
        content: historicalContext.content,
        metadata: historicalContext.metadata,
        version: (context.version || 1) + 1,
        timestamp: new Date(),
      });

      await context.save();
      return context;
    } catch (error) {
      logger.error(`Error restoring context ${id} to version ${version}:`, error);
      throw error;
    }
  }

  private async saveToHistory(context: IContext): Promise<void> {
    try {
      const historyEntry = new ContextHistory({
        contextId: context.id,
        version: context.version,
        content: context.content,
        metadata: context.metadata,
        timestamp: context.timestamp,
      });
      await historyEntry.save();
    } catch (error) {
      logger.error(`Error saving context ${context.id} to history:`, error);
      throw error;
    }
  }
} 