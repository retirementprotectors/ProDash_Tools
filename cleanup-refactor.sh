#!/bin/bash

# Cleanup and finalize the refactoring process
echo "Cleaning up ProDash_Tools directory structure..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# First, ensure Context-Keeper has captured latest changes
echo "Ensuring Context-Keeper has captured latest changes..."
if [ -f "src/core/ContextCaptureService.ts" ]; then
  node -e "
    const { ContextCaptureService } = require('./src/core/ContextCaptureService');
    const service = new ContextCaptureService();
    service.captureAllSessions().then(() => {
      console.log('Context capture completed');
      process.exit(0);
    }).catch(err => {
      console.error('Context capture failed:', err);
      process.exit(1);
    });
  "
fi

# Run backup script
echo "Running backup script..."
if [ -f "scripts/backup.sh" ]; then
  bash scripts/backup.sh
fi

# Stop any running services
echo "Stopping any running services..."
killall node 2>/dev/null || true
sleep 2

# Backup everything first (safety)
echo "Creating backup of current state..."
mkdir -p .refactor-backup
tar -czf .refactor-backup/pre-cleanup-backup.tar.gz --exclude=".refactor-backup" --exclude="node_modules" .

# Move necessary files from old structure to new structure if they don't exist already
echo "Moving remaining files to new structure..."

# Core files
mkdir -p prodash-tools/core/context-keeper
mkdir -p prodash-tools/core/utils
mkdir -p prodash-tools/api/routes

# Move any missing core files
for file in context-keeper/core/*.ts; do
  filename=$(basename "$file")
  if [ ! -f "prodash-tools/core/context-keeper/$filename" ]; then
    echo "Moving $file to prodash-tools/core/context-keeper/"
    cp "$file" "prodash-tools/core/context-keeper/"
  fi
done

# Move any missing API routes
for file in context-keeper/api/*.ts; do
  filename=$(basename "$file")
  if [ ! -f "prodash-tools/api/routes/$filename" ]; then
    echo "Moving $file to prodash-tools/api/routes/"
    cp "$file" "prodash-tools/api/routes/"
  fi
done

# Move dashboard files
mkdir -p prodash-tools/dashboard/public/src/components
if [ -d "context-keeper/dashboard/public/src" ]; then
  echo "Moving dashboard files..."
  cp -r context-keeper/dashboard/public/src/* prodash-tools/dashboard/public/src/ 2>/dev/null || true
  cp -r context-keeper/dashboard/public/index.html prodash-tools/dashboard/public/ 2>/dev/null || true
  cp -r context-keeper/dashboard/public/package.json prodash-tools/dashboard/public/ 2>/dev/null || true
  cp -r context-keeper/dashboard/public/vite.config.ts prodash-tools/dashboard/public/ 2>/dev/null || true
fi

# Move scripts
mkdir -p prodash-tools/scripts
for file in scripts/*.{js,sh,ts}; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    if [ ! -f "prodash-tools/cli/$filename" ] && [ ! -f "prodash-tools/scripts/$filename" ]; then
      echo "Moving $file to prodash-tools/scripts/"
      cp "$file" "prodash-tools/scripts/"
    fi
  fi
done

# Update main package.json to point to new structure
node -e '
const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.main = "prodash-tools/core/index.ts";
pkg.bin = {
  "context-tools": "./prodash-tools/cli/context-tools.js",
  "prodash-create": "./prodash-tools/cli/prodash-create.js"
};
pkg.scripts = {
  ...pkg.scripts,
  "start": "ts-node prodash-tools/api/server.ts",
  "dev:old": pkg.scripts.dev || "nodemon --exec ts-node context-keeper/index.ts",
  "dev": "nodemon --exec ts-node prodash-tools/api/server.ts",
  "build": "tsc -p tsconfig.json",
  "dev:dashboard": "cd prodash-tools/dashboard/public && npm run dev",
  "tools": "node prodash-tools/cli/context-tools.js"
};
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
'

# Create new main index.ts file
cat > index.ts << EOL
/**
 * ProDash Tools Main Entry Point
 */

// Re-export from the new structure
export * from './prodash-tools/core/index';

// Main server function
import { startServer } from './prodash-tools/api/server';

// If this file is run directly, start the server
if (require.main === module) {
  startServer().catch(console.error);
}
EOL

# Create README.md with transition info
cat > README.md << EOL
# ProDash Tools

A comprehensive toolkit for AI-assisted development with context management and project scaffolding.

## Directory Structure

This project has been refactored. The main code is now located in the \`prodash-tools\` directory.

See \`prodash-tools/README.md\` for full documentation.

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start the server
npm start

# Start the dashboard
npm run dev:dashboard

# Set up shell integration
source ./prodash-tools/cli/command_wrapper.sh

# Create a new project
prodash-create my-project
\`\`\`
EOL

echo "Directory cleanup complete!"
echo "Old structure remains in backup and original locations for safety."
echo "Run the following command to start using the new structure:"
echo "  npm start"

# Final Context-Keeper capture after cleanup
echo "Performing final Context-Keeper capture..."
if [ -f "src/core/ContextCaptureService.ts" ]; then
  node -e "
    const { ContextCaptureService } = require('./src/core/ContextCaptureService');
    const service = new ContextCaptureService();
    service.captureAllSessions().then(() => {
      console.log('Final context capture completed');
      process.exit(0);
    }).catch(err => {
      console.error('Final context capture failed:', err);
      process.exit(1);
    });
  "
fi 