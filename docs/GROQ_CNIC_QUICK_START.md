# Groq CNIC Verification - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Your API Key is Already Configured! ✅

The Groq API key has been added to `.env.test`:
```env
GROQ_API_KEY=your-groq-api-key-here
```

### 2. Test the Service

```bash
cd apps/backend
npm run dev
```

### 3. Test with API Call

```bash
# Using curl (PowerShell)
$body = @{
    image = "YOUR_BASE64_IMAGE_HERE"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/consultants/verify-cnic" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

## 📝 Example Usage in Code

### Frontend (React/TypeScript)

```typescript
import axios from 'axios';

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Verify CNIC
const verifyCNIC = async (file: File) => {
  try {
    const base64Image = await fileToBase64(file);
    
    const response = await axios.post(
      'http://localhost:3001/api/consultants/verify-cnic',
      { image: base64Image }
    );
    
    const result = response.data.data;
    
    if (result.verification_result === 'approved') {
      alert('✅ CNIC Verified Successfully!');
    } else {
      alert(`❌ Verification Failed: ${result.reason}`);
    }
    
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    alert('Error during verification. Please try again.');
  }
};

// Usage in component
<input 
  type="file" 
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await verifyCNIC(file);
    }
  }}
/>
```

### Backend Service

```typescript
import { verifyCNICWithGroq } from '@/services/groq-cnic-verification.service';

// Example: Verify during profile creation
const createConsultantProfile = async (data: any) => {
  // 1. Verify CNIC
  const cnicResult = await verifyCNICWithGroq(data.idCardFront);
  
  if (cnicResult.verification_result === 'rejected') {
    throw new Error(`CNIC verification failed: ${cnicResult.reason}`);
  }
  
  // 2. Create profile
  const profile = await Consultant.create({
    ...data,
    cnicVerified: true,
    cnicConfidence: cnicResult.confidence_score
  });
  
  return profile;
};
```

## 🧪 Test with Sample Images

Create a test file: `test-cnic-verification.ts`

```typescript
import fs from 'fs';
import { verifyCNICWithGroq } from './services/groq-cnic-verification.service';

async function testVerification() {
  // Load a test image
  const imageBuffer = fs.readFileSync('./test-images/cnic-sample.jpg');
  const base64Image = imageBuffer.toString('base64');
  
  // Verify
  const result = await verifyCNICWithGroq(base64Image);
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

testVerification();
```

Run it:
```bash
ts-node test-cnic-verification.ts
```

## 🎯 Expected Response Format

### ✅ Successful Verification
```json
{
  "is_valid_cnic": true,
  "confidence_score": 95,
  "image_quality": "good",
  "card_visibility": "full",
  "cnic_format_detected": true,
  "reason": "Valid Pakistani CNIC with NADRA logo visible",
  "verification_result": "approved"
}
```

### ❌ Failed Verification
```json
{
  "is_valid_cnic": false,
  "confidence_score": 30,
  "image_quality": "blurry",
  "card_visibility": "partial",
  "cnic_format_detected": false,
  "reason": "Image is too blurry and card is partially visible",
  "verification_result": "rejected"
}
```

## 🔍 What the AI Checks

✅ **Pakistani CNIC Specific:**
- NADRA logo presence
- Official CNIC layout
- 13-digit format: XXXXX-XXXXXXX-X
- Name and ID fields

✅ **Image Quality:**
- Clear vs blurry
- Good lighting vs dark
- Full visibility vs cropped

✅ **Security:**
- Not a screenshot
- Not a selfie/random photo
- Single document (not multiple)
- Actual ID card (not other documents)

## 🚨 Common Rejection Reasons

| Reason | Solution |
|--------|----------|
| "Image is blurry" | Retake photo in good lighting |
| "Card is cropped" | Ensure full card is visible |
| "Not a CNIC" | Upload actual CNIC, not other ID |
| "Multiple documents detected" | Upload only one card |
| "Poor lighting" | Take photo in bright area |
| "Screenshot detected" | Take actual photo of physical card |

## 🔗 Integration Points

The service is already integrated:

1. **Consultant Profile Creation** (`consultant.service.ts`)
   - Automatically validates CNIC during profile submission
   - Falls back to Gemini if Groq unavailable

2. **API Endpoint** (`/api/consultants/verify-cnic`)
   - Direct verification endpoint
   - Accepts single image or batch (front + back)

3. **Middleware** (optional)
   - Can be added to routes that require CNIC verification
   - Example: Pre-approval checks

## 💡 Pro Tips

1. **Image Size**: Keep under 2MB for faster processing
2. **Format**: JPG, JPEG, or PNG work best
3. **Resolution**: Minimum 800x600 pixels recommended
4. **Lighting**: Natural daylight or bright indoor light
5. **Background**: Plain background helps detection
6. **Angle**: Card should be flat, not tilted

## 📊 Monitoring

Add logging to track verification rates:

```typescript
// In your service
const result = await verifyCNICWithGroq(image);

// Log the result
await Analytics.create({
  type: 'cnic_verification',
  result: result.verification_result,
  confidence: result.confidence_score,
  quality: result.image_quality,
  timestamp: new Date()
});
```

## 🆘 Need Help?

**Check logs:**
```bash
# Backend logs
tail -f apps/backend/logs/app.log
```

**Test the API directly:**
```bash
# Health check
curl http://localhost:3001/health

# Verify service is running
curl http://localhost:3001/api/consultants
```

**Common issues:**
- API key not set → Check `.env` file
- Service not responding → Restart backend
- All rejections → Check image quality

## 📚 Full Documentation

See `docs/GROQ_CNIC_VERIFICATION.md` for:
- Detailed API reference
- Advanced configuration
- Security best practices
- Troubleshooting guide
- Performance optimization

---

**Ready to go! 🎉**

Your Groq CNIC verification service is now fully integrated and ready to use.
