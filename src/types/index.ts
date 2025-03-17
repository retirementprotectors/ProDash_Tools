export interface Template<T = any> {
  name: string;
  description: string;
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  template: string;
}

export interface Plugin {
  name: string;
  version: string;
  install(): Promise<void>;
  uninstall(): Promise<void>;
}

export interface DatabaseConfig {
  type: 'mysql' | 'postgresql' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database: string;
}

export interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
  templates: string[];
  plugins: string[];
  database?: DatabaseConfig;
} 