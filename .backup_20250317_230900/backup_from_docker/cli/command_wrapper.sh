#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Add the bin directory to PATH
export PATH="$PROJECT_ROOT/cli:$PATH"

# Function to run context-tools commands
context-tools() {
  node "$PROJECT_ROOT/cli/context-tools.js" "$@"
}

# Function to create new projects
prodash-create() {
  node "$PROJECT_ROOT/cli/prodash-create.js" "$@"
}

# Export the functions
export -f context-tools
export -f prodash-create

echo "ProDash Tools commands are now available:"
echo "- context-tools: Manage contexts and system health"
echo "- prodash-create: Create new projects" 