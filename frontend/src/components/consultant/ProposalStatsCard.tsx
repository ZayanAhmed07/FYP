import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface ProposalStatsCardProps {
  proposalStats: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
}

const ProposalStatsCard = ({ proposalStats }: ProposalStatsCardProps) => {
  const stats = [
    {
      label: 'Total Proposals',
      value: proposalStats.total,
      icon: <FaFileAlt size={24} />,
      gradient: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
      color: '#0db4bc',
    },
    {
      label: 'Pending',
      value: proposalStats.pending,
      icon: <FaClock size={24} />,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: '#f59e0b',
    },
    {
      label: 'Accepted',
      value: proposalStats.accepted,
      icon: <FaCheckCircle size={24} />,
      gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      color: '#22c55e',
    },
    {
      label: 'Rejected',
      value: proposalStats.rejected,
      icon: <FaTimesCircle size={24} />,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: '#ef4444',
    },
  ];

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Proposals
        </Typography>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: '#6b7280',
            fontWeight: 600,
          }}
        >
          {new Date().getFullYear()}
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
        {stats.map((stat, index) => (
            <Box
              key={stat.label}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              sx={{
                p: 2,
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                border: `1px solid ${stat.color}30`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: `${stat.color}60`,
                  boxShadow: `0 8px 24px ${stat.color}30`,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: stat.gradient,
                  mb: 1.5,
                  boxShadow: `0 4px 16px ${stat.color}40`,
                  color: '#fff',
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                {stat.label}
              </Typography>
            </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ProposalStatsCard;
