# Intake Assistant Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Import Component
```tsx
import { IntakeAssistantWidget } from '../components/chatbot';
```

### 2. Add to Your Page
```tsx
<IntakeAssistantWidget
  initialOpen={false}
  onComplete={(intakeData) => {
    console.log('User submitted:', intakeData);
    // Handle the data
  }}
/>
```

### 3. Handle Completion
```tsx
const handleIntakeComplete = (data) => {
  // Data structure:
  // {
  //   domain: 'Education' | 'Business' | 'Legal',
  //   description: string,
  //   timeline: string,
  //   location: string,
  //   urgency: 'Immediate' | 'Soon' | 'Flexible',
  //   budgetMin: number,
  //   budgetMax: number,
  //   keywords: string[]
  // }
  
  // Submit to backend
  await createConsultantRequest(data);
};
```

---

## 📋 Conversation Flow

```
1. GREETING
   └─> "Which area: Education, Business, or Legal?"

2. DOMAIN CLASSIFICATION
   └─> User selects domain (buttons)

3. PROBLEM SUMMARY
   └─> "Describe your situation briefly."

4. CONTEXT QUESTIONS
   └─> "Could you provide more context?"

5. TIMELINE
   └─> "When do you need this?"

6. LOCATION
   └─> User selects city (dropdown)

7. URGENCY
   └─> User selects urgency (buttons)

8. BUDGET
   └─> "What's your budget range?"

9. CONFIRMATION
   └─> Shows summary + Confirm button

10. HANDOFF
    └─> Triggers onComplete callback

11. COMPLETE
    └─> Success message
```

---

## 🎯 API Endpoints

### Process Message
```typescript
POST /api/chatbot/message

Request:
{
  "message": "I need help with university applications",
  "currentStep": "greeting",
  "domain": null,
  "intakeState": { /* current state */ }
}

Response:
{
  "success": true,
  "data": {
    "response": "Please describe your situation...",
    "intent": "info_provided",
    "entities": {
      "domain": "Education",
      "keywords": ["university", "applications"]
    },
    "requiresRedirect": false,
    "validation": { "isValid": true }
  }
}
```

---

## 🚫 What Gets Blocked

### Advice Requests
```
❌ "What should I do?"
❌ "Which university is better?"
❌ "Recommend me a strategy"
❌ "Is it good to...?"
❌ "Should I go with...?"

✅ Redirect: "A consultant can help with that. Let me collect details..."
```

### Off-Topic
```
❌ Weather queries
❌ Sports questions
❌ Movie recommendations
❌ Political discussions

✅ Redirect: "I'm here to help with Education, Business, or Legal..."
```

---

## 🛡️ Domain Guardrails

### Education
```
❌ NEVER: Recommend universities
❌ NEVER: Guarantee admissions
✅ ALWAYS: Add disclaimer about outcomes
```

### Business
```
❌ NEVER: Suggest strategies
❌ NEVER: Estimate profits
✅ ALWAYS: Mention market conditions
```

### Legal
```
❌ NEVER: Interpret laws
❌ NEVER: Recommend actions
✅ ALWAYS: "This is not legal advice"
```

---

## 🔧 Configuration

### Rate Limiting (Default)
```typescript
10 messages per minute per IP
```

**Change in:** `backend/src/modules/chatbot/chatbot.routes.ts`

### Message Length (Default)
```typescript
500 characters maximum
```

**Change in:** `backend/src/modules/chatbot/chatbot.controller.ts`

### Groq Settings
```typescript
model: 'llama-3.3-70b-versatile'
temperature: 0.2  // Low = deterministic
max_tokens: 256   // Short responses
```

**Change in:** `backend/src/services/intakeAssistant.service.ts`

---

## 🧪 Testing

### Run Test Suite
```bash
cd backend
npx ts-node scripts/test-intake-assistant.ts
```

### Manual Testing Checklist
- [ ] Try advice request → Should redirect
- [ ] Try off-topic → Should redirect  
- [ ] Complete full flow → Should reach confirmation
- [ ] Test correction → Should update data
- [ ] Test each domain → Should show disclaimers
- [ ] Rapid fire messages → Should hit rate limit

---

## 🐛 Common Issues

### Issue: "Too many messages"
**Cause:** Rate limit hit (10/min)  
**Fix:** Wait 1 minute or increase limit

### Issue: Entity extraction fails
**Cause:** Groq API issue or invalid input  
**Fix:** Check API key, verify model availability

### Issue: Response gives advice
**Cause:** System prompt violation  
**Fix:** Check `containsAdvice()` validator, lower temperature

### Issue: Steps skip
**Cause:** Validation passing incorrectly  
**Fix:** Check `validateStep()` logic

---

## 📊 Data Structure

### IntakeState
```typescript
{
  currentStep: IntakeStep,           // Current position in flow
  domain?: 'Education' | 'Business' | 'Legal',
  problemSummary?: string,           // Accumulated description
  timeline?: string,                 // When needed
  location?: string,                 // City or Remote
  urgency?: 'Immediate' | 'Soon' | 'Flexible',
  budgetMin?: number,                // PKR
  budgetMax?: number,                // PKR
  extractedKeywords: string[],       // AI-extracted terms
  messages: IntakeMessage[],         // Full conversation
  progress: number,                  // 0-100%
}
```

---

## 💡 Best Practices

### ✅ DO
- Keep responses professional (no emojis)
- Validate every step before proceeding
- Log rejected intents for monitoring
- Use quick action buttons for common inputs
- Show progress to users
- Provide clear confirmation summary

### ❌ DON'T
- Skip steps in the flow
- Allow advice in responses
- Ignore rate limiting
- Store raw chat logs unnecessarily
- Let users submit without confirmation
- Use high temperature (keeps deterministic)

---

## 🔒 Security Checklist

- [x] Rate limiting enabled
- [x] Input validation (500 char)
- [x] Sensitive data masking (CNIC, phone, email, bank)
- [x] Intent classification for malicious queries
- [x] Low temperature (0.2)
- [x] Strict system prompts
- [x] Domain-specific guardrails
- [x] Advice request blocking
- [x] Off-topic redirect
- [x] Error recovery

---

## 📞 Need Help?

1. Read full docs: `INTAKE_ASSISTANT_IMPLEMENTATION.md`
2. Check code comments in service files
3. Run test suite to verify behavior
4. Review Groq API logs if errors occur

---

## 🎓 Example Usage

### Basic Usage
```tsx
import { IntakeAssistantWidget } from '../components/chatbot';

function ConsultantRequestPage() {
  return (
    <div>
      <h1>Find a Consultant</h1>
      <IntakeAssistantWidget
        onComplete={(data) => {
          // Submit to backend
          submitRequest(data);
        }}
      />
    </div>
  );
}
```

### With Custom Handling
```tsx
function PostJobPage() {
  const [jobData, setJobData] = useState(null);

  const handleIntakeComplete = async (data) => {
    // Transform intake data to job format
    const job = {
      category: data.domain,
      title: generateTitle(data.description),
      description: data.description,
      budget: {
        min: data.budgetMin,
        max: data.budgetMax,
      },
      timeline: data.timeline,
      location: data.location,
      urgency: data.urgency,
      skills: data.keywords,
    };

    // Post job
    const response = await httpClient.post('/jobs', job);
    navigate(`/job/${response.data.id}`);
  };

  return <IntakeAssistantWidget onComplete={handleIntakeComplete} />;
}
```

---

**That's it!** The intake assistant is now ready to use. 🎉

For detailed implementation info, see `INTAKE_ASSISTANT_IMPLEMENTATION.md`
