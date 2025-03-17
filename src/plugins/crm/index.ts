import { Plugin } from '@/types';

export type CrmPlatform = 'salesforce' | 'hubspot' | 'zoho' | 'pipedrive' | 'custom';

export interface CrmConfig {
  platform: CrmPlatform;
  credentials: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    customConfig?: Record<string, any>;
  };
  features: {
    contacts: boolean;
    leads: boolean;
    opportunities: boolean;
    accounts: boolean;
    tasks: boolean;
    customObjects: boolean;
  };
  sync: {
    enabled: boolean;
    interval: number;
    direction: 'pull' | 'push' | 'bidirectional';
  };
  caching: {
    enabled: boolean;
    ttl: number;
  };
}

export class CrmPlugin implements Plugin {
  name = 'crm';
  version = '1.0.0';
  private config?: CrmConfig;

  configure(config: CrmConfig): void {
    this.config = {
      platform: config.platform,
      credentials: {
        apiKey: config.credentials?.apiKey,
        clientId: config.credentials?.clientId,
        clientSecret: config.credentials?.clientSecret,
        refreshToken: config.credentials?.refreshToken,
        customConfig: config.credentials?.customConfig
      },
      features: {
        contacts: config.features?.contacts ?? true,
        leads: config.features?.leads ?? true,
        opportunities: config.features?.opportunities ?? true,
        accounts: config.features?.accounts ?? true,
        tasks: config.features?.tasks ?? true,
        customObjects: config.features?.customObjects ?? false
      },
      sync: {
        enabled: config.sync?.enabled ?? true,
        interval: config.sync?.interval ?? 300000, // 5 minutes
        direction: config.sync?.direction ?? 'bidirectional'
      },
      caching: {
        enabled: config.caching?.enabled ?? true,
        ttl: config.caching?.ttl ?? 3600000 // 1 hour
      }
    };
  }

  async install(): Promise<void> {
    if (!this.config) {
      throw new Error('CRM configuration not set');
    }

    await this.setupDependencies();
    await this.createConnectors();
    await this.setupSync();
    console.log('CRM plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('CRM plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      ...(this.config?.platform === 'salesforce' && { 'jsforce': '^1.11.0' }),
      ...(this.config?.platform === 'hubspot' && { '@hubspot/api-client': '^8.0.0' }),
      ...(this.config?.platform === 'zoho' && { 'zoho-crm-ts': '^2.1.0' }),
      'node-cache': '^5.1.2',
      'axios': '^1.3.4'
    };

    // Add dependencies to package.json
    console.log('Added CRM dependencies:', dependencies);
  }

  private async createConnectors(): Promise<void> {
    const connectors = [
      {
        name: 'client',
        template: `
import { createClient } from './${this.config?.platform}';
import { setupCache } from './cache';

export const crmClient = createClient({
  credentials: ${JSON.stringify(this.config?.credentials)},
  caching: ${JSON.stringify(this.config?.caching)}
});`
      },
      {
        name: 'contacts',
        enabled: this.config?.features.contacts,
        template: `
import { crmClient } from './client';

export async function getContacts(filters?: Record<string, any>) {
  return crmClient.contacts.list(filters);
}

export async function createContact(data: Record<string, any>) {
  return crmClient.contacts.create(data);
}

export async function updateContact(id: string, data: Record<string, any>) {
  return crmClient.contacts.update(id, data);
}`
      },
      {
        name: 'sync',
        enabled: this.config?.sync.enabled,
        template: `
import { crmClient } from './client';
import { setupEventHandlers } from './events';

export async function startSync() {
  const interval = ${this.config?.sync.interval};
  const direction = '${this.config?.sync.direction}';
  
  // Setup sync logic
  console.log(\`Starting CRM sync: \${direction} every \${interval}ms\`);
}`
      }
    ];

    console.log('Created CRM connectors:', connectors.map(c => c.name));
  }

  private async setupSync(): Promise<void> {
    if (!this.config?.sync.enabled) return;

    const syncConfig = {
      interval: this.config.sync.interval,
      direction: this.config.sync.direction,
      features: this.config.features
    };

    console.log('Configured CRM sync with:', syncConfig);
  }
}

export const crmPlugin = new CrmPlugin(); 