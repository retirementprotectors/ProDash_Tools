import OpenAI from 'openai';
import { logError } from './logger';
import { ServiceError } from './errors';

export interface VectorOperations {
  textToVector(text: string): Promise<number[]>;
  similarity(a: number[], b: number[]): number;
}

export class DefaultVectorOperations implements VectorOperations {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-ada-002') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async textToVector(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text
      });

      if (!response.data[0]?.embedding) {
        throw new Error('No embedding returned from OpenAI API');
      }

      return response.data[0].embedding;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError(err, { message: 'Failed to convert text to vector' });
      throw new ServiceError(`Failed to convert text to vector: ${err.message}`);
    }
  }

  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    const dotProduct = a.reduce((sum, value, i) => sum + value * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }
} 