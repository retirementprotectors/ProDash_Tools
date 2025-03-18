# ProDash Tools

A comprehensive toolkit for AI-assisted development with context management and project scaffolding.

## Features

- **Context Management** - Store and retrieve conversation contexts
- **Automatic Backups** - Keep your data safe with scheduled backups
- **Dynamic Port Configuration** - Consistent port assignment based on project name
- **Project Creation** - Quickly scaffold new projects with ProDash Tools integration
- **CLI Utilities** - Command-line tools for working with ProDash Tools
- **Dashboard UI** - Visual interface for managing contexts and backups

## Directory Structure

```
/prodash-tools/
├── api/               # API routes and server
├── core/              # Core utilities and services
│   ├── context-keeper # Context management services
│   └── utils/         # Utility functions
├── dashboard/         # Frontend dashboard
├── cli/               # Command-line utilities
├── templates/         # Project templates
├── docs/              # Documentation
└── tests/             # Test files
```

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/prodash-tools.git

# Install dependencies
cd prodash-tools
npm install

# Set up shell integration
source ./prodash-tools/cli/command_wrapper.sh
```

### Usage

#### Starting the Server

```bash
# Start the development server
npm run dev

# Start the dashboard
npm run dev:dashboard
```

#### Using the CLI

```bash
# List all contexts
context-tools list

# Create a backup
context-tools backup

# Check system health
context-tools health
```

#### Creating a New Project

```bash
# Create a new project with ProDash Tools integration
prodash-create my-project

# Navigate to the project directory
cd my-project

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Development

### Core Modules

- **ContextManager** - Manages conversation contexts
- **BackupManager** - Handles automatic and manual backups
- **PortConfig** - Configures dynamic ports based on project name
- **GitIntegration** - Integrates with Git repositories

### API Routes

- `/api/contexts` - CRUD operations for contexts
- `/api/backups` - Backup management
- `/api/health` - System health monitoring
- `/api/git` - Git integration
- `/api/capture` - Context capture

## License

MIT 