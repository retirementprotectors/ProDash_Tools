import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config/env';
import swaggerConfig from '@/config/swagger';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import logger from '@/utils/logger';
import { connectDatabase } from '@/config/database';
import contextRoutes from '@/routes/contexts';
import backupRoutes from '@/routes/backups';

// Create Express app
const app = express();

// Connect to MongoDB
connectDatabase().catch((error) => {
  logger.error('Failed to connect to MongoDB:', error);
  process.exit(1);
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerConfig));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/contexts', contextRoutes);
app.use('/api/backups', backupRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app; 