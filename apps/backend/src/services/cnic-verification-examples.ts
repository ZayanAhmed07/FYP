/**
 * Complete Example: CNIC Verification Integration
 * 
 * This file demonstrates real-world usage of the Groq CNIC verification service
 * in the Expertraah platform consultant onboarding flow.
 */

import { Request, Response } from 'express';
import { verifyCNICWithGroq, CNICVerificationResult } from '../services/groq-cnic-verification.service';
import { ApiError } from '../utils/ApiError';
import logger from '../config/logger';

// ============================================================================
// Example 1: Simple Standalone Verification
// ============================================================================

async function example1_SimpleVerification(base64Image: string) {
  console.log('\n📸 Example 1: Simple CNIC Verification\n');
  
  try {
    const result = await verifyCNICWithGroq(base64Image);
    
    console.log('Verification Result:');
    console.log(`✓ Valid CNIC: ${result.is_valid_cnic}`);
    console.log(`✓ Confidence: ${result.confidence_score}%`);
    console.log(`✓ Quality: ${result.image_quality}`);
    console.log(`✓ Visibility: ${result.card_visibility}`);
    console.log(`✓ Format Detected: ${result.cnic_format_detected}`);
    console.log(`✓ Reason: ${result.reason}`);
    console.log(`✓ Result: ${result.verification_result.toUpperCase()}`);
    
    return result;
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    throw error;
  }
}

// ============================================================================
// Example 2: Consultant Profile Submission with CNIC Verification
// ============================================================================

interface ConsultantProfileData {
  name: string;
  email: string;
  specialization: string;
  idCardFront: string; // base64
  idCardBack?: string; // base64
  // ... other fields
}

async function example2_ProfileSubmission(profileData: ConsultantProfileData) {
  console.log('\n👤 Example 2: Consultant Profile Submission with CNIC Check\n');
  
  try {
    // Step 1: Verify front CNIC
    console.log('Step 1: Verifying front CNIC...');
    const frontResult = await verifyCNICWithGroq(profileData.idCardFront);
    
    if (frontResult.verification_result === 'rejected') {
      throw new ApiError(
        400,
        `CNIC front verification failed: ${frontResult.reason}`
      );
    }
    
    console.log('✅ Front CNIC verified successfully');
    
    // Step 2: Verify back CNIC (if provided)
    let backResult: CNICVerificationResult | undefined;
    if (profileData.idCardBack) {
      console.log('Step 2: Verifying back CNIC...');
      backResult = await verifyCNICWithGroq(profileData.idCardBack);
      
      if (backResult.verification_result === 'rejected') {
        throw new ApiError(
          400,
          `CNIC back verification failed: ${backResult.reason}`
        );
      }
      
      console.log('✅ Back CNIC verified successfully');
    }
    
    // Step 3: Create profile with verification metadata
    const profile = {
      ...profileData,
      cnicVerificationStatus: 'verified',
      cnicVerificationDate: new Date(),
      cnicConfidenceScore: frontResult.confidence_score,
      cnicImageQuality: frontResult.image_quality,
    };
    
    console.log('✅ Profile created with CNIC verification');
    console.log(`Confidence Score: ${frontResult.confidence_score}%`);
    
    return {
      success: true,
      profile,
      verification: {
        front: frontResult,
        back: backResult,
      }
    };
    
  } catch (error: any) {
    console.error('❌ Profile submission failed:', error.message);
    throw error;
  }
}

// ============================================================================
// Example 3: Real-time CNIC Verification During Upload
// ============================================================================

async function example3_RealtimeVerification(req: Request, res: Response) {
  console.log('\n⚡ Example 3: Real-time CNIC Verification\n');
  
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    // Verify in real-time
    const result = await verifyCNICWithGroq(image);
    
    // Return immediate feedback
    return res.status(200).json({
      success: true,
      data: {
        verified: result.verification_result === 'approved',
        confidence: result.confidence_score,
        quality: result.image_quality,
        visibility: result.card_visibility,
        message: result.verification_result === 'approved'
          ? '✅ CNIC verified successfully!'
          : `❌ Verification failed: ${result.reason}`,
        suggestions: getSuggestions(result)
      }
    });
    
  } catch (error: any) {
    logger.error('Real-time verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification service error. Please try again.'
    });
  }
}

