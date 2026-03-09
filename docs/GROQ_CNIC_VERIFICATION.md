# Groq CNIC Verification Service Documentation

## Overview

The Groq CNIC Verification Service is an automated KYC (Know Your Customer) verification assistant for the Expertraah consultant onboarding platform. It uses Groq's LLaMA Vision API to analyze Pakistani CNIC (Computerized National Identity Card) images and determine their validity.

## Features

✅ **AI-Powered Verification**: Uses Groq's `llama-3.2-90b-vision-preview` model for intelligent image analysis

✅ **Strict Validation**: Specifically trained to detect Pakistani CNIC cards with NADRA format

✅ **Quality Assessment**: Evaluates image quality (good, blurry, dark, cropped, unreadable)

✅ **Visibility Check**: Determines card visibility (full, partial, not_visible)

✅ **Format Detection**: Validates 13-digit CNIC format (XXXXX-XXXXXXX-X)

✅ **Structured Response**: Returns JSON with detailed verification results

✅ **Batch Processing**: Supports verification of both front and back CNIC images

✅ **Fallback Support**: Automatically falls back to Gemini Vision if Groq is unavailable

## Installation

The Groq SDK is already installed in the project:

```json
"groq-sdk": "^0.37.0"
```

If you need to install it separately:

```bash
cd apps/backend
npm install groq-sdk
```

## Configuration

### 1. Environment Variables

Add your Groq API key to the environment files:

**`.env` (Development):**
```env
GROQ_API_KEY=your-groq-api-key-here
```

**`.env.test` (Testing):**
```env
GROQ_API_KEY=your-groq-api-key-here
```

**`.env.example` (Template):**
```env
# Groq (Get from: https://console.groq.com/)
GROQ_API_KEY=your-groq-api-key
```

### 2. Get Your API Key

