/**
 * Migration Script: Generate and cache embeddings for existing consultants and jobs
 * 
 * This script will:
 * 1. Find all consultants without skillsEmbedding
 * 2. Generate embeddings for their skills
 * 3. Save embeddings to database
 * 4. Repeat for jobs
 * 
 * Run with: npm run generate:embeddings
 */

import mongoose from 'mongoose';
import { Consultant } from '../models/consultant.model';
import { Job } from '../models/job.model';
import { geminiEmbeddingService } from '../services/gemini-embedding.service';
import env from '../config/env';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(env.mongodbUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Generate embeddings for consultants
async function generateConsultantEmbeddings() {
  console.log('\n🔄 Processing consultants...');
  
  // Find consultants without embeddings or with stale embeddings (>30 days)
  const consultants = await Consultant.find({
    $or: [
      { skillsEmbedding: { $exists: false } },
      { skillsEmbedding: { $size: 0 } },
      { embeddingGeneratedAt: { $exists: false } },
      { 
        embeddingGeneratedAt: { 
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      }
    ]
  });

  console.log(`📊 Found ${consultants.length} consultants needing embeddings`);

  if (consultants.length === 0) {
    console.log('✅ All consultants have fresh embeddings!');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const consultant of consultants) {
    try {
      // Create text representation
      const text = [
        `Title: ${consultant.title}`,
        `Specialization: ${consultant.specialization.join(', ')}`,
        `Bio: ${consultant.bio}`,
        `Skills: ${consultant.skills.join(', ')}`,
        `Experience: ${consultant.experience}`,
      ].join('. ');

      // Generate embedding (uses keyword-based, no API calls)
      const embedding = await geminiEmbeddingService.generateEmbedding(text);

      // Update consultant
      consultant.skillsEmbedding = embedding;
      consultant.embeddingGeneratedAt = new Date();
      await consultant.save();

      updated++;
      console.log(`✅ Updated consultant ${updated}/${consultants.length}: ${consultant.title}`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to update consultant: ${consultant.title}`, error);
    }
  }

  console.log(`\n✅ Consultant embeddings generated: ${updated} success, ${failed} failed`);
}

// Generate embeddings for jobs
async function generateJobEmbeddings() {
  console.log('\n🔄 Processing jobs...');
  
  // Find jobs without embeddings or with stale embeddings
  const jobs = await Job.find({
    $or: [
      { skillsEmbedding: { $exists: false } },
      { skillsEmbedding: { $size: 0 } },
      { embeddingGeneratedAt: { $exists: false } },
      { 
        embeddingGeneratedAt: { 
          $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      }
    ]
  });

  console.log(`📊 Found ${jobs.length} jobs needing embeddings`);

  if (jobs.length === 0) {
    console.log('✅ All jobs have fresh embeddings!');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      // Create text representation
      const text = [
        `Job Title: ${job.title}`,
        `Category: ${job.category}`,
        `Description: ${job.description}`,
        `Required Skills: ${job.skills.join(', ')}`,
      ].join('. ');

      // Generate embedding (uses keyword-based, no API calls)
      const embedding = await geminiEmbeddingService.generateEmbedding(text);

      // Update job
      job.skillsEmbedding = embedding;
      job.embeddingGeneratedAt = new Date();
      await job.save();

      updated++;
      console.log(`✅ Updated job ${updated}/${jobs.length}: ${job.title}`);
    } catch (error) {
      failed++;
      console.error(`❌ Failed to update job: ${job.title}`, error);
    }
  }

  console.log(`\n✅ Job embeddings generated: ${updated} success, ${failed} failed`);
}

// Main execution
async function main() {
  console.log('🚀 Starting embedding generation script...\n');
  
  await connectDB();
  
  await generateConsultantEmbeddings();
  await generateJobEmbeddings();
  
  console.log('\n✅ Embedding generation complete!');
  console.log('\n📊 Final Cache Statistics:');
  geminiEmbeddingService.logCacheStats();
  
  await mongoose.disconnect();
  console.log('\n✅ Disconnected from MongoDB');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
