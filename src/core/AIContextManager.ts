import { ContextManager } from './ContextManager';
import { ContextCaptureService } from './ContextCaptureService';
import * as tf from '@tensorflow/tfjs-node';
import { pipeline } from '@xenova/transformers';
import { SentenceTransformer } from 'sentence-transformers';

interface AIContextConfig {
  autoSearchEnabled: boolean;
  relevanceThreshold: number;
  maxRelatedContexts: number;
  learningEnabled: boolean;
  embeddingModel: string;
  contextWindowSize: number;
  minRelevanceScore: number;
}

export interface EnhancedContext {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: string;
    topic?: string;
    confidence: number;
    usageCount: number;
    lastUsed: number;
    relatedContexts?: string[];
    parentContext?: string;
    contextType: 'solution' | 'explanation' | 'error' | 'success' | 'interaction';
    suggestedApproach?: string;
  };
}

export class AIContextManager {
  private contextManager: ContextManager;
  private captureService: ContextCaptureService;
  private encoder: SentenceTransformer;
  private classifier: any; // Zero-shot classifier
  private config: AIContextConfig = {
    autoSearchEnabled: true,
    relevanceThreshold: 0.7,
    maxRelatedContexts: 5,
    learningEnabled: true,
    embeddingModel: 'all-MiniLM-L6-v2',
    contextWindowSize: 2048,
    minRelevanceScore: 0.6
  };

  constructor() {
    this.contextManager = new ContextManager();
    this.captureService = new ContextCaptureService();
  }

  async initialize(): Promise<void> {
    await this.contextManager.initialize();
    await this.captureService.initialize();
    
    // Initialize NLP models
    this.encoder = new SentenceTransformer(this.config.embeddingModel);
    this.classifier = await pipeline('zero-shot-classification');
    
    console.log('AI Context Manager initialized with NLP capabilities');
  }

  getConfig(): AIContextConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<AIContextConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async processUserQuery(query: string): Promise<{
    relatedContexts: EnhancedContext[];
    suggestedApproaches: string[];
    confidence: number;
  }> {
    // Generate query embedding
    const queryEmbedding = await this.encoder.encode(query);
    
    // Get all potentially relevant contexts
    const contexts = await this.contextManager.searchContexts(query);
    
    // Calculate semantic similarity with embeddings
    const enhancedContexts = await Promise.all(
      contexts.map(async (context) => {
        const contextEmbedding = await this.encoder.encode(context.content);
        const similarity = this.cosineSimilarity(queryEmbedding, contextEmbedding);
        
        // Classify the context type
        const classification = await this.classifier(context.content, [
          'solution', 'explanation', 'error', 'success', 'interaction'
        ]);

        // Generate a suggested approach based on context type
        const suggestedApproach = await this.generateContextApproach(
          context.content,
          classification.labels[0]
        );
        
        return {
          id: context.id,
          content: context.content,
          embedding: contextEmbedding,
          metadata: {
            type: context.metadata?.type || 'unknown',
            topic: context.metadata?.topic,
            confidence: similarity,
            usageCount: context.metadata?.usageCount || 0,
            lastUsed: context.metadata?.lastUsed || Date.now(),
            relatedContexts: context.metadata?.relatedContexts || [],
            parentContext: context.metadata?.parentContext,
            contextType: classification.labels[0] as EnhancedContext['metadata']['contextType'],
            suggestedApproach
          }
        } as EnhancedContext;
      })
    );
    
    // Filter and sort by relevance
    const relatedContexts = enhancedContexts
      .filter(context => context.metadata.confidence > this.config.minRelevanceScore)
      .sort((a, b) => b.metadata.confidence - a.metadata.confidence)
      .slice(0, this.config.maxRelatedContexts);

    // Generate approaches using context patterns
    const suggestedApproaches = await this.generateEnhancedSuggestions(query, relatedContexts);

    // Calculate overall confidence
    const confidence = relatedContexts.reduce(
      (acc, ctx) => acc + ctx.metadata.confidence, 
      0
    ) / (relatedContexts.length || 1);

    // Learn from this interaction
    if (this.config.learningEnabled) {
      await this.learnFromInteraction(query, relatedContexts, confidence);
    }

    return {
      relatedContexts,
      suggestedApproaches,
      confidence
    };
  }

  async captureResponse(sessionId: string, response: string, metadata: any): Promise<void> {
    if (!this.config.learningEnabled) return;

    // Generate embedding for the response
    const embedding = await this.encoder.encode(response);
    
    // Classify response type and topic
    const classification = await this.classifier(response, [
      'solution', 'explanation', 'question', 'error', 'success'
    ]);

    // Capture the AI's response with enhanced metadata
    await this.contextManager.addContext(response, {
      ...metadata,
      sessionId,
      timestamp: Date.now(),
      type: 'ai_response',
      embedding,
      classification: classification.labels[0],
      confidence: classification.scores[0],
      usageMetrics: {
        created: Date.now(),
        lastUsed: Date.now(),
        usageCount: 1
      }
    });

    // Update the session
    await this.captureService.updateSession(sessionId, response);
  }

  private async generateContextApproach(
    content: string,
    contextType: string
  ): Promise<string> {
    // Use zero-shot classification to determine the best approach
    const approaches = {
      solution: ['implement', 'modify', 'configure', 'setup'],
      explanation: ['understand', 'analyze', 'describe', 'compare'],
      error: ['debug', 'fix', 'resolve', 'prevent'],
      success: ['optimize', 'enhance', 'improve', 'extend'],
      interaction: ['discuss', 'clarify', 'explore', 'plan']
    };

    const classification = await this.classifier(
      content,
      approaches[contextType as keyof typeof approaches] || approaches.interaction
    );

    return `${classification.labels[0]} - ${content.substring(0, 100)}...`;
  }

  private async generateEnhancedSuggestions(
    query: string,
    contexts: EnhancedContext[]
  ): Promise<string[]> {
    return contexts.map(context => {
      const { confidence, contextType, suggestedApproach } = context.metadata;
      const relevanceNote = confidence > 0.8 ? 'highly relevant' : 'potentially relevant';
      
      return `${relevanceNote} ${contextType}: ${suggestedApproach || context.content.substring(0, 100)}... (${(confidence * 100).toFixed(1)}%)`;
    });
  }

  private async learnFromInteraction(
    query: string,
    usedContexts: EnhancedContext[],
    confidence: number
  ): Promise<void> {
    // Update usage metrics for used contexts
    for (const context of usedContexts) {
      const updatedContext: EnhancedContext = {
        ...context,
        metadata: {
          ...context.metadata,
          usageCount: context.metadata.usageCount + 1,
          lastUsed: Date.now()
        }
      };
      
      await this.contextManager.updateContext(context.id, updatedContext);
    }

    // Store the interaction pattern
    const interactionContext: EnhancedContext = {
      id: Date.now().toString(),
      content: JSON.stringify({ query, usedContextIds: usedContexts.map(c => c.id) }),
      embedding: await this.encoder.encode(query),
      metadata: {
        type: 'interaction_pattern',
        confidence,
        usageCount: 1,
        lastUsed: Date.now(),
        contextType: 'interaction',
        topic: 'query_pattern'
      }
    };

    await this.contextManager.addContext(interactionContext.id, interactionContext);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = tf.dot(a, b);
    const normA = tf.norm(a);
    const normB = tf.norm(b);
    return dotProduct.div(normA.mul(normB)).dataSync()[0];
  }

  async shutdown(): Promise<void> {
    await this.captureService.shutdown();
  }
} 