import { Command } from 'commander';
import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { validateProjectName } from '../../utils/validation';
import { createArchive, extractArchive } from '../../utils/archive';

interface ProjectConfig {
  name: string;
  description: string;
  version: string;
  template: string;
  database: {
    type: 'local' | 'cloud';
    uri: string;
  };
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  created: Date;
  modified: Date;
  lastBackup?: Date;
  lastDeploy?: Date;
}

const PROJECT_DIR = path.join(process.cwd(), 'data/projects');
const TEMPLATE_DIR = path.join(process.cwd(), 'data/templates');
const TEMP_DIR = path.join(process.cwd(), 'data/temp');

async function createProject(
  name: string,
  options: { template?: string; database?: string; description?: string }
): Promise<void> {
  const spinner = ora('Creating project').start();
  
  try {
    // Validate project name
    const validName = validateProjectName(name);
    
    // Ensure directories exist
    await fs.ensureDir(PROJECT_DIR);
    await fs.ensureDir(TEMP_DIR);
    
    // Check if project already exists
    const projectPath = path.join(PROJECT_DIR, validName);
    if (await fs.pathExists(projectPath)) {
      throw new Error(`Project already exists: ${validName}`);
    }
    
    // Validate template
    const templateName = options.template || 'basic';
    const templatePath = path.join(TEMPLATE_DIR, templateName);
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    // Read template config
    const templateConfig = await fs.readJSON(
      path.join(templatePath, 'template.json')
    );
    
    // Create project config
    const config: ProjectConfig = {
      name: validName,
      description: options.description || `${validName} project`,
      version: '1.0.0',
      template: templateName,
      database: {
        type: (options.database || 'local') as 'local' | 'cloud',
        uri: `mongodb://localhost:27017/prodash_${validName}`,
      },
      features: templateConfig.features || [],
      dependencies: templateConfig.dependencies || {},
      devDependencies: templateConfig.devDependencies || {},
      scripts: templateConfig.scripts || {},
      created: new Date(),
      modified: new Date(),
    };
    
    // Copy template files
    await fs.copy(templatePath, projectPath, {
      filter: (src) => !src.includes('node_modules') && !src.includes('template.json'),
    });
    
    // Update package.json
    const packagePath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packagePath)) {
      const packageJson = await fs.readJSON(packagePath);
      await fs.writeJSON(packagePath, {
        ...packageJson,
        name: validName,
        version: config.version,
        description: config.description,
        dependencies: config.dependencies,
        devDependencies: config.devDependencies,
        scripts: config.scripts,
      }, { spaces: 2 });
    }
    
    // Create project config file
    await fs.writeJSON(
      path.join(projectPath, 'prodash.json'),
      config,
      { spaces: 2 }
    );
    
    // Save project to database
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    await mongoose.connection.collection('projects').insertOne(config);
    await mongoose.connection.close();
    
    spinner.succeed(`Project created successfully: ${validName}`);
    
    console.log('\nProject details:');
    console.log(chalk.cyan(`Name: ${config.name}`));
    console.log(chalk.cyan(`Description: ${config.description}`));
    console.log(chalk.cyan(`Template: ${config.template}`));
    console.log(chalk.cyan(`Database: ${config.database.type} (${config.database.uri})`));
    console.log(chalk.cyan(`Location: ${projectPath}`));
    
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.white('1. Install dependencies:'));
    console.log(chalk.gray(`   cd ${projectPath}`));
    console.log(chalk.gray('   npm install'));
    console.log(chalk.white('2. Start development server:'));
    console.log(chalk.gray('   npm run dev'));
    
  } catch (error) {
    spinner.fail('Project creation failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

async function listProjects(): Promise<void> {
  try {
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    
    const projects = await mongoose.connection
      .collection('projects')
      .find()
      .sort({ modified: -1 })
      .toArray();
    
    await mongoose.connection.close();
    
    if (projects.length === 0) {
      console.log(chalk.yellow('No projects found.'));
      return;
    }
    
    console.log(chalk.cyan('\nAvailable projects:'));
    for (const project of projects) {
      console.log(chalk.yellow(`\n${project.name}`));
      console.log(chalk.white(`  Description: ${project.description}`));
      console.log(chalk.white(`  Template: ${project.template}`));
      console.log(chalk.white(`  Version: ${project.version}`));
      console.log(chalk.white(`  Database: ${project.database.type} (${project.database.uri})`));
      console.log(chalk.white(`  Created: ${project.created}`));
      console.log(chalk.white(`  Modified: ${project.modified}`));
      
      if (project.lastBackup) {
        console.log(chalk.white(`  Last Backup: ${project.lastBackup}`));
      }
      if (project.lastDeploy) {
        console.log(chalk.white(`  Last Deploy: ${project.lastDeploy}`));
      }
      
      if (project.features.length > 0) {
        console.log(chalk.white('  Features:'));
        project.features.forEach(feature => {
          console.log(chalk.gray(`    - ${feature}`));
        });
      }
    }
    
  } catch (error) {
    console.error(chalk.red('\nError listing projects:'), error);
    process.exit(1);
  }
}

async function exportProject(name: string, outputPath: string): Promise<void> {
  const spinner = ora('Exporting project').start();
  
  try {
    const validName = validateProjectName(name);
    const projectPath = path.join(PROJECT_DIR, validName);
    
    if (!await fs.pathExists(projectPath)) {
      throw new Error(`Project not found: ${validName}`);
    }
    
    // Create temp directory for export
    await fs.ensureDir(TEMP_DIR);
    
    // Copy project files
    await fs.copy(projectPath, path.join(TEMP_DIR, 'project'), {
      filter: (src) => !src.includes('node_modules'),
    });
    
    // Create archive
    await createArchive(TEMP_DIR, outputPath);
    
    // Clean up
    await fs.remove(TEMP_DIR);
    
    spinner.succeed(`Project exported successfully: ${outputPath}.zip`);
    
  } catch (error) {
    spinner.fail('Project export failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

async function importProject(archivePath: string): Promise<void> {
  const spinner = ora('Importing project').start();
  
  try {
    if (!await fs.pathExists(archivePath)) {
      throw new Error(`Archive not found: ${archivePath}`);
    }
    
    // Create temp directory for import
    await fs.ensureDir(TEMP_DIR);
    
    // Extract archive
    await extractArchive(archivePath, TEMP_DIR);
    
    // Read project config
    const configPath = path.join(TEMP_DIR, 'project', 'prodash.json');
    const config: ProjectConfig = await fs.readJSON(configPath);
    
    // Validate project name
    const validName = validateProjectName(config.name);
    const projectPath = path.join(PROJECT_DIR, validName);
    
    // Check if project already exists
    if (await fs.pathExists(projectPath)) {
      throw new Error(`Project already exists: ${validName}`);
    }
    
    // Copy project files
    await fs.copy(path.join(TEMP_DIR, 'project'), projectPath);
    
    // Update project in database
    await mongoose.connect('mongodb://localhost:27017/prodash_master');
    await mongoose.connection.collection('projects').insertOne({
      ...config,
      modified: new Date(),
    });
    await mongoose.connection.close();
    
    // Clean up
    await fs.remove(TEMP_DIR);
    
    spinner.succeed(`Project imported successfully: ${validName}`);
    
  } catch (error) {
    spinner.fail('Project import failed');
    console.error(chalk.red('\nError:'), error);
    process.exit(1);
  }
}

export function setupProjectCommand(program: Command): void {
  program
    .command('project')
    .description('Manage projects')
    .option('-c, --create <name>', 'Create a new project')
    .option('-t, --template <name>', 'Template to use', 'basic')
    .option('-d, --database <type>', 'Database type (local, cloud)', 'local')
    .option('--description <text>', 'Project description')
    .option('-l, --list', 'List available projects')
    .option('-e, --export <name>', 'Export a project')
    .option('-o, --output <path>', 'Output path for export')
    .option('-i, --import <path>', 'Import a project from archive')
    .action(async (options) => {
      try {
        if (options.create) {
          await createProject(options.create, {
            template: options.template,
            database: options.database,
            description: options.description,
          });
        } else if (options.list) {
          await listProjects();
        } else if (options.export) {
          if (!options.output) {
            throw new Error('Output path is required for export');
          }
          await exportProject(options.export, options.output);
        } else if (options.import) {
          await importProject(options.import);
        } else {
          await listProjects();
        }
      } catch (error) {
        console.error(chalk.red('\nError:'), error);
        process.exit(1);
      }
    });
} 