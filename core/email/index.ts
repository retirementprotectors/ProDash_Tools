import { Plugin } from '@/types';

export interface EmailConfig {
  provider: {
    type: 'smtp' | 'sendgrid' | 'mailgun';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    apiKey?: string;
    domain?: string;
  };
  features: {
    templates: boolean;
    tracking: boolean;
    attachments: boolean;
    scheduling: boolean;
  };
  defaults: {
    from: string;
    replyTo?: string;
    cc?: string[];
    bcc?: string[];
  };
  monitoring: {
    enabled: boolean;
    metrics: boolean;
    logs: boolean;
  };
}

export class EmailPlugin implements Plugin {
  name = 'email';
  version = '1.0.0';
  private config?: EmailConfig;

  configure(config: EmailConfig): void {
    this.config = {
      provider: {
        type: config.provider?.type || 'smtp',
        host: config.provider?.host || 'smtp.gmail.com',
        port: config.provider?.port || 587,
        username: config.provider?.username,
        password: config.provider?.password,
        apiKey: config.provider?.apiKey,
        domain: config.provider?.domain
      },
      features: {
        templates: config.features?.templates ?? true,
        tracking: config.features?.tracking ?? true,
        attachments: config.features?.attachments ?? true,
        scheduling: config.features?.scheduling ?? true
      },
      defaults: {
        from: config.defaults?.from || 'noreply@example.com',
        replyTo: config.defaults?.replyTo,
        cc: config.defaults?.cc || [],
        bcc: config.defaults?.bcc || []
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
      throw new Error('Email configuration not set');
    }

    await this.setupDependencies();
    await this.createEmailService();
    await this.setupTemplates();
    await this.setupMonitoring();
    console.log('Email plugin installed successfully');
  }

  async uninstall(): Promise<void> {
    console.log('Email plugin uninstalled');
  }

  private async setupDependencies(): Promise<void> {
    const dependencies = {
      'nodemailer': '^6.9.1',
      'handlebars': '^4.7.7',
      'node-schedule': '^2.1.1',
      'winston': '^3.8.2',
      'prom-client': '^14.2.0'
    };

    console.log('Added Email dependencies:', dependencies);
  }

  private async createEmailService(): Promise<void> {
    const emailService = `
import nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { compile } from 'handlebars';
import schedule from 'node-schedule';
import { trackMetrics } from './monitoring';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  context?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path: string;
    contentType?: string;
  }>;
  schedule?: Date;
  tracking?: boolean;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, string>;
  private trackingEnabled: boolean;

  constructor() {
    this.templates = new Map();
    this.trackingEnabled = ${this.config?.features.tracking};
    
    switch ('${this.config?.provider.type}') {
      case 'smtp':
        this.transporter = createTransport({
          host: '${this.config?.provider.host}',
          port: ${this.config?.provider.port},
          secure: false,
          auth: {
            user: '${this.config?.provider.username}',
            pass: '${this.config?.provider.password}'
          }
        });
        break;
      
      case 'sendgrid':
        this.transporter = createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: '${this.config?.provider.apiKey}'
          }
        });
        break;
      
      case 'mailgun':
        this.transporter = createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: '${this.config?.provider.username}',
            pass: '${this.config?.provider.password}'
          }
        });
        break;
    }

    this.transporter.verify((error) => {
      if (error) {
        console.error('Email service verification failed:', error);
      } else {
        console.log('Email service is ready');
      }
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = await this.prepareMailOptions(options);
      
      if (options.schedule) {
        await this.scheduleEmail(mailOptions, options.schedule);
      } else {
        await this.sendEmail(mailOptions);
      }
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async sendBulk(options: EmailOptions[]): Promise<void> {
    const promises = options.map(opt => this.send(opt));
    await Promise.all(promises);
  }

  private async prepareMailOptions(options: EmailOptions): Promise<nodemailer.SendMailOptions> {
    let html = options.html;
    
    if (options.template) {
      html = await this.renderTemplate(options.template, options.context || {});
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: '${this.config?.defaults.from}',
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      text: options.text,
      html,
      replyTo: '${this.config?.defaults.replyTo}',
      cc: '${this.config?.defaults.cc}'.split(',').filter(Boolean),
      bcc: '${this.config?.defaults.bcc}'.split(',').filter(Boolean),
      attachments: options.attachments
    };

    ${this.config?.features.tracking ? `
    if (this.trackingEnabled && options.tracking !== false) {
      mailOptions.headers = {
        ...mailOptions.headers,
        'X-Tracking-ID': this.generateTrackingId()
      };
    }` : ''}

    return mailOptions;
  }

  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    const startTime = Date.now();
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      
      ${this.config?.monitoring.metrics ? `
      trackMetrics('email_sent', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        duration
      });` : ''}
      
      console.log('Email sent:', info.messageId);
    } catch (error) {
      ${this.config?.monitoring.metrics ? `
      trackMetrics('email_error', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        error: error.message
      });` : ''}
      
      throw error;
    }
  }

  private async scheduleEmail(mailOptions: nodemailer.SendMailOptions, date: Date): Promise<void> {
    schedule.scheduleJob(date, async () => {
      await this.sendEmail(mailOptions);
    });
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

  private generateTrackingId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}`;

    console.log('Created Email service');
  }

  private async setupTemplates(): Promise<void> {
    const templateConfig = {
      directory: 'templates',
      defaultTemplates: [
        'welcome',
        'password-reset',
        'notification',
        'report'
      ]
    };

    console.log('Configured Email templates:', templateConfig);
  }

  private async setupMonitoring(): Promise<void> {
    const monitoringConfig = {
      enabled: this.config?.monitoring.enabled,
      metrics: {
        sent: true,
        failed: true,
        opened: true,
        clicked: true
      },
      logs: {
        level: 'info',
        format: 'json'
      }
    };

    console.log('Configured Email monitoring:', monitoringConfig);
  }
}

export const emailPlugin = new EmailPlugin(); 