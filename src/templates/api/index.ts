import { Template } from '@/types';

export interface ApiTemplateConfig {
  name: string;
  description: string;
  version: string;
  port: number;
  dependencies: Record<string, string>;
}

export const apiTemplate: Template<ApiTemplateConfig> = {
  name: 'api',
  description: 'RESTful API template with Express and OpenAPI documentation',
  files: [
    {
      path: 'package.json',
      template: `{
  "name": "{{name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "dependencies": {
    "express": "^4.18.0",
    "swagger-ui-express": "^4.6.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "morgan": "^1.10.0",
    {{dependencies}}
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/swagger-ui-express": "^4.1.0",
    "@types/cors": "^2.8.0",
    "@types/morgan": "^1.9.0"
  },
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "test": "jest"
  }
}`
    },
    {
      path: 'src/app.ts',
      template: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { router } from './routes';
import { errorHandler } from './middleware/error';
import swaggerDocument from './swagger.json';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json());

  // Routes
  app.use('/api', router);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Error handling
  app.use(errorHandler);

  return app;
}`
    },
    {
      path: 'src/index.ts',
      template: `import { createApp } from './app';
import { logger } from './utils/logger';

const port = {{port}} || 3000;
const app = createApp();

app.listen(port, () => {
  logger.info(\`Server running on port \${port}\`);
});`
    },
    {
      path: 'src/routes/index.ts',
      template: `import { Router } from 'express';
import { healthRouter } from './health';

export const router = Router();

router.use('/health', healthRouter);`
    },
    {
      path: 'src/routes/health.ts',
      template: `import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});`
    },
    {
      path: 'src/middleware/error.ts',
      template: `import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error:', err);
  res.status(500).json({
    error: {
      message: 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
}`
    },
    {
      path: 'src/swagger.json',
      template: `{
  "openapi": "3.0.0",
  "info": {
    "title": "{{name}}",
    "version": "{{version}}",
    "description": "{{description}}"
  },
  "paths": {
    "/api/health": {
      "get": {
        "summary": "Health check endpoint",
        "responses": {
          "200": {
            "description": "Server is healthy",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": {
                      "type": "string",
                      "example": "ok"
                    },
                    "timestamp": {
                      "type": "string",
                      "format": "date-time"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
    }
  ]
}; 