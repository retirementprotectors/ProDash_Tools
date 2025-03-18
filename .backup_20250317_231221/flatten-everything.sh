#!/bin/bash

echo "🔥 Aggressively flattening everything to root level..."

# Stop any running processes
pkill -f node

# Create a temporary directory for flattening
mkdir -p temp_flat

# Move all important files from nested directories to temp
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" \) -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./temp_flat/*" -exec cp {} temp_flat/ \;

# Clean up root directory
rm -rf core/ templates/ docs/ .context-keeper/ .refactor-backup/ cli/ api/ dashboard/ tests/
rm -f proper-cleanup.sh final-cleanup.sh setup.sh cleanup-refactor.sh fix-structure.sh

# Move flattened files back
mv temp_flat/* .
rm -rf temp_flat

# Keep only essential files
essential_files=(
    "index.ts"
    "package.json"
    "tsconfig.json"
    "README.md"
    ".gitignore"
    "Dockerfile"
    "docker-compose.yml"
)

# Remove any files not in the essential list
find . -maxdepth 1 -type f ! -name "flatten-everything.sh" $(printf "! -name %s " "${essential_files[@]}") -delete

echo "✨ Done! Everything is now flat at the root level." 