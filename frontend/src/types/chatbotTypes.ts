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
    'Business Law',
    'Contract Law',
    'Employment Law',
    'Intellectual Property',
    'Real Estate Law',
    'Family Law',
    'Criminal Law',
    'Tax Law',
] as const;

export type Category = typeof CATEGORIES[number];
