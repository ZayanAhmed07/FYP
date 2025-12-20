# AI-Powered Consultant Matching System

## Overview
This system uses Hugging Face's sentence-transformers to intelligently match consultants with job postings using semantic similarity and additional ranking factors.

## Features

### 1. Intelligent Matching Algorithm
- **Semantic Similarity**: Uses AI embeddings to understand job requirements and consultant expertise
- **Multi-factor Scoring**: Combines AI similarity with:
  - Category specialization (15% bonus)
  - Skill overlap (10% bonus)
  - Budget compatibility (5% bonus)
  - Verification status (3% bonus)
  - High ratings (2% bonus)
  - Experience (2% bonus)
  - Response time (2% bonus)

### 2. International Consultant Database
- 50+ diverse consultants from 10+ countries
- Three main categories: Education, Business, Legal
- Realistic profiles with:
  - Professional titles and bios
  - Specialized skills
  - Experience levels
  - Education credentials
  - Multiple languages
  - Competitive hourly rates
  - Ratings and reviews

## Setup Instructions

### 1. Get Hugging Face API Key
1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up / Log in
3. Go to Settings → Access Tokens
4. Create a new token (read permissions sufficient)
5. Copy the token

### 2. Add API Key to Environment
Add to your `.env` file:
```env
HUGGINGFACE_API_KEY=hf_your_api_key_here
```

### 3. Seed Consultant Data
Run the seed script to populate your database with consultants:

```bash
cd backend
npx ts-node src/scripts/seed-consultants.ts
```

This will create:
- 50 diverse consultant profiles
- Users with email and password (default: `Consultant123!`)
- Complete profiles with skills, experience, and ratings

## API Endpoints

### 1. Find Best Matches (POST /api/consultants/match)
Match consultants to a job description using AI.

**Request Body:**
```json
{
  "title": "Need Math Tutor for SAT Prep",
  "description": "Looking for experienced tutor to help student prepare for SAT exam",
  "category": "Education",
  "skills": ["SAT Preparation", "Mathematics", "Test Strategies"],
  "budget": {
    "min": 20,
    "max": 50
  },
  "limit": 10,
  "minScore": 40,
  "onlyVerified": false
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "consultant": {
        "_id": "...",
        "userId": {
          "name": "Dr. Sarah Johnson",
          "email": "sarah.johnson@example.com",
          "profileImage": "..."
        },
        "title": "Education Consultant",
        "bio": "Experienced education consultant...",
        "skills": ["SAT Preparation", "Mathematics", "Academic Planning"],
        "hourlyRate": 45,
        "rating": 4.8,
        "completedProjects": 67,
        "isVerified": true
      },
      "matchScore": 87,
      "matchReasons": [
        "85% semantic match",
        "Specializes in Education",
        "Has 3 matching skills: SAT Preparation, Mathematics, Test Strategies",
        "Rate ($45/hr) fits budget",
        "Verified consultant",
        "Highly rated (4.8/5.0)"
      ]
    }
  ],
  "message": "Found 10 matching consultants"
}
```

### 2. Suggest Consultants for Job (GET /api/consultants/suggest/:jobId)
Automatically suggest consultants when a job is posted.

**Response:**
```json
{
  "success": true,
  "data": [...],
  "message": "Found 8 matching consultants"
}
```

## How It Works

### Matching Algorithm Flow

1. **Job Text Creation**
   - Combines job title, category, description, and required skills into a single text

2. **Consultant Text Creation**
   - Combines consultant title, specialization, bio, skills, and experience

3. **AI Embedding Generation**
   - Uses Hugging Face's `sentence-transformers/all-MiniLM-L6-v2` model
   - Converts both job and consultant texts into 384-dimensional vectors

4. **Semantic Similarity Calculation**
   - Computes cosine similarity between job and consultant embeddings
   - Range: 0 (no match) to 1 (perfect match)

5. **Bonus Score Calculation**
   - Adds points for category match, skill overlap, budget fit, etc.
   - Max bonus: ~40%

6. **Final Scoring**
   - `Final Score = (Semantic Similarity × 70%) + (Bonus Score × 30%)`
   - Filters by minimum score (default: 40%)
   - Sorts and returns top matches

### Match Score Interpretation
- **80-100%**: Excellent match - highly recommended
- **60-79%**: Good match - suitable candidate
- **40-59%**: Moderate match - could work
- **<40%**: Poor match - filtered out

## Testing the System

### 1. Test with Sample Job
```bash
curl -X POST http://localhost:5000/api/consultants/match \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Business Strategy Consultant Needed",
    "description": "Looking for expert to help develop 3-year growth strategy for tech startup",
    "category": "Business",
    "skills": ["Business Strategy", "Market Research", "Financial Planning"],
    "budget": {"min": 50, "max": 100}
  }'
```

### 2. View All Consultants
```bash
curl http://localhost:5000/api/consultants
```

### 3. Get Consultant by Category
```bash
curl http://localhost:5000/api/consultants?specialization=Legal
```

## Customization

### Adjust Matching Weights
Edit `backend/src/services/consultant-matching.service.ts`:

```typescript
// Change semantic vs bonus weight
const finalScore = semanticSimilarity * 0.7 + bonusScore; // 70/30 split

// Adjust individual bonus factors
if (consultant.specialization.includes(job.category)) {
  bonusScore += 0.15; // Increase/decrease category match weight
}
```

### Use Different AI Model
Edit `backend/src/services/huggingface.service.ts`:

```typescript
// Try different models for better accuracy
this.modelEndpoint = 'https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2';
// or
this.modelEndpoint = 'https://api-inference.huggingface.co/models/sentence-transformers/multi-qa-MiniLM-L6-cos-v1';
```

## Future Enhancements

1. **Cache Embeddings**: Store consultant embeddings in database to avoid regenerating
2. **Real-time Updates**: Automatically suggest consultants when jobs are posted
3. **Consultant Notifications**: Notify top-matched consultants about new jobs
4. **Learning Algorithm**: Improve matches based on which consultants get hired
5. **Multi-language Support**: Match consultants in different languages

## Troubleshooting

### "Failed to generate embedding"
- Check your Hugging Face API key is correct
- Ensure you have internet connection
- Model might be loading (first request can take 20-30 seconds)

### No matches found
- Lower the `minScore` threshold
- Remove `onlyVerified` filter
- Check if consultants exist in the category

### Low match scores
- Add more specific skills to job description
- Ensure job description is detailed
- Check consultant profiles have relevant information

## Cost Estimation

Hugging Face Inference API:
- **Free tier**: 30,000 requests/month
- **Pro**: $9/month for 100,000 requests
- Each match uses N+1 requests (N = number of consultants)
- Example: Matching against 50 consultants = 51 API calls

For high volume, consider:
- Caching embeddings
- Using local sentence-transformer library
- Batch processing requests

