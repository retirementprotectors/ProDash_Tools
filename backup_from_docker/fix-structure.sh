#!/bin/bash

echo "🔄 Moving files from prodash-tools to root directory..."

# Move all contents from prodash-tools to root
mv prodash-tools/* .

# Clean up empty prodash-tools directory
rm -rf prodash-tools

# Update package.json paths
sed -i '' 's|"prodash-tools/|"|g' package.json

echo "✅ Directory structure fixed!"
echo "All files have been moved to the root directory." 