// Helper: Get suggestions based on verification result
function getSuggestions(result: CNICVerificationResult): string[] {
  const suggestions: string[] = [];
  
  if (result.image_quality === 'blurry') {
    suggestions.push('Hold the camera steady and ensure good focus');
  }
  
  if (result.image_quality === 'dark') {
    suggestions.push('Take the photo in better lighting');
  }
  
  if (result.card_visibility === 'partial' || result.image_quality === 'cropped') {
    suggestions.push('Ensure the entire CNIC card is visible in the frame');
  }
  
  if (!result.cnic_format_detected) {
    suggestions.push('Make sure the CNIC number is clearly visible');
  }
  
  if (result.confidence_score < 70) {
    suggestions.push('Try taking a clearer photo of your CNIC');
    suggestions.push('Place the CNIC on a flat surface');
    suggestions.push('Avoid reflections and shadows');
  }
  
  return suggestions;
}

// ============================================================================
// Example 4: Batch Verification (Front + Back)
// ============================================================================

async function example4_BatchVerification(frontImage: string, backImage: string) {
  console.log('\n🔄 Example 4: Batch CNIC Verification (Front & Back)\n');
  
  try {
    // Verify both simultaneously
    const [frontResult, backResult] = await Promise.all([
      verifyCNICWithGroq(frontImage),
      verifyCNICWithGroq(backImage)
    ]);
    
    console.log('Front Verification:');
    console.log(`  Result: ${frontResult.verification_result}`);
    console.log(`  Confidence: ${frontResult.confidence_score}%`);
    
    console.log('\nBack Verification:');
    console.log(`  Result: ${backResult.verification_result}`);
    console.log(`  Confidence: ${backResult.confidence_score}%`);
    
    // Check overall status
    const bothApproved = 
      frontResult.verification_result === 'approved' &&
      backResult.verification_result === 'approved';
    
    console.log('\nOverall Status:', bothApproved ? '✅ APPROVED' : '❌ REJECTED');
    
    return {
      success: bothApproved,
      front: frontResult,
      back: backResult,
      overallConfidence: Math.min(frontResult.confidence_score, backResult.confidence_score)
    };
    
  } catch (error: any) {
    console.error('❌ Batch verification failed:', error.message);
    throw error;
  }
}

// ============================================================================
// Example 5: Verification with Fallback Strategy
// ============================================================================

async function example5_VerificationWithFallback(base64Image: string) {
  console.log('\n🔄 Example 5: Verification with Fallback Strategy\n');
  
  try {
    console.log('Attempting Groq verification...');
    const result = await verifyCNICWithGroq(base64Image);
    console.log('✅ Groq verification successful');
    return { service: 'groq', result };
    
  } catch (groqError: any) {
    console.warn('⚠️ Groq verification failed, trying fallback...');
    
    try {
      // Import fallback service
      const { validateNICFromBase64 } = require('../services/nic-detection.service');
      const fallbackResult = await validateNICFromBase64(base64Image);
      
      console.log('✅ Fallback (Gemini) verification successful');
      
      // Convert to standard format
      const standardResult: CNICVerificationResult = {
        is_valid_cnic: fallbackResult.isValid,
        confidence_score: Math.round(fallbackResult.confidence * 100),
        image_quality: fallbackResult.isValid ? 'good' : 'unreadable',
        card_visibility: fallbackResult.isValid ? 'full' : 'not_visible',
        cnic_format_detected: fallbackResult.isValid,
        reason: fallbackResult.reason,
        verification_result: fallbackResult.isValid ? 'approved' : 'rejected'
      };
      
      return { service: 'gemini-fallback', result: standardResult };
      
    } catch (fallbackError: any) {
      console.error('❌ Both verification services failed');
      throw new ApiError(500, 'CNIC verification service unavailable');
    }
  }
}

// ============================================================================
// Example 6: Store Verification Audit Trail
// ============================================================================

