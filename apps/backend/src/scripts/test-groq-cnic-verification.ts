/**
 * Test Script for Groq CNIC Verification Service
 * 
 * This script demonstrates how to use the Groq-based CNIC verification service.
 * It tests various scenarios including valid CNICs, invalid images, and edge cases.
 */

import fs from 'fs';
import path from 'path';
import { verifyCNICWithGroq, verifyCNICBatch } from '../services/groq-cnic-verification.service';
import logger from '../config/logger';

/**
 * Convert image file to base64
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Test CNIC verification with a sample image
 */
async function testCNICVerification() {
  console.log('='.repeat(80));
  console.log('Testing Groq CNIC Verification Service');
  console.log('='.repeat(80));
  console.log();

  // Test Case 1: Verify a single CNIC image
  console.log('Test Case 1: Single CNIC Verification');
  console.log('-'.repeat(80));
  
  try {
    // Example: Replace with actual CNIC image path
    // const cnicImagePath = path.join(__dirname, '../../test-images/cnic-front.jpg');
    // const base64Image = imageToBase64(cnicImagePath);
    
    // For testing without an image file, use a placeholder
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    console.log('Verifying CNIC image...');
    const result = await verifyCNICWithGroq(testBase64);
    
    console.log('\nVerification Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log();
    
    if (result.verification_result === 'approved') {
      console.log('✅ CNIC Approved');
    } else {
      console.log('❌ CNIC Rejected');
    }
    console.log(`Confidence: ${result.confidence_score}%`);
    console.log(`Reason: ${result.reason}`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log();

  // Test Case 2: Batch verification (front and back)
  console.log('Test Case 2: Batch CNIC Verification (Front + Back)');
  console.log('-'.repeat(80));
  
  try {
    const testBase64Front = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const testBase64Back = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    console.log('Verifying CNIC front and back images...');
    const result = await verifyCNICBatch({
      front: testBase64Front,
      back: testBase64Back,
    });
    
    console.log('\nBatch Verification Result:');
    console.log(JSON.stringify(result, null, 2));
    console.log();
    
    console.log('Front Card Status:', result.front.verification_result);
    if (result.back) {
      console.log('Back Card Status:', result.back.verification_result);
    }
    console.log('Overall Result:', result.overallResult);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log();
  console.log('='.repeat(80));
}

/**
 * Example: Test with different image scenarios
 */
async function testDifferentScenarios() {
  console.log('\nTesting Different Scenarios:');
  console.log('='.repeat(80));
  
  const scenarios = [
    {
      name: 'Valid CNIC',
      description: 'Clear Pakistani CNIC with all elements visible',
    },
    {
      name: 'Blurry Image',
      description: 'CNIC image with poor quality/blurry',
    },
    {
      name: 'Cropped CNIC',
      description: 'CNIC with parts cut off',
    },
    {
      name: 'Selfie Photo',
      description: 'Person\'s selfie instead of CNIC',
    },
    {
      name: 'Different Document',
      description: 'Passport or other ID document',
    },
    {
      name: 'Multiple Documents',
      description: 'Multiple cards in one image',
    },
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log('   Expected: ' + (index === 0 ? 'APPROVED ✅' : 'REJECTED ❌'));
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\nTo test these scenarios:');
  console.log('1. Place test images in: apps/backend/test-images/');
  console.log('2. Update the image paths in this script');
  console.log('3. Run: npm run test:groq-cnic');
  console.log('='.repeat(80));
}

/**
 * Main test execution
 */
async function main() {
  try {
    await testCNICVerification();
    await testDifferentScenarios();
    
    console.log('\n✅ All tests completed!');
    console.log('\nNote: The placeholder images used in this test will be rejected.');
    console.log('To test with real CNIC images, update the image paths in the script.\n');
    
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error);
    logger.error('Test execution error:', error);
    process.exit(1);
  }
}

// Run tests
main();
