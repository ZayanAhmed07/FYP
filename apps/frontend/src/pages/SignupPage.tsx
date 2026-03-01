import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaApple, FaEnvelope, FaFacebookF, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Box, Typography, TextField, Button, IconButton, InputAdornment, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

const SignupPage = () => {
  const location = useLocation();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(location.pathname === '/signup');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Email') {
      setShowEmailForm(true);
    } else if (provider === 'Google') {
      authService.loginWithGoogle();
    } else {
      alert(`${provider} authentication is not yet implemented. Please use email signup/login.`);
      // TODO: Implement other OAuth providers
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use AuthContext login method which handles navigation
      await login({ email, password });
      // Navigation will be handled by AuthContext
    } catch (err) {
      setError(authService.parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // For now, we'll set a default account type and let them choose later
      await authService.register({
        name,
        email,
        password,
        accountType: 'buyer', // Default, will be changed in account-type page
      });
      
      // Navigate to account type selection
      navigate('/account-type');
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
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a0e0f 0%, #0f2729 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f7f9 50%, #ffffff 100%)',
        position: 'relative',
        overflow: 'hidden',
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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(45, 90, 95, 0.1) 0%, transparent 50%)',
          opacity: 0.4,
        }}
      />

      {/* Left Panel - Hero Content */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}
      >
        <Box
          sx={{
            maxWidth: 600,
            px: { xs: 4, md: 8 },
            display: { xs: 'none', lg: 'block' },
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '3rem', md: '4.5rem', lg: '5.5rem' },
                fontWeight: 900,
                fontFamily: 'heading',
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 3,
              }}
            >
              Step Into<br />Expert Raah
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.8,
                color: 'text.secondary',
                mb: 4,
              }}
            >
              Join or log in to experience a secure, professional platform built for meaningful client–consultant connections.
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <Button
              variant="outlined"
              startIcon={<FaArrowLeft />}
              onClick={() => navigate('/')}
              sx={{
                borderRadius: '50px',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: 'rgba(13, 180, 188, 0.3)',
                color: (theme) => theme.palette.mode === 'dark' ? '#0db4bc' : '#0f766e',
                backdropFilter: 'blur(10px)',
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(13, 180, 188, 0.05)'
                  : 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: '#0db4bc',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(13, 180, 188, 0.1)'
                    : 'rgba(13, 180, 188, 0.05)',
                  transform: 'translateX(-5px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Back to Home
            </Button>
          </motion.div>
        </Box>
      </motion.div>

      {/* Right Panel - Form Content */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 520,
            px: { xs: 3, sm: 4 },
            py: 4,
          }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            sx={{
              borderRadius: '32px',
              p: { xs: 3, sm: 4, md: 5 },
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
                {isSignup ? 'Choose a Sign-Up Method' : 'Welcome Back!'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                }}
              >
                {isSignup 
                  ? 'Select an account to get started instantly.' 
                  : 'Enter your credentials to continue.'}
              </Typography>
            </Box>

            {/* Tab Switcher */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                mb: 4,
                p: 0.5,
                borderRadius: '16px',
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(0, 0, 0, 0.04)',
              }}
            >
              <Button
                fullWidth
                onClick={() => {
                  setIsSignup(true);
                  setShowEmailForm(false);
                  setError('');
                }}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: isSignup
                    ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                    : 'transparent',
                  color: isSignup ? '#ffffff' : 'text.secondary',
                  boxShadow: isSignup ? '0 8px 20px rgba(13, 180, 188, 0.3)' : 'none',
                  '&:hover': {
                    background: isSignup
                      ? 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)'
                      : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Sign Up
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setIsSignup(false);
                  setShowEmailForm(false);
                  setError('');
                }}
                sx={{
                  borderRadius: '12px',
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: !isSignup
                    ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                    : 'transparent',
                  color: !isSignup ? '#ffffff' : 'text.secondary',
                  boxShadow: !isSignup ? '0 8px 20px rgba(13, 180, 188, 0.3)' : 'none',
                  '&:hover': {
                    background: !isSignup
                      ? 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)'
                      : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Login
              </Button>
            </Box>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: '12px',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(211, 47, 47, 0.1)'
                        : 'rgba(211, 47, 47, 0.05)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content */}
            <AnimatePresence mode="wait">
              {isSignup ? (
                // Sign Up View
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {!showEmailForm ? (
                    // Social Login Options
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[
                        { provider: 'Google', Icon: FaGoogle, color: '#DB4437' },
                        { provider: 'Apple', Icon: FaApple, color: '#000000' },
                        { provider: 'Email', Icon: FaEnvelope, color: '#0db4bc' },
                      ].map(({ provider, Icon, color }) => (
                        <Button
                          key={provider}
                          fullWidth
                          variant="outlined"
                          startIcon={<Icon style={{ fontSize: '1.25rem' }} />}
                          onClick={() => handleSocialLogin(provider)}
                          disabled={loading}
                          sx={{
                            py: 1.75,
                            px: 3,
                            borderRadius: '14px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.12)',
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              borderColor: color,
                              background: (theme) => theme.palette.mode === 'dark'
                                ? `${color}15`
                                : `${color}08`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${color}30`,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Continue with {provider}
                        </Button>
                      ))}

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          my: 2,
                        }}
                      >
                        <Box sx={{ flex: 1, height: '1px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>Or</Typography>
                        <Box sx={{ flex: 1, height: '1px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                      </Box>

                      {[
                        { provider: 'Facebook', Icon: FaFacebookF, color: '#1877F2' },
                        { provider: 'X', Icon: FaXTwitter, color: '#000000' },
                      ].map(({ provider, Icon, color }) => (
                        <Button
                          key={provider}
                          fullWidth
                          variant="outlined"
                          startIcon={<Icon style={{ fontSize: '1.25rem' }} />}
                          onClick={() => handleSocialLogin(provider)}
                          disabled={loading}
                          sx={{
                            py: 1.75,
                            px: 3,
                            borderRadius: '14px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.12)'
                              : 'rgba(0, 0, 0, 0.12)',
                            color: 'text.primary',
                            background: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(10px)',
                            '&:hover': {
                              borderColor: color,
                              background: (theme) => theme.palette.mode === 'dark'
                                ? `${color}15`
                                : `${color}08`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${color}30`,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Continue with {provider}
                        </Button>
                      ))}

                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: 'center',
                          mt: 3,
                          color: 'text.secondary',
                        }}
                      >
                        Already have an account?{' '}
                        <Typography
                          component="span"
                          sx={{
                            color: '#0db4bc',
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={() => setIsSignup(false)}
                        >
                          Login
                        </Typography>
                      </Typography>
                    </Box>
                  ) : (
                    // Email Signup Form
                    <Box component="form" onSubmit={handleSignupSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      <TextField
                        fullWidth
                        type="text"
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="off"
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

                      <TextField
                        fullWidth
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="off"
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

                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        inputProps={{ minLength: 6 }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                                sx={{ color: '#0db4bc' }}
                              >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
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

                      <TextField
                        fullWidth
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                                sx={{ color: '#0db4bc' }}
                              >
                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
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
                          mt: 1,
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
                        {loading ? 'Creating Account...' : 'Sign Up'}
                      </Button>

                      <Button
                        type="button"
                        fullWidth
                        variant="text"
                        startIcon={<FaArrowLeft />}
                        onClick={() => setShowEmailForm(false)}
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          color: 'text.secondary',
                          '&:hover': {
                            color: '#0db4bc',
                            background: 'transparent',
                          },
                        }}
                      >
                        Back to Sign Up Options
                      </Button>
                    </Box>
                  )}
                </motion.div>
              ) : (
                // Login View - Email/Password Form
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box component="form" onSubmit={handleLoginSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="off"
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

                    <TextField
                      fullWidth
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="off"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: '#0db4bc' }}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
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
                        mt: 1,
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
                      {loading ? 'Logging in...' : 'Login'}
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      my: 3,
                    }}
                  >
                    <Box sx={{ flex: 1, height: '1px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>or</Typography>
                    <Box sx={{ flex: 1, height: '1px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FaGoogle style={{ fontSize: '1.25rem' }} />}
                    onClick={() => handleSocialLogin('Google')}
                    disabled={loading}
                    sx={{
                      py: 1.75,
                      px: 3,
                      borderRadius: '14px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.12)',
                      color: 'text.primary',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: '#DB4437',
                        background: (theme) => theme.palette.mode === 'dark'
                          ? '#DB443715'
                          : '#DB443708',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 20px #DB443730',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Continue with Google
                  </Button>

                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', textAlign: 'center' }}
                    >
                      Don't have an account?{' '}
                      <Typography
                        component="span"
                        sx={{
                          color: '#0db4bc',
                          fontWeight: 600,
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => {
                          setIsSignup(true);
                          setShowEmailForm(false);
                          setError('');
                        }}
                      >
                        Sign Up
                      </Typography>
                    </Typography>
                    <Typography
                      component={Link}
                      to="/forgot-password"
                      variant="body2"
                      sx={{
                        color: '#0db4bc',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Forgot password?
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </motion.div>

      {/* Mobile Back Button */}
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 1000,
          display: { xs: 'block', lg: 'none' },
        }}
      >
        <IconButton
          onClick={() => navigate('/')}
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
    </Box>
  );
};

export default SignupPage;

