import { Plugin } from '@/types';

export interface NotificationConfig {
  providers: {
    push: {
      enabled: boolean;
      firebase?: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
      };
      webPush?: {
        publicKey: string;
        privateKey: string;
      };
    };
    sms: {
      enabled: boolean;
      twilio?: {
        accountSid: string;
        authToken: string;
        phoneNumber: string;
      };
      messageBird?: {
        accessKey: string;
        originator: string;
      };
    };
    webhook: {
      enabled: boolean;
      endpoints: string[];
      retryAttempts: number;
      timeout: number;
    };
  };
  features: {
    queuing: boolean;
    scheduling: boolean;
    templates: boolean;
    tracking: boolean;
  };
  defaults: {
    priority: 'high' | 'normal' | 'low';
    ttl: number;
    retryDelay: number;
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logs: boolean;
  };
}

export class NotificationPlugin implements Plugin {
  name = 'notification';
  version = '1.0.0';
  private config?: NotificationConfig;

  configure(config: NotificationConfig): void {
    this.config = {
      providers: {
        push: {
          enabled: config.providers?.push?.enabled ?? true,
          firebase: config.providers?.push?.firebase,
          webPush: config.providers?.push?.webPush
        },
        sms: {
          enabled: config.providers?.sms?.enabled ?? true,
          twilio: config.providers?.sms?.twilio,
          messageBird: config.providers?.sms?.messageBird
        },
        webhook: {
          enabled: config.providers?.webhook?.enabled ?? true,
          endpoints: config.providers?.webhook?.endpoints || [],
          retryAttempts: config.providers?.webhook?.retryAttempts || 3,
          timeout: config.providers?.webhook?.timeout || 5000
        }
      },
      features: {
        queuing: config.features?.queuing ?? true,
        scheduling: config.features?.scheduling ?? true,
        templates: config.features?.templates ?? true,
        tracking: config.features?.tracking ?? true
      },
      defaults: {
        priority: config.defaults?.priority || 'normal',
        ttl: config.defaults?.ttl || 86400, // 24 hours
        retryDelay: config.defaults?.retryDelay || 300000 // 5 minutes
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
      throw new Error('Notification configuration not set');
    }

    await this.setupDependencies();
    await this.createNotificationService();
    await this.setupProviders();
    await this.setupMonitoring();
    console.log('Notification plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Notification plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      ...(this.config?.providers.push.enabled && {
        'firebase-admin': '^11.8.0',
        'web-push': '^3.6.6'
      }),
      ...(this.config?.providers.sms.enabled && {
        'twilio': '^4.11.0',
        'messagebird': '^3.7.0'
      }),
      'bull': '^4.10.4',
      'handlebars': '^4.7.7',
      'winston': '^3.8.2',
      'prom-client': '^14.2.0'
    };

