import mongoose from 'mongoose';
import { User } from '../modules/user/user.model';
import { Consultant } from '../models/consultant.model';

// Connect to database manually
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ExpertRaah';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function removeSeededConsultants() {
  try {
    await connectDB();
    console.log('🗑️  Starting removal of seeded consultants...');

    // Find all consultants to get their user IDs
    const consultants = await Consultant.find({});
    console.log(`📊 Found ${consultants.length} consultants in database`);

    if (consultants.length === 0) {
      console.log('ℹ️  No consultants found to remove');
      await mongoose.disconnect();
      return;
    }

    // Get all user IDs from consultants
    const userIds = consultants.map(c => c.userId);
    console.log(`👥 Found ${userIds.length} associated user IDs`);

    // Remove all consultants
    const consultantResult = await Consultant.deleteMany({});
    console.log(`✅ Removed ${consultantResult.deletedCount} consultant profiles`);

    // Remove all associated users with accountType 'consultant'
    const userResult = await User.deleteMany({
      _id: { $in: userIds },
      accountType: 'consultant'
    });
    console.log(`✅ Removed ${userResult.deletedCount} consultant user accounts`);

    console.log('\n✨ Successfully removed all seeded consultants!');
    console.log(`   - Deleted ${consultantResult.deletedCount} consultant profiles`);
    console.log(`   - Deleted ${userResult.deletedCount} user accounts`);

    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error removing consultants:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
removeSeededConsultants();
