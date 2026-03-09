# API Testing Guide - Groq CNIC Verification

## Quick API Test with cURL (PowerShell)

### Prerequisites
- Backend server running on `http://localhost:3001`
- A base64-encoded CNIC image

---

## Method 1: Using PowerShell (Recommended for Windows)

### Test Single CNIC Verification

```powershell
# Create the request body
$body = @{
    image = "YOUR_BASE64_IMAGE_STRING_HERE"
} | ConvertTo-Json

# Send the request
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/consultants/verify-cnic" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Display the response
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

### Test Batch Verification (Front + Back)

```powershell
$body = @{
    front = "BASE64_FRONT_IMAGE"
    back = "BASE64_BACK_IMAGE"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/consultants/verify-cnic" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

---

## Method 2: Using Git Bash / WSL (cURL)

### Test Single CNIC Verification

```bash
curl -X POST http://localhost:3001/api/consultants/verify-cnic \
  -H "Content-Type: application/json" \
  -d '{
    "image": "YOUR_BASE64_IMAGE_STRING_HERE"
  }'
```

### Test Batch Verification

```bash
curl -X POST http://localhost:3001/api/consultants/verify-cnic \
  -H "Content-Type: application/json" \
  -d '{
    "front": "BASE64_FRONT_IMAGE",
    "back": "BASE64_BACK_IMAGE"
  }'
```

---

## Method 3: Using a File (PowerShell)

### Step 1: Convert Image to Base64

```powershell
# Function to convert image file to base64
function Convert-ImageToBase64 {
    param($ImagePath)
    $imageBytes = [System.IO.File]::ReadAllBytes($ImagePath)
    $base64 = [System.Convert]::ToBase64String($imageBytes)
    return $base64
}

# Convert your CNIC image
$cnicImage = Convert-ImageToBase64 -ImagePath "C:\path\to\your\cnic.jpg"
```

### Step 2: Send Request with Image

```powershell
$body = @{
    image = $cnicImage
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/consultants/verify-cnic" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Pretty print the response
$result = $response.Content | ConvertFrom-Json
Write-Host "`nVerification Result:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Valid CNIC: $($result.data.is_valid_cnic)" -ForegroundColor $(if($result.data.is_valid_cnic){"Green"}else{"Red"})
Write-Host "Confidence: $($result.data.confidence_score)%"
Write-Host "Quality: $($result.data.image_quality)"
Write-Host "Visibility: $($result.data.card_visibility)"
Write-Host "Result: $($result.data.verification_result)" -ForegroundColor $(if($result.data.verification_result -eq "approved"){"Green"}else{"Red"})
Write-Host "Reason: $($result.data.reason)"
```

---

## Method 4: Postman Collection

### Create New Request

1. Open Postman
2. Create New Request
3. Set method to `POST`
4. URL: `http://localhost:3001/api/consultants/verify-cnic`

### Headers
```
Content-Type: application/json
```

### Body (raw JSON)

**Single Image:**
```json
{
  "image": "YOUR_BASE64_IMAGE_STRING"
}
```

**Batch (Front + Back):**
```json
{
  "front": "BASE64_FRONT_IMAGE",
  "back": "BASE64_BACK_IMAGE"
}
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "is_valid_cnic": true,
    "confidence_score": 95,
    "image_quality": "good",
    "card_visibility": "full",
    "cnic_format_detected": true,
    "reason": "Valid Pakistani CNIC with NADRA logo visible",
    "verification_result": "approved"
  }
}
```

---

## Method 5: Using Node.js Script

### Create `test-api.js`

```javascript
const axios = require('axios');
const fs = require('fs');

// Convert image to base64
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

// Test CNIC verification
async function testVerification() {
  try {
    // Load image
    const base64Image = imageToBase64('./test-cnic.jpg');
    
    // Send request
    const response = await axios.post(
      'http://localhost:3001/api/consultants/verify-cnic',
      { image: base64Image }
    );
    
    console.log('Verification Result:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const result = response.data.data;
    console.log('\n' + '='.repeat(50));
    console.log(`✓ Valid CNIC: ${result.is_valid_cnic}`);
    console.log(`✓ Confidence: ${result.confidence_score}%`);
    console.log(`✓ Quality: ${result.image_quality}`);
    console.log(`✓ Result: ${result.verification_result.toUpperCase()}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testVerification();
```

### Run the Script

```bash
node test-api.js
```

---

## Method 6: Complete PowerShell Test Script

Save as `test-cnic-api.ps1`:

```powershell
# Groq CNIC Verification API Test Script

param(
    [string]$ImagePath = "",
    [string]$ApiUrl = "http://localhost:3001/api/consultants/verify-cnic"
)

function Convert-ImageToBase64 {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "Image file not found: $Path"
    }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    return [System.Convert]::ToBase64String($bytes)
}

