# Professional Intake Assistant Implementation

## Overview

The chatbot has been **completely transformed** from a free-form conversational AI into a **professional intake assistant** similar to UpCounsel's Rachel. The new system is deterministic, controlled, and safe.

---

## 🎯 Core Principles

### What the Intake Assistant IS:
✅ **Information collector** - Gathers structured data  
✅ **Qualifier** - Validates user needs  
✅ **Router** - Connects users to appropriate consultants  
✅ **Professional** - Maintains neutral, calm tone  

### What it is NOT:
❌ **Consultant** - Does not give advice or opinions  
❌ **Decision maker** - Does not recommend actions  
❌ **Legal/Business/Education advisor** - Redirects to experts  

---

## 🏗️ Architecture

### Backend Components

#### 1. **Intent Classification System**
Location: `backend/src/services/intakeAssistant.service.ts`

Classifies user messages into specific intents:
- `greeting` - Initial hello
- `domain_selection` - Choosing Education/Business/Legal
- `info_provided` - Answering intake questions
- `advice_request` - 🚨 Asking for recommendations (BLOCKED)
- `off_topic` - Non-relevant conversations (REDIRECTED)
- `confirmation` - Agreeing to proceed
- `correction` - Updating provided information

**Key Features:**
- Pattern-based detection (regex)
- Confidence scoring
- Automatic redirect messages for advice requests
- Low temperature (0.2) for deterministic responses

#### 2. **Entity Extraction (NER)**
Automatically extracts:
- **Domain**: Education | Business | Legal
- **Location**: Pakistani cities or Remote
- **Timeline**: Project duration
- **Budget**: Min/max in PKR
- **Keywords**: Non-sensitive relevant terms

**Safety Features:**
- Masks sensitive data (CNIC, phone, email, bank accounts)
- Validates extracted entities
- Normalizes location names

#### 3. **Domain-Specific Guardrails**

**Education Domain:**
- ❌ NEVER recommend specific universities
- ❌ NEVER guarantee admission outcomes
- ❌ NEVER provide career advice without context
- ✅ Disclaimer: "Admission outcomes depend on many factors"

**Business Domain:**
- ❌ NEVER suggest business strategies
- ❌ NEVER estimate profits or guarantee growth
- ❌ NEVER provide tax advice
- ✅ Disclaimer: "Business outcomes depend on market conditions"

**Legal Domain:**
- ❌ NEVER interpret specific laws
- ❌ NEVER recommend legal actions
- ❌ NEVER guarantee case outcomes
- ✅ Disclaimer: "This is not legal advice - consult a qualified attorney"

#### 4. **Strict Conversation Flow**

The intake follows a **finite-state machine**:

```
greeting → domain_classification → problem_summary → 
context_questions → timeline → location → urgency → 
budget → confirmation → handoff → complete
```

**Rules:**
- ✅ ONE question at a time
- ✅ Cannot skip steps
- ✅ Must validate before proceeding
- ✅ User can correct previous answers

---

### Frontend Components

#### 1. **IntakeAssistantWidget**
Location: `frontend/src/components/chatbot/IntakeAssistantWidget.tsx`

**Features:**
- Step-by-step guided flow
- Quick action buttons (domain selection, location dropdown, urgency buttons)
- Progress bar showing completion %
- Real-time validation
- Confirmation summary before submission
- 500 character limit per message
- No emojis, professional tone

**UI Elements:**
- Domain pills with color coding:
  - 🔵 Education: Blue
  - 🟢 Business: Green
  - 🟣 Legal: Purple
- Location dropdown (Pakistani cities)
- Urgency buttons (Immediate/Soon/Flexible)
- Confirmation panel with review

---

## 🔒 Safety & Compliance

### Rate Limiting
```typescript
10 messages per minute per IP
Prevents spam and abuse
```

### Input Validation
- Maximum 500 characters per message
- Required fields checked at each step
- Sensitive data detection and masking

### Sensitive Data Patterns
Automatically detects and masks:
- CNIC: `12345-1234567-1`
- Phone: `+923001234567`
- Email: `user@example.com`
- Bank accounts: `1234567890123456`

### Groq API Configuration
```typescript
model: 'llama-3.3-70b-versatile'
temperature: 0.2  // Low for deterministic responses
max_tokens: 256   // Short, focused responses
```

---

## 📊 Step Requirements

Each step requires specific fields before proceeding:

| Step | Required Fields | Validation |
|------|----------------|------------|
| `greeting` | None | - |
| `domain_classification` | domain | Must be Education/Business/Legal |
| `problem_summary` | problemSummary | Min 10 characters |
| `context_questions` | problemSummary | Additional context |
| `timeline` | timeline | Any timeline string |
| `location` | location | Valid Pakistani city or Remote |
| `urgency` | urgency | Immediate/Soon/Flexible |
| `budget` | budgetMin | Numeric value in PKR |
| `confirmation` | All above | Complete intake state |

