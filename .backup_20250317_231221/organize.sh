#!/bin/bash

echo "🏗️ Organizing ProDash Tools into a clean, flat structure..."

# Create a backup first
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir=".backup_${timestamp}"
echo "📦 Creating backup in ${backup_dir}..."
mkdir -p "${backup_dir}"
cp -r * "${backup_dir}/"
cp -r .context-keeper "${backup_dir}/" 2>/dev/null || true

# Create essential directories if they don't exist
mkdir -p src/{core,api,utils,types}
mkdir -p public
mkdir -p config
mkdir -p tests

# Move Context Keeper core files
echo "🔄 Moving Context Keeper core files..."
mv core/ContextManager.ts src/core/ 2>/dev/null || true
mv core/BackupManager.ts src/core/ 2>/dev/null || true
mv core/MonitoringService.ts src/core/ 2>/dev/null || true
mv core/GitIntegration.ts src/core/ 2>/dev/null || true
mv core/ContextCaptureService.ts src/core/ 2>/dev/null || true
mv core/index.ts src/core/ 2>/dev/null || true

# Move API related files
echo "🔄 Moving API files..."
mv api/*.ts src/api/ 2>/dev/null || true
mv api/routes/*.ts src/api/ 2>/dev/null || true
mv api/controllers/*.ts src/api/ 2>/dev/null || true

# Move utility files
echo "🔄 Moving utility files..."
mv dashboard/public/src/utils/*.ts src/utils/ 2>/dev/null || true
find . -maxdepth 1 -name "*util*.ts" -exec mv {} src/utils/ \; 2>/dev/null || true
find . -maxdepth 1 -name "*helper*.ts" -exec mv {} src/utils/ \; 2>/dev/null || true

# Move configuration files
echo "🔄 Moving configuration files..."
mv dashboard/public/src/config/*.ts config/ 2>/dev/null || true
find . -maxdepth 1 -name "*config*.ts" -exec mv {} config/ \; 2>/dev/null || true

# Move frontend files
echo "🔄 Moving frontend files..."
mv dashboard/public/* public/ 2>/dev/null || true

# Move test files
echo "🔄 Moving test files..."
find . -name "*test*.ts" -exec mv {} tests/ \; 2>/dev/null || true
find . -name "*spec*.ts" -exec mv {} tests/ \; 2>/dev/null || true

# Move type definitions
echo "🔄 Moving type definitions..."
mv core/types/*.ts src/types/ 2>/dev/null || true
mv api/types/*.ts src/types/ 2>/dev/null || true
find . -name "*types*.ts" -exec mv {} src/types/ \; 2>/dev/null || true
find . -name "*interface*.ts" -exec mv {} src/types/ \; 2>/dev/null || true

# Keep essential files at root
essential_root_files=(
    "index.ts"
    "package.json"
    "tsconfig.json"
    "README.md"
    ".gitignore"
    "Dockerfile"
    "docker-compose.yml"
)

echo "✨ Done! Project is now organized in a clean, flat structure:
/
├── src/
│   ├── core/      (Context Keeper core functionality)
│   ├── api/       (API endpoints and controllers)
│   ├── utils/     (shared utilities)
│   └── types/     (type definitions)
├── public/        (frontend assets)
├── config/        (configuration files)
├── tests/         (test files)
└── [essential root files]

A backup of the previous structure is saved in ${backup_dir}/
You can restore it with: cp -r ${backup_dir}/* ." 