function Test-CNICVerification {
    param(
        [string]$ImagePath,
        [string]$Url
    )
    
    Write-Host "`n🔍 Testing Groq CNIC Verification API" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    
    try {
        # Convert image to base64
        Write-Host "`n📸 Converting image to base64..." -ForegroundColor Yellow
        $base64Image = Convert-ImageToBase64 -Path $ImagePath
        Write-Host "✓ Image converted (size: $($base64Image.Length) chars)" -ForegroundColor Green
        
        # Create request body
        $body = @{
            image = $base64Image
        } | ConvertTo-Json
        
        # Send request
        Write-Host "`n📤 Sending verification request..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $Url `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -UseBasicParsing
        
        # Parse response
        $result = $response.Content | ConvertFrom-Json
        
        # Display results
        Write-Host "`n📊 Verification Results:" -ForegroundColor Cyan
        Write-Host "=" * 60 -ForegroundColor Cyan
        
        $data = $result.data
        
        $statusColor = if ($data.verification_result -eq "approved") { "Green" } else { "Red" }
        $statusIcon = if ($data.verification_result -eq "approved") { "✅" } else { "❌" }
        
        Write-Host "`n$statusIcon Result: $($data.verification_result.ToUpper())" -ForegroundColor $statusColor
        Write-Host "   Valid CNIC: $($data.is_valid_cnic)" -ForegroundColor White
        Write-Host "   Confidence Score: $($data.confidence_score)%" -ForegroundColor White
        Write-Host "   Image Quality: $($data.image_quality)" -ForegroundColor White
        Write-Host "   Card Visibility: $($data.card_visibility)" -ForegroundColor White
        Write-Host "   Format Detected: $($data.cnic_format_detected)" -ForegroundColor White
        Write-Host "   Reason: $($data.reason)" -ForegroundColor White
        
        Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
        Write-Host "✓ Test completed successfully!`n" -ForegroundColor Green
        
        return $result
        
    } catch {
        Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host $_.Exception -ForegroundColor Red
        exit 1
    }
}

# Main execution
if ($ImagePath -eq "") {
    Write-Host "Usage: .\test-cnic-api.ps1 -ImagePath 'C:\path\to\cnic.jpg'" -ForegroundColor Yellow
    Write-Host "Example: .\test-cnic-api.ps1 -ImagePath 'C:\Users\test\Desktop\cnic.jpg'" -ForegroundColor Yellow
    exit 0
}

Test-CNICVerification -ImagePath $ImagePath -Url $ApiUrl
```

### Run the Script

```powershell
.\test-cnic-api.ps1 -ImagePath "C:\path\to\your\cnic.jpg"
```

---

## Sample Response Examples

### ✅ Approved Response

```json
{
  "success": true,
  "data": {
    "is_valid_cnic": true,
    "confidence_score": 95,
    "image_quality": "good",
    "card_visibility": "full",
    "cnic_format_detected": true,
    "reason": "Valid Pakistani CNIC with NADRA logo and proper format visible",
    "verification_result": "approved"
  }
}
```

### ❌ Rejected Response

```json
{
  "success": true,
  "data": {
    "is_valid_cnic": false,
    "confidence_score": 35,
    "image_quality": "blurry",
    "card_visibility": "partial",
    "cnic_format_detected": false,
    "reason": "Image is too blurry and card is partially cropped. Please upload a clear photo of your complete CNIC.",
    "verification_result": "rejected"
  }
}
```

### ⚠️ Error Response

```json
{
  "success": false,
  "error": "Image is required. Provide either 'image' or 'front' field."
}
```

---

## Testing Checklist

- [ ] Test with a valid CNIC image (should approve)
- [ ] Test with a blurry image (should reject)
- [ ] Test with a cropped CNIC (should reject)
- [ ] Test with a selfie (should reject)
- [ ] Test with no image (should return error)
- [ ] Test batch verification with front + back
- [ ] Check response time (should be 2-5 seconds)
- [ ] Verify confidence scores are accurate

---

## Troubleshooting

### Error: "Connection refused"
→ Make sure backend is running: `npm run dev`

### Error: "GROQ_API_KEY not configured"
→ Check `.env` file has the API key

### Error: "Invalid image format"
→ Ensure image is properly base64 encoded

### All images rejected
→ Test with clearer, well-lit CNIC photos

---

## Quick Test Commands

```powershell
# Check if backend is running
Invoke-WebRequest http://localhost:3001/health

# Test with minimal payload (will fail, but confirms endpoint works)
$body = @{ image = "test" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/consultants/verify-cnic" -Method POST -Body $body -ContentType "application/json"
```

---

**Need Help?** Check `docs/GROQ_CNIC_VERIFICATION.md` for full documentation.
