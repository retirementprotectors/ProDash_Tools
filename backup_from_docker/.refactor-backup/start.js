#!/usr/bin/env node

/**
 * ProDash Tools Startup Script
 * 
 * This script is the main entry point for the ProDash Tools server.
 * It initializes the server and handles any startup errors.
 */

// Import the server
const { startServer } = require('./api/server');

// Start the server
console.log('Starting ProDash Tools...');
startServer().catch(error => {
  console.error('Failed to start ProDash Tools:', error);
  process.exit(1);
}); 