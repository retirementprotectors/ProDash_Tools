export interface Context {
    id: string;
    content: string;
    metadata: {
        title?: string;
        tags?: string[];
        timestamp: number;
        source?: string;
        type?: string;
        priority?: string;
        project?: string;
    };
    embedding?: number[];
}
export type ContextUpdate = Partial<Context>;
export interface SearchOptions {
    tags?: string[];
    query?: string;
    limit?: number;
}
