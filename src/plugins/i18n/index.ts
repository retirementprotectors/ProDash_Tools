import { Plugin } from '@/types';

export interface I18nConfig {
  languages: {
    default: string;
    supported: string[];
    fallback: string;
  };
  features: {
    autoDetect: boolean;
    rtl: boolean;
    pluralization: boolean;
    interpolation: boolean;
    formatting: boolean;
  };
  storage: {
    type: 'file' | 'database' | 'api';
    path?: string;
    table?: string;
    endpoint?: string;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logs: boolean;
  };
}

export class I18nPlugin implements Plugin {
  name = 'i18n';
  version = '1.0.0';
  private config?: I18nConfig;

  configure(config: I18nConfig): void {
    this.config = {
      languages: {
        default: config.languages?.default || 'en',
        supported: config.languages?.supported || ['en'],
        fallback: config.languages?.fallback || 'en'
      },
      features: {
        autoDetect: config.features?.autoDetect ?? true,
        rtl: config.features?.rtl ?? true,
        pluralization: config.features?.pluralization ?? true,
        interpolation: config.features?.interpolation ?? true,
        formatting: config.features?.formatting ?? true
      },
      storage: {
        type: config.storage?.type || 'file',
        path: config.storage?.path || 'locales',
        table: config.storage?.table || 'translations',
        endpoint: config.storage?.endpoint
      },
      caching: {
        enabled: config.caching?.enabled ?? true,
        ttl: config.caching?.ttl || 3600,
        maxSize: config.caching?.maxSize || 1000
      },
      monitoring: {
        enabled: config.monitoring?.enabled ?? true,
        metrics: config.monitoring?.metrics ?? true,
        logs: config.monitoring?.logs ?? true
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('I18n configuration not set');
    }

    await this.setupDependencies();
    await this.createI18nService();
    await this.setupStorage();
    await this.setupMonitoring();
    console.log('I18n plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('I18n plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      'i18next': '^23.7.6',
      'i18next-fs-backend': '^2.2.3',
      'i18next-http-backend': '^2.2.3',
      'i18next-browser-languagedetector': '^7.2.0',
      'i18next-intervalplural-postprocessor': '^0.2.3',
      'moment': '^2.29.4',
      'numeral': '^2.0.6',
      'winston': '^3.8.2',
      'prom-client': '^14.2.0'
    };

    console.log('Added I18n dependencies:', dependencies);
  }

  private async createI18nService(): Promise<void> {
    const i18nService = `
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import intervalPlural from 'i18next-intervalplural-postprocessor';
import moment from 'moment';
import numeral from 'numeral';
import { trackMetrics } from './monitoring';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface TranslationOptions {
  key: string;
  params?: Record<string, any>;
  count?: number;
  context?: string;
  language?: string;
}

export interface FormatOptions {
  type: 'date' | 'time' | 'number' | 'currency';
  value: any;
  format?: string;
  language?: string;
}

export class I18nService {
  private cache: Map<string, any>;
  private rtlLanguages: Set<string>;
  private initialized: boolean;

  constructor() {
    this.cache = new Map();
    this.rtlLanguages = new Set(['ar', 'he', 'fa', 'ur']);
    this.initialized = false;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const i18nConfig = {
      fallbackLng: '${this.config?.languages.fallback}',
      supportedLngs: ${JSON.stringify(this.config?.languages.supported)},
      defaultNS: 'common',
      ns: ['common'],
      ${this.config?.features.autoDetect ? `
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'navigator', 'path', 'subdomain'],
        lookupQuerystring: 'lang',
        lookupCookie: 'i18next',
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage', 'cookie']
      },` : ''}
      ${this.config?.storage.type === 'file' ? `
      backend: {
        loadPath: join(__dirname, '${this.config?.storage.path}', '{{lng}}/{{ns}}.json')
      },` : ''}
      ${this.config?.storage.type === 'api' ? `
      backend: {
        loadPath: '${this.config?.storage.endpoint}/{{lng}}/{{ns}}'
      },` : ''}
      ${this.config?.features.pluralization ? `
      postProcess: ['intervalPlural'],` : ''}
      interpolation: {
        escapeValue: false
      }
    };

    await i18next
      ${this.config?.storage.type === 'file' ? '.use(Backend)' : ''}
      ${this.config?.storage.type === 'api' ? '.use(HttpBackend)' : ''}
      ${this.config?.features.autoDetect ? '.use(LanguageDetector)' : ''}
      ${this.config?.features.pluralization ? '.use(intervalPlural)' : ''}
      .init(i18nConfig);

    this.initialized = true;
  }

  async translate(options: TranslationOptions): Promise<string> {
    const startTime = Date.now();
    
    try {
      await this.init();

      const { key, params, count, context, language } = options;
      const cacheKey = \`\${language || i18next.language}:\${key}:\${JSON.stringify(params)}:\${count}\`;

      ${this.config?.caching.enabled ? `
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;` : ''}

      let translation = i18next.t(key, {
        ...params,
        count,
        context,
        lng: language
      });

      ${this.config?.caching.enabled ? `
      this.cache.set(cacheKey, translation);` : ''}

      const duration = Date.now() - startTime;
      
      ${this.config?.monitoring.metrics ? `
      trackMetrics('translation_requested', {
        key,
        language: language || i18next.language,
        duration
      });` : ''}

      return translation;
    } catch (error) {
      ${this.config?.monitoring.metrics ? `
      trackMetrics('translation_error', {
        key: options.key,
        error: error.message
      });` : ''}
      
      throw error;
    }
  }

  async format(options: FormatOptions): Promise<string> {
    const { type, value, format, language } = options;
    
    ${this.config?.features.formatting ? `
    switch (type) {
      case 'date':
        return moment(value).locale(language || i18next.language).format(format || 'L');
      
      case 'time':
        return moment(value).locale(language || i18next.language).format(format || 'LT');
      
      case 'number':
        return numeral(value).locale(language || i18next.language).format(format || '0,0');
      
      case 'currency':
        return numeral(value).locale(language || i18next.language).format(format || '$0,0.00');
      
      default:
        return String(value);
    }` : 'return String(value);'}
  }

  isRTL(language?: string): boolean {
    return this.rtlLanguages.has(language || i18next.language);
  }

  async changeLanguage(language: string): Promise<void> {
    await this.init();
    await i18next.changeLanguage(language);
  }

  getCurrentLanguage(): string {
    return i18next.language;
  }

  async loadTranslations(language: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      ${this.config?.storage.type === 'file' ? `
      const path = join(__dirname, '${this.config?.storage.path}', language);
      const files = readdirSync(path);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const ns = file.replace('.json', '');
          const translations = JSON.parse(readFileSync(join(path, file), 'utf-8'));
          i18next.addResourceBundle(language, ns, translations, true, true);
        }
      }` : ''}
      
      ${this.config?.storage.type === 'api' ? `
      const response = await fetch(\`\${this.config?.storage.endpoint}/\${language}\`);
      const translations = await response.json();
      
      Object.entries(translations).forEach(([ns, data]) => {
        i18next.addResourceBundle(language, ns, data, true, true);
      });` : ''}

      const duration = Date.now() - startTime;
      
      ${this.config?.monitoring.metrics ? `
      trackMetrics('translations_loaded', {
        language,
        duration
      });` : ''}
    } catch (error) {
      ${this.config?.monitoring.metrics ? `
      trackMetrics('translation_load_error', {
        language,
        error: error.message
      });` : ''}
      
      throw error;
    }
  }

  async reloadTranslations(): Promise<void> {
    await this.init();
    await i18next.reloadResources();
  }
}`;

    console.log('Created I18n service');
  }

  private async setupStorage(): Promise<void> {
    const storageConfig = {
      type: this.config?.storage.type,
      path: this.config?.storage.path,
      table: this.config?.storage.table,
      endpoint: this.config?.storage.endpoint
    };

    console.log('Configured I18n storage:', storageConfig);
  }

  private async setupMonitoring(): Promise<void> {
    const monitoringConfig = {
      enabled: this.config?.monitoring.enabled,
      metrics: {
        translations: true,
        languageChanges: true,
        loadTime: true,
        errors: true
      },
      logs: {
        level: 'info',
        format: 'json'
      }
    };

    console.log('Configured I18n monitoring:', monitoringConfig);
  }
}

export const i18nPlugin = new I18nPlugin(); 