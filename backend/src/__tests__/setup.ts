// Set test environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '3001';

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, afterEach } from '@jest/globals';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Override MONGODB_URI with in-memory server
  process.env.MONGODB_URI = mongoUri;
  
  await mongoose.connect(mongoUri);
}, 60000); // Increase timeout for MongoDB setup

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 60000);

// Clear all collections after each test
// NOTE: Tests that need data to persist across multiple test cases
// should use beforeAll for setup and manage their own cleanup
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    if (collection) {
      await collection.deleteMany({});
    }
  }
});