1. Visit [https://console.groq.com/](https://console.groq.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env` file

## Usage

### 1. Import the Service

```typescript
import { 
  verifyCNICWithGroq, 
  verifyCNICBatch,
  CNICVerificationResult 
} from '@/services/groq-cnic-verification.service';
```

### 2. Verify a Single CNIC Image

```typescript
// Base64 encoded image
const base64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRg...";

try {
  const result = await verifyCNICWithGroq(base64Image);
  
  console.log('Verification Result:', result);
  // {
  //   is_valid_cnic: true,
  //   confidence_score: 95,
  //   image_quality: "good",
  //   card_visibility: "full",
  //   cnic_format_detected: true,
  //   reason: "Valid Pakistani CNIC detected with clear visibility",
  //   verification_result: "approved"
  // }
  
  if (result.verification_result === 'approved') {
    console.log('✅ CNIC Approved');
  } else {
    console.log('❌ CNIC Rejected:', result.reason);
  }
  
} catch (error) {
  console.error('Verification failed:', error.message);
}
```

### 3. Verify Both Front and Back (Batch)

```typescript
const frontImage = "base64_encoded_front_image";
const backImage = "base64_encoded_back_image";

try {
  const result = await verifyCNICBatch({
    front: frontImage,
    back: backImage
  });
  
  console.log('Front Result:', result.front.verification_result);
  console.log('Back Result:', result.back?.verification_result);
  console.log('Overall:', result.overallResult);
  
} catch (error) {
  console.error('Batch verification failed:', error.message);
}
```

### 4. API Endpoint Usage

**POST** `/api/consultants/verify-cnic`

**Request Body (Single Image):**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Request Body (Batch - Front and Back):**
```json
{
  "front": "base64_encoded_front_image",
  "back": "base64_encoded_back_image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_valid_cnic": true,
    "confidence_score": 92,
    "image_quality": "good",
    "card_visibility": "full",
    "cnic_format_detected": true,
    "reason": "Valid Pakistani CNIC with NADRA logo and proper format",
    "verification_result": "approved"
  }
}
```

**Example with cURL:**
```bash
curl -X POST http://localhost:3001/api/consultants/verify-cnic \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64_encoded_image_here"
  }'
```

**Example with Axios:**
```typescript
import axios from 'axios';

const response = await axios.post(
  'http://localhost:3001/api/consultants/verify-cnic',
  { image: base64Image }
);

console.log('Verification:', response.data.data);
```

## Response Schema

```typescript
interface CNICVerificationResult {
  is_valid_cnic: boolean;           // Whether the image is a valid CNIC
  confidence_score: number;         // Confidence level (0-100)
  image_quality: 'good' | 'blurry' | 'dark' | 'cropped' | 'unreadable';
  card_visibility: 'full' | 'partial' | 'not_visible';
  cnic_format_detected: boolean;    // Whether 13-digit format detected
  reason: string;                   // Explanation of the result
  verification_result: 'approved' | 'rejected';
}
```

## Validation Rules

The service checks for:

### ✅ Approved Cases:
- Clear, unblurred Pakistani CNIC image
- Full card visibility
- NADRA logo present
- Official CNIC layout
- 13-digit CNIC number format (XXXXX-XXXXXXX-X)
- Name and ID fields visible
- Good lighting and image quality

### ❌ Rejected Cases:
- Not a CNIC (selfies, other documents)
- Screenshots
- Blurry or dark images
- Cropped or partially visible cards
- Multiple documents in one image
- Poor image quality
- Different ID documents (passport, driver's license)
- No NADRA logo or official layout

## Integration with Consultant Profile

The service is automatically integrated into the consultant profile creation workflow:

```typescript
// In consultant.service.ts
export const validateNICWithAICheck = async (base64Image: string): Promise<void> => {
  // Try Groq first (more strict CNIC verification)
  if (env.GROQ_API_KEY) {
    const groqResult = await verifyCNICWithGroq(base64Image);
    
    if (!groqResult.is_valid_cnic) {
      throw new ApiError(400, `Invalid CNIC: ${groqResult.reason}`);
    }
    return;
  }
  
  // Fallback to Gemini if Groq unavailable
  // ... existing validation code
};
```

When consultants submit their profile with CNIC images, the validation happens automatically:

```typescript
// Profile submission
POST /api/consultants/verify-profile

// Body includes:
{
  "idCardFront": "base64_image",
  "idCardBack": "base64_image",
  // ... other profile fields
}
```

## Testing

### Run the Test Script

```bash
cd apps/backend
npm run dev

# In another terminal:
ts-node src/scripts/test-groq-cnic-verification.ts
```

### Add Test Images

Place test CNIC images in `apps/backend/test-images/`:
- `cnic-front.jpg`
- `cnic-back.jpg`
- `cnic-blurry.jpg`
- `selfie.jpg` (for negative testing)

### Example Test Output

```
================================================================================
Testing Groq CNIC Verification Service
================================================================================

Test Case 1: Single CNIC Verification
--------------------------------------------------------------------------------
Verifying CNIC image...

Verification Result:
{
  "is_valid_cnic": true,
  "confidence_score": 95,
  "image_quality": "good",
  "card_visibility": "full",
  "cnic_format_detected": true,
  "reason": "Valid Pakistani CNIC with clear NADRA logo and proper format",
  "verification_result": "approved"
}

✅ CNIC Approved
Confidence: 95%
Reason: Valid Pakistani CNIC with clear NADRA logo and proper format
```

## Error Handling

```typescript
try {
  const result = await verifyCNICWithGroq(base64Image);
  
  if (result.verification_result === 'rejected') {
    // Handle rejection
    console.log('Rejection reason:', result.reason);
    console.log('Image quality:', result.image_quality);
    console.log('Suggestions: Please upload a clear photo of your CNIC');
  }
  
} catch (error) {
  // Handle API errors
  if (error.message.includes('API key')) {
    console.error('Configuration error - API key not set');
  } else {
    console.error('Verification error:', error.message);
  }
}
```

## Performance

- **Average Response Time**: 2-4 seconds per image
- **Model**: llama-3.2-90b-vision-preview
- **Temperature**: 0.2 (low for consistent results)
- **Max Tokens**: 500
- **Batch Processing**: Sequential (front then back)

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Image Size Limits**: Recommend max 5MB per image
3. **Rate Limiting**: Apply rate limits to the verification endpoint
4. **Image Validation**: Validate image format before sending to Groq
5. **Error Messages**: Don't expose internal errors to end users

## Troubleshooting

### Issue: "GROQ_API_KEY is not configured"

**Solution**: Add the API key to your `.env` file:
```env
GROQ_API_KEY=gsk_your_api_key_here
```

### Issue: "Verification system error"

**Solution**: 
- Check if Groq API is accessible
- Verify API key is valid
- Check network connectivity
- Review server logs for details

### Issue: "Could not parse verification response"

**Solution**: 
- Check if the model response format changed
- Verify image is valid base64
- Try with a clearer image
- Check Groq API status

### Issue: Always rejecting valid CNICs

**Solution**:
- Review the prompt in the service file
- Adjust confidence threshold if needed
- Check image quality and size
- Ensure proper lighting in photos

## Advanced Configuration

### Adjust Confidence Threshold

Edit `groq-cnic-verification.service.ts`:

```typescript
// Current threshold
const isApproved = result.confidence_score >= 70;

// For stricter verification
const isApproved = result.confidence_score >= 85;

// For more lenient verification
const isApproved = result.confidence_score >= 60;
```

### Customize Prompt

Modify the `CNIC_VERIFICATION_PROMPT` in the service file to adjust verification criteria.

### Change Model

```typescript
const completion = await groq.chat.completions.create({
  model: 'llama-3.2-90b-vision-preview', // Current
  // Or try other vision models as Groq releases them
});
```

## Best Practices

1. **Image Quality**: Encourage users to upload clear, well-lit photos
2. **File Size**: Compress images before sending (recommended: < 2MB)
3. **Validation**: Validate image format on frontend before upload
4. **Feedback**: Show users why their CNIC was rejected
5. **Retries**: Allow users to resubmit with better images
6. **Logging**: Log verification results for audit purposes
7. **Monitoring**: Track approval/rejection rates

## Support

For issues or questions:
- Check the logs: `apps/backend/logs/`
- Review Groq documentation: https://console.groq.com/docs
- Contact support: support@expertraah.com

## Changelog

### Version 1.0.0 (March 2026)
- Initial release
- Groq LLaMA Vision integration
- Single and batch CNIC verification
- API endpoint implementation
- Automatic integration with consultant profiles
- Fallback to Gemini Vision
