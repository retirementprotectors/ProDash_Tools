import { EnhancedContext } from '../types/Context';
export declare class MongoContextStore {
    private readonly mongoUri;
    private client;
    private db;
    private collection;
    constructor(mongoUri: string);
    connect(): Promise<void>;
    addContext(context: EnhancedContext): Promise<void>;
    updateContext(id: string, context: EnhancedContext): Promise<void>;
    getContext(id: string): Promise<EnhancedContext | null>;
    getAllContexts(): Promise<EnhancedContext[]>;
    searchSimilar(queryVector: number[]): Promise<EnhancedContext[]>;
    getContextsByProject(project: string): Promise<EnhancedContext[]>;
    getContextsByTags(tags: string[]): Promise<EnhancedContext[]>;
    getContextsByTimeRange(start: number, end: number): Promise<EnhancedContext[]>;
    getContextsByPriority(priority: string): Promise<EnhancedContext[]>;
    deleteContext(id: string): Promise<void>;
    close(): Promise<void>;
}
