/**
 * Groq-based CNIC Verification Service for Expertraah Platform
 * 
 * Automated KYC verification assistant that analyzes Pakistani CNIC images
 * using Groq's vision API (LLaMA Vision models).
 * 
 * This service validates:
 * - Whether the image is a valid Pakistani CNIC
 * - Card visibility and quality
 * - NADRA logo and official layout
 * - CNIC format (13-digit: XXXXX-XXXXXXX-X)
 * - Image clarity (clear, blurry, dark, cropped)
 * 
 * Returns structured JSON with verification results.
 */

import Groq from 'groq-sdk';
import logger from '../config/logger';
import { env } from '../config/env';

/**
 * CNIC Verification Response Structure
 */
export interface CNICVerificationResult {
  is_valid_cnic: boolean;
  confidence_score: number; // 0-100
  image_quality: 'good' | 'blurry' | 'dark' | 'cropped' | 'unreadable';
  card_visibility: 'full' | 'partial' | 'not_visible';
  cnic_format_detected: boolean;
  reason: string;
  verification_result: 'approved' | 'rejected';
}

/**
 * System prompt for Groq CNIC verification
 */
const CNIC_VERIFICATION_PROMPT = `You are an automated KYC verification assistant for a consultant onboarding platform called Expertraah.

Your job is to analyze an uploaded image and determine if it contains a valid Pakistani CNIC (Computerized National Identity Card).

This verification is used to confirm the identity of consultants registering on the platform.

Carefully analyze the image and check the following:

1. Determine whether the uploaded image contains a Pakistani CNIC.
2. Ensure the card is clearly visible and not cropped.
3. Check that the card resembles the official NADRA CNIC layout.
4. Look for common CNIC elements such as:
   - NADRA logo
   - Pakistani identity card layout
   - Name and ID fields
   - 13-digit CNIC number format (XXXXX-XXXXXXX-X)
5. Determine whether the image is:
   - clear
   - blurry
   - dark
   - partially visible
6. Reject images that are:
   - not a CNIC
   - screenshots
   - photos of other documents
   - multiple documents
   - heavily cropped or unreadable

Return ONLY a JSON response in the following format:

{
  "is_valid_cnic": true or false,
  "confidence_score": number between 0 and 100,
  "image_quality": "good | blurry | dark | cropped | unreadable",
  "card_visibility": "full | partial | not_visible",
  "cnic_format_detected": true or false,
  "reason": "short explanation",
  "verification_result": "approved | rejected"
}

Rules:
- Approve only if the image clearly shows a Pakistani CNIC.
- Reject if uncertain or if the image quality is poor.
- Be strict because this is used for identity verification.

Respond with ONLY the JSON object, no markdown code blocks, no additional text.`;

/**
 * Initialize Groq client
 */
function getGroqClient(): Groq {
  if (!env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in environment variables');
  }
  
  return new Groq({
    apiKey: env.GROQ_API_KEY,
  });
}

/**
 * Convert base64 image to data URL format for Groq API
 */
function formatImageForGroq(base64Image: string): string {
  // Remove existing data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  
  // Groq expects the format: data:image/jpeg;base64,<base64_data>
  return `data:image/jpeg;base64,${base64Data}`;
}

/**
 * Verify Pakistani CNIC using Groq Vision API
 * 
 * @param base64Image - Base64 encoded image string
 * @returns Promise<CNICVerificationResult>
 */
export async function verifyCNICWithGroq(base64Image: string): Promise<CNICVerificationResult> {
  try {
    logger.info('[Groq CNIC Verification] Starting verification...');

    const groq = getGroqClient();
    const imageUrl = formatImageForGroq(base64Image);

    // Call Groq's vision model (llava-v1.5-7b-4096-preview is currently supported for vision)
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: CNIC_VERIFICATION_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Current supported vision model
      temperature: 0.2, // Low temperature for consistent verification
      max_tokens: 500,
      top_p: 0.9,
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || '';
    
    logger.info(`[Groq CNIC Verification] Raw response: ${responseText}`);

    // Parse the JSON response
    const result = parseGroqResponse(responseText);
    
    logger.info(`[Groq CNIC Verification] Result: ${result.verification_result} (confidence: ${result.confidence_score}%)`);
    
    return result;

  } catch (error: any) {
    logger.error('[Groq CNIC Verification] Error:', error);

    // Handle specific Groq API errors
    if (error.message?.includes('API key')) {
      throw new Error('CNIC verification service configuration error. Please contact support.');
    }

    // Return a rejection on error (strict verification)
    return {
      is_valid_cnic: false,
      confidence_score: 0,
      image_quality: 'unreadable',
      card_visibility: 'not_visible',
      cnic_format_detected: false,
      reason: 'Verification system error. Please try again with a clear photo of your CNIC.',
      verification_result: 'rejected',
    };
  }
}

