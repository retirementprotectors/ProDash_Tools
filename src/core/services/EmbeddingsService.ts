import OpenAI from 'openai';
import { logError } from '../utils/logger';
import { ServiceError } from '../utils/errors';

export class EmbeddingsService {
  private openai: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-ada-002') {
    this.openai = new OpenAI({ apiKey });
    this.model = model;
  }

  async getEmbedding(text: string): Promise<number[]> {
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
      logError(err, { message: 'Failed to get embedding from OpenAI' });
      throw new ServiceError(`Failed to get embedding: ${err.message}`);
    }
  }

  async getContextEmbedding(context: {
    content: string;
    metadata?: { title?: string; description?: string; tags?: string[] };
    messages?: { role: string; content: string }[];
    entities?: { name: string; type: string }[];
    learnings?: { content: string }[];
  }): Promise<number[]> {
    const text = this.prepareContextText(context);
    return this.getEmbedding(text);
  }

  private prepareContextText(context: {
    content: string;
    metadata?: { title?: string; description?: string; tags?: string[] };
    messages?: { role: string; content: string }[];
    entities?: { name: string; type: string }[];
    learnings?: { content: string }[];
  }): string {
    const parts: string[] = [context.content];

    if (context.metadata) {
      if (context.metadata.title) {
        parts.push(`Title: ${context.metadata.title}`);
      }
      if (context.metadata.description) {
        parts.push(`Description: ${context.metadata.description}`);
      }
      if (context.metadata.tags?.length) {
        parts.push(`Tags: ${context.metadata.tags.join(', ')}`);
      }
    }

    if (context.messages?.length) {
      const conversationText = context.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      parts.push(`Conversation:\n${conversationText}`);
    }

    if (context.entities?.length) {
      const entitiesText = context.entities
        .map(entity => `${entity.type}: ${entity.name}`)
        .join('\n');
      parts.push(`Entities:\n${entitiesText}`);
    }

    if (context.learnings?.length) {
      const learningsText = context.learnings
        .map(learning => learning.content)
        .join('\n');
      parts.push(`Learnings:\n${learningsText}`);
    }

    return parts.join('\n\n');
  }
} 