import { Vector, VectorOperations } from '../types/Vector';
export declare class DefaultVectorOperations implements VectorOperations {
    /**
     * Calculates cosine similarity between two vectors
     */
    similarity(a: Vector, b: Vector): number;
    /**
     * Adds two vectors
     */
    add(a: Vector, b: Vector): Vector;
    /**
     * Subtracts vector b from vector a
     */
    subtract(a: Vector, b: Vector): Vector;
    /**
     * Scales a vector by a scalar value
     */
    scale(vector: Vector, scalar: number): Vector;
    /**
     * Normalizes a vector to unit length
     */
    normalize(vector: Vector): Vector;
    /**
     * Calculates the weighted average of multiple vectors
     */
    weightedAverage(vectors: Vector[], weights: number[]): Vector;
    /**
     * Calculates the distance between two vectors (Euclidean distance)
     */
    distance(a: Vector, b: Vector): number;
}
