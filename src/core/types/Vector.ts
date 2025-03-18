/**
 * Represents a vector embedding for various types of searches and comparisons
 */
export type Vector = number[];

export interface VectorMetadata {
  dimensions: number;
  model: string;  // The model used to generate this vector
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

// Constants for common vector dimensions
export const VECTOR_DIMENSIONS = {
  SEMANTIC: 1536,  // OpenAI Ada-2
  CONCEPTUAL: 768, // Smaller for concept matching
  TEMPORAL: 128,   // Time-based relationships
  CATEGORICAL: 256 // Category relationships
} as const; 