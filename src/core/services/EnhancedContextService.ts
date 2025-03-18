import { EnhancedContext, ConversationMessage, Entity, Learning, Outcome, ContextUpdate } from '../types/Context';
import { Vector, VectorOperations, VECTOR_DIMENSIONS } from '../types/Vector';
import { ensureLatestSchema, validateContext } from '../migrations/ContextMigration';
import { EmbeddingsService } from './EmbeddingsService';
import { MongoContextStore } from '../persistence/MongoContextStore';
import { DefaultVectorOperations } from '../utils/vectorOperations';
import { logError, logInfo } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';

export class EnhancedContextService {
  private contexts: Map<string, EnhancedContext> = new Map();
  private vectorOps: DefaultVectorOperations;
  private embeddingsService: EmbeddingsService;
  private store: MongoContextStore;

  constructor(
    vectorOps: DefaultVectorOperations,
    private readonly mongoUri: string
  ) {
    this.vectorOps = vectorOps;
    this.store = new MongoContextStore(mongoUri);
    this.embeddingsService = new EmbeddingsService(process.env.OPENAI_API_KEY || '');
  }

  /**
   * Initializes the service
   */
  async initialize(): Promise<void> {
    try {
      await this.store.connect();
      logInfo('EnhancedContextService initialized');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to initialize EnhancedContextService' });
      throw error;
    }
  }

