"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupProjectCommand = setupProjectCommand;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const validation_1 = require("../../utils/validation");
const archive_1 = require("../../utils/archive");
const PROJECT_DIR = path_1.default.join(process.cwd(), 'data/projects');
const TEMPLATE_DIR = path_1.default.join(process.cwd(), 'data/templates');
const TEMP_DIR = path_1.default.join(process.cwd(), 'data/temp');
async function createProject(name, options) {
    const spinner = (0, ora_1.default)('Creating project').start();
    try {
        // Validate project name
        const validName = (0, validation_1.validateProjectName)(name);
        // Ensure directories exist
        await fs_extra_1.default.ensureDir(PROJECT_DIR);
        await fs_extra_1.default.ensureDir(TEMP_DIR);
        // Check if project already exists
        const projectPath = path_1.default.join(PROJECT_DIR, validName);
        if (await fs_extra_1.default.pathExists(projectPath)) {
            throw new Error(`Project already exists: ${validName}`);
        }
        // Validate template
        const templateName = options.template || 'basic';
        const templatePath = path_1.default.join(TEMPLATE_DIR, templateName);
        if (!await fs_extra_1.default.pathExists(templatePath)) {
            throw new Error(`Template not found: ${templateName}`);
        }
        // Read template config
        const templateConfig = await fs_extra_1.default.readJSON(path_1.default.join(templatePath, 'template.json'));
        // Create project config
        const config = {
            name: validName,
            description: options.description || `${validName} project`,
            version: '1.0.0',
            template: templateName,
            database: {
                type: (options.database || 'local'),
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
        await fs_extra_1.default.copy(templatePath, projectPath, {
            filter: (src) => !src.includes('node_modules') && !src.includes('template.json'),
        });
        // Update package.json
        const packagePath = path_1.default.join(projectPath, 'package.json');
        if (await fs_extra_1.default.pathExists(packagePath)) {
            const packageJson = await fs_extra_1.default.readJSON(packagePath);
            await fs_extra_1.default.writeJSON(packagePath, {
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
        await fs_extra_1.default.writeJSON(path_1.default.join(projectPath, 'prodash.json'), config, { spaces: 2 });
        // Save project to database
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        await mongoose_1.default.connection.collection('projects').insertOne(config);
        await mongoose_1.default.connection.close();
        spinner.succeed(`Project created successfully: ${validName}`);
        console.log('\nProject details:');
        console.log(chalk_1.default.cyan(`Name: ${config.name}`));
        console.log(chalk_1.default.cyan(`Description: ${config.description}`));
        console.log(chalk_1.default.cyan(`Template: ${config.template}`));
        console.log(chalk_1.default.cyan(`Database: ${config.database.type} (${config.database.uri})`));
        console.log(chalk_1.default.cyan(`Location: ${projectPath}`));
        console.log(chalk_1.default.yellow('\nNext steps:'));
        console.log(chalk_1.default.white('1. Install dependencies:'));
        console.log(chalk_1.default.gray(`   cd ${projectPath}`));
        console.log(chalk_1.default.gray('   npm install'));
        console.log(chalk_1.default.white('2. Start development server:'));
        console.log(chalk_1.default.gray('   npm run dev'));
    }
    catch (error) {
        spinner.fail('Project creation failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
async function listProjects() {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        const projects = await mongoose_1.default.connection
            .collection('projects')
            .find()
            .sort({ modified: -1 })
            .toArray();
        await mongoose_1.default.connection.close();
        if (projects.length === 0) {
            console.log(chalk_1.default.yellow('No projects found.'));
            return;
        }
        console.log(chalk_1.default.cyan('\nAvailable projects:'));
        for (const project of projects) {
            console.log(chalk_1.default.yellow(`\n${project.name}`));
            console.log(chalk_1.default.white(`  Description: ${project.description}`));
            console.log(chalk_1.default.white(`  Template: ${project.template}`));
            console.log(chalk_1.default.white(`  Version: ${project.version}`));
            console.log(chalk_1.default.white(`  Database: ${project.database.type} (${project.database.uri})`));
            console.log(chalk_1.default.white(`  Created: ${project.created}`));
            console.log(chalk_1.default.white(`  Modified: ${project.modified}`));
            if (project.lastBackup) {
                console.log(chalk_1.default.white(`  Last Backup: ${project.lastBackup}`));
            }
            if (project.lastDeploy) {
                console.log(chalk_1.default.white(`  Last Deploy: ${project.lastDeploy}`));
            }
            if (project.features.length > 0) {
                console.log(chalk_1.default.white('  Features:'));
                project.features.forEach(feature => {
                    console.log(chalk_1.default.gray(`    - ${feature}`));
                });
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\nError listing projects:'), error);
        process.exit(1);
    }
}
async function exportProject(name, outputPath) {
    const spinner = (0, ora_1.default)('Exporting project').start();
    try {
        const validName = (0, validation_1.validateProjectName)(name);
        const projectPath = path_1.default.join(PROJECT_DIR, validName);
        if (!await fs_extra_1.default.pathExists(projectPath)) {
            throw new Error(`Project not found: ${validName}`);
        }
        // Create temp directory for export
        await fs_extra_1.default.ensureDir(TEMP_DIR);
        // Copy project files
        await fs_extra_1.default.copy(projectPath, path_1.default.join(TEMP_DIR, 'project'), {
            filter: (src) => !src.includes('node_modules'),
        });
        // Create archive
        await (0, archive_1.createArchive)(TEMP_DIR, outputPath);
        // Clean up
        await fs_extra_1.default.remove(TEMP_DIR);
        spinner.succeed(`Project exported successfully: ${outputPath}.zip`);
    }
    catch (error) {
        spinner.fail('Project export failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
async function importProject(archivePath) {
    const spinner = (0, ora_1.default)('Importing project').start();
    try {
        if (!await fs_extra_1.default.pathExists(archivePath)) {
            throw new Error(`Archive not found: ${archivePath}`);
        }
        // Create temp directory for import
        await fs_extra_1.default.ensureDir(TEMP_DIR);
        // Extract archive
        await (0, archive_1.extractArchive)(archivePath, TEMP_DIR);
        // Read project config
        const configPath = path_1.default.join(TEMP_DIR, 'project', 'prodash.json');
        const config = await fs_extra_1.default.readJSON(configPath);
        // Validate project name
        const validName = (0, validation_1.validateProjectName)(config.name);
        const projectPath = path_1.default.join(PROJECT_DIR, validName);
        // Check if project already exists
        if (await fs_extra_1.default.pathExists(projectPath)) {
            throw new Error(`Project already exists: ${validName}`);
        }
        // Copy project files
        await fs_extra_1.default.copy(path_1.default.join(TEMP_DIR, 'project'), projectPath);
        // Update project in database
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        await mongoose_1.default.connection.collection('projects').insertOne({
            ...config,
            modified: new Date(),
        });
        await mongoose_1.default.connection.close();
        // Clean up
        await fs_extra_1.default.remove(TEMP_DIR);
        spinner.succeed(`Project imported successfully: ${validName}`);
    }
    catch (error) {
        spinner.fail('Project import failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
function setupProjectCommand(program) {
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
            }
            else if (options.list) {
                await listProjects();
            }
            else if (options.export) {
                if (!options.output) {
                    throw new Error('Output path is required for export');
                }
                await exportProject(options.export, options.output);
            }
            else if (options.import) {
                await importProject(options.import);
            }
            else {
                await listProjects();
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\nError:'), error);
            process.exit(1);
        }
    });
}
