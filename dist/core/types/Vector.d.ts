/**
 * Represents a vector embedding for various types of searches and comparisons
 */
export type Vector = number[];
export interface VectorMetadata {
    dimensions: number;
    model: string;
    timestamp: number;
    version: string;
}
export interface VectorWithMetadata {
    vector: Vector;
    metadata: VectorMetadata;
}
export interface VectorOperations {
    similarity: (a: Vector, b: Vector) => number;
    add: (a: Vector, b: Vector) => Vector;
    subtract: (a: Vector, b: Vector) => Vector;
    scale: (vector: Vector, scalar: number) => Vector;
    normalize: (vector: Vector) => Vector;
}
export declare const VECTOR_DIMENSIONS: {
    readonly SEMANTIC: 1536;
    readonly CONCEPTUAL: 768;
    readonly TEMPORAL: 128;
    readonly CATEGORICAL: 256;
};
