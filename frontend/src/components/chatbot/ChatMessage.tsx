import { Box, Avatar, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '../../types/chatbotTypes';

interface ChatMessageProps {
    message: ChatMessageType;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
    const isAssistant = message.sender === 'assistant';

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
                    mb: 2,
                    flexDirection: isAssistant ? 'row' : 'row-reverse',
                    alignItems: 'flex-start',
                }}
            >
                {isAssistant && (
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#0db4bc',
                            fontSize: '0.9rem',
                        }}
                    >
                        S
                    </Avatar>
                )}

                <Box
                    sx={{
                        maxWidth: '75%',
                        bgcolor: isAssistant ? '#e0f7f9' : '#0db4bc',
                        color: isAssistant ? '#1f2937' : 'white',
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        borderTopLeftRadius: isAssistant ? 0 : 2,
                        borderTopRightRadius: isAssistant ? 2 : 0,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                >
                    {message.isTyping ? (
                        <Box sx={{ display: 'flex', gap: 0.5, py: 0.5 }}>
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#999',
                                    display: 'inline-block',
                                }}
                            />
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#999',
                                    display: 'inline-block',
                                }}
                            />
                            <motion.span
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: '#999',
                                    display: 'inline-block',
                                }}
                            />
                        </Box>
                    ) : (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.text}
                        </Typography>
                    )}
                </Box>
            </Box>
        </motion.div>
    );
};

export default ChatMessage;
