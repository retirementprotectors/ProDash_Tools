import mongoose from 'mongoose';
import { config } from './env';
import logger from '@/utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);

    logger.info('Connected to MongoDB');

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
}); 