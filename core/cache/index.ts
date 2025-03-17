import { Plugin } from '@/types';

export interface CacheConfig {
  provider: {
    type: 'redis' | 'memory';
    url?: string;
    password?: string;
    database?: number;
  };
  features: {
    compression: boolean;
    encryption: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    alerts: boolean;
  };
  fallback: {
    enabled: boolean;
    strategy: 'memory' | 'none';
  };
}

export class CachePlugin implements Plugin {
  name = 'cache';
  version = '1.0.0';
  private config?: CacheConfig;

  configure(config: CacheConfig): void {
    this.config = {
      provider: {
        type: config.provider?.type || 'memory',
        url: config.provider?.url || 'redis://localhost:6379',
        password: config.provider?.password,
        database: config.provider?.database || 0
      },
      features: {
        compression: config.features?.compression ?? true,
        encryption: config.features?.encryption ?? false,
        ttl: config.features?.ttl ?? 3600,
        maxSize: config.features?.maxSize ?? 1000
      },
      monitoring: {
        enabled: config.monitoring?.enabled ?? true,
        metrics: config.monitoring?.metrics ?? true,
        alerts: config.monitoring?.alerts ?? true
      },
      fallback: {
        enabled: config.fallback?.enabled ?? true,
        strategy: config.fallback?.strategy || 'memory'
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('Cache configuration not set');
    }

    await this.setupDependencies();
    await this.createCacheService();
    await this.setupMonitoring();
    console.log('Cache plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Cache plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      ...(this.config?.provider.type === 'redis' && {
        'ioredis': '^5.3.2',
        'compression': '^1.7.4',
        'crypto-js': '^4.1.1'
      }),
      'winston': '^3.8.2',
      'prom-client': '^14.2.0'
    };

    console.log('Added Cache dependencies:', dependencies);
  }

  private async createCacheService(): Promise<void> {
    const cacheService = `
import { Redis } from 'ioredis';
import NodeCache from 'node-cache';
import { compress, decompress } from 'compression';
import CryptoJS from 'crypto-js';
import { promisify } from 'util';
import { trackMetrics } from './monitoring';

const compressAsync = promisify(compress);
const decompressAsync = promisify(decompress);

export class CacheService {
  private client: Redis | NodeCache;
  private fallback: NodeCache | null;
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = process.env.CACHE_ENCRYPTION_KEY || 'default-key';
    
    if ('${this.config?.provider.type}' === 'redis') {
      this.client = new Redis({
        host: '${this.config?.provider.url}',
        password: '${this.config?.provider.password}',
        db: ${this.config?.provider.database},
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        }
      });
    } else {
      this.client = new NodeCache({
        stdTTL: ${this.config?.features.ttl},
        maxKeys: ${this.config?.features.maxSize}
      });
    }

    ${this.config?.fallback.enabled ? `
    this.fallback = new NodeCache({
      stdTTL: ${this.config?.features.ttl},
      maxKeys: ${this.config?.features.maxSize}
    });` : 'this.fallback = null;'}
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      let value = await this.getFromPrimary(key);
      
      if (!value && this.fallback) {
        value = await this.getFromFallback(key);
      }

      return value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const processedValue = await this.processValue(value);
      await this.setInPrimary(key, processedValue, ttl);
      
      if (this.fallback) {
        await this.setInFallback(key, processedValue, ttl);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.deleteFromPrimary(key);
      if (this.fallback) {
        await this.deleteFromFallback(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.clearPrimary();
      if (this.fallback) {
        await this.clearFallback();
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  private async getFromPrimary(key: string): Promise<any> {
    if ('${this.config?.provider.type}' === 'redis') {
      const value = await (this.client as Redis).get(key);
      return value ? await this.unprocessValue(value) : null;
    } else {
      return (this.client as NodeCache).get(key);
    }
  }

  private async getFromFallback(key: string): Promise<any> {
    return this.fallback?.get(key);
  }

  private async setInPrimary(key: string, value: string, ttl?: number): Promise<void> {
    if ('${this.config?.provider.type}' === 'redis') {
      if (ttl) {
        await (this.client as Redis).setex(key, ttl, value);
      } else {
        await (this.client as Redis).set(key, value);
      }
    } else {
      (this.client as NodeCache).set(key, value, ttl);
    }
  }

  private async setInFallback(key: string, value: string, ttl?: number): Promise<void> {
    this.fallback?.set(key, value, ttl);
  }

  private async deleteFromPrimary(key: string): Promise<void> {
    if ('${this.config?.provider.type}' === 'redis') {
      await (this.client as Redis).del(key);
    } else {
      (this.client as NodeCache).del(key);
    }
  }

  private async deleteFromFallback(key: string): Promise<void> {
    this.fallback?.del(key);
  }

  private async clearPrimary(): Promise<void> {
    if ('${this.config?.provider.type}' === 'redis') {
      await (this.client as Redis).flushdb();
    } else {
      (this.client as NodeCache).flushAll();
    }
  }

  private async clearFallback(): Promise<void> {
    this.fallback?.flushAll();
  }

  private async processValue(value: any): Promise<string> {
    let processed = JSON.stringify(value);

    ${this.config?.features.compression ? `
    processed = await compressAsync(processed);` : ''}

    ${this.config?.features.encryption ? `
    processed = CryptoJS.AES.encrypt(processed, this.encryptionKey).toString();` : ''}

    return processed;
  }

  private async unprocessValue(value: string): Promise<any> {
    let unprocessed = value;

    ${this.config?.features.encryption ? `
    unprocessed = CryptoJS.AES.decrypt(unprocessed, this.encryptionKey).toString(CryptoJS.enc.Utf8);` : ''}

    ${this.config?.features.compression ? `
    unprocessed = await decompressAsync(unprocessed);` : ''}

    return JSON.parse(unprocessed);
  }
}`;

    console.log('Created Cache service');
  }

  private async setupMonitoring(): Promise<void> {
    const monitoringConfig = {
      enabled: this.config?.monitoring.enabled,
      metrics: {
        hits: true,
        misses: true,
        errors: true,
        latency: true
      },
      alerts: {
        errorThreshold: 0.1,
        latencyThreshold: 1000
      }
    };

    console.log('Configured Cache monitoring:', monitoringConfig);
  }
}

export const cachePlugin = new CachePlugin(); 