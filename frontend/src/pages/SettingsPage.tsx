import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
            sx={{
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              px: 3,
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            Back
          </Button>
        </Box>

        {/* Main Card */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 6,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              fontSize: '5rem',
              mb: 3,
              display: 'inline-block',
              animation: 'spin 3s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            ⚙️
          </Box>

          {/* Title */}
          <Typography
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#1f2937',
              mb: 2,
            }}
          >
            Settings
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              color: '#6b7280',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              mb: 4,
            }}
          >
            Settings page coming soon. You'll be able to manage your account preferences,
            notifications, and privacy settings here.
          </Typography>

          {/* Decorative Elements */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 2,
              mt: 4,
            }}
          >
            {[
              { icon: '👤', label: 'Profile' },
              { icon: '🔔', label: 'Notifications' },
              { icon: '🔒', label: 'Privacy' },
            ].map((item, index) => (
              <Box
                key={index}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  p: 3,
                  background: 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(102, 126, 234, 0.2)',
                }}
              >
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>{item.icon}</Typography>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default SettingsPage;




