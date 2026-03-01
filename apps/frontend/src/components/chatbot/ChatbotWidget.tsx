import { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Fab, Paper, Typography, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';
import ProgressIndicator from './ProgressIndicator';
import type { ChatMessage as ChatMessageType, ConversationState, ConversationStep } from '../../types/chatbotTypes';
import { SKILL_KEYWORDS } from '../../types/chatbotTypes';
import { sarahAI } from '../../services/rachelAI.service';

// Valid options for location
const VALID_LOCATIONS = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Remote (Pakistan)'];
const MINIMUM_WORDS = 100;

// Word counter utility
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

interface ChatbotWidgetProps {
    initialOpen?: boolean;
    onJobDataChange?: (jobData: any, progress: number, currentStep: ConversationStep) => void;
}

const ChatbotWidget = ({ initialOpen = false, onJobDataChange }: ChatbotWidgetProps) => {
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [state, setState] = useState<ConversationState>({
        currentStep: 'welcome',
        progress: 0,
        jobData: {},
        messages: [],
        isOpen: initialOpen,
    });

    // Notify parent component when job data changes
    useEffect(() => {
        if (onJobDataChange) {
            onJobDataChange(state.jobData, state.progress, state.currentStep);
        }
    }, [state.jobData, state.progress, state.currentStep, onJobDataChange]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [state.messages]);

    // Auto-scroll when new message is added
    useEffect(() => {
        const timer = setTimeout(() => scrollToBottom(), 100);
        return () => clearTimeout(timer);
    }, [state.messages.length]);

    const addMessage = (text: string, sender: 'user' | 'assistant', isTyping = false) => {
        // Check if the last message is identical to what we're trying to add (for duplicate prevention)
        const lastMessage = state.messages[state.messages.length - 1];
        if (lastMessage && lastMessage.text === text && lastMessage.sender === sender && !isTyping) {
            console.warn('[Duplicate Prevention] Skipping duplicate message:', text);
            return lastMessage.id;
        }
        
        const newMessage: ChatMessageType = {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date(),
            isTyping,
        };
        setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage],
        }));
        return newMessage.id;
    };

    const updateMessage = (id: string, updates: Partial<ChatMessageType>) => {
        setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => msg.id === id ? { ...msg, ...updates } : msg),
        }));
    };

    // Sub-categories for each main category
    const SUB_CATEGORIES = {
        Education: ['Tutoring', 'Test Preparation', 'Academic Consulting', 'Career Counseling', 'Curriculum Development'],
        Business: ['Marketing Strategy', 'Financial Planning', 'Business Development', 'Project Management', 'HR Consulting'],
        Legal: ['Contract Review', 'Legal Compliance', 'Litigation Support', 'Corporate Law', 'Intellectual Property'],
    };

    const getNextStep = (current: ConversationStep): ConversationStep => {
        // Strict 6-step flow: category -> subcategory -> description -> location -> budget -> timeline -> summary
        const steps: ConversationStep[] = ['welcome', 'category', 'description', 'location', 'budget', 'timeline', 'summary', 'complete'];
        const currentIndex = steps.indexOf(current);
        return steps[currentIndex + 1] || 'complete';
    };

    const calculateProgress = (step: ConversationStep): number => {
        const progressMap: Record<ConversationStep, number> = {
            welcome: 0,
            category: 16,      // Step 1: Consultancy Type
            description: 33,   // Step 2 & 3: Sub-category + Description
            location: 50,      // Step 4: Location
            budget: 66,        // Step 5: Budget
            timeline: 83,      // Step 6: Timeline
            summary: 95,
            complete: 100,
        };
        return progressMap[step];
    };

    const simulateTyping = async (text: string, useAI: boolean = false): Promise<string> => {
        setIsTyping(true);
        const typingId = addMessage('', 'assistant', true);

        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, useAI ? 1200 : 800 + Math.random() * 400));

        updateMessage(typingId, { text, isTyping: false });
        setIsTyping(false);
        return typingId;
    };

    const getAssistantMessage = (step: ConversationStep, additionalData?: any): string => {
        const messages: Record<ConversationStep, string> = {
            welcome: "Hi! 👋 I'm Sarah, your Raah assistant. I'll help you post your job and connect with qualified Pakistani consultants in Education, Business, and Legal fields.\n\nLet's get started! **Step 1 of 6**: What type of consultancy do you need?",
            category: "Great choice! What type of consultancy do you need? Choose from the options below:",
            description: additionalData?.subCategory 
                ? `Perfect! You've selected **${additionalData.subCategory}** in **${additionalData.category || state.jobData.category}**.\n\n**Step 3 of 6**: Now, please describe your project in detail. What are your requirements, goals, and expectations? (Minimum 100 words)`
                : `**Step 2 of 6**: What specific area within ${additionalData?.category || state.jobData.category || 'your selected field'} do you need help with?`,
            location: `Excellent! I've enhanced your description to:\n\n"${additionalData?.enhancedDescription || state.jobData.enhancedDescription}"\n\n**Step 4 of 6**: Where would you like the consultant to work?`,
            budget: "Great! **Step 5 of 6**: What's your budget for this project? You can say something like '10000 to 50000' or just '25000'. I work in PKR (Pakistani Rupees).",
            timeline: "Perfect! **Step 6 of 6**: When do you need this completed? For example: '2 weeks', '1 month', 'ASAP', or a specific date.",
            summary: `Excellent! Here's your complete job posting:\n\n📁 **Category**: ${state.jobData.category || 'Not set'} - ${state.jobData.subCategory || 'Not set'}\n📋 **Description**: ${state.jobData.enhancedDescription || state.jobData.description || 'Not set'}\n💰 **Budget**: PKR ${state.jobData.budgetMin?.toLocaleString() || '0'} - ${state.jobData.budgetMax?.toLocaleString() || '0'}\n⏰ **Timeline**: ${state.jobData.timeline || 'Not set'}\n📍 **Location**: ${state.jobData.location || 'Not set'}\n\nYou can review and edit the preview on the right. Click "Post Job" when ready!`,
            complete: "Perfect! Your job has been prepared. Review the details and click Post Job to publish it.",
        };
        return messages[step];
    };

    const handleCategorySelect = async (category: string) => {
        addMessage(category, 'user');
        
        setState(prev => ({
            ...prev,
            jobData: { 
                ...prev.jobData, 
                category
            },
            currentStep: 'description', // Go to subcategory selection (shown as description step)
            progress: calculateProgress('description'),
        }));
        // Acknowledge selection to avoid confusion that the previous reply belongs to next step
        await simulateTyping(`✅ Category set to ${category}.`);
        await simulateTyping(getAssistantMessage('description', { category }));
    };

    const handleSubCategorySelect = async (subCategory: string) => {
        addMessage(subCategory, 'user');
        
        setState(prev => ({
            ...prev,
            jobData: { 
                ...prev.jobData, 
                subCategory
            },
        }));
        await simulateTyping(`✅ Sub-category set to ${subCategory}.`);
        await simulateTyping(getAssistantMessage('description', { subCategory, category: state.jobData.category }));
    };

    const handleLocationSelect = async (location: string) => {
        addMessage(location, 'user');
        
        setState(prev => ({
            ...prev,
            jobData: { ...prev.jobData, location },
            currentStep: 'budget',
            progress: calculateProgress('budget'),
        }));
        await simulateTyping(`✅ Location set to ${location}.`);
        await simulateTyping(getAssistantMessage('budget'));
    };

    // Smart skill extraction from description
    const extractSkillsFromDescription = (description: string, category: string): string[] => {
        const lowerDesc = description.toLowerCase();
        const skills: string[] = [];
        const categorySkills = SKILL_KEYWORDS[category as keyof typeof SKILL_KEYWORDS] || [];
        
        categorySkills.forEach(keyword => {
            if (lowerDesc.includes(keyword.toLowerCase())) {
                // Capitalize first letter
                const skill = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                if (!skills.includes(skill)) {
                    skills.push(skill);
                }
            }
        });
        
        return skills.slice(0, 6); // Limit to 6 skills
    };

    const handleSummaryAction = async (action: 'post' | 'edit') => {
        if (action === 'post') {
            addMessage('Yes, post this job!', 'user');
            setState(prev => ({
                ...prev,
                currentStep: 'complete',
                progress: 100,
            }));
            await simulateTyping(getAssistantMessage('complete'));

            // Redirect to post job page with pre-filled data
            setTimeout(() => {
                navigate('/post-job', { state: { chatbotData: state.jobData } });
                setState(prev => ({ ...prev, isOpen: false }));
            }, 1500);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isTyping) return;

        const userMessage = inputValue.trim();
        
        // Add user message only once
        addMessage(userMessage, 'user');
        setInputValue('');

        const currentStep = state.currentStep;

        try {
            let updatedJobData = { ...state.jobData };
            let nextStep = currentStep;

            // Step 1: Welcome -> Category selection is automatic (buttons shown on welcome)
            if (currentStep === 'welcome') {
                // User shouldn't be typing during welcome, buttons should be used
                await simulateTyping("Please select a consultancy type from the options above.");
                return;
            }

            // Step 2 & 3: Sub-category -> Description (150+ words minimum)
            if (currentStep === 'description') {
                // If no subcategory selected yet, they shouldn't be typing
                if (!state.jobData.subCategory) {
                    await simulateTyping("Please select a sub-category from the options above first.");
                    return;
                }

                // Collect description
                const description = state.jobData.rawDescription 
                    ? `${state.jobData.rawDescription} ${userMessage}`.trim()
                    : userMessage;
                
                const wordCount = countWords(description);
                
                if (wordCount < MINIMUM_WORDS) {
                    updatedJobData.rawDescription = description;
                    setState(prev => ({
                        ...prev,
                        jobData: updatedJobData,
                    }));
                    await simulateTyping(`You've provided ${wordCount} words. Please add ${MINIMUM_WORDS - wordCount} more words to give me a complete understanding of your project.`, true);
                    return;
                }
                
                // Description meets minimum, enhance it with AI
                try {
                    const aiResponse = await sarahAI.enhanceDescription(description, state.jobData.category || '');
                    updatedJobData.rawDescription = description;
                    updatedJobData.description = description;
                    updatedJobData.enhancedDescription = aiResponse.enhanced || description;
                    
                    // Extract skills
                    const detectedSkills = await sarahAI.extractSkills(description, state.jobData.category || '');
                    updatedJobData.skills = detectedSkills;
                    
                    nextStep = 'location';
                } catch (error) {
                    console.error('AI enhancement error:', error);
                    // Fallback: use original description
                    updatedJobData.rawDescription = description;
                    updatedJobData.description = description;
                    updatedJobData.enhancedDescription = description;
                    updatedJobData.skills = extractSkillsFromDescription(description, state.jobData.category || '');
                    nextStep = 'location';
                }
                
                setState(prev => ({
                    ...prev,
                    jobData: updatedJobData,
                    currentStep: nextStep,
                    progress: calculateProgress(nextStep),
                }));
                await simulateTyping(getAssistantMessage(nextStep, { enhancedDescription: updatedJobData.enhancedDescription }));
                return;
            }

            // Step 4: Location (handled by buttons)
            if (currentStep === 'location') {
                await simulateTyping("Please select a location from the options above.");
                return;
            }

            // Step 5: Budget
            if (currentStep === 'budget') {
                const budgetInfo = parseBudget(userMessage);
                if (budgetInfo) {
                    updatedJobData.budgetMin = budgetInfo.min;
                    updatedJobData.budgetMax = budgetInfo.max;
                    nextStep = 'timeline';
                } else {
                    await simulateTyping("I didn't quite catch that. Please tell me your budget like '10000 to 50000' or just '25000' in PKR.", true);
                    return;
                }
            }
            // Step 6: Timeline
            else if (currentStep === 'timeline') {
                updatedJobData.timeline = userMessage;
                nextStep = 'summary';
            }

            setState(prev => ({
                ...prev,
                jobData: updatedJobData,
                currentStep: nextStep,
                progress: calculateProgress(nextStep),
            }));

            await simulateTyping(getAssistantMessage(nextStep), true);

        } catch (error) {
            console.error('Sarah AI error:', error);
            await simulateTyping("I encountered an error. Please try again or rephrase your message.");
        }
    };

    // Detect category from text using keywords
    const detectCategoryFromText = (text: string): string | null => {
        const lowerText = text.toLowerCase();
        
        if (lowerText.match(/tutor|teach|education|student|learn|study|homework|exam|school|college|university|sat|test prep/)) {
            return 'Education';
        }
        if (lowerText.match(/business|market|sales|finance|account|consult|strategy|management|project/)) {
            return 'Business';
        }
        if (lowerText.match(/legal|law|lawyer|contract|compliance|litigation|attorney|court|lawsuit/)) {
            return 'Legal';
        }
        
        return null;
    };

    // Smart budget parser
    const parseBudget = (text: string): { min: number; max: number } | null => {
        // Remove commas and extract numbers
        const cleaned = text.replace(/,/g, '');
        
        // Pattern 1: "10000 to 50000" or "10000-50000"
        const rangeMatch = cleaned.match(/(\d+)[\s-]+(?:to\s+)?(\d+)/);
        if (rangeMatch) {
            return {
                min: parseInt(rangeMatch[1]),
                max: parseInt(rangeMatch[2])
            };
        }
        
        // Pattern 2: Single number like "25000"
        const singleMatch = cleaned.match(/\d+/);
        if (singleMatch) {
            const budget = parseInt(singleMatch[0]);
            return {
                min: Math.floor(budget * 0.8), // 20% lower
                max: Math.floor(budget * 1.2)  // 20% higher
            };
        }
        
        return null;
    };

    // Normalize Pakistani city names
    const normalizeLocation = (text: string): string => {
        const lowerText = text.toLowerCase();
        
        if (lowerText.includes('rawalpindi') || lowerText.includes('pindi')) {
            return 'Rawalpindi, Pakistan';
        }
        if (lowerText.includes('islamabad') || lowerText.includes('isb')) {
            return 'Islamabad, Pakistan';
        }
        if (lowerText.includes('lahore') || lowerText.includes('lhr')) {
            return 'Lahore, Pakistan';
        }
        if (lowerText.includes('karachi') || lowerText.includes('khi')) {
            return 'Karachi, Pakistan';
        }
        if (lowerText.includes('remote') || lowerText.includes('online') || lowerText.includes('virtual')) {
            return 'Remote (Pakistan)';
        }
        
        // Default to what user typed
        return text;
    };

    const handleOpen = async () => {
        setState(prev => ({ ...prev, isOpen: true }));
        // Don't send welcome message on open - it's already sent on mount
    };

    const handleClose = () => {
        setState(prev => ({ ...prev, isOpen: false }));
    };

    // Initialize welcome message for embedded mode - only once
    useEffect(() => {
        if (initialOpen && state.messages.length === 0) {
            const timer = setTimeout(async () => {
                await simulateTyping(getAssistantMessage('welcome'));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []); // Empty dependency array to run only once

    // Initialize welcome message when chatbot opens in floating mode
    useEffect(() => {
        if (state.isOpen && !initialOpen && state.messages.length === 0) {
            const timer = setTimeout(async () => {
                await simulateTyping(getAssistantMessage('welcome'));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state.isOpen]); // Run when isOpen changes

    // If initialOpen is true, render embedded mode (no floating button)
    if (initialOpen) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ChatIcon />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                Sarah - Raah AI Assistant 🤖
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                Chat with me to post your job and find Pakistani consultants
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    {/* Messages Area */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            minHeight: 0,
                        }}
                    >
                        {/* Messages */}
                        <Box
                            sx={{
                                flex: 1,
                                overflowY: 'auto',
                                p: 3,
                                bgcolor: '#fafafa',
                                minHeight: 0,
                            }}
                        >
                            {state.messages.map(message => (
                                <ChatMessage key={message.id} message={message} />
                            ))}

                            {/* Category Selection - Step 1 */}
                            {(state.currentStep === 'welcome' || state.currentStep === 'category') && !isTyping && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                    {['Education', 'Business', 'Legal'].map(category => (
                                        <Chip
                                            key={category}
                                            label={category}
                                            onClick={() => handleCategorySelect(category)}
                                            sx={{
                                                bgcolor: '#0db4bc',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: '#0a8b91',
                                                },
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Sub-Category Selection - Step 2 */}
                            {state.currentStep === 'description' && state.jobData.category && !state.jobData.subCategory && !isTyping && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                    {SUB_CATEGORIES[state.jobData.category as keyof typeof SUB_CATEGORIES]?.map(subCat => (
                                        <Chip
                                            key={subCat}
                                            label={subCat}
                                            onClick={() => handleSubCategorySelect(subCat)}
                                            sx={{
                                                bgcolor: '#0db4bc',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: '#0a8b91',
                                                },
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Location Selection - Step 4 */}
                            {state.currentStep === 'location' && !isTyping && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                    {VALID_LOCATIONS.map(location => (
                                        <Chip
                                            key={location}
                                            label={location}
                                            onClick={() => handleLocationSelect(location)}
                                            sx={{
                                                bgcolor: '#0db4bc',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: '#0a8b91',
                                                },
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Summary View */}
                            {state.currentStep === 'summary' && !isTyping && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f9ff', borderRadius: 2 }}>
                                    <Typography sx={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 500 }}>
                                        ℹ️ Job details collected! Review the preview on the right and click "Post Job" when ready.
                                    </Typography>
                                </Box>
                            )}

                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Input Area */}
                        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                    fullWidth
                                    placeholder={
                                        state.currentStep === 'category' ? "Select a category above" :
                                        state.currentStep === 'description' && !state.jobData.subCategory ? "Select a sub-category above" :
                                        state.currentStep === 'location' ? "Select a location above" :
                                        state.currentStep === 'summary' ? "Review and click Post Job" :
                                        state.currentStep === 'budget' ? "e.g., 10000 to 50000" :
                                        state.currentStep === 'timeline' ? "e.g., 2 weeks, 1 month" :
                                        "Type your message here..."
                                    }
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={
                                        isTyping || 
                                        state.currentStep === 'category' || 
                                        (state.currentStep === 'description' && !state.jobData.subCategory) ||
                                        state.currentStep === 'location' || 
                                        state.currentStep === 'summary' || 
                                        state.currentStep === 'complete'
                                    }
                                    size="small"
                                    multiline={state.currentStep === 'description' && state.jobData.subCategory}
                                    maxRows={4}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            bgcolor: 'white',
                                            '& input': {
                                                color: '#1f2937',
                                            },
                                            '& input::placeholder': {
                                                color: '#9ca3af',
                                                opacity: 1,
                                            },
                                        },
                                    }}
                                />
                                <IconButton
                                    onClick={handleSendMessage}
                                    disabled={
                                        !inputValue.trim() || 
                                        isTyping || 
                                        state.currentStep === 'category' || 
                                        (state.currentStep === 'description' && !state.jobData.subCategory) ||
                                        state.currentStep === 'location' || 
                                        state.currentStep === 'summary'
                                    }
                                    sx={{
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                        },
                                        '&.Mui-disabled': {
                                            bgcolor: '#e0e0e0',
                                        },
                                    }}
                                >
                                    <SendIcon />
                                </IconButton>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                                {state.currentStep === 'description' && state.jobData.subCategory && (
                                    <span style={{ color: '#0db4bc', fontWeight: 600 }}>
                                        {countWords((state.jobData.rawDescription ? state.jobData.rawDescription + ' ' : '') + inputValue)} / {MINIMUM_WORDS} words minimum
                                    </span>
                                )}
                                {state.currentStep !== 'description' && "Raah Assistant can make mistakes. Check important info."}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        );
    }

    // Default floating widget mode

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!state.isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1000,
                        }}
                    >
                        <Fab
                            color="primary"
                            onClick={handleOpen}
                            sx={{
                                width: 64,
                                height: 64,
                                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                boxShadow: '0 8px 24px rgba(13, 180, 188, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #0a8b91 0%, #08696d 100%)',
                                    boxShadow: '0 12px 32px rgba(13, 180, 188, 0.5)',
                                },
                            }}
                        >
                            <ChatIcon sx={{ fontSize: 32 }} />
                        </Fab>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {state.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: 24,
                            right: 24,
                            zIndex: 1000,
                            width: '90vw',
                            maxWidth: 900,
                            height: '80vh',
                            maxHeight: 700,
                        }}
                    >
                        <Paper
                            elevation={8}
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 3,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <Box
                                sx={{
                                    p: 2,
                                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ChatIcon />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            Sarah - Raah AI Assistant 🤖
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                            Chat with me to post your job and find Pakistani consultants
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>

                            {/* Main Content */}
                            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                                {/* Messages Area */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* Messages */}
                                    <Box
                                        sx={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            p: 3,
                                            bgcolor: '#fafafa',
                                        }}
                                    >
                                        {state.messages.map(message => (
                                            <ChatMessage key={message.id} message={message} />
                                        ))}

                                        {/* Category Selection - Step 1 */}
                                        {(state.currentStep === 'welcome' || state.currentStep === 'category') && !isTyping && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                {['Education', 'Business', 'Legal'].map(category => (
                                                    <Chip
                                                        key={category}
                                                        label={category}
                                                        onClick={() => handleCategorySelect(category)}
                                                        sx={{
                                                            bgcolor: '#0db4bc',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: '#0a8b91',
                                                            },
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        {/* Sub-Category Selection - Step 2 */}
                                        {state.currentStep === 'description' && state.jobData.category && !state.jobData.subCategory && !isTyping && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                {SUB_CATEGORIES[state.jobData.category as keyof typeof SUB_CATEGORIES]?.map(subCat => (
                                                    <Chip
                                                        key={subCat}
                                                        label={subCat}
                                                        onClick={() => handleSubCategorySelect(subCat)}
                                                        sx={{
                                                            bgcolor: '#0db4bc',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: '#0a8b91',
                                                            },
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        {/* Location Selection - Step 4 */}
                                        {state.currentStep === 'location' && !isTyping && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                {VALID_LOCATIONS.map(location => (
                                                    <Chip
                                                        key={location}
                                                        label={location}
                                                        onClick={() => handleLocationSelect(location)}
                                                        sx={{
                                                            bgcolor: '#0db4bc',
                                                            color: 'white',
                                                            '&:hover': {
                                                                bgcolor: '#0a8b91',
                                                            },
                                                            cursor: 'pointer',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        {/* Summary View */}
                                        {state.currentStep === 'summary' && !isTyping && (
                                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                <Chip
                                                    label="Yes, Post This Job!"
                                                    onClick={() => handleSummaryAction('post')}
                                                    color="primary"
                                                    sx={{
                                                        cursor: 'pointer',
                                                        px: 2,
                                                        py: 3,
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </Box>

                                    {/* Input Area */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: 'white',
                                            borderTop: '1px solid #e0e0e0',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <TextField
                                                fullWidth
                                                placeholder={
                                                    state.currentStep === 'category' ? "Select a category above" :
                                                    state.currentStep === 'description' && !state.jobData.subCategory ? "Select a sub-category above" :
                                                    state.currentStep === 'location' ? "Select a location above" :
                                                    state.currentStep === 'summary' ? "Review and click Post Job" :
                                                    state.currentStep === 'budget' ? "e.g., 10000 to 50000" :
                                                    state.currentStep === 'timeline' ? "e.g., 2 weeks, 1 month" :
                                                    "Type your message here..."
                                                }
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                disabled={
                                                    isTyping || 
                                                    state.currentStep === 'category' || 
                                                    (state.currentStep === 'description' && !state.jobData.subCategory) ||
                                                    state.currentStep === 'location' || 
                                                    state.currentStep === 'summary' || 
                                                    state.currentStep === 'complete'
                                                }
                                                size="small"
                                                multiline={state.currentStep === 'description' && state.jobData.subCategory}
                                                maxRows={4}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
                                                        bgcolor: 'white',
                                                        '& input': {
                                                            color: '#1f2937',
                                                        },
                                                        '& input::placeholder': {
                                                            color: '#9ca3af',
                                                            opacity: 1,
                                                        },
                                                    },
                                                }}
                                            />
                                            <IconButton
                                                onClick={handleSendMessage}
                                                disabled={
                                                    !inputValue.trim() || 
                                                    isTyping || 
                                                    state.currentStep === 'category' || 
                                                    (state.currentStep === 'description' && !state.jobData.subCategory) ||
                                                    state.currentStep === 'location' || 
                                                    state.currentStep === 'summary'
                                                }
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    color: 'white',
                                                    '&:hover': {
                                                        bgcolor: 'primary.dark',
                                                    },
                                                    '&.Mui-disabled': {
                                                        bgcolor: '#e0e0e0',
                                                    },
                                                }}
                                            >
                                                <SendIcon />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                                            {state.currentStep === 'description' && state.jobData.subCategory && (
                                                <span style={{ color: '#0db4bc', fontWeight: 600 }}>
                                                    {countWords((state.jobData.rawDescription ? state.jobData.rawDescription + ' ' : '') + inputValue)} / {MINIMUM_WORDS} words minimum
                                                </span>
                                            )}
                                            {state.currentStep !== 'description' && "Raah Assistant can make mistakes. Check important info."}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Progress Sidebar */}
                                <Box
                                    sx={{
                                        width: 280,
                                        p: 3,
                                        bgcolor: '#f8f9fa',
                                        borderLeft: '1px solid #e0e0e0',
                                        display: { xs: 'none', md: 'block' },
                                    }}
                                >
                                    <ProgressIndicator progress={state.progress} />
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatbotWidget;
