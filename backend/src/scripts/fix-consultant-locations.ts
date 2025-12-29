/**
 * Migration Script: Fix Consultant Location Structure
 * 
 * This script updates existing consultant documents to ensure:
 * 1. Location is properly structured as { country, city }
 * 2. remoteWork flag is set (default 60% true)
 * 
 * Run with: npx ts-node src/scripts/fix-consultant-locations.ts
 */

import mongoose from 'mongoose';
import { Consultant } from '../models/consultant.model';
import { faker } from '@faker-js/faker';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ExpertRaah';

async function fixConsultantLocations() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find all consultants
    const consultants = await Consultant.find({}).lean();
    console.log(`\n📊 Found ${consultants.length} consultants to check`);

    let updatedCount = 0;
    let alreadyCorrect = 0;

    for (const consultant of consultants) {
      const updates: any = {};
      let needsUpdate = false;

      // Check if location needs fixing
      if (!consultant.location || typeof consultant.location === 'string') {
        // Location is missing or string - set default
        updates.location = {
          country: 'Pakistan',
          city: 'Islamabad', // Default city
        };
        needsUpdate = true;
      } else if (!consultant.location.city || !consultant.location.country) {
        // Location exists but missing city or country
        updates.location = {
          country: consultant.location.country || 'Pakistan',
          city: consultant.location.city || 'Islamabad',
        };
        needsUpdate = true;
      }

      // Check if remoteWork needs setting
      if (consultant.remoteWork === undefined || consultant.remoteWork === null) {
        updates.remoteWork = faker.datatype.boolean(0.6); // 60% chance
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Consultant.updateOne({ _id: consultant._id }, { $set: updates });
        updatedCount++;
        console.log(`✅ Updated consultant ${consultant._id}`);
      } else {
        alreadyCorrect++;
      }
    }

    console.log('\n✨ Migration Complete!');
    console.log(`Updated: ${updatedCount} consultants`);
    console.log(`Already correct: ${alreadyCorrect} consultants`);
    console.log(`Total: ${consultants.length} consultants\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixConsultantLocations();
