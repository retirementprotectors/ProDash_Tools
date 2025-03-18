import express from 'express';
import cors from 'cors';
import { EnhancedContextService, DefaultVectorOperations, createContextRoutes } from 'prodash-tools';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize context service
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const openAiKey = process.env.OPENAI_API_KEY;

if (!openAiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

const vectorOps = new DefaultVectorOperations();
const contextService = new EnhancedContextService(vectorOps, openAiKey, mongoUri);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0'
  });
});

// Context endpoints
app.use('/api/contexts', createContextRoutes(contextService));

// Start server
async function startServer() {
  try {
    await contextService.initialize();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 