---

## 🚀 Usage

### Using the New Intake Assistant

**Option 1: Replace existing ChatbotWidget**
```tsx
// In PostJobPage.tsx or any page
import { IntakeAssistantWidget } from '../components/chatbot';

<IntakeAssistantWidget
  initialOpen={true}
  onComplete={(intakeData) => {
    console.log('Collected data:', intakeData);
    // Handle submission
  }}
/>
```

**Option 2: Keep both (A/B testing)**
```tsx
const useNewIntake = true; // Feature flag

{useNewIntake ? (
  <IntakeAssistantWidget onComplete={handleComplete} />
) : (
  <ChatbotWidget onJobDataChange={handleJobChange} />
)}
```

### API Endpoint

**POST** `/api/chatbot/message`

**Request:**
```json
{
  "message": "I need help with university admissions",
  "currentStep": "greeting",
  "domain": null,
  "intakeState": {
    "currentStep": "greeting",
    "progress": 0,
    "extractedKeywords": [],
    "messages": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Please describe your situation briefly. What specific assistance are you looking for?",
    "intent": "info_provided",
    "entities": {
      "domain": "Education",
      "keywords": ["university", "admissions"]
    },
    "requiresRedirect": false,
    "validation": {
      "isValid": true
    }
  }
}
```

---

## 🧪 Testing Checklist

### ✅ Must Pass All Tests

#### 1. **No Advice Given**
```
❌ User: "Which university should I apply to?"
✅ Response: "A qualified education consultant can help you explore options. Let me collect a few details to connect you with the right expert."
```

#### 2. **One Question at a Time**
```
✅ Each step asks exactly ONE question
❌ Never: "What's your budget and timeline?"
✅ Correct: "What's your budget?" (then next step: "When do you need this?")
```

#### 3. **Domain-Aware Behavior**
```
Education: Adds admission disclaimer
Business: Adds market conditions disclaimer
Legal: Adds "not legal advice" disclaimer
```

#### 4. **Intent Handling**
```
✅ Detects advice requests → Redirects
✅ Detects off-topic → Redirects
✅ Handles corrections → Updates state
```

#### 5. **Safe Groq Usage**
```
✅ Temperature: 0.2 (deterministic)
✅ Max tokens: 256 (concise)
✅ Rejects outputs that give advice
✅ Fallback to safe prompts on error
```

#### 6. **Production Ready**
```
✅ Rate limiting: 10 msg/min
✅ Input validation: 500 char max
✅ Sensitive data masking
✅ Error recovery
✅ Logging for rejected intents
```

---

## 🔄 Migration from Old Chatbot

### For Developers

**Step 1: Install (if needed)**
```bash
cd backend
npm install express-rate-limit
```

**Step 2: Update imports**
```tsx
// Old
import { ChatbotWidget } from '../components/chatbot';

// New
import { IntakeAssistantWidget } from '../components/chatbot';
```

**Step 3: Update usage**
```tsx
// Old
<ChatbotWidget 
  onJobDataChange={(data, progress) => {
    setJobPreview(data);
  }}
/>

// New
<IntakeAssistantWidget
  onComplete={(intakeData) => {
    // intakeData contains:
    // - domain: Education/Business/Legal
    // - description: Full problem summary
    // - timeline, location, urgency
    // - budgetMin, budgetMax
    // - keywords: Array of extracted terms
    
    handleSubmit(intakeData);
  }}
/>
```

### For Consultants/Admins

**What Changed:**
1. Users can no longer ask for advice directly
2. All requests follow structured intake flow
3. Better qualified leads with complete information
4. Standardized data format for easier matching

**What Stayed the Same:**
1. Same domain categories (Education/Business/Legal)
2. Same Pakistani city locations
3. Budget still in PKR
4. Timeline flexibility maintained

---

## 📝 Configuration

### Environment Variables
No new environment variables needed. Uses existing:
```env
GROQ_API_KEY=your_groq_api_key
```

### Customization Points

#### 1. **Add New Domain**
File: `backend/src/types/intake.types.ts`
```typescript
export type IntakeDomain = 'Education' | 'Business' | 'Legal' | 'Healthcare';

export const DOMAIN_GUARDRAILS = {
  Healthcare: {
    prohibited: [
      'diagnose conditions',
      'prescribe treatments',
      'guarantee health outcomes',
    ],
    disclaimers: [
      'A licensed healthcare consultant can review your needs',
      'This is not medical advice',
    ],
  },
  // ... existing domains
};
```