    console.log('Added Notification dependencies:', dependencies);
  }

  private async createNotificationService(): Promise<void> {
    const notificationService = `
import admin from 'firebase-admin';
import webpush from 'web-push';
import twilio from 'twilio';
import messagebird from 'messagebird';
import Queue from 'bull';
import { compile } from 'handlebars';
import { trackMetrics } from './monitoring';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface NotificationOptions {
  type: 'push' | 'sms' | 'webhook';
  recipients: string[];
  title?: string;
  body: string;
  data?: Record<string, any>;
  template?: string;
  context?: Record<string, any>;
  schedule?: Date;
  priority?: 'high' | 'normal' | 'low';
  ttl?: number;
  tracking?: boolean;
}

export class NotificationService {
  private pushQueue: Queue.Queue;
  private smsQueue: Queue.Queue;
  private webhookQueue: Queue.Queue;
  private templates: Map<string, string>;
  private trackingEnabled: boolean;

  constructor() {
    this.templates = new Map();
    this.trackingEnabled = ${this.config?.features.tracking};
    
    ${this.config?.features.queuing ? `
    this.pushQueue = new Queue('push-notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.smsQueue = new Queue('sms-notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    this.webhookQueue = new Queue('webhook-notifications', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });` : ''}

    this.setupProviders();
  }

  async send(options: NotificationOptions): Promise<void> {
    try {
      const processedOptions = await this.processOptions(options);
      
      if (options.schedule) {
        await this.scheduleNotification(processedOptions, options.schedule);
      } else {
        await this.sendNotification(processedOptions);
      }
    } catch (error) {
      console.error('Notification send error:', error);
      throw error;
    }
  }

  async sendBulk(options: NotificationOptions[]): Promise<void> {
    const promises = options.map(opt => this.send(opt));
    await Promise.all(promises);
  }

  private async processOptions(options: NotificationOptions): Promise<NotificationOptions> {
    let body = options.body;
    
    if (options.template) {
      body = await this.renderTemplate(options.template, options.context || {});
    }

    return {
      ...options,
      body,
      priority: options.priority || '${this.config?.defaults.priority}',
      ttl: options.ttl || ${this.config?.defaults.ttl},
      tracking: this.trackingEnabled && options.tracking !== false
    };
  }

  private async sendNotification(options: NotificationOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (options.type) {
        case 'push':
          await this.sendPushNotification(options);
          break;
        
        case 'sms':
          await this.sendSmsNotification(options);
          break;
        
        case 'webhook':
          await this.sendWebhookNotification(options);
          break;
      }

      const duration = Date.now() - startTime;
      
      ${this.config?.monitoring.metrics ? `
      trackMetrics('notification_sent', {
        type: options.type,
        recipients: options.recipients.length,
        duration
      });` : ''}
    } catch (error) {
      ${this.config?.monitoring.metrics ? `
      trackMetrics('notification_error', {
        type: options.type,
        error: error.message
      });` : ''}
      
      throw error;
    }
  }

  private async sendPushNotification(options: NotificationOptions): Promise<void> {
    const { recipients, title, body, data, priority } = options;
    
    ${this.config?.providers.push.enabled ? `
    if (this.config?.providers.push.firebase) {
      const messages = recipients.map(token => ({
        token,
        notification: {
          title,
          body
        },
        data,
        android: {
          priority,
          ttl: options.ttl
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              priority: priority === 'high' ? 10 : 5
            }
          }
        }
      }));

      await admin.messaging().sendAll(messages);
    }

    if (this.config?.providers.push.webPush) {
      const messages = recipients.map(subscription => ({
        endpoint: subscription,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        },
        payload: JSON.stringify({
          title,
          body,
          data
        })
      }));

      await Promise.all(
        messages.map(message =>
          webpush.sendNotification(message, this.config?.providers.push.webPush?.privateKey || '')
        )
      );
    }` : ''}
  }

  private async sendSmsNotification(options: NotificationOptions): Promise<void> {
    const { recipients, body } = options;
    
    ${this.config?.providers.sms.enabled ? `
    if (this.config?.providers.sms.twilio) {
      const client = twilio(
        this.config.providers.sms.twilio.accountSid,
        this.config.providers.sms.twilio.authToken
      );

      await Promise.all(
        recipients.map(phoneNumber =>
          client.messages.create({
            body,
            to: phoneNumber,
            from: this.config?.providers.sms.twilio.phoneNumber
          })
        )
      );
    }

    if (this.config?.providers.sms.messageBird) {
      const client = messagebird(this.config.providers.sms.messageBird.accessKey);

      await client.messages.create({
        originator: this.config?.providers.sms.messageBird.originator,
        recipients,
        body
      });
    }` : ''}
  }

  private async sendWebhookNotification(options: NotificationOptions): Promise<void> {
    const { recipients, body, data } = options;
    
    ${this.config?.providers.webhook.enabled ? `
    const payload = {
      body,
      data,
      timestamp: new Date().toISOString()
    };

    await Promise.all(
      recipients.map(endpoint =>
        this.sendWebhookWithRetry(endpoint, payload)
      )
    );` : ''}
  }

  private async sendWebhookWithRetry(
    endpoint: string,
    payload: any,
    attempt: number = 0
  ): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: ${this.config?.providers.webhook.timeout}
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
    } catch (error) {
      if (attempt < ${this.config?.providers.webhook.retryAttempts}) {
        await new Promise(resolve => setTimeout(resolve, ${this.config?.defaults.retryDelay}));
        return this.sendWebhookWithRetry(endpoint, payload, attempt + 1);
      }
      throw error;
    }
  }

  private async scheduleNotification(
    options: NotificationOptions,
    date: Date
  ): Promise<void> {
    ${this.config?.features.scheduling ? `
    const delay = date.getTime() - Date.now();
    
    if (delay <= 0) {
      await this.sendNotification(options);
      return;
    }

    switch (options.type) {
      case 'push':
        await this.pushQueue.add(options, { delay });
        break;
      
      case 'sms':
        await this.smsQueue.add(options, { delay });
        break;
      
      case 'webhook':
        await this.webhookQueue.add(options, { delay });
        break;
    }` : ''}
  }

  private async renderTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    let template = this.templates.get(templateName);
    
    if (!template) {
      const templatePath = join(__dirname, 'templates', \`\${templateName}.hbs\`);
      template = readFileSync(templatePath, 'utf-8');
      this.templates.set(templateName, template);
    }

    const compiledTemplate = compile(template);
    return compiledTemplate(context);
  }
}`;

    console.log('Created Notification service');
  }

  private async setupProviders(): Promise<void> {
    const providerConfig = {
      push: {
        enabled: this.config?.providers.push.enabled,
        firebase: this.config?.providers.push.firebase ? {
          projectId: this.config.providers.push.firebase.projectId
        } : undefined,
        webPush: this.config?.providers.push.webPush ? {
          publicKey: this.config.providers.push.webPush.publicKey
        } : undefined
      },
      sms: {
        enabled: this.config?.providers.sms.enabled,
        twilio: this.config?.providers.sms.twilio ? {
          accountSid: this.config.providers.sms.twilio.accountSid
        } : undefined,
        messageBird: this.config?.providers.sms.messageBird ? {
          accessKey: this.config.providers.sms.messageBird.accessKey
        } : undefined
      },
      webhook: {
        enabled: this.config?.providers.webhook.enabled,
        endpoints: this.config?.providers.webhook.endpoints
      }
    };

    console.log('Configured Notification providers:', providerConfig);
  }

  private async setupMonitoring(): Promise<void> {
    const monitoringConfig = {
      enabled: this.config?.monitoring.enabled,
      metrics: {
        sent: true,
        failed: true,
        queued: true,
        delivered: true
      },
      logs: {
        level: 'info',
        format: 'json'
      }
    };

    console.log('Configured Notification monitoring:', monitoringConfig);
  }
}

export const notificationPlugin = new NotificationPlugin(); 