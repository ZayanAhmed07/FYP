import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaDollarSign, FaEye, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaSun, FaMoon } from 'react-icons/fa';
import { Box, Container, Typography, Chip, CircularProgress, Button, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { proposalService, type Proposal } from '../services/proposalService';
import { httpClient } from '../api/httpClient';
import { useThemeMode } from '../context/ThemeContext';

const ConsultantProposalsPage = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConsultantProfile(user.id);
  }, [navigate]);

  const fetchConsultantProfile = async (userId: string) => {
    try {
      const response = await httpClient.get(`/consultants/user/${userId}`);
      const consultant = response.data?.data;
      if (consultant?._id) {
        fetchProposals(consultant._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch consultant profile', error);
      setLoading(false);
    }
  };

  const fetchProposals = async (consultantId: string) => {
    try {
      setLoading(true);
      const data = await proposalService.getProposalsByConsultant(consultantId);
      setProposals(data);
    } catch (error) {
      console.error('Failed to fetch proposals', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle style={{ fontSize: '16px' }} />;
      case 'rejected':
        return <FaTimesCircle style={{ fontSize: '16px' }} />;
      default:
        return <FaHourglassHalf style={{ fontSize: '16px' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateStats = () => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === 'pending').length;
    const accepted = proposals.filter((p) => p.status === 'accepted').length;
    const rejected = proposals.filter((p) => p.status === 'rejected').length;
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

    return { total, pending, accepted, rejected, acceptanceRate };
  };

  const stats = calculateStats();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1 }}>
            <Button
              onClick={() => navigate('/consultant-dashboard')}
              startIcon={<FaArrowLeft />}
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#0db4bc',
                background: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(13, 180, 188, 0.1)',
                backdropFilter: 'blur(10px)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.2)'
                  : '1px solid rgba(13, 180, 188, 0.3)',
                px: 3,
                py: 1.2,
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(13, 180, 188, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Back to Dashboard
            </Button>
            <Typography
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#0db4bc',
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                textShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 2px 10px rgba(0, 0, 0, 0.5)'
                  : '0 2px 10px rgba(13, 180, 188, 0.2)',
              }}
            >
              My Proposals
            </Typography>
          </Box>
          
          {/* Theme Toggle */}
          <IconButton
            component={motion.button}
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#fff' : '#0db4bc',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(13, 180, 188, 0.1)',
              border: (theme) => theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : '1px solid rgba(13, 180, 188, 0.3)',
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(13, 180, 188, 0.2)',
                boxShadow: '0 0 20px rgba(13, 180, 188, 0.4)',
              },
            }}
          >
            {mode === 'dark' ? <FaSun size={20} /> : <FaMoon size={20} />}
          </IconButton>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { icon: '📊', value: stats.total, label: 'Total Proposals', color: '#0db4bc', bgColor: 'rgba(13, 180, 188, 0.1)' },
            { icon: '⏳', value: stats.pending, label: 'Pending', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
            { icon: '✅', value: stats.accepted, label: 'Accepted', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' },
            { icon: '❌', value: stats.rejected, label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
            { icon: '📈', value: `${stats.acceptanceRate}%`, label: 'Acceptance Rate', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
          ].map((stat, index) => (
            <Box
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)' }}
              sx={{
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.8)'
                  : '#fff',
                borderRadius: '16px',
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                  : '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: stat.color,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: stat.color,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Filters */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { value: 'all', label: 'All', count: proposals.length },
            { value: 'pending', label: 'Pending', count: stats.pending },
            { value: 'accepted', label: 'Accepted', count: stats.accepted },
            { value: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map((filterOption) => (
            <Button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as typeof filter)}
              component={motion.button}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                background: (theme) => 
                  filter === filterOption.value
                    ? '#0db4bc'
                    : theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#fff',
                color: (theme) => 
                  filter === filterOption.value 
                    ? '#fff' 
                    : theme.palette.mode === 'dark' ? '#e5e7eb' : '#6b7280',
                px: 4,
                py: 1.2,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 600,
                border: (theme) => filter === filterOption.value 
                  ? '2px solid #0db4bc' 
                  : theme.palette.mode === 'dark' ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid #e5e7eb',
                boxShadow: filter === filterOption.value 
                  ? '0 2px 4px rgba(13, 180, 188, 0.2)' 
                  : (theme) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  background: (theme) =>
                    filter === filterOption.value
                      ? '#0a8b91'
                      : theme.palette.mode === 'dark' ? 'rgba(51, 65, 85, 0.8)' : '#f9fafb',
                  borderColor: (theme) => filter === filterOption.value 
                    ? '#0a8b91' 
                    : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {filterOption.label} ({filterOption.count})
            </Button>
          ))}
        </Box>

        {/* Proposals List */}
        {loading ? (
          <Box
            sx={{
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#fff',
              borderRadius: '16px',
              p: 6,
              textAlign: 'center',
              boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
            }}
          >
            <CircularProgress sx={{ color: '#0db4bc', mb: 2 }} size={60} />
            <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '1.125rem' }}>
              Loading proposals...
            </Typography>
          </Box>
        ) : filteredProposals.length === 0 ? (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'rgba(30, 41, 59, 0.8)' 
                : 'linear-gradient(135deg, rgba(13, 180, 188, 0.05) 0%, rgba(13, 180, 188, 0.1) 100%)',
              borderRadius: '16px',
              p: 6,
              textAlign: 'center',
              border: (theme) => theme.palette.mode === 'dark'
                ? '2px dashed rgba(13, 180, 188, 0.3)'
                : '2px dashed rgba(13, 180, 188, 0.2)',
            }}
          >
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>📭</Typography>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
                mb: 1,
              }}
            >
              No proposals {filter !== 'all' ? filter : 'yet'}
            </Typography>
            <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '1rem', mb: 3 }}>
              {filter === 'all'
                ? 'Start submitting proposals to jobs that match your expertise'
                : `You don't have any ${filter} proposals`}
            </Typography>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/consultant-dashboard')}
                sx={{
                  background: '#0db4bc',
                  color: '#fff',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 2px 4px rgba(13, 180, 188, 0.2)',
                  '&:hover': {
                    background: '#0a8b91',
                    boxShadow: '0 4px 6px rgba(13, 180, 188, 0.3)',
                  },
                }}
              >
                Browse Jobs
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {filteredProposals.map((proposal, index) => (
              <Box
                key={proposal._id}
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(102, 126, 234, 0.3)' }}
                sx={{
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : '#fff',
                  borderRadius: '16px',
                  p: 3,
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: '#0db4bc',
                  },
                  '&:hover': {
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(13, 180, 188, 0.3)' 
                      : '0 8px 32px rgba(13, 180, 188, 0.2)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {/* Proposal Header */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 3,
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: '200px' }}>
                    <Typography
                      sx={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
                        mb: 1,
                      }}
                    >
                      {proposal.jobId?.title || 'Job Title Unavailable'}
                    </Typography>
                    <Chip
                      label={proposal.jobId?.category || 'General'}
                      sx={{
                        background: 'rgba(13, 180, 188, 0.1)',
                        color: '#0db4bc',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        border: '1px solid rgba(13, 180, 188, 0.2)',
                      }}
                    />
                  </Box>
                  <Chip
                    icon={getStatusIcon(proposal.status)}
                    label={proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    sx={{
                      background:
                        proposal.status === 'accepted'
                          ? '#22c55e'
                          : proposal.status === 'rejected'
                          ? '#ef4444'
                          : '#f59e0b',
                      color: '#fff',
                      fontWeight: 600,
                      px: 2,
                      py: 2.5,
                    }}
                  />
                </Box>

                {/* Meta Information */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 3,
                    mb: 3,
                    p: 2.5,
                    background: (theme) => theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : '#f9fafb',
                    borderRadius: '12px',
                    border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e5e7eb',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaDollarSign style={{ color: '#0db4bc', fontSize: '16px' }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                        Bid Amount
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937' }}>
                        Rs {proposal.bidAmount?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaClock style={{ color: '#0db4bc', fontSize: '16px' }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Delivery
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#1f2937' }}>
                        {proposal.deliveryTime}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Submitted
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#1f2937' }}>
                        {formatDate(proposal.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Cover Letter */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
                      mb: 1,
                    }}
                  >
                    Cover Letter:
                  </Typography>
                  <Typography
                    sx={{
                      color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#4b5563',
                      fontSize: '0.95rem',
                      lineHeight: 1.6,
                      maxHeight: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {proposal.coverLetter}
                  </Typography>
                </Box>

                {/* Client Budget */}
                {proposal.jobId?.budget && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      background: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(34, 197, 94, 0.1)' 
                        : 'rgba(34, 197, 94, 0.05)',
                      borderRadius: '12px',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
                      Client Budget:
                    </Typography>
                    <Typography sx={{ color: '#22c55e', fontSize: '1rem', fontWeight: 700 }}>
                      Rs {proposal.jobId.budget.min?.toLocaleString()} - Rs {proposal.jobId.budget.max?.toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    onClick={() => navigate(`/consultant-dashboard`)}
                    startIcon={<FaEye />}
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    sx={{
                      background: '#0db4bc',
                      color: '#fff',
                      px: 4,
                      py: 1.3,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(13, 180, 188, 0.2)',
                      '&:hover': {
                        background: '#0a8b91',
                        boxShadow: '0 4px 6px rgba(13, 180, 188, 0.3)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View Job Details
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ConsultantProposalsPage;
