import mongoose from 'mongoose';
import fs from 'fs-extra';
import path from 'path';

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
    await fs.ensureDir(path.join(process.cwd(), dir));
  }

  // Connect to test database
  await mongoose.connect(TEST_MONGODB_URI);
});

// Clean up after tests
afterAll(async () => {
  // Remove test directories
  for (const dir of TEST_DIRS) {
    await fs.remove(path.join(process.cwd(), dir));
  }

  // Drop test database and close connection
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clean up between tests
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  // Clear test directories except the root
  for (const dir of TEST_DIRS) {
    const dirPath = path.join(process.cwd(), dir);
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      await fs.remove(path.join(dirPath, file));
    }
  }
}); 