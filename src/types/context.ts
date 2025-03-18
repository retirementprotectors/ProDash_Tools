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

// Simple update type for partial updates
export type ContextUpdate = Partial<Context>;

// Search options
export interface SearchOptions {
  tags?: string[];
  query?: string;
  limit?: number;
} 