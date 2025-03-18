import { EnhancedContext, ConversationMessage, Entity, Learning, Outcome, ContextUpdate } from '../types/Context';
import { DefaultVectorOperations } from '../utils/vectorOperations';
export declare class EnhancedContextService {
    private readonly mongoUri;
    private contexts;
    private vectorOps;
    private embeddingsService;
    private store;
    constructor(vectorOps: DefaultVectorOperations, mongoUri: string);
    /**
     * Initializes the service
     */
    initialize(): Promise<void>;
    /**
     * Creates a new context or updates an existing one
     */
    addContext(context: EnhancedContext): Promise<EnhancedContext>;
    /**
     * Adds a message to an existing context
     */
    addMessage(contextId: string, message: ConversationMessage): Promise<EnhancedContext>;
    /**
     * Adds an entity to the knowledge base
     */
    addEntity(contextId: string, entity: Entity): Promise<EnhancedContext>;
    /**
     * Adds a learning to the knowledge base
     */
    addLearning(contextId: string, learning: Learning): Promise<EnhancedContext>;
    /**
     * Records an outcome in the context
     */
    addOutcome(contextId: string, outcome: Outcome): Promise<EnhancedContext>;
    /**
     * Updates vectors for the context
     */
    private updateVectors;
    /**
     * Finds similar contexts based on vector similarity
     */
    findSimilar(contextId: string, limit?: number): Promise<Array<{
        context: EnhancedContext;
        similarity: number;
    }>>;
    /**
     * Retrieves a context by ID
     */
    getContext(id: string): Promise<EnhancedContext | null>;
    /**
     * Updates specific fields in a context
     */
    updateContext(id: string, update: ContextUpdate): Promise<EnhancedContext>;
    /**
     * Links two contexts together by creating a relationship
     */
    linkContexts(sourceId: string, targetId: string, relationType: string, strength: number): Promise<void>;
    /**
     * Exports all contexts for backup
     */
    exportContexts(): Promise<EnhancedContext[]>;
    /**
     * Imports contexts from a backup
     */
    importContexts(contexts: EnhancedContext[]): Promise<void>;
    /**
     * Searches contexts by text content
     */
    searchContexts(query: string): Promise<EnhancedContext[]>;
    /**
     * Gets contexts by project
     */
    getContextsByProject(project: string): Promise<EnhancedContext[]>;
    /**
     * Gets contexts by tags
     */
    getContextsByTags(tags: string[]): Promise<EnhancedContext[]>;
    /**
     * Gets contexts by time range
     */
    getContextsByTimeRange(start: number, end: number): Promise<EnhancedContext[]>;
    /**
     * Gets contexts by priority
     */
    getContextsByPriority(priority: string): Promise<EnhancedContext[]>;
    /**
     * Deletes a context
     */
    deleteContext(contextId: string): Promise<void>;
    /**
     * Closes all connections
     */
    close(): Promise<void>;
    private updateContextVectors;
    private getContextText;
    private validateContext;
    private getAllContexts;
    private matchesQuery;
}
