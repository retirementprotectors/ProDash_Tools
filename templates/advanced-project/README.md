# ProDash Advanced Project Template

This template provides a foundation for building full-stack applications with React and Express, featuring built-in context and backup management capabilities, along with a modern Material-UI interface.

## Features

- React frontend with TypeScript
- Express.js backend
- Material-UI components and theming
- Context management system
- Backup system
- React Router for navigation
- Zustand for state management
- ESLint and Prettier for code quality
- Jest for testing
- Hot reloading during development
- Vite for fast builds

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Start production server:
```bash
npm start
```

## Project Structure

```
.
├── src/
│   ├── client/           # React frontend
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── theme.ts     # Material-UI theme
│   │   └── index.tsx    # Frontend entry point
│   ├── server/          # Express backend
│   │   ├── core/        # Core functionality
│   │   ├── routes/      # API routes
│   │   └── index.ts     # Server entry point
│   └── shared/          # Shared types and utilities
├── tests/               # Test files
├── dist/               # Compiled files
│   ├── client/         # Frontend build
│   └── server/         # Backend build
└── docs/              # Documentation
```

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build frontend and backend for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Run TypeScript type checking

## API Endpoints

### Health Check
- `GET /api/health` - Check server and service status

### Context Management
- `GET /api/contexts` - List all contexts
- `POST /api/contexts` - Create new context
- `GET /api/contexts/:id` - Get specific context
- `PUT /api/contexts/:id` - Update context
- `DELETE /api/contexts/:id` - Delete context

### Backup Management
- `GET /api/backups` - List all backups
- `POST /api/backups` - Create new backup
- `GET /api/backups/:id` - Download backup
- `POST /api/backups/:id/restore` - Restore from backup

## Frontend Routes

- `/` - Dashboard with system overview
- `/contexts` - Context management interface
- `/backups` - Backup management interface

## Customizing

You can customize this project by:

1. Modifying the theme in `src/client/theme.ts`
2. Adding new components in `src/client/components/`
3. Creating new pages in `src/client/pages/`
4. Adding API routes in `src/server/routes/`
5. Implementing custom backup strategies
6. Adding new features to the dashboard 