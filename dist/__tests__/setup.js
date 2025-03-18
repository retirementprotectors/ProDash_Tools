"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// MongoDB test configuration
const TEST_MONGODB_URI = 'mongodb://localhost:27017/prodash_test';
// Test directories
const TEST_DIRS = [
    'data/test/projects',
    'data/test/templates',
    'data/test/backups',
    'data/test/deployments',
    'data/test/logs',
    'data/test/temp',
];
// Create test directories
beforeAll(async () => {
    // Create test directories
    for (const dir of TEST_DIRS) {
        await fs_extra_1.default.ensureDir(path_1.default.join(process.cwd(), dir));
    }
    // Connect to test database
    await mongoose_1.default.connect(TEST_MONGODB_URI);
});
// Clean up after tests
afterAll(async () => {
    // Remove test directories
    for (const dir of TEST_DIRS) {
        await fs_extra_1.default.remove(path_1.default.join(process.cwd(), dir));
    }
    // Drop test database and close connection
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
});
// Clean up between tests
afterEach(async () => {
    // Clear all collections
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
    // Clear test directories except the root
    for (const dir of TEST_DIRS) {
        const dirPath = path_1.default.join(process.cwd(), dir);
        const files = await fs_extra_1.default.readdir(dirPath);
        for (const file of files) {
            await fs_extra_1.default.remove(path_1.default.join(dirPath, file));
        }
    }
});
