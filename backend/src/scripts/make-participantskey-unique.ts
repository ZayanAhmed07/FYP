import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Make participantsKey index unique
 */
async function makeIndexUnique() {
  try {
    await mongoose.connect(env.mongodbUri!);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const collection = db.collection('conversations');

    // Drop existing participantsKey index
    try {
      await collection.dropIndex('participantsKey_1');
      console.log('Dropped existing participantsKey_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('Index participantsKey_1 does not exist');
      } else {
        throw error;
      }
    }

    // Create unique index
    await collection.createIndex({ participantsKey: 1 }, { unique: true });
    console.log('✅ Created unique index on participantsKey');

    // Verify indexes
    const indexes = await collection.indexes();
    console.log('Final indexes:', JSON.stringify(indexes, null, 2));

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

makeIndexUnique();
