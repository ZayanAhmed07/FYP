import { Box, Typography, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import SecurityIcon from '@mui/icons-material/Security';

interface ProgressIndicatorProps {
    progress: number;
}

const ProgressIndicator = ({ progress }: ProgressIndicatorProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    p: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        Let's keep it going
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {progress}%
                    </Typography>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                        },
                    }}
                />

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 3,
                        p: 2,
                        bgcolor: '#f8f9fa',
                        borderRadius: 1,
                    }}
                >
                    <SecurityIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                        All your info will be <strong>Safe & Secure</strong>
                    </Typography>
                </Box>
            </Box>
        </motion.div>
    );
};

export default ProgressIndicator;
