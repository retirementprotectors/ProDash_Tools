import { config } from './env';

export default {
  definition: {
    openapi: '3.0.0',
    info: {
      title: config.swagger.title,
      version: config.swagger.version,
      description: config.swagger.description,
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        Context: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Context ID',
            },
            content: {
              type: 'object',
              description: 'Context content',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata',
            },
          },
        },
        Backup: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Backup ID',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Backup timestamp',
            },
            contextCount: {
              type: 'number',
              description: 'Number of contexts in backup',
            },
            version: {
              type: 'string',
              description: 'Backup version',
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts'], // Path to the API routes
}; 