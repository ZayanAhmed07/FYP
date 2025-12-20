/**
 * Frontend Intake Assistant Types
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

export interface IntakeMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  intent?: IntakeIntent;
  isTyping?: boolean;
}

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
  messages: IntakeMessage[];
  isOpen: boolean;
  progress: number;
}

export interface IntakeApiResponse {
  success: boolean;
  data: {
    response: string;
    intent: IntakeIntent;
    entities: {
      domain?: IntakeDomain;
      location?: string;
      timeline?: string;
      budgetMin?: number;
      budgetMax?: number;
      keywords: string[];
    };
    requiresRedirect: boolean;
    validation: {
      isValid: boolean;
      message?: string;
    };
  };
}

/**
 * Step progress mapping
 */
export const INTAKE_PROGRESS: Record<IntakeStep, number> = {
  greeting: 0,
  domain_classification: 14,
  problem_summary: 28,
  context_questions: 42,
  timeline: 57,
  location: 71,
  urgency: 85,
  budget: 90,
  confirmation: 95,
  handoff: 98,
  complete: 100,
};

/**
 * Step display names
 */
export const STEP_NAMES: Record<IntakeStep, string> = {
  greeting: 'Welcome',
  domain_classification: 'Select Domain',
  problem_summary: 'Describe Need',
  context_questions: 'Provide Context',
  timeline: 'Timeline',
  location: 'Location',
  urgency: 'Urgency Level',
  budget: 'Budget Range',
  confirmation: 'Review Details',
  handoff: 'Connecting...',
  complete: 'Complete',
};

/**
 * Pakistani cities for dropdown
 */
export const PAKISTANI_CITIES = [
  'Rawalpindi',
  'Islamabad',
  'Lahore',
  'Karachi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Remote',
];

/**
 * Urgency levels
 */
export const URGENCY_LEVELS: Array<'Immediate' | 'Soon' | 'Flexible'> = [
  'Immediate',
  'Soon',
  'Flexible',
];

/**
 * Domain colors for UI
 */
export const DOMAIN_COLORS: Record<IntakeDomain, string> = {
  Education: '#3b82f6',
  Business: '#10b981',
  Legal: '#8b5cf6',
};
