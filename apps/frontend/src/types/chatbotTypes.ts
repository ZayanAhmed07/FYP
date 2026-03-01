export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'assistant';
    timestamp: Date;
    isTyping?: boolean;
}

export interface JobData {
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    timeline: string;
    location: string;
    skills: string[];
}

export type ConversationStep =
    | 'welcome'
    | 'description'
    | 'category'
    | 'budget'
    | 'timeline'
    | 'location'
    | 'summary'
    | 'complete';

export interface ConversationState {
    currentStep: ConversationStep;
    progress: number;
    jobData: Partial<JobData>;
    messages: ChatMessage[];
    isOpen: boolean;
}

export const CATEGORIES = [
    'Education',
    'Business',
    'Legal',
] as const;

export type Category = typeof CATEGORIES[number];

// Skill keywords for automatic extraction
export const SKILL_KEYWORDS: Record<string, string[]> = {
    Education: ['teaching', 'tutoring', 'curriculum', 'student', 'learning', 'exam', 'homework', 'study', 'math', 'science', 'english', 'counseling', 'SAT', 'test prep'],
    Business: ['marketing', 'sales', 'strategy', 'finance', 'accounting', 'management', 'consulting', 'planning', 'development', 'project', 'operations', 'supply chain', 'digital'],
    Legal: ['contract', 'law', 'legal', 'compliance', 'regulation', 'litigation', 'corporate', 'tax law', 'employment law', 'intellectual property', 'patent', 'trademark'],
};
