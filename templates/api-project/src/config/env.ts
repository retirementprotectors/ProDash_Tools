import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  mongodb: {
    uri: string;
    options: {
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  cors: {
    origin: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
    file: string;
  };
  paths: {
    contexts: string;
    backups: string;
  };
  swagger: {
    title: string;
    version: string;
    description: string;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '52000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/prodash',
    options: {
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT || '5000', 10),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT || '45000', 10),
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  paths: {
    contexts: process.env.CONTEXTS_PATH || '.context-keeper/contexts',
    backups: process.env.BACKUPS_PATH || '.context-keeper/backups',
  },
  swagger: {
    title: process.env.SWAGGER_TITLE || 'ProDash API',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    description: process.env.SWAGGER_DESCRIPTION || 'API documentation for ProDash Tools',
  },
}; 