import { PackageJson } from 'type-fest';

export interface TemplateFeature {
  name: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  files: string[];
}

export interface ProjectTemplate {
  name: string;
  description: string;
  features: TemplateFeature[];
  basePackageJson: Partial<PackageJson>;
}

export const TEMPLATES: Record<string, ProjectTemplate> = {
  basic: {
    name: 'Basic Project',
    description: 'Simple setup with core context management features',
    features: [
      {
        name: 'Context Management',
        description: 'Basic context storage and retrieval',
        dependencies: ['@prodash/core'],
        devDependencies: [],
        files: ['src/contexts']
      },
      {
        name: 'Backup System',
        description: 'Simple file-based backups',
        dependencies: ['fs-extra'],
        devDependencies: ['@types/fs-extra'],
        files: ['src/backups']
      }
    ],
    basePackageJson: {
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon --exec ts-node src/index.ts',
        build: 'tsc',
        test: 'jest'
      }
    }
  },
  advanced: {
    name: 'Advanced Project',
    description: 'Full-featured setup with dashboard and real-time updates',
    features: [
      {
        name: 'Advanced Context Management',
        description: 'Real-time context updates with WebSocket support',
        dependencies: ['@prodash/core', 'socket.io'],
        devDependencies: ['@types/socket.io'],
        files: ['src/contexts', 'src/websocket']
      },
      {
        name: 'Enhanced Backup System',
        description: 'Configurable backup strategies with cloud support',
        dependencies: ['@prodash/core', 'aws-sdk', 'google-cloud-storage'],
        devDependencies: [],
        files: ['src/backups', 'src/cloud']
      },
      {
        name: 'Dashboard Integration',
        description: 'Web-based dashboard for context management',
        dependencies: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
        devDependencies: ['@types/react', '@types/react-dom'],
        files: ['src/dashboard']
      },
      {
        name: 'Analytics',
        description: 'Usage tracking and performance monitoring',
        dependencies: ['prom-client', 'winston'],
        devDependencies: [],
        files: ['src/analytics']
      }
    ],
    basePackageJson: {
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon --exec ts-node src/index.ts',
        'dev:dashboard': 'cd src/dashboard && npm start',
        build: 'tsc && cd src/dashboard && npm run build',
        test: 'jest'
      }
    }
  },
  api: {
    name: 'API Project',
    description: 'API-focused setup with documentation and security features',
    features: [
      {
        name: 'OpenAPI Documentation',
        description: 'Automatic API documentation generation',
        dependencies: ['swagger-ui-express', 'swagger-jsdoc'],
        devDependencies: ['@types/swagger-ui-express', '@types/swagger-jsdoc'],
        files: ['src/docs']
      },
      {
        name: 'Authentication',
        description: 'JWT-based authentication system',
        dependencies: ['jsonwebtoken', 'bcryptjs', 'passport', 'passport-jwt'],
        devDependencies: ['@types/jsonwebtoken', '@types/bcryptjs', '@types/passport', '@types/passport-jwt'],
        files: ['src/auth']
      },
      {
        name: 'Rate Limiting',
        description: 'API rate limiting and request throttling',
        dependencies: ['express-rate-limit', 'rate-limit-redis'],
        devDependencies: [],
        files: ['src/middleware/rate-limit']
      },
      {
        name: 'Monitoring',
        description: 'Health checks and performance monitoring',
        dependencies: ['prom-client', 'winston'],
        devDependencies: [],
        files: ['src/monitoring']
      }
    ],
    basePackageJson: {
      scripts: {
        start: 'node src/index.js',
        dev: 'nodemon --exec ts-node src/index.ts',
        build: 'tsc',
        test: 'jest',
        docs: 'swagger-jsdoc -d src/docs/swagger.json src/routes/*.ts'
      }
    }
  }
}; 