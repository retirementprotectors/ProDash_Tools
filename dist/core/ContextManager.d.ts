import { Context, ContextUpdate, SearchOptions } from '../types/context';
export declare class ContextManager {
    private mongoUrl;
    private openaiKey;
    private collection;
    private openai;
    private db;
    private client;
    private initialized;
    constructor(mongoUrl: string, openaiKey: string);
    initialize(): Promise<void>;
    connect(): Promise<void>;
    close(): Promise<void>;
    private getEmbedding;
    addContext(content: string, metadata?: Partial<Context['metadata']>): Promise<Context>;
    getContext(id: string): Promise<Context | null>;
    getAllContexts(): Promise<Context[]>;
    getContextCount(): Promise<number>;
    updateContext(id: string, update: ContextUpdate): Promise<Context | null>;
    deleteContext(id: string): Promise<boolean>;
    clearAllContexts(): Promise<void>;
    searchContexts(options: SearchOptions | string): Promise<Context[]>;
    isInitialized(): boolean;
}
