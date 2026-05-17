/**
 * Seed Test Job for AI Matching
 * Creates a sample job to test consultant matching functionality
 */

import mongoose from 'mongoose';
import { Job } from '../models/job.model';
import { User } from '../modules/user/user.model';

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

async function seedTestJob() {
  try {
    await connectDB();
    console.log('🌱 Creating test job for AI matching...');

    // Find or create a test buyer
    let buyer = await User.findOne({ email: 'testbuyer@expertrah.com' });
    
    if (!buyer) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('TestBuyer@123', 10);
      
      buyer = await User.create({
        name: 'Test Buyer',
        email: 'testbuyer@expertrah.com',
        password: hashedPassword,
        accountType: 'buyer',
        isEmailVerified: true,
      });
      console.log('✅ Created test buyer account');
    } else {
      console.log('✅ Using existing test buyer account');
    }

    // Check if test job already exists
    const existingJob = await Job.findOne({ 
      buyerId: buyer._id,
      title: 'Corporate Tax Planning & Compliance Assistance'
    });

    if (existingJob) {
      console.log('⏭️  Test job already exists');
      console.log(`📋 Job ID: ${existingJob._id}`);
      console.log(`📋 Job Title: ${existingJob.title}`);
      console.log(`📋 Category: ${existingJob.category}`);
      console.log(`📋 Skills: ${existingJob.skills.join(', ')}`);
      console.log('');
      console.log('🔗 Test the matching at:');
      console.log(`   Frontend: http://localhost:5173/jobs/${existingJob._id}/matching`);
      console.log(`   API: GET /api/consultants/suggest/${existingJob._id}`);
      await mongoose.disconnect();
      return;
    }

    // Create a test job that should match our seeded consultants
    const testJob = await Job.create({
      buyerId: buyer._id,
      category: 'LEGAL',
      title: 'Corporate Tax Planning & Compliance Assistance',
      description: 'Looking for an experienced tax law consultant to help with corporate tax planning, FBR compliance, and financial regulations. Need expertise in tax optimization strategies and audit representation for a growing business.',
      budget: {
        min: 4000,
        max: 6000,
      },
      timeline: '2-3 months',
      location: 'Karachi, Pakistan',
      skills: ['Tax Law', 'FBR Compliance', 'Tax Planning', 'Corporate Taxation', 'Financial Law'],
      status: 'open',
      proposalsCount: 0,
    });

    console.log('✅ Created test job successfully!');
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 TEST JOB DETAILS');
    console.log('═══════════════════════════════════════════');
    console.log(`📋 Job ID: ${testJob._id}`);
    console.log(`📋 Title: ${testJob.title}`);
    console.log(`📋 Category: ${testJob.category}`);
    console.log(`📋 Location: ${testJob.location}`);
    console.log(`📋 Budget: PKR ${testJob.budget.min} - ${testJob.budget.max}/hr`);
    console.log(`📋 Skills: ${testJob.skills.join(', ')}`);
    console.log('');
    console.log('🔗 Test the matching at:');
    console.log(`   Frontend: http://localhost:5173/jobs/${testJob._id}/matching`);
    console.log(`   API: GET /api/consultants/suggest/${testJob._id}`);
    console.log('');
    console.log('💡 Expected matches:');
    console.log('   - Bilal Ahmed Syed (Tax Law & Financial Compliance Consultant in Karachi)');
    console.log('   - Other LEGAL consultants with matching skills');
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('✅ Database disconnected');
    process.exit(0);

  } catch (error) {
    console.error('💥 Error seeding test job:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedTestJob();
