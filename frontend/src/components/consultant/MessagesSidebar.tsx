import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { FaEnvelope, FaComments } from 'react-icons/fa';

interface MessagesSidebarProps {
  currentUser: any;
}

const MessagesSidebar = ({ currentUser }: MessagesSidebarProps) => {
  const navigate = useNavigate();

  return (
    <Box
      component={motion.aside}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass-card"
      sx={{
        position: 'sticky',
        top: 80,
        height: 'fit-content',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            boxShadow: '0 4px 16px rgba(13, 180, 188, 0.3)',
          }}
        >
          <FaComments size={20} color="#fff" />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#1f2937',
          }}
        >
          Messages
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: 1.6,
        }}
      >
        Your conversations with buyers now live in the dedicated Messaging Center.
      </Typography>

      <Button
        variant="contained"
        fullWidth
        component={motion.button}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        startIcon={<FaEnvelope />}
        onClick={() =>
          navigate('/messages', {
            state: currentUser
              ? {
                  user: {
                    _id: currentUser.id,
                    name: currentUser.name,
                    profileImage: currentUser.profileImage,
                    accountType: currentUser.accountType,
                  },
                }
              : undefined,
          })
        }
        sx={{
          py: 1.5,
          mt: 1,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          color: '#fff',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 4px 16px rgba(13, 180, 188, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            boxShadow: '0 6px 20px rgba(13, 180, 188, 0.4)',
          },
        }}
      >
        Open Messaging Center
      </Button>

      <Typography
        sx={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Reach out to buyers, answer questions, and close deals faster
      </Typography>
    </Box>
  );
};

export default MessagesSidebar;
