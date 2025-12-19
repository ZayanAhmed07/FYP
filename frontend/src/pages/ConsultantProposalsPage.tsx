import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaDollarSign, FaEye, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { Box, Container, Typography, Chip, CircularProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { proposalService, type Proposal } from '../services/proposalService';
import { httpClient } from '../api/httpClient';

const ConsultantProposalsPage = () => {
  const navigate = useNavigate();
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
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              onClick={() => navigate('/consultant-dashboard')}
              startIcon={<FaArrowLeft />}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                px: 3,
                py: 1.2,
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Back to Dashboard
            </Button>
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                fontWeight: 800,
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              }}
            >
              My Proposals
            </Typography>
          </Box>
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
            { icon: '📊', value: stats.total, label: 'Total Proposals', gradient: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' },
            { icon: '⏳', value: stats.pending, label: 'Pending', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { icon: '✅', value: stats.accepted, label: 'Accepted', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
            { icon: '❌', value: stats.rejected, label: 'Rejected', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
            { icon: '📈', value: `${stats.acceptanceRate}%`, label: 'Acceptance Rate', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
          ].map((stat, index) => (
            <Box
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)' }}
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
                  height: '4px',
                  background: stat.gradient,
                },
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  background: stat.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                sx={{
                  color: '#6b7280',
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
                background:
                  filter === filterOption.value
                    ? 'rgba(255, 255, 255, 0.98)'
                    : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: filter === filterOption.value ? '#0db4bc' : '#fff',
                px: 4,
                py: 1.2,
                borderRadius: '16px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 700,
                border: filter === filterOption.value ? '2px solid #0db4bc' : '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: filter === filterOption.value ? '0 4px 12px rgba(102, 126, 234, 0.25)' : 'none',
                '&:hover': {
                  background:
                    filter === filterOption.value
                      ? 'rgba(255, 255, 255, 1)'
                      : 'rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              p: 6,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CircularProgress sx={{ color: '#0db4bc', mb: 2 }} size={60} />
            <Typography sx={{ color: '#6b7280', fontSize: '1.125rem' }}>
              Loading proposals...
            </Typography>
          </Box>
        ) : filteredProposals.length === 0 ? (
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
            }}
          >
            <Typography sx={{ fontSize: '4rem', mb: 2 }}>📝</Typography>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1f2937',
                mb: 1,
              }}
            >
              No proposals {filter !== 'all' ? filter : 'yet'}
            </Typography>
            <Typography sx={{ color: '#6b7280', fontSize: '1rem', mb: 3 }}>
              {filter === 'all'
                ? 'Start submitting proposals to jobs that match your expertise'
                : `You don't have any ${filter} proposals`}
            </Typography>
            {filter === 'all' && (
              <Button
                onClick={() => navigate('/consultant-dashboard')}
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: '#fff',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
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
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  p: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
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
                    background: 'linear-gradient(90deg, #0db4bc 0%, #0a8b91 100%)',
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
                        color: '#1f2937',
                        mb: 1,
                      }}
                    >
                      {proposal.jobId?.title || 'Job Title Unavailable'}
                    </Typography>
                    <Chip
                      label={proposal.jobId?.category || 'General'}
                      sx={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#0db4bc',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}
                    />
                  </Box>
                  <Chip
                    icon={getStatusIcon(proposal.status)}
                    label={proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    sx={{
                      background:
                        proposal.status === 'accepted'
                          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                          : proposal.status === 'rejected'
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
                    p: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(102, 126, 234, 0.15)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaDollarSign style={{ color: '#0db4bc', fontSize: '16px' }} />
                    <Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        Bid Amount
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: '#1f2937' }}>
                        ${proposal.bidAmount}
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
                      color: '#1f2937',
                      mb: 1,
                    }}
                  >
                    Cover Letter:
                  </Typography>
                  <Typography
                    sx={{
                      color: '#4b5563',
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
                      background: 'rgba(34, 197, 94, 0.05)',
                      borderRadius: '12px',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
                      Client Budget:
                    </Typography>
                    <Typography sx={{ color: '#22c55e', fontSize: '1rem', fontWeight: 700 }}>
                      ${proposal.jobId.budget.min} - ${proposal.jobId.budget.max}
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
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: '#fff',
                      px: 4,
                      py: 1.3,
                      borderRadius: '14px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0a8b91 0%, #2d5a5f 100%)',
                        boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
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
