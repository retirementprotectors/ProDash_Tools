#!/bin/bash

# More aggressive cleanup script that will definitely remove all redundant files

echo "🧹 Starting aggressive cleanup..."

# Stop any running Node processes
pkill -f "node" || true

# Create final backup
echo "📦 Creating final backup..."
mkdir -p .refactor-backup
cp -r * .refactor-backup/ 2>/dev/null || true

# Remove old directories
echo "🗑️ Removing old directories..."
rm -rf "context-keeper"
rm -rf "core"
rm -rf "scripts"
rm -rf "services"
rm -rf "dist"
rm -rf "plugins"
rm -rf "docs"
rm -rf ".context-keeper"
rm -rf "templates"

# Remove old files
echo "🗑️ Removing old files..."
rm -f "TROUBLESHOOTING.md"
rm -f "USAGE.md"
rm -f "tsconfig.json"
rm -f "requirements.txt"

# Make sure we have all the needed directories
echo "📁 Creating clean directory structure..."
mkdir -p core/context-keeper
mkdir -p core/utils
mkdir -p api/routes
mkdir -p dashboard/public/src/components
mkdir -p cli
mkdir -p templates/basic-project
mkdir -p docs
mkdir -p tests

echo "✨ Cleanup complete! Your directory should now contain:"
echo "- core/ (core functionality)"
echo "- api/ (API routes)"
echo "- dashboard/ (frontend)"
echo "- cli/ (command line tools)"
echo "- templates/ (project templates)"
echo "- docs/ (documentation)"
echo "- tests/ (test files)"
echo "- node_modules/ (dependencies)"
echo "- .git/ (version control)"
echo "- .refactor-backup/ (backup of old files)" 