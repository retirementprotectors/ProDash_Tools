import { Vector, VectorOperations } from '../types/Vector';

export class DefaultVectorOperations implements VectorOperations {
  /**
   * Calculates cosine similarity between two vectors
   */
  similarity(a: Vector, b: Vector): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Adds two vectors
   */
  add(a: Vector, b: Vector): Vector {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return a.map((val, i) => val + b[i]);
  }

  /**
   * Subtracts vector b from vector a
   */
  subtract(a: Vector, b: Vector): Vector {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return a.map((val, i) => val - b[i]);
  }

  /**
   * Scales a vector by a scalar value
   */
  scale(vector: Vector, scalar: number): Vector {
    return vector.map(val => val * scalar);
  }

  /**
   * Normalizes a vector to unit length
   */
  normalize(vector: Vector): Vector {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      return vector;
    }

    return vector.map(val => val / magnitude);
  }

  /**
   * Calculates the weighted average of multiple vectors
   */
  weightedAverage(vectors: Vector[], weights: number[]): Vector {
    if (vectors.length === 0) {
      throw new Error('No vectors provided');
    }
    if (vectors.length !== weights.length) {
      throw new Error('Number of vectors must match number of weights');
    }

    const dimensions = vectors[0].length;
    if (!vectors.every(v => v.length === dimensions)) {
      throw new Error('All vectors must have the same dimensions');
    }

    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    if (weightSum === 0) {
      throw new Error('Sum of weights must be greater than 0');
    }

    // Normalize weights
    const normalizedWeights = weights.map(w => w / weightSum);

    // Calculate weighted sum
    const result = new Array(dimensions).fill(0);
    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      const weight = normalizedWeights[i];
      for (let j = 0; j < dimensions; j++) {
        result[j] += vector[j] * weight;
      }
    }

    return result;
  }

  /**
   * Calculates the distance between two vectors (Euclidean distance)
   */
  distance(a: Vector, b: Vector): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    const sumOfSquares = a.reduce((sum, val, i) => {
      const diff = val - b[i];
      return sum + diff * diff;
    }, 0);

    return Math.sqrt(sumOfSquares);
  }
} 