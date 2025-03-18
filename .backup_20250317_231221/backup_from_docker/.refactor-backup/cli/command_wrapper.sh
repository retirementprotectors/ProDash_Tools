#!/usr/bin/env bash

# Command Wrapper for ProDash Tools
# This script makes all ProDash Tools commands available in your shell

# Find the absolute path to the project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Define the command function for context-tools
context-tools() {
  node "$PROJECT_ROOT/cli/context-tools.js" "$@"
}

# Define the command for prodash-create
prodash-create() {
  local project_name="$1"
  if [ -z "$project_name" ]; then
    echo "Error: Project name is required"
    echo "Usage: prodash-create <project-name>"
    return 1
  fi

  # Create the project directory
  mkdir -p "$project_name"
  
  # Copy template files
  cp -r "$PROJECT_ROOT/templates/basic-project/"* "$project_name/"
  
  # Link to core modules
  ln -sf "$PROJECT_ROOT/core" "$project_name/core"
  
  echo "Project created successfully: $project_name"
  echo "To get started, run:"
  echo "  cd $project_name"
  echo "  npm install"
  echo "  npm run dev"
}

# Export the commands
export -f context-tools
export -f prodash-create

# Message confirming wrapper is loaded
echo "ProDash Tools commands are now available:"
echo "  - context-tools"
echo "  - prodash-create" 