import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { EnhancedContextService, DefaultVectorOperations, createContextRoutes } from 'prodash-tools';
import { createLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { validateApiKey } from './middleware/auth';
import { registerRoutes } from './routes';
import { swaggerDocs } from './utils/swagger';

// Initialize logger
const logger = createLogger();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Load environment variables
if (!process.env.OPENAI_API_KEY) {
  logger.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  logger.error('Error: MONGO_URI environment variable is required');
  process.exit(1);
}

// Initialize context service
const vectorOps = new DefaultVectorOperations();
const contextService = new EnhancedContextService(
  vectorOps,
  process.env.OPENAI_API_KEY,
  process.env.MONGO_URI
);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(rateLimiter);
app.use('/api', validateApiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      mongodb: 'connected',
      openai: 'ready'
    }
  });
});

// API Documentation
swaggerDocs(app);

// Context routes
app.use('/api/contexts', createContextRoutes(contextService));

// Additional API routes
registerRoutes(app, contextService);

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await contextService.initialize();
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Documentation available at http://localhost:${port}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer(); 