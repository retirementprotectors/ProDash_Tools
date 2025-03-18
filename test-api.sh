#!/bin/bash

# Load environment variables
source .env

echo "Using backend port: $BACKEND_PORT"

# Test health endpoint
echo "Testing health endpoint..."
curl -v http://localhost:$BACKEND_PORT/api/health

# Test contexts endpoint
echo -e "\nTesting contexts endpoint..."
curl -v http://localhost:$BACKEND_PORT/api/contexts

# Test backups endpoint
echo -e "\nTesting backups endpoint..."
curl -v http://localhost:$BACKEND_PORT/api/backups 