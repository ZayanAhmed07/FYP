import Groq from 'groq-sdk';
import env from '../config/env';
import {
  IntakeIntent,
  IntakeDomain,
  IntakeStep,
  IntentClassificationResult,
  EntityExtractionResult,
  DOMAIN_GUARDRAILS,
  SENSITIVE_PATTERNS,
  ADVICE_PATTERNS,
  OFF_TOPIC_PATTERNS,
  VALID_LOCATIONS,
} from '../types/intake.types';

/**
 * Professional Intake Assistant Service
 * Implements deterministic, controlled conversation flow with strict guardrails
 */
class IntakeAssistantService {
  private groq: Groq;
  private model = 'llama-3.3-70b-versatile';
  
  // Low temperature for deterministic responses
  private readonly TEMPERATURE = 0.2;
  private readonly MAX_TOKENS = 256;

  constructor() {
    this.groq = new Groq({
      apiKey: env.GROQ_API_KEY || '',
    });
  }

  /**
   * Classify user intent with confidence scoring
   */
  async classifyIntent(
    userMessage: string,
    currentStep: IntakeStep
  ): Promise<IntentClassificationResult> {
    // Check for advice requests first (highest priority)
    if (this.isAdviceRequest(userMessage)) {
      return {
        intent: 'advice_request',
        confidence: 1.0,
        requiresRedirect: true,
        redirectMessage:
          "I understand you're looking for guidance. While I can't provide advice, I can connect you with a qualified consultant who can help. Let me collect a few details first.",
      };
    }

    // Check for off-topic
    if (this.isOffTopic(userMessage)) {
      return {
        intent: 'off_topic',
        confidence: 1.0,
        requiresRedirect: true,
        redirectMessage:
          "I'm here to help you connect with professional consultants in Education, Business, or Legal fields. What kind of assistance are you looking for?",
      };
    }

    // Check for greetings
    if (this.isGreeting(userMessage)) {
      return {
        intent: 'greeting',
        confidence: 1.0,
        requiresRedirect: false,
      };
    }

    // Check for confirmation
    if (this.isConfirmation(userMessage)) {
      return {
        intent: 'confirmation',
        confidence: 1.0,
        requiresRedirect: false,
      };
    }

    // Check for correction intent
    if (this.isCorrection(userMessage)) {
      return {
        intent: 'correction',
        confidence: 0.9,
        requiresRedirect: false,
      };
    }

    // Default to info_provided
    return {
      intent: 'info_provided',
      confidence: 0.8,
      requiresRedirect: false,
    };
  }

