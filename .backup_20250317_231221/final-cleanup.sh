#!/bin/bash

# WARNING: This script removes old files and directories
# Only run this after verifying the new structure works properly

echo "⚠️  WARNING: This script will remove old files and directories ⚠️"
echo "Only run this after verifying the new structure works properly."
echo "Press Ctrl+C to cancel or Enter to continue..."
read

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Create another backup just to be safe
echo "Creating final backup before removal..."
mkdir -p .refactor-backup
tar -czf .refactor-backup/pre-final-cleanup.tar.gz --exclude=".refactor-backup" --exclude="node_modules" .

# List directories to be removed
TO_REMOVE=(
  "context-keeper"
  "core"
  "scripts"
  "services"
  "dist/context-keeper"
  "dist/core"
  "plugins"
  "docs"
  ".context-keeper"
)

# Remove each directory
for dir in "${TO_REMOVE[@]}"; do
  if [ -d "$dir" ]; then
    echo "Removing $dir..."
    rm -rf "$dir"
  fi
done

echo ""
echo "✅ Cleanup complete! The ProDash Tools directory is now organized."
echo "The new structure is in the 'prodash-tools' directory."
echo ""
echo "Your old files have been backed up to .refactor-backup/"
echo "Run the following to verify everything works:"
echo ""
echo "  npm start" 