/**
 * Parse and validate Groq's JSON response
 */
function parseGroqResponse(responseText: string): CNICVerificationResult {
  try {
    // Remove markdown code blocks if present
    let jsonText = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to parse JSON
    const parsed = JSON.parse(jsonText);

    // Validate and normalize the response
    return {
      is_valid_cnic: Boolean(parsed.is_valid_cnic),
      confidence_score: Math.min(Math.max(Number(parsed.confidence_score) || 0, 0), 100),
      image_quality: validateImageQuality(parsed.image_quality),
      card_visibility: validateCardVisibility(parsed.card_visibility),
      cnic_format_detected: Boolean(parsed.cnic_format_detected),
      reason: String(parsed.reason || 'No reason provided'),
      verification_result: parsed.is_valid_cnic === true ? 'approved' : 'rejected',
    };

  } catch (parseError) {
    logger.error('[Groq CNIC Verification] Failed to parse JSON response:', responseText);

    // Fallback: analyze text response
    const lowerText = responseText.toLowerCase();
    const isValid = 
      lowerText.includes('valid') && 
      lowerText.includes('cnic') && 
      !lowerText.includes('not valid') &&
      !lowerText.includes('invalid');

    return {
      is_valid_cnic: isValid,
      confidence_score: isValid ? 60 : 20,
      image_quality: 'unreadable',
      card_visibility: 'partial',
      cnic_format_detected: false,
      reason: 'Could not parse verification response. Please try again.',
      verification_result: 'rejected',
    };
  }
}

/**
 * Validate image quality enum
 */
function validateImageQuality(quality: string): CNICVerificationResult['image_quality'] {
  const validQualities: CNICVerificationResult['image_quality'][] = ['good', 'blurry', 'dark', 'cropped', 'unreadable'];
  
  if (validQualities.includes(quality as any)) {
    return quality as CNICVerificationResult['image_quality'];
  }
  
  return 'unreadable';
}

/**
 * Validate card visibility enum
 */
function validateCardVisibility(visibility: string): CNICVerificationResult['card_visibility'] {
  const validVisibilities: CNICVerificationResult['card_visibility'][] = ['full', 'partial', 'not_visible'];
  
  if (validVisibilities.includes(visibility as any)) {
    return visibility as CNICVerificationResult['card_visibility'];
  }
  
  return 'not_visible';
}

/**
 * Verify CNIC from Buffer (alternative input format)
 */
export async function verifyCNICFromBuffer(imageBuffer: Buffer): Promise<CNICVerificationResult> {
  const base64Image = imageBuffer.toString('base64');
  return verifyCNICWithGroq(base64Image);
}

/**
 * Batch verify multiple CNIC images (front and back)
 */
export async function verifyCNICBatch(images: {
  front: string;
  back?: string;
}): Promise<{
  front: CNICVerificationResult;
  back?: CNICVerificationResult;
  overallResult: 'approved' | 'rejected';
}> {
  const frontResult = await verifyCNICWithGroq(images.front);
  
  let backResult: CNICVerificationResult | undefined;
  if (images.back) {
    backResult = await verifyCNICWithGroq(images.back);
  }

  // Overall approval: both front (and back if provided) must be approved
  const overallResult: 'approved' | 'rejected' = 
    frontResult.verification_result === 'approved' && 
    (!backResult || backResult.verification_result === 'approved')
      ? 'approved'
      : 'rejected';

  const result: {
    front: CNICVerificationResult;
    back?: CNICVerificationResult;
    overallResult: 'approved' | 'rejected';
  } = {
    front: frontResult,
    overallResult,
  };
  
  if (backResult !== undefined) {
    result.back = backResult;
  }
  
  return result;
}
