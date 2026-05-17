import { Box, Avatar, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '../../types/chatbotTypes';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useThemeMode } from '../../context/ThemeContext';

interface ChatMessageProps {
    message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
    const isAssistant = message.sender === 'assistant';
    const { mode } = useThemeMode();

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Box
                sx={{
                    display: 'flex',
                    gap: 1.5,
                    mb: 2.5,
                    flexDirection: isAssistant ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                }}
            >
                {isAssistant && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                        <Avatar
                            sx={{
                                width: 40,
                                height: 40,
                                bgcolor: mode === 'dark' ? '#00838F' : '#00BCD4',
                                fontSize: '1rem',
                                boxShadow: mode === 'dark' 
                                  ? '0 2px 8px rgba(0,188,212,0.3)' 
                                  : '0 2px 8px rgba(0,188,212,0.2)',
                            }}
                        >
                            <SmartToyIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                    </motion.div>
                )}

                <Box
                    sx={{
                        maxWidth: '75%',
                        bgcolor: isAssistant 
                          ? (mode === 'dark' ? 'rgba(0,188,212,0.12)' : '#E8F9FC')
                          : '#00BCD4',
                        color: isAssistant 
                          ? (mode === 'dark' ? '#E0F7FA' : '#1f2937')
                          : '#FFFFFF',
                        px: 2.5,
                        py: 2,
                        borderRadius: isAssistant ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        boxShadow: mode === 'dark'
                          ? '0 2px 8px rgba(0,0,0,0.4)'
                          : '0 2px 4px rgba(0,0,0,0.1)',
                        border: isAssistant 
                          ? (mode === 'dark' ? '1px solid rgba(0,188,212,0.2)' : 'none')
                          : 'none',
                        position: 'relative',
                        '&::before': isAssistant ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: -4,
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            borderWidth: '0 8px 8px 0',
                            borderColor: `transparent ${mode === 'dark' ? 'rgba(0,188,212,0.12)' : '#E8F9FC'} transparent transparent`,
                        } : {},
                        '&::after': !isAssistant ? {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: -4,
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            borderWidth: '0 0 8px 8px',
                            borderColor: 'transparent transparent transparent #00BCD4',
                        } : {},
                    }}
                >
                    {message.isTyping ? (
                        <Box sx={{ display: 'flex', gap: 0.7, py: 0.5 }}>
                            <motion.span
                                animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5] 
                                }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0, ease: 'easeInOut' }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: mode === 'dark' ? '#80DEEA' : '#00BCD4',
                                    display: 'inline-block',
                                }}
                            />
                            <motion.span
                                animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5] 
                                }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2, ease: 'easeInOut' }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: mode === 'dark' ? '#80DEEA' : '#00BCD4',
                                    display: 'inline-block',
                                }}
                            />
                            <motion.span
                                animate={{ 
                                    scale: [1, 1.3, 1],
                                    opacity: [0.5, 1, 0.5] 
                                }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: 'easeInOut' }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: mode === 'dark' ? '#80DEEA' : '#00BCD4',
                                    display: 'inline-block',
                                }}
                            />
                        </Box>
                    ) : (
                        <>
                            {!isAssistant && (
                                <CheckCircleIcon 
                                    sx={{ 
                                        fontSize: 16, 
                                        mr: 1, 
                                        verticalAlign: 'middle',
                                        display: 'inline',
                                    }} 
                                />
                            )}
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    whiteSpace: 'pre-wrap',
                                    fontSize: '15px',
                                    lineHeight: 1.6,
                                    display: 'inline',
                                    '& strong': {
                                        fontWeight: 700,
                                        color: isAssistant 
                                          ? (mode === 'dark' ? '#B2EBF2' : '#00838F')
                                          : '#FFFFFF',
                                    },
                                }}
                            >
                                {message.text}
                            </Typography>
                        </>
                    )}
                </Box>

                {/* Timestamp (optional, shown on hover) */}
                {!message.isTyping && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: mode === 'dark' ? 'rgba(255,255,255,0.4)' : '#9CA3AF',
                            fontSize: '0.7rem',
                            alignSelf: 'flex-end',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { opacity: 1 },
                        }}
                    >
                        Just now
                    </Typography>
                )}
            </Box>
        </motion.div>
    );
};

export default ChatMessage;
