#!/bin/bash

echo "Checking Context Keeper services..."
echo "---------------------------------"

# Check backend health
echo "Checking backend (should be at http://localhost:4000):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health | grep -q 200; then
  echo "✅ Backend is running!"
else
  echo "❌ Backend is not responding at http://localhost:4000/health"
fi

# Check frontend
echo ""
echo "Checking frontend (should be at http://localhost:5173):"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ | grep -q 200; then
  echo "✅ Frontend is running!"
else
  echo "❌ Frontend is not responding at http://localhost:5173/"
fi

echo "---------------------------------"
echo "If services are not running, please check Docker logs using:"
echo "docker-compose logs -f" 