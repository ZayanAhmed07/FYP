import { Box, Typography, Chip, CircularProgress, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaFileAlt } from 'react-icons/fa';

interface JobFromApi {
  _id: string;
  category: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  skills: string[];
  attachments?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposalsCount: number;
  createdAt: string;
  buyerId?: {
    _id: string;
    name: string;
    email?: string;
    profileImage?: string;
  };
}

interface JobsListProps {
  jobs: JobFromApi[];
  jobsLoading: boolean;
  jobsError: string;
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
}

const JobsList = ({ jobs, jobsLoading, jobsError, selectedJobId, onSelectJob }: JobsListProps) => {
  const formatBudget = (budget: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    return `Rs ${budget.min?.toLocaleString()} - Rs ${budget.max?.toLocaleString()}`;
  };

  const getDaysAgo = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffTime = Math.abs(now.getTime() - posted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  if (jobsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#0db4bc' }} />
      </Box>
    );
  }

  if (jobsError) {
    return (
      <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>
        {jobsError}
      </Alert>
    );
  }

  if (jobs.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          px: 3,
          borderRadius: '24px',
          background: 'rgba(13, 180, 188, 0.05)',
          border: '2px dashed rgba(13, 180, 188, 0.2)',
        }}
      >
        <Typography variant="h6" sx={{ color: '#6b7280', mb: 1, fontWeight: 600 }}>
          No jobs available at the moment
        </Typography>
        <Typography sx={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Check back soon for new opportunities matching your expertise
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <AnimatePresence>
        {jobs.map((job, index) => (
          <Box
            key={job._id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            onClick={() => onSelectJob(job._id)}
            className="glass-card"
            sx={{
              p: 3,
              cursor: 'pointer',
              border: selectedJobId === job._id ? '2px solid #0db4bc' : '2px solid transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: selectedJobId === job._id ? '#0db4bc' : 'rgba(13, 180, 188, 0.3)',
                boxShadow: selectedJobId === job._id
                  ? '0 12px 40px rgba(13, 180, 188, 0.35)'
                  : '0 12px 40px rgba(13, 180, 188, 0.25)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 1,
                    fontSize: '1.125rem',
                  }}
                >
                  {job.title}
                </Typography>
                <Chip
                  label={job.category}
                  size="small"
                  sx={{
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <Chip
                label={job.status === 'open' ? 'Open' : 'Closed'}
                size="small"
                sx={{
                  background:
                    job.status === 'open'
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Box>

            <Typography
              sx={{
                color: '#6b7280',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              {job.description.length > 150
                ? job.description.substring(0, 150) + '...'
                : job.description}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FaMapMarkerAlt size={14} color="#0db4bc" />
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {job.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <FaClock size={14} color="#0db4bc" />
                <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {job.timeline || 'Not specified'}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 2,
                borderTop: '1px solid rgba(13, 180, 188, 0.1)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <FaMoneyBillWave size={16} color="#22c55e" />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#22c55e' }}>
                  {formatBudget(job.budget)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FaFileAlt size={12} color="#6b7280" />
                  <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {job.proposalsCount || 0} proposals
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {getDaysAgo(job.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default JobsList;
