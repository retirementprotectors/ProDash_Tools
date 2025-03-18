# ProDash Tools Project

This project was created with ProDash Tools, a powerful toolkit for AI-assisted development.

## Features

- Context Management - Store and retrieve conversation contexts
- Automatic Backups - Keep your data safe with scheduled backups
- Dynamic Port Configuration - Consistent port assignment based on project name

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Access the API:
- API Endpoint: http://localhost:3000/api/contexts

## Using ProDash Tools

This project includes the ProDash Tools core library, which provides several utilities:

```typescript
import { 
  getContextManager, 
  getBackupManager,
  getGitIntegration
} from './core';

// Get service instances
const contextManager = getContextManager();
const backupManager = getBackupManager();

// Use the API
const contexts = await contextManager.getAllContexts();
const backup = await backupManager.createBackup(contexts);
```

## CLI Tools

ProDash Tools comes with CLI utilities to help manage your project:

```bash
# List all contexts
context-tools list

# Create a backup
context-tools backup

# Check system health
context-tools health
```

## Customizing

You can customize this project by:

1. Adding new routes in `src/index.ts`
2. Creating service modules in `src/services/`
3. Implementing custom backup strategies 