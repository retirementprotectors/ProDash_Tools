import { MongoClient, Collection, Db } from 'mongodb';
import { EnhancedContext } from '../types/Context';
import { logError, logInfo } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export class MongoContextStore {
  private client: MongoClient;
  private db!: Db;
  private collection!: Collection<EnhancedContext>;

  constructor(private readonly mongoUri: string) {
    this.client = new MongoClient(mongoUri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db('prodash');
      this.collection = this.db.collection<EnhancedContext>('contexts');
      
      // Create indexes for optimized queries
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ embedding: '2dsphere' });
      await this.collection.createIndex({ 'metadata.project': 1 });
      await this.collection.createIndex({ 'metadata.tags': 1 });
      await this.collection.createIndex({ 'metadata.priority': 1 });
      await this.collection.createIndex({ 'metadata.created': 1 });
      await this.collection.createIndex({ 'metadata.updated': 1 });
      
      logInfo('Connected to MongoDB');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to connect to MongoDB' });
      throw new DatabaseError(`Failed to connect to MongoDB: ${err.message}`);
    }
  }

  async addContext(context: EnhancedContext): Promise<void> {
    try {
      await this.collection.insertOne(context);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to add context: ${context.id}` });
      throw new DatabaseError(`Failed to add context: ${err.message}`);
    }
  }

  async updateContext(id: string, context: EnhancedContext): Promise<void> {
    try {
      const result = await this.collection.replaceOne({ id }, context);
      if (result.matchedCount === 0) {
        throw new DatabaseError(`Context not found: ${id}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to update context: ${id}` });
      throw new DatabaseError(`Failed to update context: ${err.message}`);
    }
  }

  async getContext(id: string): Promise<EnhancedContext | null> {
    try {
      return await this.collection.findOne({ id });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to get context: ${id}` });
      throw new DatabaseError(`Failed to get context: ${err.message}`);
    }
  }

  async getAllContexts(): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find().toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to get all contexts' });
      throw new DatabaseError(`Failed to get all contexts: ${err.message}`);
    }
  }

  async searchSimilar(queryVector: number[]): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find({
        embedding: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: queryVector
            },
            $maxDistance: 0.5 // Adjust this threshold as needed
          }
        }
      }).toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to search similar contexts' });
      throw new DatabaseError(`Failed to search similar contexts: ${err.message}`);
    }
  }

  async getContextsByProject(project: string): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find({
        'metadata.project': project
      }).toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to get contexts by project: ${project}` });
      throw new DatabaseError(`Failed to get contexts by project: ${err.message}`);
    }
  }

  async getContextsByTags(tags: string[]): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find({
        'metadata.tags': { $in: tags }
      }).toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to get contexts by tags: ${tags.join(', ')}` });
      throw new DatabaseError(`Failed to get contexts by tags: ${err.message}`);
    }
  }

  async getContextsByTimeRange(start: number, end: number): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find({
        'metadata.created': {
          $gte: start,
          $lte: end
        }
      }).toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to get contexts by time range: ${start} - ${end}` });
      throw new DatabaseError(`Failed to get contexts by time range: ${err.message}`);
    }
  }

  async getContextsByPriority(priority: string): Promise<EnhancedContext[]> {
    try {
      return await this.collection.find({
        'metadata.priority': priority
      }).toArray();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to get contexts by priority: ${priority}` });
      throw new DatabaseError(`Failed to get contexts by priority: ${err.message}`);
    }
  }

  async deleteContext(id: string): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ id });
      if (result.deletedCount === 0) {
        throw new DatabaseError(`Context not found: ${id}`);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to delete context: ${id}` });
      throw new DatabaseError(`Failed to delete context: ${err.message}`);
    }
  }

  async close(): Promise<void> {
    try {
      await this.client.close();
      logInfo('Closed MongoDB connection');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to close MongoDB connection' });
      throw new DatabaseError(`Failed to close MongoDB connection: ${err.message}`);
    }
  }
} 