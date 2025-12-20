import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Fab,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { httpClient } from '../../api/httpClient';
import type {
  IntakeState,
  IntakeStep,
  IntakeDomain,
  IntakeMessage,
  IntakeApiResponse,
} from '../../types/intakeTypes';
import {
  INTAKE_PROGRESS,
  STEP_NAMES,
  PAKISTANI_CITIES,
  URGENCY_LEVELS,
  DOMAIN_COLORS,
} from '../../types/intakeTypes';
import ChatMessage from './ChatMessage';

interface IntakeAssistantWidgetProps {
  initialOpen?: boolean;
  onComplete?: (intakeData: any) => void;
}

const IntakeAssistantWidget = ({
  initialOpen = false,
  onComplete,
}: IntakeAssistantWidgetProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [state, setState] = useState<IntakeState>({
    currentStep: 'greeting',
    progress: 0,
    extractedKeywords: [],
    messages: [],
    isOpen: initialOpen,
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  // Initial greeting
  useEffect(() => {
    if (state.messages.length === 0) {
      addMessage(
        "Hello. I'm here to help you connect with qualified consultants in Education, Business, or Legal fields in Pakistan. Which area do you need assistance with?",
        'assistant'
      );
    }
  }, []);

  const addMessage = (
    content: string,
    role: 'user' | 'assistant',
    isTyping = false
  ): string => {
    const newMessage: IntakeMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      isTyping,
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
    return newMessage.id;
  };

  const updateMessage = (id: string, updates: Partial<IntakeMessage>) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  };

  const simulateTyping = async (text: string): Promise<string> => {
    setIsTyping(true);
    const typingId = addMessage('', 'assistant', true);

    // Simulate typing delay (shorter for professional feel)
    await new Promise((resolve) => setTimeout(resolve, 600));

    updateMessage(typingId, { content: text, isTyping: false });
    setIsTyping(false);
    return typingId;
  };

  const processUserMessage = async (message: string) => {
    if (!message.trim() || isTyping) return;

    // Add user message
    addMessage(message, 'user');
    setInputValue('');

    try {
      // Call intake assistant API
      const response = await httpClient.post<IntakeApiResponse>('/chatbot/message', {
        message,
        currentStep: state.currentStep,
        domain: state.domain,
        intakeState: state,
      });

      const { data } = response.data;

      // Update state with extracted entities
      const updatedState: Partial<IntakeState> = {};

      if (data.entities.domain) {
        updatedState.domain = data.entities.domain;
      }
      if (data.entities.location) {
        updatedState.location = data.entities.location;
      }
      if (data.entities.timeline) {
        updatedState.timeline = data.entities.timeline;
      }
      if (data.entities.budgetMin) {
        updatedState.budgetMin = data.entities.budgetMin;
      }
      if (data.entities.budgetMax) {
        updatedState.budgetMax = data.entities.budgetMax;
      }
      if (data.entities.keywords.length > 0) {
        updatedState.extractedKeywords = [
          ...state.extractedKeywords,
          ...data.entities.keywords,
        ];
      }

      // Accumulate problem summary if in early steps
      if (
        state.currentStep === 'greeting' ||
        state.currentStep === 'problem_summary' ||
        state.currentStep === 'context_questions'
      ) {
        const existingSummary = state.problemSummary || '';
        updatedState.problemSummary = existingSummary
          ? `${existingSummary} ${message}`
          : message;
      }

      // Determine next step based on validation
      let nextStep = state.currentStep;
      if (data.validation.isValid) {
        nextStep = getNextStep(state.currentStep, updatedState as IntakeState);
      }

      // Update state
      setState((prev) => ({
        ...prev,
        ...updatedState,
        currentStep: nextStep,
        progress: INTAKE_PROGRESS[nextStep],
      }));

      // Show assistant response
      await simulateTyping(data.response);
    } catch (error: any) {
      console.error('Intake assistant error:', error);
      await simulateTyping(
        'I apologize for the technical difficulty. Could you please repeat that?'
      );
    }
  };

  const getNextStep = (current: IntakeStep, updatedState: IntakeState): IntakeStep => {
    // Deterministic step progression
    switch (current) {
      case 'greeting':
        return updatedState.domain ? 'problem_summary' : 'domain_classification';
      case 'domain_classification':
        return 'problem_summary';
      case 'problem_summary':
        return 'context_questions';
      case 'context_questions':
        return 'timeline';
      case 'timeline':
        return 'location';
      case 'location':
        return 'urgency';
      case 'urgency':
        return 'budget';
      case 'budget':
        return 'confirmation';
      case 'confirmation':
        return 'handoff';
      case 'handoff':
        return 'complete';
      default:
        return current;
    }
  };

  const handleDomainSelect = async (domain: IntakeDomain) => {
    await processUserMessage(domain);
  };

  const handleLocationSelect = async (location: string) => {
    setState((prev) => ({ ...prev, location }));
    await processUserMessage(location);
  };

  const handleUrgencySelect = async (urgency: 'Immediate' | 'Soon' | 'Flexible') => {
    setState((prev) => ({ ...prev, urgency }));
    await processUserMessage(urgency);
  };

  const handleConfirm = async () => {
    if (onComplete) {
      onComplete({
        domain: state.domain,
        description: state.problemSummary,
        timeline: state.timeline,
        location: state.location,
        urgency: state.urgency,
        budgetMin: state.budgetMin,
        budgetMax: state.budgetMax,
        keywords: state.extractedKeywords,
      });
    }

    setState((prev) => ({
      ...prev,
      currentStep: 'complete',
      progress: 100,
    }));

    await simulateTyping(
      'Perfect. I will now connect you with qualified consultants who match your requirements.'
    );
  };

  const renderQuickActions = () => {
    switch (state.currentStep) {
      case 'domain_classification':
        return (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {(['Education', 'Business', 'Legal'] as IntakeDomain[]).map((domain) => (
              <Button
                key={domain}
                variant="outlined"
                size="small"
                onClick={() => handleDomainSelect(domain)}
                sx={{
                  borderColor: DOMAIN_COLORS[domain],
                  color: DOMAIN_COLORS[domain],
                  '&:hover': {
                    borderColor: DOMAIN_COLORS[domain],
                    backgroundColor: `${DOMAIN_COLORS[domain]}20`,
                  },
                }}
              >
                {domain}
              </Button>
            ))}
          </Box>
        );

      case 'location':
        return (
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Select Location</InputLabel>
            <Select
              value={state.location || ''}
              onChange={(e) => handleLocationSelect(e.target.value)}
              label="Select Location"
            >
              {PAKISTANI_CITIES.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'urgency':
        return (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {URGENCY_LEVELS.map((level) => (
              <Button
                key={level}
                variant="outlined"
                size="small"
                onClick={() => handleUrgencySelect(level)}
                color={
                  level === 'Immediate' ? 'error' : level === 'Soon' ? 'warning' : 'info'
                }
              >
                {level}
              </Button>
            ))}
          </Box>
        );

      case 'confirmation':
        return (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#f9fafb' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Review Your Request
            </Typography>
            <Divider sx={{ my: 1 }} />
            {state.domain && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Domain:
                </Typography>
                <Chip
                  label={state.domain}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: DOMAIN_COLORS[state.domain],
                    color: 'white',
                  }}
                />
              </Box>
            )}
            {state.problemSummary && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Need:</strong> {state.problemSummary.substring(0, 150)}
                {state.problemSummary.length > 150 ? '...' : ''}
              </Typography>
            )}
            {state.timeline && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Timeline:</strong> {state.timeline}
              </Typography>
            )}
            {state.location && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Location:</strong> {state.location}
              </Typography>
            )}
            {state.urgency && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Urgency:</strong> {state.urgency}
              </Typography>
            )}
            {state.budgetMin && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Budget:</strong> PKR {state.budgetMin.toLocaleString()}
                {state.budgetMax && ` - ${state.budgetMax.toLocaleString()}`}
              </Typography>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={handleConfirm}
              sx={{ mt: 2 }}
              startIcon={<CheckCircleIcon />}
            >
              Confirm & Connect with Consultants
            </Button>
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!state.isOpen && (
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setState((prev) => ({ ...prev, isOpen: true }))}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: '#0db4bc',
            '&:hover': { bgcolor: '#0a8b91' },
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1300,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                width: 400,
                height: 600,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Intake Assistant
                  </Typography>
                  <Typography variant="caption">
                    {STEP_NAMES[state.currentStep]} • {state.progress}%
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setState((prev) => ({ ...prev, isOpen: false }))}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Progress Bar */}
              <Box
                sx={{
                  height: 4,
                  bgcolor: '#e5e7eb',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    bgcolor: '#10b981',
                    transition: 'width 0.5s ease',
                    width: `${state.progress}%`,
                  }}
                />
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: '#f9fafb',
                }}
              >
                {state.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={{
                      id: msg.id,
                      text: msg.content,
                      sender: msg.role,
                      timestamp: msg.timestamp,
                      isTyping: msg.isTyping,
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </Box>

              {/* Quick Actions */}
              {renderQuickActions()}

              {/* Input Area */}
              {state.currentStep !== 'complete' &&
                state.currentStep !== 'location' &&
                state.currentStep !== 'urgency' &&
                state.currentStep !== 'domain_classification' &&
                state.currentStep !== 'confirmation' && (
                  <Box
                    sx={{
                      p: 2,
                      borderTop: '1px solid #e5e7eb',
                      bgcolor: 'white',
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Type your message..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            processUserMessage(inputValue);
                          }
                        }}
                        disabled={isTyping}
                        inputProps={{ maxLength: 500 }}
                      />
                      <IconButton
                        color="primary"
                        onClick={() => processUserMessage(inputValue)}
                        disabled={!inputValue.trim() || isTyping}
                      >
                        <SendIcon />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {inputValue.length}/500
                    </Typography>
                  </Box>
                )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default IntakeAssistantWidget;
