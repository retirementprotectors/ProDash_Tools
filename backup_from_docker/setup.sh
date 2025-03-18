#!/bin/bash

# ProDash Tools Setup Script
echo "Setting up ProDash Tools..."

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up dashboard
if [ -d "prodash-tools/dashboard/public" ]; then
  echo "Setting up dashboard..."
  (cd prodash-tools/dashboard/public && npm install)
fi

# Configure shell integration
echo "Configuring shell integration..."
SCRIPT_PATH="$(pwd)/prodash-tools/cli/command_wrapper.sh"
SHELL_RC="$HOME/.zshrc"

# Check if the command_wrapper is already in the shell config
if ! grep -q "source.*$(basename "$SCRIPT_PATH")" "$SHELL_RC"; then
  echo "Adding shell integration to $SHELL_RC"
  echo "# ProDash Tools integration" >> "$SHELL_RC"
  echo "source $SCRIPT_PATH" >> "$SHELL_RC"
  echo "Shell integration added to $SHELL_RC"
else
  echo "Shell integration already configured in $SHELL_RC"
fi

# Create symbolic links for easy access
echo "Creating symbolic links..."
mkdir -p "$HOME/.local/bin" 2>/dev/null || true
ln -sf "$(pwd)/prodash-tools/cli/context-tools.js" "$HOME/.local/bin/context-tools" 2>/dev/null || true
ln -sf "$(pwd)/prodash-tools/cli/prodash-create.js" "$HOME/.local/bin/prodash-create" 2>/dev/null || true

# Update PATH if needed
if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
  echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$SHELL_RC"
fi

echo "Setup complete!"
echo ""
echo "To start using ProDash Tools:"
echo "1. Restart your terminal or run: source $SHELL_RC"
echo "2. Start the server: npm start"
echo "3. In a new terminal, start the dashboard: npm run dev:dashboard"
echo ""
echo "Available commands:"
echo "- context-tools list                # List all contexts"
echo "- prodash-create my-new-project     # Create a new project" 