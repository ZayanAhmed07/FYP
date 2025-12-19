import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { storage } from '../utils/storage';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google auth error:', error);
        navigate('/login', { state: { error: 'Google authentication failed' } });
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));

          // Clear any previous authentication state before setting new data
          localStorage.removeItem('expert_raah_user');

          // Store the token using the storage utility
          storage.setToken('expert_raah_token', token);

          // Store the new user data
          localStorage.setItem('expert_raah_user', JSON.stringify(user));

          // Dispatch a custom event to notify AuthContext of the OAuth login
          window.dispatchEvent(new CustomEvent('oauthLogin', { detail: user }));

          // Check if user needs to select account type
          if (!user.accountType) {
            navigate('/account-type');
            return;
          }

          // Redirect to dashboard based on user role
          if (user.accountType === 'consultant') {
            navigate('/consultant-dashboard');
          } else if (user.accountType === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/buyer-dashboard');
          }
        } catch (err) {
          console.error('Error processing auth callback:', err);
          navigate('/login', { state: { error: 'Authentication failed' } });
        }
      } else {
        navigate('/login', { state: { error: 'Invalid authentication response' } });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          p: 4,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CircularProgress
          sx={{
            color: '#0db4bc',
            mb: 3,
          }}
          size={60}
        />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: '#1a1a1a',
            mb: 1,
          }}
        >
          Completing sign in...
        </Typography>
        <Typography
          sx={{
            color: '#666',
            fontSize: '0.95rem',
          }}
        >
          Please wait while we authenticate your account
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallbackPage;