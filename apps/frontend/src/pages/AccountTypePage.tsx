import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserTie, FaArrowLeft } from 'react-icons/fa';
import { Box, Typography, IconButton, CircularProgress, Card } from '@mui/material';
import { motion } from 'framer-motion';
import { httpClient } from '../api/httpClient';
import { authService } from '../services/authService';

const AccountTypePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountTypeSelect = async (type: 'consultant' | 'buyer') => {
    setIsLoading(true);
    try {
      // Update account type in backend
      await httpClient.patch('/users/me', { accountType: type });
      
      // Update localStorage with new account type
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, accountType: type };
        localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
        
        // Dispatch a custom event to notify AuthContext of user data update
        window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: updatedUser }));
      }

      // Navigate based on account type
      if (type === 'consultant') {
        // Consultants need to verify their identity
        navigate('/verify-identity');
      } else {
        // Buyers go to buyer dashboard
        navigate('/buyer-dashboard');
      }
    } catch (error) {
      console.error('Failed to update account type:', error);
      alert('Failed to update account type. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const accountTypes = [
    {
      type: 'consultant' as const,
      Icon: FaUserShield,
      title: 'Consultant',
      description: 'Provide consultancy services',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      type: 'buyer' as const,
      Icon: FaUserTie,
      title: 'Buyer',
      description: 'Hire a consultant',
      gradient: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
    },
  ];

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
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 80% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)',
          opacity: 0.4,
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
          onClick={() => navigate(-1)}
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

      {/* Main Content */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        sx={{
          width: '100%',
          maxWidth: 900,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 900,
              mb: 2,
              background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome!
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            Select Your Account Type
          </Typography>
        </Box>

        {/* Account Type Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 4,
          }}
        >
          {accountTypes.map(({ type, Icon, title, description, gradient }) => (
            <Card
              key={type}
              component={motion.div}
              whileHover={{ scale: 1.03, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !isLoading && handleAccountTypeSelect(type)}
              sx={{
                p: 4,
                borderRadius: '28px',
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.7) 0%, rgba(10, 25, 27, 0.85) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '2px solid rgba(13, 180, 188, 0.15)'
                  : '2px solid rgba(13, 180, 188, 0.1)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 15px 45px rgba(0, 0, 0, 0.3)'
                  : '0 15px 45px rgba(13, 180, 188, 0.12)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#0db4bc',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 20px 60px rgba(13, 180, 188, 0.25)'
                    : '0 20px 60px rgba(13, 180, 188, 0.2)',
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: '20px',
                  background: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(13, 180, 188, 0.3)',
                }}
              >
                <Icon style={{ fontSize: '2.5rem', color: '#ffffff' }} />
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontSize: { xs: '1.4rem', md: '1.75rem' },
                  fontWeight: 700,
                  mb: 1,
                  color: 'text.primary',
                }}
              >
                {title}
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '1rem',
                }}
              >
                {description}
              </Typography>
            </Card>
          ))}
        </Box>

        {/* Loading Indicator */}
        {isLoading && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{
              mt: 4,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={24} sx={{ color: '#0db4bc' }} />
            <Typography sx={{ color: 'text.secondary', fontSize: '1rem' }}>
              Updating account type...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AccountTypePage;