  /**
   * Extract entities from user message using NER
   */
  async extractEntities(
    userMessage: string,
    currentStep: IntakeStep
  ): Promise<EntityExtractionResult> {
    const entities: EntityExtractionResult = {
      keywords: [],
    };

    // Mask sensitive data
    const sanitized = this.maskSensitiveData(userMessage);

    try {
      const systemPrompt = `You are an entity extraction system. Extract ONLY factual information.
NEVER provide advice or recommendations.
Return ONLY a JSON object with extracted entities.

Current step: ${currentStep}

Extract:
- domain: Education | Business | Legal (if mentioned)
- location: Pakistani city or Remote
- timeline: exact timeline mentioned
- budgetMin: minimum budget in PKR (number only)
- budgetMax: maximum budget in PKR (number only)
- keywords: array of relevant non-sensitive keywords

If not found, omit the field. Return valid JSON only.`;

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract entities from: "${sanitized}"` },
        ],
        model: this.model,
        temperature: this.TEMPERATURE,
        max_tokens: 256,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : '{}';
      const extracted = JSON.parse(jsonStr);

      // Validate and normalize entities
      if (extracted.domain && ['Education', 'Business', 'Legal'].includes(extracted.domain)) {
        entities.domain = extracted.domain as IntakeDomain;
      }

      if (extracted.location) {
        entities.location = this.normalizeLocation(extracted.location);
      }

      if (extracted.timeline) {
        entities.timeline = extracted.timeline;
      }

      if (extracted.budgetMin && typeof extracted.budgetMin === 'number') {
        entities.budgetMin = extracted.budgetMin;
      }

      if (extracted.budgetMax && typeof extracted.budgetMax === 'number') {
        entities.budgetMax = extracted.budgetMax;
      }

      if (Array.isArray(extracted.keywords)) {
        entities.keywords = extracted.keywords.filter(
          (k: any) => typeof k === 'string' && k.length > 0
        );
      }

      return entities;
    } catch (error: any) {
      console.error('Entity extraction error:', error.message);
      return { keywords: [] };
    }
  }

  /**
   * Generate controlled response based on step and intent
   */
  async generateResponse(
    userMessage: string,
    currentStep: IntakeStep,
    domain?: IntakeDomain,
    intentResult?: IntentClassificationResult
  ): Promise<string> {
    // Handle redirects first
    if (intentResult?.requiresRedirect && intentResult.redirectMessage) {
      return intentResult.redirectMessage;
    }

    // Get step-specific prompt
    const stepPrompt = this.getStepPrompt(currentStep, domain);

    try {
      const systemPrompt = this.buildSystemPrompt(currentStep, domain);

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
          { role: 'assistant', content: stepPrompt },
        ],
        model: this.model,
        temperature: this.TEMPERATURE,
        max_tokens: this.MAX_TOKENS,
      });

      let response = completion.choices[0]?.message?.content || stepPrompt;

      // Enforce domain-specific disclaimers for certain steps
      if (domain && currentStep === 'problem_summary') {
        response = this.addDomainDisclaimer(response, domain);
      }

      // Validate response doesn't give advice
      if (this.containsAdvice(response)) {
        return stepPrompt; // Fallback to safe prompt
      }

      return response;
    } catch (error: any) {
      console.error('Response generation error:', error.message);
      return stepPrompt; // Always fallback to deterministic prompt
    }
  }

  /**
   * Build system prompt with strict guardrails
   */
  private buildSystemPrompt(currentStep: IntakeStep, domain?: IntakeDomain): string {
    const baseRules = `You are a professional intake assistant for a consulting platform.

STRICT RULES - NEVER VIOLATE:
1. You are NOT a consultant - you only collect information
2. NEVER give advice, opinions, or recommendations
3. NEVER answer "what should I do?" questions
4. NEVER interpret laws or regulations
5. NEVER guarantee outcomes or results
6. NEVER recommend specific consultants, universities, or businesses
7. Ask ONE question at a time
8. Keep responses to 1-2 sentences maximum
9. Be professional, neutral, and calm
10. NO emojis, NO slang

YOUR ONLY JOB:
- Collect structured information
- Qualify the user's needs
- Route them to the correct consultant

ALLOWED LANGUAGE:
- "A consultant can help with..."
- "Let me collect a few details..."
- "I'll connect you with the right expert..."

Current step: ${currentStep}
${domain ? `Domain: ${domain}` : ''}`;

    // Add domain-specific prohibitions
    if (domain) {
      const guardrails = DOMAIN_GUARDRAILS[domain];
      return `${baseRules}

DOMAIN-SPECIFIC PROHIBITIONS for ${domain}:
${guardrails.prohibited.map((p) => `- NEVER ${p}`).join('\n')}

If user asks for advice, respond: "${guardrails.disclaimers[0]}"`;
    }

    return baseRules;
  }

  /**
   * Get step-specific prompt (deterministic fallback)
   */
  private getStepPrompt(currentStep: IntakeStep, domain?: IntakeDomain): string {
    const prompts: Record<IntakeStep, string> = {
      greeting:
        "Hello. I'm here to help you connect with qualified consultants in Education, Business, or Legal fields in Pakistan. Which area do you need assistance with?",
      domain_classification:
        'Which area do you need help with: Education, Business, or Legal?',
      problem_summary:
        'Please describe your situation briefly. What specific assistance are you looking for?',
      context_questions:
        'Thank you. To better understand your needs, could you provide a bit more context?',
      timeline: 'When do you need this assistance? For example: immediately, within a week, or flexible.',
      location:
        'Where are you located or where would you prefer the consultation? Options: Rawalpindi, Islamabad, Lahore, Karachi, or Remote.',
      urgency: 'How urgent is this matter? Immediate, Soon, or Flexible?',
      budget: 'What is your budget range for this consultation in PKR? For example: 5000 to 10000.',
      confirmation:
        'Let me confirm the details. I will show you a summary shortly. Would you like to review it?',
      handoff:
        'Perfect. I will now connect you with qualified consultants who match your requirements.',
      complete: 'Thank you. Your request has been submitted successfully.',
    };

    let prompt = prompts[currentStep];

    // Add domain-specific disclaimers
    if (domain && currentStep === 'problem_summary') {
      const disclaimer = DOMAIN_GUARDRAILS[domain].disclaimers[0];
      prompt = `${prompt} Note: ${disclaimer}`;
    }

    return prompt;
  }

  /**
   * Detect advice requests using pattern matching
   */
  private isAdviceRequest(message: string): boolean {
    return ADVICE_PATTERNS.some((pattern) => pattern.test(message));
  }

  /**
   * Detect off-topic messages
   */
  private isOffTopic(message: string): boolean {
    return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(message));
  }

  /**
   * Detect greetings
   */
  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'];
    const lower = message.toLowerCase().trim();
    return greetings.some((g) => lower.startsWith(g) && message.split(' ').length <= 3);
  }

  /**
   * Detect confirmation
   */
  private isConfirmation(message: string): boolean {
    const confirmations = [
      'yes',
      'yeah',
      'sure',
      'ok',
      'okay',
      'correct',
      'right',
      'proceed',
      'continue',
      'confirm',
    ];
    const lower = message.toLowerCase().trim();
    return confirmations.includes(lower) || /^(yes|yeah|ok|okay)\b/i.test(message);
  }

  /**
   * Detect correction intent
   */
  private isCorrection(message: string): boolean {
    const corrections = ['no', 'wrong', 'incorrect', 'change', 'update', 'edit', 'fix', 'mistake'];
    const lower = message.toLowerCase();
    return corrections.some((c) => lower.includes(c));
  }

  /**
   * Check if response contains advice (safety check)
   */
  private containsAdvice(response: string): boolean {
    const adviceIndicators = [
      'you should',
      'i recommend',
      'i suggest',
      'you must',
      'you need to',
      'the best option',
      'i would do',
      'go with',
    ];
    const lower = response.toLowerCase();
    return adviceIndicators.some((indicator) => lower.includes(indicator));
  }

  /**
   * Mask sensitive data
   */
  private maskSensitiveData(text: string): string {
    let masked = text;
    
    // Mask CNIC
    masked = masked.replace(SENSITIVE_PATTERNS.cnic, '[CNIC REMOVED]');
    
    // Mask phone numbers
    masked = masked.replace(SENSITIVE_PATTERNS.phone, '[PHONE REMOVED]');
    
    // Mask emails
    masked = masked.replace(SENSITIVE_PATTERNS.email, '[EMAIL REMOVED]');
    
    // Mask bank accounts
    masked = masked.replace(SENSITIVE_PATTERNS.bankAccount, '[ACCOUNT REMOVED]');
    
    return masked;
  }

  /**
   * Normalize location to valid Pakistani cities
   */
  private normalizeLocation(location: string): string {
    const lower = location.toLowerCase().trim();
    
    // Direct matches
    for (const validLoc of VALID_LOCATIONS) {
      if (lower === validLoc.toLowerCase()) {
        return validLoc;
      }
    }
    
    // Partial matches
    if (lower.includes('remote') || lower.includes('online') || lower.includes('anywhere')) {
      return 'Remote';
    }
    if (lower.includes('isb') || lower.includes('islamabad')) return 'Islamabad';
    if (lower.includes('pindi') || lower.includes('rawalpindi')) return 'Rawalpindi';
    if (lower.includes('lahore') || lower.includes('lhr')) return 'Lahore';
    if (lower.includes('karachi') || lower.includes('khi')) return 'Karachi';
    
    return location; // Return original if no match
  }

  /**
   * Add domain-specific disclaimers
   */
  private addDomainDisclaimer(response: string, domain: IntakeDomain): string {
    const disclaimer = DOMAIN_GUARDRAILS[domain].disclaimers[0];
    
    // Only add if not already present
    if (!response.toLowerCase().includes(disclaimer.toLowerCase())) {
      return `${response} ${disclaimer}`;
    }
    
    return response;
  }

  /**
   * Validate step completion
   */
  validateStep(currentStep: IntakeStep, state: any): { isValid: boolean; message?: string } {
    switch (currentStep) {
      case 'domain_classification':
        if (!state.domain) {
          return { isValid: false, message: 'Please select a domain: Education, Business, or Legal.' };
        }
        break;
      case 'problem_summary':
        if (!state.problemSummary || state.problemSummary.length < 10) {
          return { isValid: false, message: 'Please provide more details about your needs.' };
        }
        break;
      case 'timeline':
        if (!state.timeline) {
          return { isValid: false, message: 'Please specify your timeline.' };
        }
        break;
      case 'location':
        if (!state.location) {
          return { isValid: false, message: 'Please specify your preferred location.' };
        }
        break;
      case 'urgency':
        if (!state.urgency) {
          return { isValid: false, message: 'Please specify the urgency: Immediate, Soon, or Flexible.' };
        }
        break;
      case 'budget':
        if (!state.budgetMin) {
          return { isValid: false, message: 'Please provide your budget range.' };
        }
        break;
    }

    return { isValid: true };
  }
}

export default new IntakeAssistantService();
