import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Custom format for log messages
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// If we're not in production, log to the console with a simpler format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Create a stream object for Morgan middleware
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for common logging patterns
export const logError = (error: Error, meta?: Record<string, unknown>): void => {
  logger.error({
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...meta
  });
};

export const logInfo = (message: string, meta?: Record<string, unknown>): void => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: Record<string, unknown>): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>): void => {
  logger.debug(message, meta);
};

export {
  logger,
  stream,
  logError,
  logInfo,
  logWarn,
  logDebug,
}; 