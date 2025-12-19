import { Box, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { FaDollarSign, FaCheckCircle, FaClock } from 'react-icons/fa';

interface EarningsCardProps {
  earnings: {
    total: number;
    paid: number;
    pending: number;
  };
}

const EarningsCard = ({ earnings }: EarningsCardProps) => {
  const paidPercentage = earnings.total > 0 ? (earnings.paid / earnings.total) * 100 : 0;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -4 }}
      className="glass-card"
      sx={{
        p: 3,
        transition: 'all 0.3s ease',
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
          mb: 3,
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
          mb: 3,
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={160}
            thickness={4}
            sx={{
              color: '#e5e7eb',
              position: 'absolute',
            }}
          />
          <CircularProgress
            variant="determinate"
            value={paidPercentage}
            size={160}
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
                width: 48,
                height: 48,
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
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1f2937',
              }}
            >
              Rs {earnings.total.toLocaleString()}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: '#6b7280',
              }}
            >
              Total Earnings
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Breakdown */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          component={motion.div}
          whileHover={{ x: 4 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderRadius: '12px',
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
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
              }}
            >
              <FaCheckCircle size={16} />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
              Paid
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#22c55e' }}>
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
            p: 2,
            borderRadius: '12px',
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
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
              }}
            >
              <FaClock size={16} />
            </Box>
            <Typography sx={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
              Pending
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#f59e0b' }}>
            Rs {earnings.pending.toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default EarningsCard;
