export declare class EmbeddingsService {
    private openai;
    private model;
    constructor(apiKey: string, model?: string);
    getEmbedding(text: string): Promise<number[]>;
    getContextEmbedding(context: {
        content: string;
        metadata?: {
            title?: string;
            description?: string;
            tags?: string[];
        };
        messages?: {
            role: string;
            content: string;
        }[];
        entities?: {
            name: string;
            type: string;
        }[];
        learnings?: {
            content: string;
        }[];
    }): Promise<number[]>;
    private prepareContextText;
}
