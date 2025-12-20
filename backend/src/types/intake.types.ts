/**
 * Professional Intake Assistant Types
 * Defines strict conversation flow and intent handling
 */

export type IntakeIntent =
  | 'greeting'
  | 'domain_selection'
  | 'info_provided'
  | 'advice_request'
  | 'off_topic'
  | 'confirmation'
  | 'correction'
  | 'unclear';

export type IntakeDomain = 'Education' | 'Business' | 'Legal';

export type IntakeStep =
  | 'greeting'
  | 'domain_classification'
  | 'problem_summary'
  | 'context_questions'
  | 'timeline'
  | 'location'
  | 'urgency'
  | 'budget'
  | 'confirmation'
  | 'handoff'
  | 'complete';

export interface IntakeState {
  currentStep: IntakeStep;
  domain?: IntakeDomain;
  problemSummary?: string;
  timeline?: string;
  location?: string;
  urgency?: 'Immediate' | 'Soon' | 'Flexible';
  budgetMin?: number;
  budgetMax?: number;
  extractedKeywords: string[];
  conversationHistory: ConversationMessage[];
  isComplete: boolean;
}

export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  intent?: IntakeIntent;
}

export interface IntentClassificationResult {
  intent: IntakeIntent;
  confidence: number;
  requiresRedirect: boolean;
  redirectMessage?: string;
}

export interface EntityExtractionResult {
  domain?: IntakeDomain;
  location?: string;
  timeline?: string;
  budgetMin?: number;
  budgetMax?: number;
  keywords: string[];
}

export interface IntakeFlowValidation {
  isValid: boolean;
  canProceed: boolean;
  missingFields: string[];
  currentStep: IntakeStep;
  nextStep: IntakeStep | null;
}

/**
 * Domain-specific guardrails
 */
export const DOMAIN_GUARDRAILS = {
  Education: {
    prohibited: [
      'guarantee admission',
      'guarantee results',
      'recommend specific university',
      'provide career advice without context',
    ],
    disclaimers: [
      'A qualified education consultant can help you explore options',
      'Admission outcomes depend on many factors and cannot be guaranteed',
    ],
  },
  Business: {
    prohibited: [
      'guarantee profits',
      'recommend specific investments',
      'provide tax advice',
      'predict market outcomes',
    ],
    disclaimers: [
      'A business consultant can help you develop strategies',
      'Business outcomes depend on market conditions and execution',
    ],
  },
  Legal: {
    prohibited: [
      'interpret specific laws',
      'recommend legal actions',
      'guarantee case outcomes',
      'act as legal counsel',
    ],
    disclaimers: [
      'A licensed legal consultant can review your situation',
      'This is not legal advice - consult a qualified attorney',
      'Legal outcomes vary based on individual circumstances',
    ],
  },
} as const;

/**
 * Step transition rules
 */
export const STEP_TRANSITIONS: Record<IntakeStep, IntakeStep> = {
  greeting: 'domain_classification',
  domain_classification: 'problem_summary',
  problem_summary: 'context_questions',
  context_questions: 'timeline',
  timeline: 'location',
  location: 'urgency',
  urgency: 'budget',
  budget: 'confirmation',
  confirmation: 'handoff',
  handoff: 'complete',
  complete: 'complete',
};

/**
 * Required fields for each step
 */
export const STEP_REQUIREMENTS: Record<IntakeStep, string[]> = {
  greeting: [],
  domain_classification: ['domain'],
  problem_summary: ['problemSummary'],
  context_questions: ['problemSummary'],
  timeline: ['timeline'],
  location: ['location'],
  urgency: ['urgency'],
  budget: ['budgetMin'],
  confirmation: ['domain', 'problemSummary', 'timeline', 'location', 'urgency'],
  handoff: ['domain', 'problemSummary', 'timeline', 'location', 'urgency'],
  complete: [],
};

/**
 * Pakistani cities for location validation
 */
export const VALID_LOCATIONS = [
  'Rawalpindi',
  'Islamabad',
  'Lahore',
  'Karachi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Remote',
  'Online',
] as const;

/**
 * Sensitive data patterns to detect and mask
 */
export const SENSITIVE_PATTERNS = {
  cnic: /\b\d{5}-\d{7}-\d{1}\b/g,
  phone: /\b(\+92|0)?3\d{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  bankAccount: /\b\d{16,20}\b/g,
};

/**
 * Advice request patterns
 */
export const ADVICE_PATTERNS = [
  /what should i do/i,
  /which .* should i/i,
  /recommend me/i,
  /suggest me/i,
  /what do you think/i,
  /is it good to/i,
  /should i go with/i,
  /which is better/i,
  /give me advice/i,
  /what would you do/i,
];

/**
 * Off-topic patterns
 */
export const OFF_TOPIC_PATTERNS = [
  /weather/i,
  /sports/i,
  /politics/i,
  /recipe/i,
  /movie/i,
  /game/i,
  /celebrity/i,
];
