import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { FaDollarSign, FaCheckCircle, FaClock, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

interface EarningsCardProps {
  earnings: {
    total: number;
    paid: number;
    pending: number;
  };
}

const EarningsCard = ({ earnings }: EarningsCardProps) => {
  const navigate = useNavigate();
  const paidPercentage = earnings.total > 0 ? (earnings.paid / earnings.total) * 100 : 0;

  const handleWithdrawClick = () => {
    navigate('/withdrawal');
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -4 }}
      className="glass-card"
      sx={{
        p: 2.5,
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: 'rgba(13, 180, 188, 0.3)',
          boxShadow: '0 12px 40px rgba(13, 180, 188, 0.25)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 2,
          fontSize: '1rem',
        }}
      >
        Earnings
      </Typography>

      {/* Circular Progress */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={120}
            thickness={4}
            sx={{
              color: '#e5e7eb',
              position: 'absolute',
            }}
          />
          <CircularProgress
            variant="determinate"
            value={paidPercentage}
            size={120}
            thickness={4}
            sx={{
              color: '#22c55e',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                mb: 1,
                boxShadow: '0 4px 16px rgba(13, 180, 188, 0.4)',
                color: '#fff',
              }}
            >
              <FaDollarSign size={24} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
                fontSize: '1.25rem',
              }}
            >
              Rs {earnings.total.toLocaleString()}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.7rem',
                color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
              }}
            >
              Total
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Breakdown */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
              }}
            >
              <FaCheckCircle size={14} />
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#374151', fontWeight: 500 }}>
              Paid
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>
            Rs {earnings.paid.toLocaleString()}
          </Typography>
        </Box>

        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
              }}
            >
              <FaClock size={14} />
            </Box>
            <Typography sx={{ fontSize: '0.8rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#374151', fontWeight: 500 }}>
              Pending
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
            Rs {earnings.pending.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Withdraw Button */}
      <Button
        onClick={handleWithdrawClick}
        sx={{
          mt: 2,
          width: '100%',
          py: 1.2,
          background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
          color: 'white',
          fontWeight: 600,
          borderRadius: '8px',
          textTransform: 'none',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'linear-gradient(135deg, #0a9faa 0%, #3d9aaa 100%)',
            boxShadow: '0 8px 24px rgba(13, 180, 188, 0.35)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        <FaArrowRight size={14} />
        Withdraw Earnings
      </Button>
    </Box>
  );
};

export default EarningsCard;
