import { MongoClient, Collection, Db } from 'mongodb';
import OpenAI from 'openai';
import { Context, ContextUpdate, SearchOptions } from '../types/context';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

export class ContextManager {
  private collection!: Collection<Context>;
  private openai: OpenAI;
  private db!: Db;
  private client!: MongoClient;
  private initialized = false;

  constructor(
    private mongoUrl: string,
    private openaiKey: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.connect();
    this.initialized = true;
  }

  async connect(): Promise<void> {
    try {
      this.client = await MongoClient.connect(this.mongoUrl);
      this.db = this.client.db('prodash_master');
      this.collection = this.db.collection<Context>('contexts');
      
      // Create indexes for common queries
      await this.collection.createIndex({ 'metadata.tags': 1 });
      await this.collection.createIndex({ 'metadata.timestamp': 1 });
      await this.collection.createIndex({ embedding: '2dsphere' });
      
      logger.info('Connected to MongoDB');
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client?.close();
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Failed to get embedding:', error);
      return [];
    }
  }

  async addContext(content: string, metadata: Partial<Context['metadata']> = {}): Promise<Context> {
    try {
      const newContext: Context = {
        id: Date.now().toString(),
        content,
        metadata: {
          timestamp: Date.now(),
          ...metadata
        },
        embedding: await this.getEmbedding(content)
      };

      await this.collection.insertOne(newContext);
      logger.info(`Added context with ID: ${newContext.id}`);
      return newContext;
    } catch (error) {
      logger.error('Failed to add context:', error);
      throw error;
    }
  }

  async getContext(id: string): Promise<Context | null> {
    return this.collection.findOne({ id });
  }

  async getAllContexts(): Promise<Context[]> {
    try {
      return this.collection.find({}).toArray();
    } catch (error) {
      logger.error('Failed to get all contexts:', error);
      throw error;
    }
  }

  async getContextCount(): Promise<number> {
    return this.collection.countDocuments();
  }

  async updateContext(id: string, update: ContextUpdate): Promise<Context | null> {
    try {
      const result = await this.collection.findOneAndUpdate(
        { id },
        { $set: update },
        { returnDocument: 'after' }
      );
      return result;
    } catch (error) {
      logger.error(`Failed to update context ${id}:`, error);
      throw error;
    }
  }

  async deleteContext(id: string): Promise<boolean> {
    try {
      const result = await this.collection.deleteOne({ id });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Failed to delete context ${id}:`, error);
      throw error;
    }
  }

  async clearAllContexts(): Promise<void> {
    try {
      await this.collection.deleteMany({});
    } catch (error) {
      logger.error('Failed to clear contexts:', error);
      throw error;
    }
  }

  async searchContexts(options: SearchOptions | string): Promise<Context[]> {
    try {
      const query: Record<string, any> = {};
      
      if (typeof options === 'string') {
        const embedding = await this.getEmbedding(options);
        if (embedding.length) {
          query.embedding = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: embedding
              }
            }
          };
        }
      } else {
        if (options.tags?.length) {
          query['metadata.tags'] = { $in: options.tags };
        }

        if (options.query) {
          const embedding = await this.getEmbedding(options.query);
          if (embedding.length) {
            query.embedding = {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: embedding
                }
              }
            };
          }
        }
      }

      return this.collection
        .find(query)
        .limit(typeof options === 'object' ? options.limit || 10 : 10)
        .toArray();
    } catch (error) {
      logger.error('Failed to search contexts:', error);
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
} 