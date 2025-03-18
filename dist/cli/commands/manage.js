"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displaySystemStatus = displaySystemStatus;
exports.setupManageCommand = setupManageCommand;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
async function checkMongoDBStatus() {
    try {
        // Check if MongoDB is running
        (0, child_process_1.execSync)('pgrep mongod', { stdio: 'ignore' });
        // Get MongoDB version
        const versionOutput = (0, child_process_1.execSync)('mongod --version').toString();
        const version = versionOutput.match(/db version v([\d.]+)/)?.[1] || 'unknown';
        // Connect and get database stats
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        const adminDb = mongoose_1.default.connection.db.admin();
        const { databases } = await adminDb.listDatabases();
        const collections = {};
        for (const db of databases) {
            if (db.name.startsWith('prodash_')) {
                const dbConnection = mongoose_1.default.connection.useDb(db.name);
                const dbCollections = await dbConnection.listCollections().toArray();
                collections[db.name] = dbCollections.length;
            }
        }
        await mongoose_1.default.connection.close();
        return {
            status: 'running',
            version,
            databases: databases
                .map(db => db.name)
                .filter(name => name.startsWith('prodash_')),
            collections,
        };
    }
    catch (error) {
        return {
            status: 'error',
            databases: [],
            collections: {},
        };
    }
}
async function getStorageStats() {
    const stats = {
        projects: 0,
        templates: 0,
        backups: 0,
        deployments: 0,
        total: 0,
    };
    const directories = {
        projects: path_1.default.join(process.cwd(), 'data/projects'),
        templates: path_1.default.join(process.cwd(), 'data/templates'),
        backups: path_1.default.join(process.cwd(), 'data/backups'),
        deployments: path_1.default.join(process.cwd(), 'data/deployments'),
    };
    for (const [key, dir] of Object.entries(directories)) {
        if (await fs_extra_1.default.pathExists(dir)) {
            const items = await fs_extra_1.default.readdir(dir);
            stats[key] = items.length;
            // Calculate total size
            for (const item of items) {
                const itemPath = path_1.default.join(dir, item);
                const itemStats = await fs_extra_1.default.stat(itemPath);
                stats.total += itemStats.size;
            }
        }
    }
    return stats;
}
async function getSystemStatus() {
    const status = {
        version: '1.0.0',
        uptime: process.uptime(),
        system: {
            platform: os_1.default.platform(),
            arch: os_1.default.arch(),
            memory: {
                total: os_1.default.totalmem(),
                free: os_1.default.freemem(),
                used: os_1.default.totalmem() - os_1.default.freemem(),
            },
            cpu: {
                cores: os_1.default.cpus().length,
                load: os_1.default.loadavg(),
            },
        },
        mongodb: await checkMongoDBStatus(),
        storage: await getStorageStats(),
    };
    return status;
}
function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}
async function displaySystemStatus() {
    const spinner = (0, ora_1.default)('Checking system status').start();
    try {
        const status = await getSystemStatus();
        spinner.stop();
        console.log(chalk_1.default.cyan('\nProDash Tools System Status\n'));
        // Version and Uptime
        console.log(chalk_1.default.white('Version:'), chalk_1.default.yellow(status.version));
        console.log(chalk_1.default.white('Uptime:'), chalk_1.default.yellow(`${Math.floor(status.uptime / 60)} minutes`));
        // System Information
        console.log(chalk_1.default.cyan('\nSystem Information:'));
        console.log(chalk_1.default.white('  Platform:'), chalk_1.default.yellow(status.system.platform));
        console.log(chalk_1.default.white('  Architecture:'), chalk_1.default.yellow(status.system.arch));
        console.log(chalk_1.default.white('  CPU Cores:'), chalk_1.default.yellow(status.system.cpu.cores.toString()));
        console.log(chalk_1.default.white('  Load Average:'), chalk_1.default.yellow(status.system.cpu.load.map(l => l.toFixed(2)).join(', ')));
        console.log(chalk_1.default.white('  Memory:'));
        console.log(chalk_1.default.white('    Total:'), chalk_1.default.yellow(formatBytes(status.system.memory.total)));
        console.log(chalk_1.default.white('    Used:'), chalk_1.default.yellow(formatBytes(status.system.memory.used)));
        console.log(chalk_1.default.white('    Free:'), chalk_1.default.yellow(formatBytes(status.system.memory.free)));
        // MongoDB Status
        console.log(chalk_1.default.cyan('\nMongoDB Status:'));
        console.log(chalk_1.default.white('  Status:'), status.mongodb.status === 'running'
            ? chalk_1.default.green('Running')
            : chalk_1.default.red(status.mongodb.status));
        if (status.mongodb.version) {
            console.log(chalk_1.default.white('  Version:'), chalk_1.default.yellow(status.mongodb.version));
        }
        if (status.mongodb.databases.length > 0) {
            console.log(chalk_1.default.white('  Databases:'));
            status.mongodb.databases.forEach(db => {
                console.log(chalk_1.default.white(`    ${db}:`), chalk_1.default.yellow(`${status.mongodb.collections[db] || 0} collections`));
            });
        }
        // Storage Status
        console.log(chalk_1.default.cyan('\nStorage Status:'));
        console.log(chalk_1.default.white('  Projects:'), chalk_1.default.yellow(status.storage.projects.toString()));
        console.log(chalk_1.default.white('  Templates:'), chalk_1.default.yellow(status.storage.templates.toString()));
        console.log(chalk_1.default.white('  Backups:'), chalk_1.default.yellow(status.storage.backups.toString()));
        console.log(chalk_1.default.white('  Deployments:'), chalk_1.default.yellow(status.storage.deployments.toString()));
        console.log(chalk_1.default.white('  Total Size:'), chalk_1.default.yellow(formatBytes(status.storage.total)));
    }
    catch (error) {
        spinner.fail('Failed to get system status');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
async function cleanupSystem() {
    const spinner = (0, ora_1.default)('Cleaning up system').start();
    try {
        // Clean up temporary files
        const tempDir = path_1.default.join(process.cwd(), 'data/temp');
        if (await fs_extra_1.default.pathExists(tempDir)) {
            await fs_extra_1.default.remove(tempDir);
        }
        // Clean up old logs
        const logsDir = path_1.default.join(process.cwd(), 'data/logs');
        if (await fs_extra_1.default.pathExists(logsDir)) {
            const logs = await fs_extra_1.default.readdir(logsDir);
            const now = Date.now();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            for (const log of logs) {
                const logPath = path_1.default.join(logsDir, log);
                const stats = await fs_extra_1.default.stat(logPath);
                if (now - stats.mtimeMs > maxAge) {
                    await fs_extra_1.default.remove(logPath);
                }
            }
        }
        // Connect to MongoDB and clean up old data
        await mongoose_1.default.connect('mongodb://localhost:27017/prodash_master');
        // Clean up old deployments (keep last 10)
        const deployments = mongoose_1.default.connection.collection('deployments');
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
        await mongoose_1.default.connection.close();
        spinner.succeed('System cleanup completed');
    }
    catch (error) {
        spinner.fail('System cleanup failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
function setupManageCommand(program) {
    program
        .command('manage')
        .description('Manage ProDash Tools system')
        .option('-s, --status', 'Display system status')
        .option('-c, --cleanup', 'Clean up temporary files and old data')
        .action(async (options) => {
        try {
            if (options.status) {
                await displaySystemStatus();
            }
            else if (options.cleanup) {
                await cleanupSystem();
            }
            else {
                await displaySystemStatus();
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('\nError:'), error);
            process.exit(1);
        }
    });
}
