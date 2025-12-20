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
        const newMessage: ChatMessageType = {
            id: Date.now().toString(),
            text,
            sender,
            timestamp: new Date(),
            isTyping,
        };
        setState(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
        return newMessage.id;
    };

    const updateMessage = (id: string, updates: Partial<ChatMessageType>) => {
        setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg => msg.id === id ? { ...msg, ...updates } : msg),
        }));
    };

    const getNextStep = (current: ConversationStep): ConversationStep => {
        const steps: ConversationStep[] = ['welcome', 'description', 'category', 'budget', 'timeline', 'location', 'summary', 'complete'];
        const currentIndex = steps.indexOf(current);
        return steps[currentIndex + 1] || 'complete';
    };

    const calculateProgress = (step: ConversationStep): number => {
        const progressMap: Record<ConversationStep, number> = {
            welcome: 0,
            description: 15,
            category: 30,
            budget: 50,
            timeline: 70,
            location: 85,
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

    const getAssistantMessage = (step: ConversationStep): string => {
        const messages: Record<ConversationStep, string> = {
            welcome: "Hi! 👋 I'm Sarah, your Raah assistant. I'll help you post your job and connect with qualified Pakistani consultants in Education, Business, and Legal fields. Let's start! What kind of help do you need?",
            description: "Excellent! Tell me more about your project. What specific tasks or outcomes are you looking for? The more details you provide, the better I can match you with the right consultant.",
            category: "Got it! Which category best describes your needs?",
            budget: "Perfect! What's your budget for this project? You can say something like '10000 to 50000' or just '25000'. I work in PKR (Pakistani Rupees).",
            timeline: "Understood! When do you need this completed? For example: '1 week', '2 months', 'ASAP', or a specific date.",
            location: "Great! Where would you like the consultant to work? Choose: Rawalpindi, Islamabad, Lahore, Karachi, or Remote.",
            summary: `Thank you! Let me summarize what we've collected:\n\n📋 Description: ${state.jobData.description}\n📁 Category: ${state.jobData.category}\n🎯 Skills Detected: ${state.jobData.skills?.length ? state.jobData.skills.join(', ') : 'None'}\n💰 Budget: PKR ${state.jobData.budgetMin?.toLocaleString()} - ${state.jobData.budgetMax?.toLocaleString()}\n⏰ Timeline: ${state.jobData.timeline}\n📍 Location: ${state.jobData.location}\n\nWould you like to post this job and connect with qualified Pakistani consultants?`,
            complete: "Perfect! Redirecting you to finalize your job posting...",
        };
        return messages[step];
    };

    const handleCategorySelect = async (category: string) => {
        addMessage(category, 'user');
        
        // Auto-detect skills from description based on category
        const detectedSkills = extractSkillsFromDescription(state.jobData.description || '', category);
        
        setState(prev => ({
            ...prev,
            jobData: { 
                ...prev.jobData, 
                category,
                skills: detectedSkills 
            },
            currentStep: 'budget',
            progress: calculateProgress('budget'),
        }));
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
        addMessage(userMessage, 'user');
        setInputValue('');

        const currentStep = state.currentStep;

        try {
            // Use Groq AI for intelligent responses
            const aiResponse = await sarahAI.getResponse(userMessage, state.messages, currentStep);

            // Handle welcome - collect initial description
            if (currentStep === 'welcome') {
                const description = state.jobData.description || '';
                const combinedDescription = description ? `${description} ${userMessage}` : userMessage;
                
                // Check if description is detailed enough (at least 20 words)
                const wordCount = combinedDescription.trim().split(/\s+/).length;
                
                if (wordCount < 20) {
                    setState(prev => ({
                        ...prev,
                        jobData: { ...prev.jobData, description: combinedDescription },
                        currentStep: 'description',
                        progress: calculateProgress('description'),
                    }));
                    await simulateTyping(aiResponse || getAssistantMessage('description'), true);
                    return;
                }
                
                // Description is detailed enough, proceed to category detection
                const detectedCategory = await sarahAI.detectCategory(combinedDescription);
                
                if (detectedCategory) {
                    const detectedSkills = await sarahAI.extractSkills(combinedDescription, detectedCategory);
                    
                    setState(prev => ({
                        ...prev,
                        jobData: {
                            ...prev.jobData,
                            description: combinedDescription,
                            category: detectedCategory,
                            skills: detectedSkills
                        },
                        currentStep: 'budget',
                        progress: calculateProgress('budget'),
                    }));
                    
                    await simulateTyping(aiResponse || `Great! I can see you need help with ${detectedCategory}. ${getAssistantMessage('budget')}`, true);
                    return;
                } else {
                    setState(prev => ({
                        ...prev,
                        jobData: { ...prev.jobData, description: combinedDescription },
                        currentStep: 'category',
                        progress: calculateProgress('category'),
                    }));
                    await simulateTyping(aiResponse || getAssistantMessage('category'), true);
                    return;
                }
            }

            // Handle description step - append more details
            if (currentStep === 'description') {
                const previousDescription = state.jobData.description || '';
                const fullDescription = `${previousDescription} ${userMessage}`.trim();
                
                const detectedCategory = await sarahAI.detectCategory(fullDescription);
                
                if (detectedCategory) {
                    const detectedSkills = await sarahAI.extractSkills(fullDescription, detectedCategory);
                    
                    setState(prev => ({
                        ...prev,
                        jobData: {
                            ...prev.jobData,
                            description: fullDescription,
                            category: detectedCategory,
                            skills: detectedSkills
                        },
                        currentStep: 'budget',
                        progress: calculateProgress('budget'),
                    }));
                    
                    await simulateTyping(aiResponse || `Excellent! I can see you need help with ${detectedCategory}. ${getAssistantMessage('budget')}`, true);
                    return;
                } else {
                    setState(prev => ({
                        ...prev,
                        jobData: { ...prev.jobData, description: fullDescription },
                        currentStep: 'category',
                        progress: calculateProgress('category'),
                    }));
                    await simulateTyping(aiResponse || getAssistantMessage('category'), true);
                    return;
                }
            }

            // Handle other steps
            let updatedJobData = { ...state.jobData };
            const nextStep = getNextStep(currentStep);

            switch (currentStep) {
                case 'budget':
                    const budgetInfo = parseBudget(userMessage);
                    if (budgetInfo) {
                        updatedJobData.budgetMin = budgetInfo.min;
                        updatedJobData.budgetMax = budgetInfo.max;
                    } else {
                        await simulateTyping(aiResponse || "I didn't quite catch that. Please tell me your budget like '10000 to 50000' or just '25000' in PKR.", true);
                        return;
                    }
                    break;
                case 'timeline':
                    updatedJobData.timeline = userMessage;
                    break;
                case 'location':
                    updatedJobData.location = normalizeLocation(userMessage);
                    break;
            }

            setState(prev => ({
                ...prev,
                jobData: updatedJobData,
                currentStep: nextStep,
                progress: calculateProgress(nextStep),
            }));

            await simulateTyping(aiResponse || getAssistantMessage(nextStep), true);

        } catch (error) {
            console.error('Sarah AI error:', error);
            // Fallback to hardcoded logic
            const detectedCategory = detectCategoryFromText(userMessage);
            let updatedJobData = { ...state.jobData };
            const nextStep = getNextStep(currentStep);

            if ((currentStep === 'welcome' || currentStep === 'description') && detectedCategory) {
                const skillsDetected = extractSkillsFromDescription(userMessage, detectedCategory);
                updatedJobData = {
                    ...updatedJobData,
                    description: userMessage,
                    category: detectedCategory,
                    skills: skillsDetected
                };
                setState(prev => ({
                    ...prev,
                    jobData: updatedJobData,
                    currentStep: 'budget',
                    progress: calculateProgress('budget'),
                }));
                await simulateTyping(`I can see you need help with ${detectedCategory}! ${getAssistantMessage('budget')}`);
                return;
            }

            // Continue with original logic for other steps
            switch (currentStep) {
                case 'welcome':
                case 'description':
                    updatedJobData.description = userMessage;
                    break;
                case 'budget':
                    const budgetInfo = parseBudget(userMessage);
                    if (budgetInfo) {
                        updatedJobData.budgetMin = budgetInfo.min;
                        updatedJobData.budgetMax = budgetInfo.max;
                    } else {
                        await simulateTyping("I didn't quite catch that. Please tell me your budget like '10000 to 50000' or just '25000' in PKR.");
                        return;
                    }
                    break;
                case 'timeline':
                    updatedJobData.timeline = userMessage;
                    break;
                case 'location':
                    updatedJobData.location = normalizeLocation(userMessage);
                    break;
            }

            setState(prev => ({
                ...prev,
                jobData: updatedJobData,
                currentStep: nextStep,
                progress: calculateProgress(nextStep),
            }));

            await simulateTyping(getAssistantMessage(nextStep));
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
            const timer = setTimeout(() => {
                simulateTyping(getAssistantMessage('welcome'));
            }, 500);
            return () => clearTimeout(timer);
        }
    }, []); // Empty dependency array to run only once

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

                            {/* Category Selection */}
                            {state.currentStep === 'category' && !isTyping && (
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

                            {/* Summary View - No buttons, just show summary */}
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
                                    placeholder="Message Sarah"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={isTyping || state.currentStep === 'category' || state.currentStep === 'summary' || state.currentStep === 'complete'}
                                    size="small"
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
                                    disabled={!inputValue.trim() || isTyping || state.currentStep === 'category' || state.currentStep === 'summary'}
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
                                Raah Assistant can make mistakes. Check important info.
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

                                        {/* Category Selection */}
                                        {state.currentStep === 'category' && !isTyping && (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                                                {['Education', 'Business', 'Legal'].map(category => (
                                                    <Chip
                                                        key={category}
                                                        label={category}
                                                        onClick={() => handleCategorySelect(category)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            '&:hover': {
                                                                bgcolor: 'primary.main',
                                                                color: 'white',
                                                            },
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        )}

                                        {/* Summary Actions */}
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
                                                placeholder="Message Sarah"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                disabled={isTyping || state.currentStep === 'category' || state.currentStep === 'summary' || state.currentStep === 'complete'}
                                                size="small"
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
                                                disabled={!inputValue.trim() || isTyping || state.currentStep === 'category' || state.currentStep === 'summary'}
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
                                            Raah Assistant can make mistakes. Check important info.
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
