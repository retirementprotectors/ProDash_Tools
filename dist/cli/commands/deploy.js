"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployProject = deployProject;
exports.listDeployments = listDeployments;
exports.setupDeployCommand = setupDeployCommand;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const validation_1 = require("../../utils/validation");
const archive_1 = require("../../utils/archive");
const DEPLOY_DIR = path_1.default.join(process.cwd(), 'data/deployments');
async function initializeDeployment(project, environment) {
    // Validate project name
    const validProjectName = (0, validation_1.validateProjectName)(project);
    // Ensure deployment directory exists
    await fs_extra_1.default.ensureDir(DEPLOY_DIR);
    // Create deployment config
    const config = {
        environment: environment,
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
async function saveDeployment(config) {
    await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
    const deployments = mongoose_1.default.connection.collection('deployments');
    await deployments.insertOne(config);
    await mongoose_1.default.connection.close();
}
async function updateDeploymentStatus(project, status, log) {
    await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
    const deployments = mongoose_1.default.connection.collection('deployments');
    await deployments.updateOne({ project }, {
        $set: { status },
        $push: { logs: `[${new Date().toISOString()}] ${log}` },
    });
    await mongoose_1.default.connection.close();
}
async function deployProject(project, environment = 'local') {
    const spinner = (0, ora_1.default)('Preparing deployment').start();
    try {
        // Initialize deployment
        const config = await initializeDeployment(project, environment);
        await saveDeployment(config);
        // Validate project directory
        const projectDir = path_1.default.join(process.cwd(), 'data/projects', project);
        if (!await fs_extra_1.default.pathExists(projectDir)) {
            throw new Error(`Project directory not found: ${project}`);
        }
        spinner.text = 'Creating deployment package...';
        // Create temp directory for deployment
        const tempDir = path_1.default.join(process.cwd(), 'data/temp');
        await fs_extra_1.default.ensureDir(tempDir);
        // Copy project files
        await fs_extra_1.default.copy(projectDir, path_1.default.join(tempDir, 'app'));
        // Create deployment archive
        const deploymentPath = path_1.default.join(DEPLOY_DIR, `${project}-${config.timestamp.getTime()}`);
        await (0, archive_1.createArchive)(tempDir, deploymentPath);
        // Update status
        await updateDeploymentStatus(project, 'running', 'Deployment package created successfully');
        // Clean up temp directory
        await fs_extra_1.default.remove(tempDir);
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
        await updateDeploymentStatus(project, 'completed', `Deployment completed successfully to ${environment}`);
        spinner.succeed(`Deployment completed: ${project} (${environment})`);
        console.log('\nDeployment details:');
        console.log(chalk_1.default.cyan(`Project: ${config.project}`));
        console.log(chalk_1.default.cyan(`Environment: ${config.environment}`));
        console.log(chalk_1.default.cyan(`Database: ${config.database}`));
        console.log(chalk_1.default.cyan(`Port: ${config.port}`));
        console.log(chalk_1.default.cyan(`Status: ${chalk_1.default.green('completed')}`));
    }
    catch (error) {
        spinner.fail('Deployment failed');
        console.error(chalk_1.default.red('\nError:'), error);
        // Update error status
        await updateDeploymentStatus(project, 'failed', error instanceof Error ? error.message : 'Unknown error occurred');
        process.exit(1);
    }
}
async function deployLocal(config) {
    // For local deployment, we just need to:
    // 1. Create the database
    await mongoose_1.default.connect(`mongodb://localhost:27017/${config.database}`);
    await mongoose_1.default.connection.close();
    // 2. Start the application (in development, this would be handled by the dev server)
    // In production, you might want to use PM2 or similar
    console.log(chalk_1.default.yellow('\nTo start the application locally:'));
    console.log(chalk_1.default.cyan(`cd data/projects/${config.project}`));
    console.log(chalk_1.default.cyan('npm install'));
    console.log(chalk_1.default.cyan(`PORT=${config.port} npm start`));
}
async function deployCloud(config) {
    // This would integrate with your cloud provider's API
    // For now, we'll just simulate the deployment
    console.log(chalk_1.default.yellow('\nCloud deployment simulation:'));
    console.log(chalk_1.default.cyan('1. Uploading deployment package...'));
    console.log(chalk_1.default.cyan('2. Provisioning cloud resources...'));
    console.log(chalk_1.default.cyan('3. Configuring environment...'));
    console.log(chalk_1.default.cyan('4. Starting application servers...'));
    // In a real implementation, this would:
    // 1. Upload the deployment package to cloud storage
    // 2. Trigger cloud build/deploy pipeline
    // 3. Update DNS/routing if needed
    // 4. Set up monitoring and logging
}
async function listDeployments() {
    try {
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        const deployments = mongoose_1.default.connection.collection('deployments');
        const results = await deployments.find().sort({ timestamp: -1 }).toArray();
        await mongoose_1.default.connection.close();
        if (results.length === 0) {
            console.log(chalk_1.default.yellow('No deployments found.'));
            return;
        }
        console.log(chalk_1.default.cyan('\nRecent deployments:'));
        for (const deployment of results) {
            console.log(chalk_1.default.yellow(`\n${deployment.project} (${deployment.environment})`));
            console.log(chalk_1.default.white(`  Timestamp: ${deployment.timestamp}`));
            console.log(chalk_1.default.white(`  Status: ${getStatusColor(deployment.status)(deployment.status)}`));
            console.log(chalk_1.default.white(`  Database: ${deployment.database}`));
            console.log(chalk_1.default.white(`  Port: ${deployment.port}`));
            if (deployment.logs.length > 0) {
                console.log(chalk_1.default.white('  Recent logs:'));
                deployment.logs.slice(-3).forEach(log => {
                    console.log(chalk_1.default.gray(`    ${log}`));
                });
            }
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('\nError listing deployments:'), error);
        process.exit(1);
    }
}
function getStatusColor(status) {
    switch (status) {
        case 'completed':
            return chalk_1.default.green;
        case 'running':
            return chalk_1.default.blue;
        case 'failed':
            return chalk_1.default.red;
        default:
            return chalk_1.default.yellow;
    }
}
function setupDeployCommand(program) {
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
            }
            else {
                await deployProject(project, options.environment);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\nError:'), error);
            process.exit(1);
        }
    });
}
