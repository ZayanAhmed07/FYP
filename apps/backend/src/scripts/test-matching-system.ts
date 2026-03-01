/**
 * Test Script: Verify Consultant Matching System
 * 
 * Tests the matching algorithm with various job scenarios
 * Run with: npx ts-node src/scripts/test-matching-system.ts
 */

import mongoose from 'mongoose';
import consultantMatchingService from '../services/consultant-matching.service';
import { Consultant } from '../models/consultant.model';
import { User } from '../modules/user/user.model';  // Import User model for populate

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ExpertRaah';

async function testMatching() {
  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Register User model to avoid populate errors
    try {
      // Try to get existing model, or define a minimal version
      if (!mongoose.models.User) {
        const UserSchema = new mongoose.Schema({
          name: String,
          email: String,
          profileImage: String,
        });
        mongoose.model('User', UserSchema);
      }
    } catch (err) {
      // Model already exists, ignore
    }

    // Check consultant data first
    const totalConsultants = await Consultant.countDocuments();
    const availableConsultants = await Consultant.countDocuments({ 
      availability: { $in: ['available', 'limited'] } 
    });
    const consultantsWithLocation = await Consultant.countDocuments({ 
      'location.city': { $exists: true, $ne: null } 
    });
    const remoteConsultants = await Consultant.countDocuments({ remoteWork: true });

    console.log('📊 Database Stats:');
    console.log(`   Total Consultants: ${totalConsultants}`);
    console.log(`   Available: ${availableConsultants}`);
    console.log(`   With Location: ${consultantsWithLocation}`);
    console.log(`   Remote Workers: ${remoteConsultants}\n`);

    // Test Case 1: Education job in Islamabad
    console.log('🧪 Test 1: Education consultant in Islamabad');
    console.log('=' .repeat(60));
    const test1 = await consultantMatchingService.findBestMatches({
      title: 'Need Career Counseling for University Admissions',
      description: 'Looking for an experienced education consultant to help with university admission process and career guidance for my son.',
      category: 'Education',
      skills: ['Career Guidance', 'University Admissions', 'Student Counseling'],
      budget: { min: 5000, max: 15000 },
      location: 'Islamabad, Pakistan',
    }, {
      limit: 5,
      minScore: 0.3,
    });
    
    console.log(`✅ Found ${test1.length} matches`);
    test1.forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.consultant.userId.name} (${match.matchScore}% match)`);
      console.log(`   Location: ${match.consultant.location?.city || 'Not set'}`);
      console.log(`   Remote: ${match.consultant.remoteWork ? 'Yes' : 'No'}`);
      console.log(`   Skills: ${match.consultant.skills.slice(0, 3).join(', ')}`);
      console.log(`   Reasons: ${match.matchReasons.join(', ')}`);
    });

    // Test Case 2: Business consultant with specific skills
    console.log('\n\n🧪 Test 2: Business consultant with specific skills');
    console.log('='.repeat(60));
    const test2 = await consultantMatchingService.findBestMatches({
      title: 'Digital Marketing Strategy for Startup',
      description: 'Need a business consultant with expertise in digital marketing and market research to help launch our new product.',
      category: 'Business',
      skills: ['Digital Marketing', 'Market Research', 'Business Strategy'],
      budget: { min: 10000, max: 30000 },
      location: 'Lahore, Pakistan',
    }, {
      limit: 5,
      minScore: 0.3,
    });
    
    console.log(`✅ Found ${test2.length} matches`);
    test2.forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.consultant.userId.name} (${match.matchScore}% match)`);
      console.log(`   Location: ${match.consultant.location?.city || 'Not set'}`);
      console.log(`   Remote: ${match.consultant.remoteWork ? 'Yes' : 'No'}`);
      console.log(`   Skills: ${match.consultant.skills.slice(0, 3).join(', ')}`);
      console.log(`   Reasons: ${match.matchReasons.join(', ')}`);
    });

    // Test Case 3: Legal consultant (any location, prefer remote)
    console.log('\n\n🧪 Test 3: Legal consultant (Remote preferred)');
    console.log('='.repeat(60));
    const test3 = await consultantMatchingService.findBestMatches({
      title: 'Contract Review and Legal Advice',
      description: 'Need legal consultant to review business contracts and provide compliance guidance.',
      category: 'Legal',
      skills: ['Contract Law', 'Corporate Law', 'Compliance & Regulatory'],
      budget: { min: 15000, max: 50000 },
      location: 'Karachi, Pakistan',
    }, {
      limit: 5,
      minScore: 0.3,
    });
    
    console.log(`✅ Found ${test3.length} matches`);
    test3.forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.consultant.userId.name} (${match.matchScore}% match)`);
      console.log(`   Location: ${match.consultant.location?.city || 'Not set'}`);
      console.log(`   Remote: ${match.consultant.remoteWork ? 'Yes' : 'No'}`);
      console.log(`   Skills: ${match.consultant.skills.slice(0, 3).join(', ')}`);
      console.log(`   Reasons: ${match.matchReasons.join(', ')}`);
    });

    // Test Case 4: Skill-based match (not exact category)
    console.log('\n\n🧪 Test 4: Skill-based match (Financial Planning - could be Business)');
    console.log('='.repeat(60));
    const test4 = await consultantMatchingService.findBestMatches({
      title: 'Personal Financial Planning',
      description: 'Looking for consultant to help with retirement planning and investment strategy.',
      category: 'Business',  // Category is Business
      skills: ['Financial Planning', 'Risk Management'],  // But skills should still match
      budget: { min: 8000, max: 25000 },
      location: 'Rawalpindi, Pakistan',
    }, {
      limit: 5,
      minScore: 0.3,
    });
    
    console.log(`✅ Found ${test4.length} matches`);
    test4.forEach((match, i) => {
      console.log(`\n${i + 1}. ${match.consultant.userId.name} (${match.matchScore}% match)`);
      console.log(`   Location: ${match.consultant.location?.city || 'Not set'}`);
      console.log(`   Remote: ${match.consultant.remoteWork ? 'Yes' : 'No'}`);
      console.log(`   Skills: ${match.consultant.skills.slice(0, 3).join(', ')}`);
      console.log(`   Reasons: ${match.matchReasons.join(', ')}`);
    });

    console.log('\n\n✨ All tests completed!');
    console.log('\n💡 Tips:');
    console.log('   - If no matches found, run: npm run seed:consultants');
    console.log('   - If location is "Not set", run: npx ts-node src/scripts/fix-consultant-locations.ts');
    console.log('   - Lower match scores? That\'s normal - semantic matching is strict\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
testMatching();