  /**
   * Creates a new context or updates an existing one
   */
  async addContext(context: EnhancedContext): Promise<EnhancedContext> {
    try {
      const embedding = await this.embeddingsService.getContextEmbedding({
        content: context.content,
        metadata: {
          title: context.metadata.title,
          description: context.metadata.description,
          tags: context.metadata.tags
        },
        messages: context.conversation.messages,
        entities: context.knowledge.entities,
        learnings: context.knowledge.learnings
      });

      const contextWithEmbedding: EnhancedContext = {
        ...context,
        embedding
      };

      await this.store.addContext(contextWithEmbedding);
      logInfo(`Added context with ID: ${context.id}`);
      return contextWithEmbedding;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to add context with ID: ${context.id}` });
      throw error;
    }
  }

  /**
   * Adds a message to an existing context
   */
  async addMessage(contextId: string, message: ConversationMessage): Promise<EnhancedContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    context.conversation.thread.push(message);
    context.metadata.updated = Date.now();
    
    // Update vectors based on new message
    await this.updateVectors(context);
    
    return this.addContext(context);
  }

  /**
   * Adds an entity to the knowledge base
   */
  async addEntity(contextId: string, entity: Entity): Promise<EnhancedContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    context.knowledge.entities.push(entity);
    context.metadata.updated = Date.now();
    
    // Update conceptual vectors
    await this.updateVectors(context);
    
    return this.addContext(context);
  }

  /**
   * Adds a learning to the knowledge base
   */
  async addLearning(contextId: string, learning: Learning): Promise<EnhancedContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    context.knowledge.learnings.push(learning);
    context.metadata.updated = Date.now();
    
    // Update vectors based on new learning
    await this.updateVectors(context);
    
    return this.addContext(context);
  }

  /**
   * Records an outcome in the context
   */
  async addOutcome(contextId: string, outcome: Outcome): Promise<EnhancedContext> {
    const context = await this.getContext(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }

    context.metadata.outcomes.push(outcome);
    context.metadata.updated = Date.now();
    
    return this.addContext(context);
  }

  /**
   * Updates vectors for the context
   */
  private async updateVectors(context: EnhancedContext): Promise<void> {
    await this.embeddingsService.updateContextVectors(context);
  }

  /**
   * Finds similar contexts based on vector similarity
   */
  async findSimilar(contextId: string, limit: number = 5): Promise<Array<{ context: EnhancedContext; similarity: number }>> {
    const sourceContext = await this.getContext(contextId);
    if (!sourceContext) {
      throw new Error(`Context not found: ${contextId}`);
    }

    const results = Array.from(this.contexts.values())
      .filter(c => c.id !== contextId)
      .map(context => ({
        context,
        similarity: this.vectorOps.similarity(
          context.vectorIndices.semantic,
          sourceContext.vectorIndices.semantic
        )
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  }

  /**
   * Retrieves a context by ID
   */
  async getContext(id: string): Promise<EnhancedContext | null> {
    return this.store.getContext(id);
  }

  /**
   * Updates specific fields in a context
   */
  async updateContext(id: string, update: ContextUpdate): Promise<EnhancedContext> {
    try {
      const context = await this.getContext(id);
      if (!context) {
        throw new Error(`Context not found: ${id}`);
      }

      const updatedContext: EnhancedContext = {
        ...context,
        ...update,
        metadata: {
          ...context.metadata,
          ...update.metadata,
          updated: Date.now()
        }
      };

      if (update.content) {
        updatedContext.embedding = await this.embeddingsService.getContextEmbedding({
          content: updatedContext.content,
          metadata: {
            title: updatedContext.metadata.title,
            description: updatedContext.metadata.description,
            tags: updatedContext.metadata.tags
          },
          messages: updatedContext.conversation.messages,
          entities: updatedContext.knowledge.entities,
          learnings: updatedContext.knowledge.learnings
        });
      }

      await this.store.updateContext(id, updatedContext);
      logInfo(`Updated context with ID: ${id}`);
      return updatedContext;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: `Failed to update context with ID: ${id}` });
      throw error;
    }
  }

  /**
   * Links two contexts together by creating a relationship
   */
  async linkContexts(sourceId: string, targetId: string, relationType: string, strength: number): Promise<void> {
    const source = await this.getContext(sourceId);
    const target = await this.getContext(targetId);

    if (!source || !target) {
      throw new Error('One or both contexts not found');
    }

    source.knowledge.relationships.push({
      source: sourceId,
      target: targetId,
      type: relationType as any,
      strength
    });

    await this.upsertContext(source);
  }

  /**
   * Exports all contexts for backup
   */
  async exportContexts(): Promise<EnhancedContext[]> {
    try {
      return await this.store.getAllContexts();
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to export contexts'));
      throw error;
    }
  }

  /**
   * Imports contexts from a backup
   */
  async importContexts(contexts: EnhancedContext[]): Promise<void> {
    for (const context of contexts) {
      await this.upsertContext(context);
    }
  }

  /**
   * Searches contexts by text content
   */
  async searchContexts(query: string): Promise<EnhancedContext[]> {
    try {
      const queryVector = await this.embeddingsService.getEmbedding(query);
      return this.store.searchSimilar(queryVector);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to search contexts' });
      throw error;
    }
  }

  /**
   * Gets contexts by project
   */
  async getContextsByProject(project: string): Promise<EnhancedContext[]> {
    try {
      const contexts = await this.store.getContextsByProject(project);
      contexts.forEach(context => {
        this.contexts.set(context.id, context);
      });
      return contexts;
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to get contexts by project'));
      throw error;
    }
  }

  /**
   * Gets contexts by tags
   */
  async getContextsByTags(tags: string[]): Promise<EnhancedContext[]> {
    try {
      return this.store.getContextsByTags(tags);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to get contexts by tags'));
      throw error;
    }
  }

  /**
   * Gets contexts by time range
   */
  async getContextsByTimeRange(start: number, end: number): Promise<EnhancedContext[]> {
    try {
      return this.store.getContextsByTimeRange(start, end);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to get contexts by time range'));
      throw error;
    }
  }

  /**
   * Gets contexts by priority
   */
  async getContextsByPriority(priority: string): Promise<EnhancedContext[]> {
    try {
      return this.store.getContextsByPriority(priority);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to get contexts by priority'));
      throw error;
    }
  }

  /**
   * Deletes a context
   */
  async deleteContext(contextId: string): Promise<void> {
    try {
      await this.store.deleteContext(contextId);
      this.contexts.delete(contextId);
      logInfo('Context deleted', { contextId });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to delete context'));
      throw error;
    }
  }

  /**
   * Closes all connections
   */
  async close(): Promise<void> {
    await this.store.close();
  }

  private async updateContextVectors(context: EnhancedContext): Promise<void> {
    try {
      // Update semantic vector
      const text = this.getContextText(context);
      context.vectors.semantic = await this.vectorOps.textToVector(text);

      // Update categorical vector
      context.vectors.categorical = await this.vectorOps.categoriesToVector([
        context.metadata.project,
        ...context.metadata.tags,
        context.metadata.priority
      ]);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Failed to update context vectors'));
      throw error;
    }
  }

  private getContextText(context: EnhancedContext): string {
    return [
      context.metadata.title,
      context.metadata.description,
      ...context.conversation.thread.map(msg => msg.content),
      ...context.knowledge.entities.map(entity => `${entity.name}: ${entity.description}`),
      ...context.knowledge.learnings.map(learning => learning.content),
      ...context.knowledge.outcomes.map(outcome => outcome.description)
    ].join(' ');
  }

  private validateContext(context: EnhancedContext): void {
    if (!context.id) throw new ValidationError('Context ID is required');
    if (!context.metadata.project) throw new ValidationError('Project is required');
    if (!context.metadata.title) throw new ValidationError('Title is required');
    if (!Array.isArray(context.metadata.tags)) throw new ValidationError('Tags must be an array');
    if (!context.metadata.priority) throw new ValidationError('Priority is required');
  }

  private async getAllContexts(): Promise<EnhancedContext[]> {
    return this.store.getAllContexts();
  }

  private matchesQuery(context: EnhancedContext, query: string): boolean {
    const searchText = query.toLowerCase();
    const content = context.content.toLowerCase();
    const title = context.metadata.title.toLowerCase();
    const description = context.metadata.description.toLowerCase();
    const tags = context.metadata.tags.map(tag => tag.toLowerCase());

    return (
      content.includes(searchText) ||
      title.includes(searchText) ||
      description.includes(searchText) ||
      tags.includes(searchText)
    );
  }
} 