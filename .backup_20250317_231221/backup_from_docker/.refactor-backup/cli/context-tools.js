#!/usr/bin/env node

/**
 * Context Tools CLI
 * 
 * Command-line interface for interacting with Context Keeper.
 */

const path = require('path');
const fs = require('fs');

// Locate the project root
const findProjectRoot = () => {
  let currentDir = process.cwd();
  
  // Try to find package.json as indicator of project root
  while (currentDir !== '/') {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // If we can't find it, use the current directory
  return process.cwd();
};

const projectRoot = findProjectRoot();

// Register ts-node to handle TypeScript imports
try {
  require('ts-node').register({
    transpileOnly: true,
    project: path.join(projectRoot, 'tsconfig.json')
  });
} catch (err) {
  console.error('Failed to initialize ts-node:', err);
  process.exit(1);
}

// Import the Context Keeper utilities
const { 
  getContextManager, 
  getBackupManager 
} = require(path.join(projectRoot, 'prodash-tools/core/index'));

// Get instances
const contextManager = getContextManager();
const backupManager = getBackupManager();

// Command handlers
const commands = {
  // Show help
  help: () => {
    console.log(`
Context Tools v1.0.0

Usage: node ${path.basename(__filename)} <command> [options]

Available commands:
  help                 Show this help message
  list                 List all contexts
  get <id>             Retrieve a specific context by ID
  add <file>           Add a context from a JSON file
  backup               Trigger a manual backup
  restore <file>       Restore from a backup file
  list-backups         List all available backups
  health               Check system health

Examples:
  node ${path.basename(__filename)} list
  node ${path.basename(__filename)} backup
    `);
  },
  
  // List all contexts
  list: async () => {
    try {
      const contexts = await contextManager.getAllContexts();
      console.log(`Found ${contexts.length} contexts:`);
      
      contexts.forEach((context, index) => {
        console.log(`\n[${index + 1}] ID: ${context.id}`);
        console.log(`    Created: ${new Date(context.createdAt).toLocaleString()}`);
        console.log(`    Updated: ${new Date(context.updatedAt).toLocaleString()}`);
        
        // Print truncated content
        const contentPreview = typeof context.content === 'string' 
          ? context.content.substring(0, 100) 
          : JSON.stringify(context.content).substring(0, 100);
        
        console.log(`    Content: ${contentPreview}${contentPreview.length >= 100 ? '...' : ''}`);
      });
    } catch (error) {
      console.error('Error listing contexts:', error);
    }
  },
  
  // Get a specific context by ID
  get: async (id) => {
    if (!id) {
      console.error('Error: Context ID is required');
      return;
    }
    
    try {
      const context = await contextManager.getContext(id);
      
      if (!context) {
        console.error(`Context with ID ${id} not found`);
        return;
      }
      
      console.log(`\nContext ID: ${context.id}`);
      console.log(`Created: ${new Date(context.createdAt).toLocaleString()}`);
      console.log(`Updated: ${new Date(context.updatedAt).toLocaleString()}`);
      console.log('\nContent:');
      console.log(typeof context.content === 'string' ? context.content : JSON.stringify(context.content, null, 2));
      
      if (context.metadata && Object.keys(context.metadata).length > 0) {
        console.log('\nMetadata:');
        console.log(JSON.stringify(context.metadata, null, 2));
      }
    } catch (error) {
      console.error(`Error getting context ${id}:`, error);
    }
  },
  
  // Add a context from a JSON file
  add: async (filePath) => {
    if (!filePath) {
      console.error('Error: File path is required');
      return;
    }
    
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`Error: File not found: ${fullPath}`);
        return;
      }
      
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      let contextData;
      
      try {
        contextData = JSON.parse(fileContent);
      } catch (parseError) {
        console.error('Error: File must contain valid JSON', parseError);
        return;
      }
      
      const newContext = await contextManager.addContext(contextData);
      console.log(`Context added successfully with ID: ${newContext.id}`);
    } catch (error) {
      console.error('Error adding context:', error);
    }
  },
  
  // Trigger a manual backup
  backup: async () => {
    try {
      const contexts = await contextManager.getAllContexts();
      const backupFile = await backupManager.createBackup(contexts);
      console.log(`Backup created successfully: ${backupFile}`);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  },
  
  // Restore from a backup file
  restore: async (filePath) => {
    if (!filePath) {
      console.error('Error: Backup file path is required');
      return;
    }
    
    try {
      const contexts = await backupManager.restoreBackup(filePath);
      
      // Clear existing contexts
      await contextManager.clearAllContexts();
      
      // Add contexts from backup
      let count = 0;
      for (const context of contexts) {
        await contextManager.addContext(context);
        count++;
      }
      
      console.log(`Successfully restored ${count} contexts from backup`);
    } catch (error) {
      console.error('Error restoring from backup:', error);
    }
  },
  
  // List all available backups
  'list-backups': async () => {
    try {
      const backups = await backupManager.listBackups();
      
      if (backups.length === 0) {
        console.log('No backups found');
        return;
      }
      
      console.log(`Found ${backups.length} backups:`);
      backups.forEach((backup, index) => {
        console.log(`[${index + 1}] ${backup}`);
      });
    } catch (error) {
      console.error('Error listing backups:', error);
    }
  },
  
  // Check system health
  health: async () => {
    try {
      const contextStatus = contextManager.isInitialized();
      const backupStatus = backupManager.isInitialized();
      
      console.log('System Health:');
      console.log(`- Context Manager: ${contextStatus ? 'ONLINE' : 'OFFLINE'}`);
      console.log(`- Backup Manager: ${backupStatus ? 'ONLINE' : 'OFFLINE'}`);
      
      const overallStatus = contextStatus && backupStatus ? 'HEALTHY' : 'DEGRADED';
      console.log(`\nOverall Status: ${overallStatus}`);
      
      // Get context count
      const contexts = await contextManager.getAllContexts();
      console.log(`\nTotal Contexts: ${contexts.length}`);
      
      // Get backup count
      const backups = await backupManager.listBackups();
      console.log(`Total Backups: ${backups.length}`);
      if (backups.length > 0) {
        console.log(`Latest Backup: ${backups[0]}`);
      }
    } catch (error) {
      console.error('Error checking system health:', error);
    }
  }
};

// Parse command line arguments
const [,, command, ...args] = process.argv;

// Execute the command
const run = async () => {
  // Initialize managers
  await contextManager.initialize();
  await backupManager.initialize();
  
  // Handle command
  if (commands[command]) {
    await commands[command](...args);
  } else {
    console.error(`Unknown command: ${command}`);
    commands.help();
  }
};

// Run the command
run().catch(error => {
  console.error('Error executing command:', error);
  process.exit(1);
}).finally(() => {
  process.exit(0);
}); 