import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { Schedule as ClockIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';

const VerificationPendingPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Box
        sx={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          p: 5,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
        }}
      >
        {/* Clock Icon */}
        <Box
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <ClockIcon
            sx={{
              fontSize: 50,
              color: 'white',
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1a1a1a',
            mb: 2,
          }}
        >
          Verification Pending
        </Typography>

        {/* Message */}
        <Typography
          sx={{
            fontSize: '16px',
            color: '#666',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          Thank you for submitting your profile! Our admin team is currently reviewing your documents and information.
        </Typography>

        {/* Info Card */}
        <Box
          sx={{
            background: 'rgba(13, 180, 188, 0.05)',
            border: '2px solid rgba(13, 180, 188, 0.2)',
            borderRadius: 2,
            p: 3,
            mb: 4,
            textAlign: 'left',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 32,
                color: '#0db4bc',
                flexShrink: 0,
                mt: 0.5,
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  mb: 2,
                }}
              >
                What's Next?
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 2,
                  m: 0,
                  '& li': {
                    color: '#666',
                    mb: 1,
                    lineHeight: 1.6,
                  },
                }}
              >
                <li>Our team will review your CNIC and profile details</li>
                <li>Verification typically takes 24-48 hours</li>
                <li>You'll receive an email once your profile is approved</li>
                <li>After approval, you can access your consultant dashboard</li>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Button
            onClick={() => navigate('/')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              color: 'white',
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(13, 180, 188, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(13, 180, 188, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Return to Home
          </Button>
          <Button
            onClick={() => navigate('/login')}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              border: '2px solid #0db4bc',
              color: '#0db4bc',
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(13, 180, 188, 0.1)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Go to Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default VerificationPendingPage;
