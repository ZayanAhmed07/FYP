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

const ChatbotWidget = () => {
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [state, setState] = useState<ConversationState>({
        currentStep: 'welcome',
        progress: 0,
        jobData: {},
        messages: [],
        isOpen: false,
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [state.messages]);

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

    const simulateTyping = async (text: string): Promise<string> => {
        setIsTyping(true);
        const typingId = addMessage('', 'assistant', true);

        // Simulate typing delay
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

        updateMessage(typingId, { text, isTyping: false });
        setIsTyping(false);
        return typingId;
    };

    const getAssistantMessage = (step: ConversationStep): string => {
        const messages: Record<ConversationStep, string> = {
            welcome: "Hi! I'm Rachel, your legal job posting assistant. I'm here to help you find the perfect legal professional for your needs. What type of legal help are you looking for?",
            description: "Great! Can you tell me more about your legal needs? Please provide a detailed description of what you're looking for.",
            category: "Perfect! Which legal specialty best matches your needs?",
            budget: "Understood. What's your budget range for this project? (Please provide minimum and maximum amounts in PKR)",
            timeline: "Got it! What's your timeline or deadline for this project?",
            location: "Excellent! Do you prefer remote consultants, in-office, or hybrid work arrangements? Please specify your location preference.",
            summary: `Thank you! Let me summarize what we've collected:\n\n📋 Description: ${state.jobData.description}\n📁 Legal Specialty: ${state.jobData.category}\n💰 Budget: PKR ${state.jobData.budgetMin?.toLocaleString()} - ${state.jobData.budgetMax?.toLocaleString()}\n⏰ Timeline: ${state.jobData.timeline}\n📍 Location: ${state.jobData.location}\n\nWould you like to post this job and connect with qualified legal professionals?`,
            complete: "Perfect! Redirecting you to finalize your job posting...",
        };
        return messages[step];
    };

    const handleCategorySelect = async (category: string) => {
        addMessage(category, 'user');
        setState(prev => ({
            ...prev,
            jobData: { ...prev.jobData, category },
            currentStep: 'budget',
            progress: calculateProgress('budget'),
        }));
        await simulateTyping(getAssistantMessage('budget'));
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
        const nextStep = getNextStep(currentStep);

        // Update job data based on current step
        let updatedJobData = { ...state.jobData };

        switch (currentStep) {
            case 'welcome':
            case 'description':
                updatedJobData.description = userMessage;
                break;
            case 'budget':
                // Parse budget from user input (e.g., "5000-10000" or "5000 to 10000")
                const budgetMatch = userMessage.match(/(\d+)[\s-]+(?:to\s+)?(\d+)/);
                if (budgetMatch) {
                    updatedJobData.budgetMin = parseInt(budgetMatch[1]);
                    updatedJobData.budgetMax = parseInt(budgetMatch[2]);
                } else {
                    const singleBudget = parseInt(userMessage.replace(/\D/g, ''));
                    if (singleBudget) {
                        updatedJobData.budgetMin = singleBudget;
                        updatedJobData.budgetMax = singleBudget * 1.5;
                    }
                }
                break;
            case 'timeline':
                updatedJobData.timeline = userMessage;
                break;
            case 'location':
                updatedJobData.location = userMessage;
                break;
        }

        setState(prev => ({
            ...prev,
            jobData: updatedJobData,
            currentStep: nextStep,
            progress: calculateProgress(nextStep),
        }));

        await simulateTyping(getAssistantMessage(nextStep));
    };

    const handleOpen = async () => {
        setState(prev => ({ ...prev, isOpen: true }));
        if (state.messages.length === 0) {
            await simulateTyping(getAssistantMessage('welcome'));
        }
    };

    const handleClose = () => {
        setState(prev => ({ ...prev, isOpen: false }));
    };

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
                                background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
                                boxShadow: '0 8px 24px rgba(13, 180, 188, 0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
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
                                    background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
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
                                            Rachel - Legal Job Assistant
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                                            Have a quick chat. We'll build your case. Connect with Consultants.
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
                                                {['Legal', 'Business Consulting', 'Technical/IT', 'Marketing', 'Financial', 'Design', 'Writing', 'Other'].map(category => (
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
                                                placeholder="Message Raah Assistant"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                disabled={isTyping || state.currentStep === 'category' || state.currentStep === 'summary' || state.currentStep === 'complete'}
                                                size="small"
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 3,
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
