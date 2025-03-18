import { Command } from 'commander';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { validateProjectName } from '../../utils/validation';
import { createArchive } from '../../utils/archive';

interface DeploymentConfig {
  environment: 'local' | 'staging' | 'production';
  version: string;
  timestamp: Date;
  project: string;
  database: string;
  port: number;
  status: 'pending' | 'running' | 'failed' | 'completed';
  logs: string[];
}

const DEPLOY_DIR = path.join(process.cwd(), 'data/deployments');

async function initializeDeployment(
  project: string,
  environment: string
): Promise<DeploymentConfig> {
  // Validate project name
  const validProjectName = validateProjectName(project);
  
  // Ensure deployment directory exists
  await fs.ensureDir(DEPLOY_DIR);
  
  // Create deployment config
  const config: DeploymentConfig = {
    environment: environment as 'local' | 'staging' | 'production',
    version: '1.0.0',
    timestamp: new Date(),
    project: validProjectName,
    database: `prodash_${validProjectName}_${environment}`,
    port: 3000 + Math.floor(Math.random() * 1000),
    status: 'pending',
    logs: [],
  };
  
  return config;
}

async function saveDeployment(config: DeploymentConfig): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/prodash_master');
  
  const deployments = mongoose.connection.collection('deployments');
  await deployments.insertOne(config);
  
  await mongoose.connection.close();
}

async function updateDeploymentStatus(
  project: string,
  status: DeploymentConfig['status'],
  log: string
): Promise<void> {
  await mongoose.connect('mongodb://localhost:27017/prodash_master');
  
  const deployments = mongoose.connection.collection('deployments');
  await deployments.updateOne(
    { project },
    {
      $set: { status },
      $push: { logs: `[${new Date().toISOString()}] ${log}` },
    }
  );
  
  await mongoose.connection.close();
}

export async function deployProject(
  project: string,
  environment: string = 'local'
): Promise<void> {
  const spinner = ora('Preparing deployment').start();
  
  try {
    // Initialize deployment
    const config = await initializeDeployment(project, environment);
    await saveDeployment(config);
    
    // Validate project directory
    const projectDir = path.join(process.cwd(), 'data/projects', project);
    if (!await fs.pathExists(projectDir)) {
      throw new Error(`Project directory not found: ${project}`);
    }
    
    spinner.text = 'Creating deployment package...';
    
    // Create temp directory for deployment
    const tempDir = path.join(process.cwd(), 'data/temp');
    await fs.ensureDir(tempDir);
    
    // Copy project files
    await fs.copy(projectDir, path.join(tempDir, 'app'));
    
    // Create deployment archive
    const deploymentPath = path.join(DEPLOY_DIR, `${project}-${config.timestamp.getTime()}`);
    await createArchive(tempDir, deploymentPath);
    
    // Update status
    await updateDeploymentStatus(
      project,
      'running',
      'Deployment package created successfully'
    );
    
    // Clean up temp directory
    await fs.remove(tempDir);
    
    // Deploy based on environment
    spinner.text = `Deploying to ${environment}...`;
    
    switch (environment) {
      case 'local':
        await deployLocal(config);
        break;
      case 'staging':
      case 'production':
        await deployCloud(config);
        break;
      default:
        throw new Error(`Invalid environment: ${environment}`);
    }
    
    // Update final status
    await updateDeploymentStatus(
      project,
      'completed',
      `Deployment completed successfully to ${environment}`
    );
    
    spinner.succeed(`Deployment completed: ${project} (${environment})`);
    
    console.log('\nDeployment details:');
    console.log(chalk.cyan(`Project: ${config.project}`));
    console.log(chalk.cyan(`Environment: ${config.environment}`));
    console.log(chalk.cyan(`Database: ${config.database}`));
    console.log(chalk.cyan(`Port: ${config.port}`));
    console.log(chalk.cyan(`Status: ${chalk.green('completed')}`));
    
  } catch (error) {
    spinner.fail('Deployment failed');
    console.error(chalk.red('\nError:'), error);
    
    // Update error status
    await updateDeploymentStatus(
      project,
      'failed',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
    
    process.exit(1);
  }
}

async function deployLocal(config: DeploymentConfig): Promise<void> {
  // For local deployment, we just need to:
  // 1. Create the database
  await mongoose.connect(`mongodb://localhost:27017/${config.database}`);
  await mongoose.connection.close();
  
  // 2. Start the application (in development, this would be handled by the dev server)
  // In production, you might want to use PM2 or similar
  console.log(chalk.yellow('\nTo start the application locally:'));
  console.log(chalk.cyan(`cd data/projects/${config.project}`));
  console.log(chalk.cyan('npm install'));
  console.log(chalk.cyan(`PORT=${config.port} npm start`));
}

async function deployCloud(config: DeploymentConfig): Promise<void> {
  // This would integrate with your cloud provider's API
  // For now, we'll just simulate the deployment
  console.log(chalk.yellow('\nCloud deployment simulation:'));
  console.log(chalk.cyan('1. Uploading deployment package...'));
  console.log(chalk.cyan('2. Provisioning cloud resources...'));
  console.log(chalk.cyan('3. Configuring environment...'));
  console.log(chalk.cyan('4. Starting application servers...'));
  
  // In a real implementation, this would:
  // 1. Upload the deployment package to cloud storage
  // 2. Trigger cloud build/deploy pipeline
  // 3. Update DNS/routing if needed
  // 4. Set up monitoring and logging
}

export async function listDeployments(): Promise<void> {
  try {
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    
    const deployments = mongoose.connection.collection('deployments');
    const results = await deployments.find().sort({ timestamp: -1 }).toArray();
    
    await mongoose.connection.close();
    
    if (results.length === 0) {
      console.log(chalk.yellow('No deployments found.'));
      return;
    }
    
    console.log(chalk.cyan('\nRecent deployments:'));
    for (const deployment of results) {
      console.log(chalk.yellow(`\n${deployment.project} (${deployment.environment})`));
      console.log(chalk.white(`  Timestamp: ${deployment.timestamp}`));
      console.log(chalk.white(`  Status: ${getStatusColor(deployment.status)(deployment.status)}`));
      console.log(chalk.white(`  Database: ${deployment.database}`));
      console.log(chalk.white(`  Port: ${deployment.port}`));
      
      if (deployment.logs.length > 0) {
        console.log(chalk.white('  Recent logs:'));
        deployment.logs.slice(-3).forEach(log => {
          console.log(chalk.gray(`    ${log}`));
        });
      }
    }
    
  } catch (error) {
    console.error(chalk.red('\nError listing deployments:'), error);
    process.exit(1);
  }
}

function getStatusColor(status: DeploymentConfig['status']): (text: string) => string {
  switch (status) {
    case 'completed':
      return chalk.green;
    case 'running':
      return chalk.blue;
    case 'failed':
      return chalk.red;
    default:
      return chalk.yellow;
  }
}

export function setupDeployCommand(program: Command): void {
  program
    .command('deploy')
    .description('Deploy a project')
    .argument('<project>', 'Project to deploy')
    .option('-e, --environment <env>', 'Deployment environment', 'local')
    .option('-l, --list', 'List recent deployments')
    .action(async (project, options) => {
      try {
        if (options.list) {
          await listDeployments();
        } else {
          await deployProject(project, options.environment);
        }
      } catch (error) {
        console.error(chalk.red('\nError:'), error);
        process.exit(1);
      }
    });
} 