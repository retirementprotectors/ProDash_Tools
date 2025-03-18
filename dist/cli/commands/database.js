"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const REQUIRED_DIRECTORIES = [
    'data/mongodb',
    'data/projects',
    'data/templates',
    'data/cache',
    'data/backups',
    'data/logs',
];
const DATABASE_CONFIGS = [
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
async function checkMongoDBConnection(uri) {
    try {
        await mongoose_1.default.connect(uri);
        await mongoose_1.default.connection.close();
        return true;
    }
    catch {
        return false;
    }
}
async function createCollection(db, name, indexes, initialData) {
    const collection = db.collection(name);
    // Create collection if it doesn't exist
    if (!(await collection.exists())) {
        await db.createCollection(name);
    }
    // Create indexes
    if (indexes) {
        const collectionIndexes = indexes.filter(idx => idx.collection === name);
        for (const index of collectionIndexes) {
            await collection.createIndex({ [index.field]: 1 }, { unique: index.unique });
        }
    }
    // Insert initial data
    if (initialData) {
        await collection.insertOne(initialData);
    }
}
async function initDatabase() {
    const spinner = (0, ora_1.default)('Initializing ProDash Tools environment').start();
    try {
        // Create required directories
        spinner.text = 'Creating required directories...';
        for (const dir of REQUIRED_DIRECTORIES) {
            await fs_extra_1.default.ensureDir(path_1.default.join(process.cwd(), dir));
        }
        spinner.succeed('Created required directories');
        // Check MongoDB service
        spinner.text = 'Checking MongoDB service...';
        try {
            (0, child_process_1.execSync)('mongod --version', { stdio: 'ignore' });
        }
        catch (error) {
            spinner.fail('MongoDB is not installed');
            console.log(chalk_1.default.yellow('\nPlease install MongoDB first:'));
            console.log(chalk_1.default.cyan('\nbrew tap mongodb/brew'));
            console.log(chalk_1.default.cyan('brew install mongodb-community@7.0'));
            console.log(chalk_1.default.cyan('brew services start mongodb/brew/mongodb-community@7.0\n'));
            process.exit(1);
        }
        // Test MongoDB connection
        spinner.text = 'Testing MongoDB connection...';
        const testUri = 'mongodb://localhost:27017/test';
        if (!(await checkMongoDBConnection(testUri))) {
            spinner.fail('Cannot connect to MongoDB');
            console.log(chalk_1.default.yellow('\nPlease ensure MongoDB is running:'));
            console.log(chalk_1.default.cyan('brew services start mongodb/brew/mongodb-community@7.0'));
            process.exit(1);
        }
        spinner.succeed('MongoDB service is available');
        // Initialize databases
        spinner.text = 'Initializing databases...';
        for (const config of DATABASE_CONFIGS) {
            const uri = `mongodb://localhost:27017/${config.name}`;
            await mongoose_1.default.connect(uri);
            // Create collections and indexes
            for (const collection of config.collections) {
                const initialData = config.initialData?.find(data => data.collection === collection)?.data;
                await createCollection(mongoose_1.default.connection, collection, config.indexes, initialData);
            }
            await mongoose_1.default.connection.close();
        }
        spinner.succeed('Initialized databases');
        console.log(chalk_1.default.green('\n✨ ProDash Tools environment initialized successfully!\n'));
        console.log(chalk_1.default.cyan('Next steps:'));
        console.log(chalk_1.default.white('1. Create your first project:'));
        console.log(chalk_1.default.yellow('   prodash create my-project\n'));
        console.log(chalk_1.default.white('2. Generate a custom template:'));
        console.log(chalk_1.default.yellow('   prodash generate my-template\n'));
        console.log(chalk_1.default.white('3. Check system status:'));
        console.log(chalk_1.default.yellow('   prodash manage --status\n'));
    }
    catch (error) {
        spinner.fail('Initialization failed');
        console.error(chalk_1.default.red('\nError:'), error);
        process.exit(1);
    }
}
