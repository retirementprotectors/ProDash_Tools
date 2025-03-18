# ProDash Basic Project Template

This template provides a basic setup for building applications with ProDash Tools, focusing on context management and AI-powered features.

## Features

- Express.js server with TypeScript
- MongoDB integration for context persistence
- OpenAI integration for embeddings and AI features
- Context management system with:
  - CRUD operations for contexts
  - Conversation threading
  - Knowledge management
  - Vector-based similarity search
  - Full-text search capabilities

## Prerequisites

- Node.js >= 18.0.0
- MongoDB running locally or accessible via URL
- OpenAI API key

## Getting Started

1. Clone this template:
   ```bash
   npx prodash-tools create my-app --template basic
   cd my-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_api_key_here" > .env
   echo "MONGO_URI=mongodb://localhost:27017" >> .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Contexts

- `GET /api/contexts` - List all contexts
- `GET /api/contexts/:id` - Get context by ID
- `POST /api/contexts` - Create/Update context
- `DELETE /api/contexts/:id` - Delete context
- `POST /api/contexts/:id/messages` - Add message to context
- `GET /api/contexts/:id/similar` - Find similar contexts
- `GET /api/contexts/search/text` - Search contexts by text

### Example Usage

Create a new context:
```bash
curl -X POST http://localhost:3000/api/contexts \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "project": "my-project",
      "tags": ["feature", "api"],
      "priority": "high"
    },
    "conversation": {
      "summary": "API implementation discussion"
    }
  }'
```

Add a message to a context:
```bash
curl -X POST http://localhost:3000/api/contexts/123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "content": "Let's implement the authentication feature"
  }'
```

Find similar contexts:
```bash
curl http://localhost:3000/api/contexts/123/similar?limit=5
```

## Project Structure

```
.
├── src/
│   ├── index.ts           # Application entry point
│   ├── routes/            # API routes
│   │   └── contextRoutes.ts
│   ├── middleware/        # Express middleware
│   └── types/            # TypeScript type definitions
├── tests/                # Test files
└── docs/                # Documentation
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

MIT 