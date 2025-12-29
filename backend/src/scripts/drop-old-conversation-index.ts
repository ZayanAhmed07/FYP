import mongoose from 'mongoose';
import { env } from '../config/env';

/**
 * Drop old participants index from conversations collection
 * The old index is causing duplicate key errors because it's based on
 * the array order of participants, while we now use participantsKey
 */
async function dropOldIndex() {
  try {
    await mongoose.connect(env.mongodbUri!);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const collection = db.collection('conversations');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop the old participants_1 index if it exists
    try {
      await collection.dropIndex('participants_1');
      console.log('✅ Successfully dropped old participants_1 index');
    } catch (error: any) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('Index participants_1 does not exist (already removed)');
      } else {
        throw error;
      }
    }

    // Verify remaining indexes
    const remainingIndexes = await collection.indexes();
    console.log('Remaining indexes:', JSON.stringify(remainingIndexes, null, 2));

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

dropOldIndex();