#### 2. **Modify Step Flow**
File: `backend/src/types/intake.types.ts`
```typescript
export const STEP_TRANSITIONS: Record<IntakeStep, IntakeStep> = {
  greeting: 'domain_classification',
  domain_classification: 'problem_summary',
  // Add new steps here
  your_new_step: 'next_step',
};
```

#### 3. **Change Rate Limits**
File: `backend/src/modules/chatbot/chatbot.routes.ts`
```typescript
const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Increase to 20 messages per minute
  // ...
});
```

---

## 🐛 Troubleshooting

### Issue: Assistant gives advice
**Solution:** Check Groq response validation in `intakeAssistant.service.ts`
```typescript
if (this.containsAdvice(response)) {
  return stepPrompt; // Fallback to safe prompt
}
```

### Issue: Steps being skipped
**Solution:** Ensure validation passes before step transition
```typescript
const validation = intakeAssistant.validateStep(currentStep, intakeState);
if (!validation.isValid) {
  // Stay on current step
}
```

### Issue: Rate limit too strict
**Solution:** Adjust rate limiter in `chatbot.routes.ts`
```typescript
max: 15, // Increase from 10
```

### Issue: Entity extraction failing
**Solution:** Check Groq API key and model availability
```typescript
model: 'llama-3.3-70b-versatile' // Ensure model is available
```

---

## 📈 Monitoring & Logging

### Log Rejected Intents
```typescript
// In intakeAssistant.service.ts
if (intentResult.intent === 'advice_request') {
  console.warn('[INTAKE] Advice request blocked:', userMessage);
  // Track in analytics
}
```

### Track Completion Rates
```typescript
// In IntakeAssistantWidget.tsx
useEffect(() => {
  if (state.currentStep === 'complete') {
    analytics.track('Intake Completed', {
      domain: state.domain,
      timeSpent: Date.now() - startTime,
    });
  }
}, [state.currentStep]);
```

---

## 🎓 Best Practices

1. **Always redirect advice requests** - Never attempt to answer
2. **Keep responses under 2 sentences** - Concise and professional
3. **Use neutral language** - "A consultant can help..."
4. **Validate before proceeding** - Check required fields
5. **Log rejected intents** - Monitor for abuse patterns
6. **Test with real user queries** - Ensure guardrails work
7. **Review Groq outputs** - Fallback to safe prompts if needed

---

## 🔐 Security Considerations

### ✅ Implemented
- Rate limiting (10 msg/min)
- Input validation (500 char max)
- Sensitive data masking (CNIC, phone, email, bank)
- Intent classification for malicious queries
- Low temperature for deterministic behavior
- Strict system prompts with guardrails

### 🔄 Recommended
- Add CAPTCHA for repeated requests
- Implement user session tracking
- Add abuse detection (repeated advice requests)
- Log and review all "advice_request" intents
- Monitor Groq API usage and costs

---

## 📞 Support

For questions or issues:
1. Check this documentation first
2. Review code comments in:
   - `backend/src/services/intakeAssistant.service.ts`
   - `frontend/src/components/chatbot/IntakeAssistantWidget.tsx`
3. Test with sample queries in development
4. Check Groq API logs for errors

---

## ✅ Final Checklist

Before deploying to production:

- [ ] All 6 test categories pass
- [ ] Rate limiting configured
- [ ] Groq API key valid
- [ ] Domain guardrails tested for each category
- [ ] Sensitive data masking verified
- [ ] Frontend component integrated
- [ ] Error handling tested
- [ ] Logging implemented
- [ ] Documentation reviewed
- [ ] User acceptance testing completed

---

## 🚀 Deployment

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve build folder
```

**Environment:**
- Ensure `GROQ_API_KEY` is set
- Rate limiting works with Redis (optional but recommended)
- Monitor Groq API usage

---

## 📊 Comparison: Old vs New

| Feature | Old Chatbot | New Intake Assistant |
|---------|-------------|---------------------|
| **Behavior** | Free-form conversation | Structured intake flow |
| **Advice** | Sometimes gave advice | NEVER gives advice |
| **Steps** | Flexible, could skip | Strict, sequential |
| **Validation** | Minimal | Every step validated |
| **Safety** | Basic | Domain-specific guardrails |
| **Rate Limiting** | None | 10 msg/min |
| **Sensitive Data** | Not handled | Automatically masked |
| **Intent Detection** | No | Yes, with confidence |
| **Tone** | Casual with emojis | Professional, no emojis |
| **Temperature** | 0.7-0.8 | 0.2 (deterministic) |
| **Error Recovery** | Generic fallback | Step-specific fallback |

---

**Implementation Complete** ✅

The chatbot now behaves like a professional intake assistant, never gives advice, follows strict guardrails, and ensures safe, controlled conversations.