interface VerificationAudit {
  userId: string;
  consultantId: string;
  verificationType: 'cnic_front' | 'cnic_back';
  result: CNICVerificationResult;
  timestamp: Date;
  ipAddress?: string;
}

async function example6_AuditTrail(
  userId: string,
  consultantId: string,
  base64Image: string,
  verificationType: 'cnic_front' | 'cnic_back',
  ipAddress?: string
) {
  console.log('\n📋 Example 6: CNIC Verification with Audit Trail\n');
  
  try {
    // Perform verification
    const result = await verifyCNICWithGroq(base64Image);
    
    // Create audit record
    const auditRecord: VerificationAudit = {
      userId,
      consultantId,
      verificationType,
      result,
      timestamp: new Date(),
      ...(ipAddress && { ipAddress })
    };
    
    // Log audit (in production, save to database)
    logger.info('CNIC Verification Audit', auditRecord);
    console.log('✅ Audit record created');
    
    // In production, save to MongoDB:
    // await VerificationAudit.create(auditRecord);
    
    return {
      success: true,
      verification: result,
      auditId: `audit-${Date.now()}` // In production, use actual DB ID
    };
    
  } catch (error: any) {
    console.error('❌ Verification with audit failed:', error.message);
    
    // Log failed attempt
    logger.error('CNIC Verification Failed', {
      userId,
      consultantId,
      error: error.message,
      timestamp: new Date()
    });
    
    throw error;
  }
}

// ============================================================================
// Example 7: Frontend Integration Pattern
// ============================================================================

/**
 * This example shows how to structure the API response
 * for easy frontend consumption
 */
async function example7_FrontendFriendlyResponse(req: Request, res: Response) {
  console.log('\n🎨 Example 7: Frontend-Friendly Response\n');
  
  try {
    const { image } = req.body;
    const result = await verifyCNICWithGroq(image);
    
    // Structure response for easy frontend handling
    const response = {
      success: result.verification_result === 'approved',
      message: result.verification_result === 'approved'
        ? 'CNIC verified successfully! You can proceed with your profile.'
        : 'CNIC verification failed. Please check the issues below.',
      data: {
        verified: result.verification_result === 'approved',
        confidence: result.confidence_score,
        details: {
          isValidCNIC: result.is_valid_cnic,
          quality: {
            level: result.image_quality,
            isGood: result.image_quality === 'good',
            needsImprovement: ['blurry', 'dark', 'cropped'].includes(result.image_quality)
          },
          visibility: {
            level: result.card_visibility,
            isFull: result.card_visibility === 'full',
            isPartial: result.card_visibility === 'partial',
            notVisible: result.card_visibility === 'not_visible'
          },
          formatDetected: result.cnic_format_detected
        }
      },
      issues: result.verification_result === 'rejected' ? [result.reason] : [],
      suggestions: getSuggestions(result),
      // For UI state management
      ui: {
        showError: result.verification_result === 'rejected',
        showSuccess: result.verification_result === 'approved',
        canProceed: result.verification_result === 'approved',
        allowRetry: result.verification_result === 'rejected'
      }
    };
    
    return res.status(200).json(response);
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'An error occurred during verification',
      error: error.message,
      ui: {
        showError: true,
        showSuccess: false,
        canProceed: false,
        allowRetry: true
      }
    });
  }
}

// ============================================================================
// Export all examples
// ============================================================================

export {
  example1_SimpleVerification,
  example2_ProfileSubmission,
  example3_RealtimeVerification,
  example4_BatchVerification,
  example5_VerificationWithFallback,
  example6_AuditTrail,
  example7_FrontendFriendlyResponse
};

// ============================================================================
// Usage Instructions
// ============================================================================

/**
 * To test these examples:
 * 
 * 1. Import in your test file:
 *    import { example1_SimpleVerification } from './cnic-verification-examples';
 * 
 * 2. Call with base64 image:
 *    const result = await example1_SimpleVerification(base64Image);
 * 
 * 3. For API endpoint examples (3 & 7), add to your routes:
 *    router.post('/verify-cnic-realtime', example3_RealtimeVerification);
 * 
 * 4. See full documentation:
 *    docs/GROQ_CNIC_VERIFICATION.md
 */
