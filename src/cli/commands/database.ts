import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import chalk from 'chalk';

interface DatabaseConfig {
  name: string;
  collections: string[];
  indexes?: Record<string, unknown>[];
  initialData?: Record<string, unknown>[];
}

const REQUIRED_DIRECTORIES = [
  'data/mongodb',
  'data/projects',
  'data/templates',
  'data/cache',
  'data/backups',
  'data/logs',
];

const DATABASE_CONFIGS: DatabaseConfig[] = [
  {
    name: 'prodash_master',
    collections: [
      'projects',
      'templates',
      'settings',
      'logs',
      'backups',
      'deployments',
      'users',
    ],
    indexes: [
      { collection: 'projects', field: 'name', unique: true },
      { collection: 'templates', field: 'name', unique: true },
      { collection: 'users', field: 'email', unique: true },
      { collection: 'deployments', field: 'projectId', unique: false },
      { collection: 'logs', field: 'timestamp', unique: false },
    ],
    initialData: [
      {
        collection: 'settings',
        data: {
          version: '1.0.0',
          initialized: new Date(),
          features: {
            localDevelopment: true,
            cloudDeployment: false,
            templateCustomization: true,
            autoBackup: true,
            monitoring: true,
          },
          backup: {
            enabled: true,
            schedule: '0 0 * * *', // Daily at midnight
            retention: 7, // Days
          },
          security: {
            requireAuth: true,
            sessionTimeout: 3600,
          },
        },
      },
    ],
  },
  {
    name: 'prodash_master_test',
    collections: [
      'projects',
      'templates',
      'settings',
      'logs',
      'backups',
      'deployments',
      'users',
    ],
  },
];

async function checkMongoDBConnection(uri: string): Promise<boolean> {
  try {
    await mongoose.connect(uri);
    await mongoose.connection.close();
    return true;
  } catch {
    return false;
  }
}

async function createCollection(
  db: mongoose.Connection,
  name: string,
  indexes?: Record<string, unknown>[],
  initialData?: Record<string, unknown>
): Promise<void> {
  const collection = db.collection(name);
  
  // Create collection if it doesn't exist
  if (!(await collection.exists())) {
    await db.createCollection(name);
  }

  // Create indexes
  if (indexes) {
    const collectionIndexes = indexes.filter(idx => idx.collection === name);
    for (const index of collectionIndexes) {
      await collection.createIndex(
        { [index.field as string]: 1 },
        { unique: index.unique as boolean }
      );
    }
  }

  // Insert initial data
  if (initialData) {
    await collection.insertOne(initialData);
  }
}

export async function initDatabase(): Promise<void> {
  const spinner = ora('Initializing ProDash Tools environment').start();

  try {
    // Create required directories
    spinner.text = 'Creating required directories...';
    for (const dir of REQUIRED_DIRECTORIES) {
      await fs.ensureDir(path.join(process.cwd(), dir));
    }
    spinner.succeed('Created required directories');

    // Check MongoDB service
    spinner.text = 'Checking MongoDB service...';
    try {
      execSync('mongod --version', { stdio: 'ignore' });
    } catch (error) {
      spinner.fail('MongoDB is not installed');
      console.log(chalk.yellow('\nPlease install MongoDB first:'));
      console.log(chalk.cyan('\nbrew tap mongodb/brew'));
      console.log(chalk.cyan('brew install mongodb-community@7.0'));
      console.log(chalk.cyan('brew services start mongodb/brew/mongodb-community@7.0\n'));
      process.exit(1);
    }

    // Test MongoDB connection
    spinner.text = 'Testing MongoDB connection...';
    const testUri = 'mongodb://localhost:27017/test';
    if (!(await checkMongoDBConnection(testUri))) {
      spinner.fail('Cannot connect to MongoDB');
      console.log(chalk.yellow('\nPlease ensure MongoDB is running:'));
      console.log(chalk.cyan('brew services start mongodb/brew/mongodb-community@7.0'));
      process.exit(1);
    }
    spinner.succeed('MongoDB service is available');

    // Initialize databases
    spinner.text = 'Initializing databases...';
    for (const config of DATABASE_CONFIGS) {
      const uri = `mongodb://localhost:27017/${config.name}`;
      await mongoose.connect(uri);

      // Create collections and indexes
      for (const collection of config.collections) {
        const initialData = config.initialData?.find(
          data => data.collection === collection
        )?.data;
        
        await createCollection(
          mongoose.connection,
          collection,
          config.indexes,
          initialData
        );
      }

      await mongoose.connection.close();
    }
    spinner.succeed('Initialized databases');

    console.log(chalk.green('\n✨ ProDash Tools environment initialized successfully!\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.white('1. Create your first project:'));
    console.log(chalk.yellow('   prodash create my-project\n'));
    console.log(chalk.white('2. Generate a custom template:'));
    console.log(chalk.yellow('   prodash generate my-template\n'));
    console.log(chalk.white('3. Check system status:'));
    console.log(chalk.yellow('   prodash manage --status\n'));

  } catch (error) {
    spinner.fail('Initialization failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
} 