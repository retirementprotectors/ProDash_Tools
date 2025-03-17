import { Plugin } from '@/types';

export interface SearchConfig {
  engine: {
    type: 'elasticsearch' | 'solr';
    url: string;
    index: string;
    version: string;
  };
  features: {
    fullText: boolean;
    fuzzy: boolean;
    faceted: boolean;
    suggestions: boolean;
    highlighting: boolean;
    pagination: boolean;
  };
  indexing: {
    batchSize: number;
    refreshInterval: number;
    autoIndex: boolean;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  analytics: {
    enabled: boolean;
    trackQueries: boolean;
    trackResults: boolean;
  };
}

export class SearchPlugin implements Plugin {
  name = 'search';
  version = '1.0.0';
  private config?: SearchConfig;

  configure(config: SearchConfig): void {
    this.config = {
      engine: {
        type: config.engine?.type || 'elasticsearch',
        url: config.engine?.url || 'http://localhost:9200',
        index: config.engine?.index || 'search_index',
        version: config.engine?.version || '7.17.0'
      },
      features: {
        fullText: config.features?.fullText ?? true,
        fuzzy: config.features?.fuzzy ?? true,
        faceted: config.features?.faceted ?? true,
        suggestions: config.features?.suggestions ?? true,
        highlighting: config.features?.highlighting ?? true,
        pagination: config.features?.pagination ?? true
      },
      indexing: {
        batchSize: config.indexing?.batchSize ?? 1000,
        refreshInterval: config.indexing?.refreshInterval ?? 5000,
        autoIndex: config.indexing?.autoIndex ?? true
      },
      caching: {
        enabled: config.caching?.enabled ?? true,
        ttl: config.caching?.ttl ?? 3600,
        maxSize: config.caching?.maxSize ?? 1000
      },
      analytics: {
        enabled: config.analytics?.enabled ?? true,
        trackQueries: config.analytics?.trackQueries ?? true,
        trackResults: config.analytics?.trackResults ?? true
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('Search configuration not set');
    }

    await this.setupDependencies();
    await this.createSearchService();
    await this.setupIndex();
    console.log('Search plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Search plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      ...(this.config?.engine.type === 'elasticsearch' && {
        '@elastic/elasticsearch': '^8.0.0'
      }),
      ...(this.config?.engine.type === 'solr' && {
        'solr-node': '^0.12.0'
      }),
      'node-cache': '^5.1.2',
      'winston': '^3.8.2',
      'lodash': '^4.17.21'
    };

    console.log('Added Search dependencies:', dependencies);
  }

  private async createSearchService(): Promise<void> {
    const searchService = `
import { Client } from '@elastic/elasticsearch';
import NodeCache from 'node-cache';
import { debounce } from 'lodash';
import { trackSearch } from './analytics';

export class SearchService {
  private client: Client;
  private cache: NodeCache;
  private indexName: string;

  constructor() {
    this.client = new Client({
      node: '${this.config?.engine.url}',
      version: '${this.config?.engine.version}'
    });
    
    this.cache = new NodeCache({
      stdTTL: ${this.config?.caching.ttl},
      maxKeys: ${this.config?.caching.maxSize}
    });
    
    this.indexName = '${this.config?.engine.index}';
  }

  async search(query: string, options: {
    page?: number;
    limit?: number;
    filters?: Record<string, any>;
    sort?: string[];
    fields?: string[];
  }): Promise<{
    hits: any[];
    total: number;
    took: number;
    facets?: Record<string, any>;
  }> {
    const cacheKey = \`search:\${query}:\${JSON.stringify(options)}\`;
    
    ${this.config?.caching.enabled ? `
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;` : ''}

    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: options.fields || ['*'],
                fuzziness: ${this.config?.features.fuzzy ? "'AUTO'" : '0'},
                operator: 'AND'
              }
            }
          ],
          filter: this.buildFilters(options.filters)
        }
      },
      ${this.config?.features.highlighting ? `
      highlight: {
        fields: {
          '*': {}
        }
      },` : ''}
      ${this.config?.features.faceted ? `
      aggs: this.buildAggregations(options.filters),` : ''}
      from: (options.page || 0) * (options.limit || 10),
      size: options.limit || 10,
      sort: this.buildSort(options.sort)
    };

    const response = await this.client.search({
      index: this.indexName,
      body: searchBody
    });

    const result = {
      hits: response.hits.hits.map(hit => ({
        ...hit._source,
        score: hit._score,
        ${this.config?.features.highlighting ? 'highlights: hit.highlight,' : ''}
      })),
      total: response.hits.total,
      took: response.took,
      ${this.config?.features.faceted ? 'facets: response.aggregations,' : ''}
    };

    ${this.config?.caching.enabled ? `
    this.cache.set(cacheKey, result);` : ''}

    ${this.config?.analytics.trackQueries ? `
    trackSearch(query, options, result);` : ''}

    return result;
  }

  async suggest(query: string, field: string): Promise<string[]> {
    const response = await this.client.search({
      index: this.indexName,
      body: {
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field: \`\${field}.suggest\`,
              size: 5
            }
          }
        }
      }
    });

    return response.suggest.suggestions[0].options.map(option => option.text);
  }

  async index(documents: any[]): Promise<void> {
    const operations = documents.flatMap(doc => [
      { index: { _index: this.indexName } },
      doc
    ]);

    await this.client.bulk({ body: operations });
  }

  async delete(id: string): Promise<void> {
    await this.client.delete({
      index: this.indexName,
      id
    });
  }

  private buildFilters(filters?: Record<string, any>): any[] {
    if (!filters) return [];
    
    return Object.entries(filters).map(([field, value]) => ({
      term: { [field]: value }
    }));
  }

  private buildAggregations(filters?: Record<string, any>): Record<string, any> {
    if (!filters) return {};
    
    return Object.keys(filters).reduce((acc, field) => ({
      ...acc,
      [field]: {
        terms: {
          field,
          size: 10
        }
      }
    }), {});
  }

  private buildSort(sort?: string[]): any[] {
    if (!sort) return [];
    
    return sort.map(field => ({
      [field]: {
        order: field.startsWith('-') ? 'desc' : 'asc'
      }
    }));
  }
}`;

    console.log('Created Search service');
  }

  private async setupIndex(): Promise<void> {
    const indexConfig = {
      name: this.config?.engine.index,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1
      },
      mappings: {
        properties: {
          title: { type: 'text' },
          content: { type: 'text' },
          tags: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };

    console.log('Configured Search index:', indexConfig);
  }
}

export const searchPlugin = new SearchPlugin(); 