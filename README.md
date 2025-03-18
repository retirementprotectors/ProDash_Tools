# ProDash Tools

A powerful CLI tool for creating and managing business web applications.

## Features

- 🚀 Project Templates
  - Basic Web App
  - Advanced Web App
  - API Service
- 🗄️ Database Management
  - Local MongoDB Support
  - Cloud Database Integration
- 📦 Project Management
  - Create Projects
  - Import/Export Projects
  - List Projects
- 🔧 Template Management
  - Create Templates
  - Import/Export Templates
  - List Templates
- 💾 Backup Management
  - Create Backups
  - Restore from Backup
  - List Backups
- 🚢 Deployment Management
  - Local Deployment
  - Cloud Deployment Support
  - Deployment History
- 🛠️ System Management
  - System Status
  - Resource Cleanup
  - Performance Monitoring

## Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 7.0.0
- Git

## Installation

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community@7.0

# Install ProDash Tools
npm install -g prodash-tools
```

## Quick Start

```bash
# Initialize ProDash Tools
prodash init

# Create a new project
prodash project -c my-project -t basic

# List available projects
prodash project -l

# Create a backup
prodash backup -c

# Deploy a project
prodash deploy my-project -e local

# Check system status
prodash manage -s
```

## Command Reference

### Project Management

```bash
# Create a new project
prodash project -c <name> [-t template] [-d database] [--description text]

# List projects
prodash project -l

# Export a project
prodash project -e <name> -o <path>

# Import a project
prodash project -i <path>
```

### Template Management

```bash
# Create a new template
prodash template -g <name> [-b base] [-d description]

# List templates
prodash template -l

# Export a template
prodash template -e <name> -o <path>

# Import a template
prodash template -i <path>
```

### Backup Management

```bash
# Create a backup
prodash backup -c [name]

# List backups
prodash backup -l

# Restore from backup
prodash backup -r <name>
```

### Deployment Management

```bash
# Deploy a project
prodash deploy <project> [-e environment]

# List deployments
prodash deploy -l
```

### System Management

```bash
# Show system status
prodash manage -s

# Clean up resources
prodash manage -c
```

## Project Structure

```
.
├── data/
│   ├── projects/     # Project files
│   ├── templates/    # Template files
│   ├── backups/      # Backup archives
│   ├── deployments/  # Deployment packages
│   ├── logs/         # System logs
│   └── temp/         # Temporary files
├── src/
│   ├── cli/         # CLI commands
│   ├── core/        # Core functionality
│   └── utils/       # Utility functions
└── templates/       # Base templates
    ├── basic/      # Basic web app
    ├── advanced/   # Advanced web app
    └── api/        # API service
```

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/prodash-tools.git
cd prodash-tools

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 