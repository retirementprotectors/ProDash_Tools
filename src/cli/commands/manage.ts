import { Command } from 'commander';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';

interface SystemStatus {
  version: string;
  uptime: number;
  system: {
    platform: string;
    arch: string;
    memory: {
      total: number;
      free: number;
      used: number;
    };
    cpu: {
      cores: number;
      load: number[];
    };
  };
  mongodb: {
    status: 'running' | 'stopped' | 'error';
    version?: string;
    databases: string[];
    collections: Record<string, number>;
  };
  storage: {
    projects: number;
    templates: number;
    backups: number;
    deployments: number;
    total: number;
  };
}

async function checkMongoDBStatus(): Promise<SystemStatus['mongodb']> {
  try {
    // Check if MongoDB is running
    execSync('pgrep mongod', { stdio: 'ignore' });
    
    // Get MongoDB version
    const versionOutput = execSync('mongod --version').toString();
    const version = versionOutput.match(/db version v([\d.]+)/)?.[1] || 'unknown';
    
    // Connect and get database stats
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    const adminDb = mongoose.connection.db.admin();
    const { databases } = await adminDb.listDatabases();
    
    const collections: Record<string, number> = {};
    for (const db of databases) {
      if (db.name.startsWith('prodash_')) {
        const dbConnection = mongoose.connection.useDb(db.name);
        const dbCollections = await dbConnection.listCollections().toArray();
        collections[db.name] = dbCollections.length;
      }
    }
    
    await mongoose.connection.close();
    
    return {
      status: 'running',
      version,
      databases: databases
        .map(db => db.name)
        .filter(name => name.startsWith('prodash_')),
      collections,
    };
    
  } catch (error) {
    return {
      status: 'error',
      databases: [],
      collections: {},
    };
  }
}

async function getStorageStats(): Promise<SystemStatus['storage']> {
  const stats = {
    projects: 0,
    templates: 0,
    backups: 0,
    deployments: 0,
    total: 0,
  };
  
  const directories = {
    projects: path.join(process.cwd(), 'data/projects'),
    templates: path.join(process.cwd(), 'data/templates'),
    backups: path.join(process.cwd(), 'data/backups'),
    deployments: path.join(process.cwd(), 'data/deployments'),
  };
  
  for (const [key, dir] of Object.entries(directories)) {
    if (await fs.pathExists(dir)) {
      const items = await fs.readdir(dir);
      stats[key as keyof typeof stats] = items.length;
      
      // Calculate total size
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const itemStats = await fs.stat(itemPath);
        stats.total += itemStats.size;
      }
    }
  }
  
  return stats;
}

async function getSystemStatus(): Promise<SystemStatus> {
  const status: SystemStatus = {
    version: '1.0.0',
    uptime: process.uptime(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpu: {
        cores: os.cpus().length,
        load: os.loadavg(),
      },
    },
    mongodb: await checkMongoDBStatus(),
    storage: await getStorageStats(),
  };
  
  return status;
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function displaySystemStatus(): Promise<void> {
  const spinner = ora('Checking system status').start();
  
  try {
    const status = await getSystemStatus();
    spinner.stop();
    
    console.log(chalk.cyan('\nProDash Tools System Status\n'));
    
    // Version and Uptime
    console.log(chalk.white('Version:'), chalk.yellow(status.version));
    console.log(chalk.white('Uptime:'), chalk.yellow(`${Math.floor(status.uptime / 60)} minutes`));
    
    // System Information
    console.log(chalk.cyan('\nSystem Information:'));
    console.log(chalk.white('  Platform:'), chalk.yellow(status.system.platform));
    console.log(chalk.white('  Architecture:'), chalk.yellow(status.system.arch));
    console.log(chalk.white('  CPU Cores:'), chalk.yellow(status.system.cpu.cores.toString()));
    console.log(chalk.white('  Load Average:'), chalk.yellow(status.system.cpu.load.map(l => l.toFixed(2)).join(', ')));
    console.log(chalk.white('  Memory:'));
    console.log(chalk.white('    Total:'), chalk.yellow(formatBytes(status.system.memory.total)));
    console.log(chalk.white('    Used:'), chalk.yellow(formatBytes(status.system.memory.used)));
    console.log(chalk.white('    Free:'), chalk.yellow(formatBytes(status.system.memory.free)));
    
    // MongoDB Status
    console.log(chalk.cyan('\nMongoDB Status:'));
    console.log(
      chalk.white('  Status:'),
      status.mongodb.status === 'running'
        ? chalk.green('Running')
        : chalk.red(status.mongodb.status)
    );
    if (status.mongodb.version) {
      console.log(chalk.white('  Version:'), chalk.yellow(status.mongodb.version));
    }
    if (status.mongodb.databases.length > 0) {
      console.log(chalk.white('  Databases:'));
      status.mongodb.databases.forEach(db => {
        console.log(
          chalk.white(`    ${db}:`),
          chalk.yellow(`${status.mongodb.collections[db] || 0} collections`)
        );
      });
    }
    
    // Storage Status
    console.log(chalk.cyan('\nStorage Status:'));
    console.log(chalk.white('  Projects:'), chalk.yellow(status.storage.projects.toString()));
    console.log(chalk.white('  Templates:'), chalk.yellow(status.storage.templates.toString()));
    console.log(chalk.white('  Backups:'), chalk.yellow(status.storage.backups.toString()));
    console.log(chalk.white('  Deployments:'), chalk.yellow(status.storage.deployments.toString()));
    console.log(chalk.white('  Total Size:'), chalk.yellow(formatBytes(status.storage.total)));
    
  } catch (error) {
    spinner.fail('Failed to get system status');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

async function cleanupSystem(): Promise<void> {
  const spinner = ora('Cleaning up system').start();
  
  try {
    // Clean up temporary files
    const tempDir = path.join(process.cwd(), 'data/temp');
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
    // Clean up old logs
    const logsDir = path.join(process.cwd(), 'data/logs');
    if (await fs.pathExists(logsDir)) {
      const logs = await fs.readdir(logsDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const log of logs) {
        const logPath = path.join(logsDir, log);
        const stats = await fs.stat(logPath);
        if (now - stats.mtimeMs > maxAge) {
          await fs.remove(logPath);
        }
      }
    }
    
    // Connect to MongoDB and clean up old data
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    
    // Clean up old deployments (keep last 10)
    const deployments = mongoose.connection.collection('deployments');
    const deploymentCount = await deployments.countDocuments();
    if (deploymentCount > 10) {
      const oldDeployments = await deployments
        .find()
        .sort({ timestamp: 1 })
        .limit(deploymentCount - 10)
        .toArray();
      
      for (const deployment of oldDeployments) {
        await deployments.deleteOne({ _id: deployment._id });
      }
    }
    
    await mongoose.connection.close();
    
    spinner.succeed('System cleanup completed');
    
  } catch (error) {
    spinner.fail('System cleanup failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

export function setupManageCommand(program: Command): void {
  program
    .command('manage')
    .description('Manage ProDash Tools system')
    .option('-s, --status', 'Display system status')
    .option('-c, --cleanup', 'Clean up temporary files and old data')
    .action(async (options) => {
      try {
        if (options.status) {
          await displaySystemStatus();
        } else if (options.cleanup) {
          await cleanupSystem();
        } else {
          await displaySystemStatus();
        }
      } catch (error) {
        console.error(chalk.red('\nError:'), error);
        process.exit(1);
      }
    });
} 