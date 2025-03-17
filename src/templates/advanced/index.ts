import { Template } from '@/types';

export interface AdvancedTemplateConfig {
  name: string;
  description: string;
  version: string;
  author: string;
  features: {
    testing: boolean;
    cicd: boolean;
    docker: boolean;
    monitoring: boolean;
  };
}

export const advancedTemplate: Template<AdvancedTemplateConfig> = {
  name: 'advanced',
  description: 'Advanced project template with testing, CI/CD, Docker, and monitoring',
  files: [
    {
      path: 'package.json',
      template: `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "author": "{{author}}",
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "docker:build": "docker build -t {{name}} .",
    "docker:run": "docker run -p 3000:3000 {{name}}"
  },
  "dependencies": {
    "express": "^4.18.0",
    "winston": "^3.8.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/jest": "^29.0.0",
    "@types/node": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "nodemon": "^2.0.0",
    "prettier": "^2.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^4.9.0"
  }
}`
    },
    {
      path: '.github/workflows/ci.yml',
      template: `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run lint
    - run: npm test
    - run: npm run build

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    - uses: docker/setup-buildx-action@v2
    - uses: docker/build-push-action@v4
      with:
        push: false
        tags: {{name}}:latest`
    },
    {
      path: 'Dockerfile',
      template: `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env.example ./.env

EXPOSE 3000
CMD ["node", "dist/index.js"]`
    },
    {
      path: 'jest.config.js',
      template: `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};`
    },
    {
      path: 'src/config/index.ts',
      template: `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const config = configSchema.parse(process.env);`
    },
    {
      path: 'src/utils/logger.ts',
      template: `import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});`
    },
    {
      path: 'src/index.ts',
      template: `import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';

app.listen(config.PORT, () => {
  logger.info(\`Server running on port \${config.PORT} in \${config.NODE_ENV} mode\`);
});`
    },
    {
      path: 'src/app.ts',
      template: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error';
import { router } from './routes';

export const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', router);
app.use(errorHandler);`
    },
    {
      path: 'src/__tests__/app.test.ts',
      template: `import request from 'supertest';
import { app } from '../app';

describe('App', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown');
    expect(response.status).toBe(404);
  });

  it('should handle JSON parsing errors', async () => {
    const response = await request(app)
      .post('/api/example')
      .set('Content-Type', 'application/json')
      .send('invalid json');
    expect(response.status).toBe(400);
  });
});`
    }
  ]
}; 