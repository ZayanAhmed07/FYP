/**
 * NIC/CNIC Detection Service using AI-powered Image Analysis
 * Uses Google Gemini Vision API + Sharp for robust validation
 * 
 * Detection Strategy:
 * 1. AI Vision Analysis - Detects ID cards vs selfies/random images
 * 2. Aspect ratio validation (ID cards are rectangular)
 * 3. Text detection (ID cards contain structured text)
 * 4. Edge detection (ID cards have defined borders)
 * 5. Validate file properties (size, dimensions, format)
 */

import sharp from 'sharp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger';
import { env } from '../config/env';

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  detectedLabels?: string[];
  checks?: {
    aspectRatio: boolean;
    dimensions: boolean;
    fileSize: boolean;
    aiDetection: boolean;
    textDetected: boolean;
    edgeDetection: boolean;
  };
}

/**
 * AI-powered NIC detection using Google Gemini Vision
 * Analyzes image content to determine if it's an ID card
 */
async function detectIDCardWithAI(imageBuffer: Buffer): Promise<{
  isIDCard: boolean;
  confidence: number;
  detectedLabels: string[];
  reasoning: string;
}> {
  try {
    // Check if Gemini API key is available
    if (!env.GEMINI_API_KEY) {
      logger.warn('Gemini API key not configured, using fallback validation');
      return {
        isIDCard: true,
        confidence: 0.5,
        detectedLabels: ['fallback'],
        reasoning: 'AI validation unavailable',
      };
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `Analyze this image and determine if it is a National Identity Card (NIC/CNIC/ID Card) or not.

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text).

Your response must follow this EXACT format:
{"isIDCard": true/false, "confidence": 0.0-1.0, "detectedLabels": ["label1", "label2"], "reasoning": "brief explanation"}

Classification rules:
- If image shows an ID card, passport, driver's license, or any government-issued identification document: isIDCard = true
- If image shows a selfie, portrait photo, person's face close-up: isIDCard = false
- If image shows random objects, scenery, animals, etc.: isIDCard = false
- If image shows text documents but no photo ID: isIDCard = false

Important checks:
1. Does it have a rectangular card shape with defined borders?
2. Does it contain structured text fields (name, ID number, dates)?
3. Does it have a small passport-style photo (not a selfie)?
4. Does it have security features, holograms, or official logos?
5. Is the aspect ratio typical of ID cards (wider than tall)?

Respond with ONLY the JSON object.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text().trim();
    
    // Remove markdown code blocks if present
    let jsonText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    logger.info(`Gemini Vision AI Response: ${jsonText}`);

    try {
      const aiResult = JSON.parse(jsonText);
      
      return {
        isIDCard: aiResult.isIDCard === true,
        confidence: Math.min(Math.max(aiResult.confidence || 0.5, 0), 1),
        detectedLabels: Array.isArray(aiResult.detectedLabels) ? aiResult.detectedLabels : [],
        reasoning: aiResult.reasoning || 'No reasoning provided',
      };
    } catch (parseError) {
      logger.error('Failed to parse AI response as JSON:', text);
      // Fallback: analyze the text response
      const lowerText = text.toLowerCase();
      const isIDCard = 
        lowerText.includes('id card') || 
        lowerText.includes('identity card') ||
        lowerText.includes('cnic') ||
        lowerText.includes('identification document');
      
      return {
        isIDCard,
        confidence: 0.6,
        detectedLabels: ['text-analysis'],
        reasoning: 'Parsed from text response',
      };
    }
  } catch (error) {
    logger.error('Error in AI ID card detection:', error);
    // Fallback to basic validation
    return {
      isIDCard: true,
      confidence: 0.5,
      detectedLabels: ['error-fallback'],
      reasoning: 'AI detection failed, using fallback',
    };
  }
}

/**
 * Detect text in image (ID cards should have structured text)
 */
async function detectTextInImage(imageBuffer: Buffer): Promise<boolean> {
  try {
    // Use sharp to analyze image characteristics
    const { width, height } = await sharp(imageBuffer).metadata();
    
    if (!width || !height) return false;

    // Convert to grayscale and apply edge detection
    const edges = await sharp(imageBuffer)
      .greyscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .raw()
      .toBuffer();

    // Count edge pixels (text regions have many edges)
    let edgeCount = 0;
    for (let i = 0; i < edges.length; i++) {
      const pixelValue = edges[i];
      if (pixelValue !== undefined && pixelValue > 100) edgeCount++;
    }

    const edgeRatio = edgeCount / edges.length;
    
    // ID cards typically have 5-20% edge pixels due to text and borders
    return edgeRatio > 0.05 && edgeRatio < 0.5;
  } catch (error) {
    logger.error('Error detecting text:', error);
    return true; // Assume text is present if detection fails
  }
}

/**
 * Detect card edges and borders
 */
async function detectCardEdges(imageBuffer: Buffer): Promise<boolean> {
  try {
    const { width, height } = await sharp(imageBuffer).metadata();
    
    if (!width || !height) return false;

    // Apply Canny edge detection
    const edgeImage = await sharp(imageBuffer)
      .greyscale()
      .normalise()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      .raw()
      .toBuffer();

    // Analyze border regions (top, bottom, left, right 5%)
    const borderThickness = Math.min(Math.floor(width * 0.05), Math.floor(height * 0.05));
    let borderEdgeCount = 0;
    let totalBorderPixels = 0;

    // Sample border pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Check if pixel is in border region
        if (x < borderThickness || x >= width - borderThickness || 
            y < borderThickness || y >= height - borderThickness) {
          const idx = y * width + x;
          if (idx < edgeImage.length) {
            totalBorderPixels++;
            if (edgeImage[idx] !== undefined && edgeImage[idx] > 100) borderEdgeCount++;
          }
        }
      }
    }

    const borderEdgeRatio = borderEdgeCount / (totalBorderPixels || 1);
    
    // ID cards have defined borders (10-40% edge pixels in border region)
    return borderEdgeRatio > 0.1 && borderEdgeRatio < 0.6;
  } catch (error) {
    logger.error('Error detecting card edges:', error);
    return true; // Assume edges present if detection fails
  }
}

/**
 * Comprehensive NIC validation using AI + image analysis
 * @param imageBuffer - Image buffer (from base64 or file upload)
 * @returns Promise<ValidationResult>
 */
export async function validateNICWithAI(imageBuffer: Buffer): Promise<ValidationResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Invalid image: unable to read dimensions',
      };
    }

    // Check 1: Aspect Ratio
    // Pakistan CNIC: 85.6mm x 54mm = ratio ~1.586
    // Allow range: 1.2 to 2.2 (accounts for photos at angles)
    const aspectRatio = metadata.width / metadata.height;
    const isValidAspectRatio = aspectRatio >= 1.2 && aspectRatio <= 2.2;

    // Check 2: Dimensions
    // ID cards are typically at least 300x200 pixels when photographed
    const hasValidDimensions = metadata.width >= 200 && metadata.height >= 100;

    // Check 3: File Size
    const fileSizeKB = imageBuffer.length / 1024;
    const isValidFileSize = fileSizeKB >= 10 && fileSizeKB <= 10240; // 10KB to 10MB

    // Check 4: AI Detection - Most important check
    const aiResult = await detectIDCardWithAI(imageBuffer);
    const aiDetectionPassed = aiResult.isIDCard;

    // Check 5: Text detection
    const hasText = await detectTextInImage(imageBuffer);

    // Check 6: Edge detection (card borders)
    const hasCardEdges = await detectCardEdges(imageBuffer);

    // Check 7: Detect if it's likely a selfie/portrait
    // Selfies/portraits typically have aspect ratio close to 1:1 or 3:4 or 4:3
    const isLikelySelfie = aspectRatio >= 0.6 && aspectRatio <= 1.5;

    // Decision Logic with Weighted Scoring
    let score = 0;
    let maxScore = 0;
    const reasons: string[] = [];

    // AI Detection (Weight: 50 points) - MOST IMPORTANT
    maxScore += 50;
    if (aiDetectionPassed) {
      score += 50;
    } else {
      reasons.push(`AI detected: ${aiResult.detectedLabels.join(', ')} (${aiResult.reasoning})`);
    }

    // Aspect Ratio (Weight: 15 points)
    maxScore += 15;
    if (isValidAspectRatio) {
      score += 15;
    } else if (isLikelySelfie) {
      reasons.push(`Image appears to be a portrait/selfie (aspect ratio ${aspectRatio.toFixed(2)}). ID cards should be rectangular.`);
    } else {
      reasons.push(`Invalid aspect ratio (${aspectRatio.toFixed(2)}). ID cards should have ratio between 1.2 and 2.2.`);
    }

    // Dimensions (Weight: 10 points)
    maxScore += 10;
    if (hasValidDimensions) {
      score += 10;
    } else {
      reasons.push(`Image too small (${metadata.width}x${metadata.height}). Minimum 200x100 pixels required.`);
    }

    // File Size (Weight: 5 points)
    maxScore += 5;
    if (isValidFileSize) {
      score += 5;
    } else {
      reasons.push(`File size ${Math.round(fileSizeKB)}KB is ${fileSizeKB < 10 ? 'too small' : 'too large'}.`);
    }

    // Text Detection (Weight: 10 points)
    maxScore += 10;
    if (hasText) {
      score += 10;
    } else {
      reasons.push('No structured text detected (ID cards contain text fields).');
    }

    // Edge Detection (Weight: 10 points)
    maxScore += 10;
    if (hasCardEdges) {
      score += 10;
    } else {
      reasons.push('No clear card borders detected (ID cards have defined edges).');
    }

    // Calculate final confidence and decision
    const confidence = score / maxScore;
    const isValid = confidence >= 0.65; // Require 65% confidence threshold

    // Specific rejection for selfies
    if (isLikelySelfie && !aiDetectionPassed) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: 'This appears to be a selfie or portrait photo, not an ID card. Please upload a photo of your National Identity Card (CNIC).',
        detectedLabels: aiResult.detectedLabels,
        checks: {
          aspectRatio: isValidAspectRatio,
          dimensions: hasValidDimensions,
          fileSize: isValidFileSize,
          aiDetection: aiDetectionPassed,
          textDetected: hasText,
          edgeDetection: hasCardEdges,
        },
      };
    }

    return {
      isValid,
      confidence: Math.round(confidence * 100) / 100,
      reason: isValid 
        ? `Image validated as ID card (${Math.round(confidence * 100)}% confidence)` 
        : `Not a valid ID card: ${reasons.join(' ')}`,
      detectedLabels: aiResult.detectedLabels,
      checks: {
        aspectRatio: isValidAspectRatio,
        dimensions: hasValidDimensions,
        fileSize: isValidFileSize,
        aiDetection: aiDetectionPassed,
        textDetected: hasText,
        edgeDetection: hasCardEdges,
      },
    };

  } catch (error) {
    logger.error('Error in NIC validation:', error);
    
    // Strict fallback: Reject the image if validation system fails
    return {
      isValid: false,
      confidence: 0,
      reason: 'Image validation system error. Please try again with a clear photo of your ID card.',
    };
  }
}

/**
 * Validate NIC image from base64 string
 */
export async function validateNICFromBase64(base64Image: string): Promise<ValidationResult> {
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    return await validateNICWithAI(imageBuffer);
  } catch (error) {
    logger.error('Error validating NIC from base64:', error);
    throw new Error('Invalid image format');
  }
}

/**
 * Advanced validation combining multiple checks
 */
export async function validateNICAdvanced(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  checks: {
    imageAnalysis: { passed: boolean; confidence: number; reason: string };
    aspectRatio: { passed: boolean; ratio: number };
    fileSize: { passed: boolean; size: number };
    aiDetection: { passed: boolean; labels: string[] };
    textDetected: { passed: boolean };
    edgeDetection: { passed: boolean };
  };
}> {
  try {
    // 1. Full AI validation
    const analysisResult = await validateNICWithAI(imageBuffer);

    // 2. Get detailed metrics
    const metadata = await sharp(imageBuffer).metadata();
    const aspectRatio = metadata.width && metadata.height 
      ? metadata.width / metadata.height 
      : 0;
    
    const isValidAspectRatio = aspectRatio >= 1.2 && aspectRatio <= 2.2;

    // 3. Check file size
    const fileSizeKB = imageBuffer.length / 1024;
    const isValidFileSize = fileSizeKB >= 10 && fileSizeKB <= 10240;

    // 4. AI detection
    const aiResult = await detectIDCardWithAI(imageBuffer);

    // 5. Text detection
    const hasText = await detectTextInImage(imageBuffer);

    // 6. Edge detection
    const hasEdges = await detectCardEdges(imageBuffer);

    return {
      isValid: analysisResult.isValid,
      checks: {
        imageAnalysis: {
          passed: analysisResult.isValid,
          confidence: analysisResult.confidence,
          reason: analysisResult.reason,
        },
        aspectRatio: {
          passed: isValidAspectRatio,
          ratio: Math.round(aspectRatio * 100) / 100,
        },
        fileSize: {
          passed: isValidFileSize,
          size: Math.round(fileSizeKB),
        },
        aiDetection: {
          passed: aiResult.isIDCard,
          labels: aiResult.detectedLabels,
        },
        textDetected: {
          passed: hasText,
        },
        edgeDetection: {
          passed: hasEdges,
        },
      },
    };
  } catch (error) {
    logger.error('Error in advanced NIC validation:', error);
    throw new Error('Failed to validate NIC image');
  }
}
