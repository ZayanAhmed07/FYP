import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Typography, Button, Alert, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';
import { authService } from '../services/authService';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email });
      setMessage(res?.resetLink ? `Reset link generated (development) — check server logs` : 'If the email exists, a reset link will be sent');
    } catch (err) {
      setError(authService.parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a0e0f 0%, #0f2729 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f7f9 50%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 3,
      }}
    >
      {/* Animated Background Effects */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(13, 180, 188, 0.15) 0%, transparent 50%)',
          opacity: 0.6,
        }}
      />

      {/* Back Button */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => navigate('/login')}
          sx={{
            background: (theme) => theme.palette.mode === 'dark'
              ? 'rgba(13, 180, 188, 0.1)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(13, 180, 188, 0.2)',
            color: '#0db4bc',
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(13, 180, 188, 0.2)'
                : 'rgba(255, 255, 255, 1)',
            },
          }}
        >
          <FaArrowLeft />
        </IconButton>
      </Box>

      {/* Form Card */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        sx={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            borderRadius: '32px',
            p: { xs: 3, sm: 5 },
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.8) 0%, rgba(10, 25, 27, 0.9) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '2px solid rgba(13, 180, 188, 0.2)'
              : '2px solid rgba(13, 180, 188, 0.15)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 25px 60px rgba(13, 180, 188, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                fontWeight: 700,
                mb: 1.5,
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
              }}
            >
              Enter your email to receive password reset instructions.
            </Typography>
          </Box>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                  {error}
                </Alert>
              </motion.div>
            )}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
                  {message}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  '& fieldset': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.12)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#0db4bc',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#0db4bc',
                    borderWidth: '2px',
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.75,
                borderRadius: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                color: '#ffffff',
                boxShadow: '0 8px 25px rgba(13, 180, 188, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                  boxShadow: '0 12px 35px rgba(13, 180, 188, 0.45)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.6,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>

            <Typography
              component={Link}
              to="/login"
              variant="body2"
              sx={{
                textAlign: 'center',
                display: 'block',
                mt: 2,
                color: '#0db4bc',
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Back to Login
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;
