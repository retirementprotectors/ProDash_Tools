import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '52001';
process.env.CONTEXTS_PATH = '.context-keeper/test/contexts';
process.env.BACKUPS_PATH = '.context-keeper/test/backups';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}); 