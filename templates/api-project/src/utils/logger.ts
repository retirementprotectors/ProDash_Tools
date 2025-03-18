import winston from 'winston';
import { config } from '@/config/env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Write to all logs with level 'info' and below to 'app.log'
    new winston.transports.File({
      filename: config.logging.file,
      level: 'info',
    }),
    // Write all logs error (and below) to 'error.log'
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
  ],
});

// If we're not in production, log to the console with color
if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;

export function createLogger() {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
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
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/combined.log'
      })
    ]
  });
} 