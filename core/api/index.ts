import { Plugin } from '@/types';

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: Function;
  middleware?: Function[];
  documentation: {
    summary: string;
    description?: string;
    parameters?: {
      name: string;
      in: 'path' | 'query' | 'header' | 'body';
      required: boolean;
      type: string;
      description?: string;
    }[];
    responses: {
      [statusCode: string]: {
        description: string;
        content?: {
          'application/json': {
            schema: Record<string, any>;
          };
        };
      };
    };
  };
}

export interface ApiConfig {
  basePath: string;
  endpoints: ApiEndpoint[];
  middleware?: Function[];
  cors?: {
    origin: string | string[];
    methods?: string[];
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export class ApiPlugin implements Plugin {
  name = 'api';
  version = '1.0.0';
  private config?: ApiConfig;

  configure(config: ApiConfig): void {
    this.config = {
      basePath: config.basePath || '/api',
      endpoints: config.endpoints || [],
      middleware: config.middleware || [],
      cors: config.cors || { origin: '*' },
      rateLimit: config.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('API configuration not set');
    }

    // Generate OpenAPI documentation
    const openApiDocs = this.generateOpenApiDocs();
    
    // Set up API routes and middleware
    await this.setupApiRoutes();
    
    console.log('API plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    // Cleanup API routes
    console.log('API plugin uninstalled');
  }

  private generateOpenApiDocs(): Record<string, any> {
    const docs = {
      openapi: '3.0.0',
      info: {
        title: 'ProDash Tools API',
        version: this.version,
      },
      paths: {},
    };

    this.config!.endpoints.forEach(endpoint => {
      const path = endpoint.path.startsWith('/')
        ? endpoint.path
        : '/' + endpoint.path;

      docs.paths[path] = {
        [endpoint.method.toLowerCase()]: {
          summary: endpoint.documentation.summary,
          description: endpoint.documentation.description,
          parameters: endpoint.documentation.parameters,
          responses: endpoint.documentation.responses,
        },
      };
    });

    return docs;
  }

  private async setupApiRoutes(): Promise<void> {
    if (!this.config) return;
    // Implementation for setting up API routes
    console.log('API routes configured with base path:', this.config.basePath);
  }
}

export const apiPlugin = new ApiPlugin(); 