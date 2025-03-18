export interface VectorOperations {
    textToVector(text: string): Promise<number[]>;
    similarity(a: number[], b: number[]): number;
}
export declare class DefaultVectorOperations implements VectorOperations {
    private openai;
    private model;
    constructor(apiKey: string, model?: string);
    textToVector(text: string): Promise<number[]>;
    similarity(a: number[], b: number[]): number;
}
