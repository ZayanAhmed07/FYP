import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaDownload, FaArrowLeft } from 'react-icons/fa';
import { Box, Container, Typography, CircularProgress, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';

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
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  skills?: string[];
  attachments?: string[];
  createdAt: string;
}

const ConsultantProjectDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobFromApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        setLoading(true);
        setError('');
        const response = await httpClient.get(`/jobs/${jobId}`);
        if (response.data?.data) {
          setJob(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load project details', err);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const formatBudget = (budget?: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    if (!budget.min && !budget.max) return 'Not specified';
    if (!budget.max || budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
  };

  const getFilenameFromBase64 = (base64String: string): string => {
    // Extract filename from data URL or generate a default one
    try {
      const parts = base64String.split(',');
      if (parts.length > 1) {
        const metadata = parts[0];
        if (metadata.includes('filename=')) {
          const match = metadata.match(/filename=([^;]+)/);
          if (match) return decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      console.error('Error parsing filename from base64', e);
    }
    return `attachment_${new Date().getTime()}`;
  };

  const downloadFile = (base64String: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64String;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file', error);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#fff', mb: 2 }} size={60} />
          <Typography sx={{ color: '#fff', fontSize: '1.125rem' }}>
            Loading project...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <Typography sx={{ color: '#ef4444', fontSize: '1.125rem', mb: 3, fontWeight: 600 }}>
            {error || 'Project not found.'}
          </Typography>
          <Button
            onClick={() => navigate('/consultant-dashboard')}
            startIcon={<FaArrowLeft />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Back to Projects
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
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
          <Typography
            sx={{
              color: '#fff',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            Project Details
          </Typography>
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
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {/* Card Header */}
          <Box sx={{ mb: 4 }}>
            <Chip
              label={job.category}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 600,
                mb: 2,
                px: 2,
                py: 2.5,
              }}
            />
            <Typography
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#1f2937',
                mb: 2,
              }}
            >
              {job.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaClock style={{ color: '#667eea', fontSize: '18px' }} />
                <Typography sx={{ color: '#6b7280', fontSize: '0.95rem' }}>
                  Posted on {new Date(job.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FaMapMarkerAlt style={{ color: '#ef4444', fontSize: '18px' }} />
                <Typography sx={{ color: '#6b7280', fontSize: '0.95rem' }}>
                  {job.location}
                </Typography>
              </Box>
              <Chip
                label={job.status === 'open' ? 'Open' : job.status}
                sx={{
                  background: job.status === 'open' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : '#9ca3af',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          {/* Description Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#1f2937',
                mb: 2,
              }}
            >
              Description
            </Typography>
            <Typography
              sx={{
                color: '#4b5563',
                fontSize: '1rem',
                lineHeight: 1.7,
              }}
            >
              {job.description}
            </Typography>
          </Box>

          {/* Budget & Timeline Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 4,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '16px',
                p: 3,
                color: '#fff',
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', opacity: 0.9, mb: 1 }}>
                Budget
              </Typography>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {formatBudget(job.budget)}
              </Typography>
            </Box>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '16px',
                p: 3,
                color: '#fff',
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', opacity: 0.9, mb: 1 }}>
                Timeline
              </Typography>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {job.timeline || 'Not specified'}
              </Typography>
            </Box>
          </Box>

          {/* Skills Section */}
          {job.skills && job.skills.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 2,
                }}
              >
                Required Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {job.skills.map((skill: string, index: number) => (
                  <Chip
                    key={index}
                    label={skill.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      px: 1,
                      py: 2.5,
                      borderRadius: '12px',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Attachments Section */}
          {job.attachments && job.attachments.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 2,
                }}
              >
                Attachments
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {job.attachments.map((attachment: string, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                    }}
                  >
                    <Typography sx={{ color: '#4b5563', fontSize: '0.95rem', fontWeight: 500 }}>
                      {getFilenameFromBase64(attachment)}
                    </Typography>
                    <Button
                      onClick={() =>
                        downloadFile(
                          attachment,
                          getFilenameFromBase64(attachment)
                        )
                      }
                      startIcon={<FaDownload />}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        px: 3,
                        py: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Download
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
            }}
          >
            <Button
              onClick={() => navigate('/consultant-dashboard')}
              sx={{
                background: 'rgba(156, 163, 175, 0.15)',
                color: '#4b5563',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(156, 163, 175, 0.25)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => navigate(`/submit-proposal/${job._id}`)}
              disabled={job.status !== 'open'}
              sx={{
                background: job.status === 'open' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#9ca3af',
                color: '#fff',
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                boxShadow: job.status === 'open' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                '&:hover': {
                  background: job.status === 'open'
                    ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                    : '#9ca3af',
                  boxShadow: job.status === 'open' ? '0 6px 20px rgba(102, 126, 234, 0.4)' : 'none',
                },
                '&:disabled': {
                  color: '#fff',
                  opacity: 0.6,
                },
              }}
            >
              {job.status === 'open' ? 'Submit Proposal' : 'Project Closed'}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ConsultantProjectDetailsPage;





