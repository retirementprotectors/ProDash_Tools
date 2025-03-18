#!/bin/bash

# Backup script for ProDash_Tools
# Handles both GitHub and local backups

# Configuration
BACKUP_DIR=".backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="prodash_backup_${TIMESTAMP}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Function to check if we have uncommitted changes
check_git_status() {
  if [[ $(git status --porcelain) ]]; then
    return 0 # Has changes
  else
    return 1 # No changes
  fi
}

# Function to create local backup
create_local_backup() {
  echo "Creating local backup..."
  tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".backups" \
    --exclude="*.log" \
    .
  echo "Local backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
}

# Function to push to GitHub
push_to_github() {
  echo "Pushing changes to GitHub..."
  git add .
  git commit -m "Automated backup: ${TIMESTAMP}"
  git push origin main
}

# Main backup process
echo "Starting ProDash_Tools backup process..."

# 1. Check Git status
if check_git_status; then
  echo "Uncommitted changes detected"
  # Create local backup first
  create_local_backup
  # Push to GitHub
  push_to_github
else
  echo "No changes to backup to GitHub"
  # Still create a local backup for safety
  create_local_backup
fi

# Clean up old backups (keep last 5)
cd "$BACKUP_DIR" || exit
ls -t *.tar.gz | tail -n +6 | xargs rm -f 2>/dev/null
cd - || exit

echo "Backup process completed!" 