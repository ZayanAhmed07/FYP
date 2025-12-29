import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, TextField, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';

interface JobSummary {
  _id: string;
  title: string;
  category: string;
  location: string;
  budget?: {
    min: number;
    max: number;
  };
}

const SubmitProposalPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobSummary | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        const response = await httpClient.get(`/jobs/${jobId}`);
        if (response.data?.data) {
          setJob(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load job for proposal', err);
        setError('Failed to load job. Please go back and try again.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    setError('');
    setSuccess('');

    const numericBid = Number(bidAmount);
    if (Number.isNaN(numericBid) || numericBid <= 0) {
      setError('Please enter a valid bid amount in PKR.');
      return;
    }
    if (numericBid < 1000) {
      setError('Bid amount must be at least 1000 PKR.');
      return;
    }
    if (!deliveryTime.trim()) {
      setError('Please specify a delivery time (e.g., 7 days).');
      return;
    }
    if (deliveryTime.trim().length < 3) {
      setError('Delivery time must be at least 3 characters.');
      return;
    }
    if (!coverLetter.trim()) {
      setError('Please write a brief cover letter.');
      return;
    }
    if (coverLetter.trim().length < 100) {
      setError('Cover letter must be at least 100 characters.');
      return;
    }

    try {
      setLoading(true);
      await httpClient.post('/proposals', {
        jobId,
        proposedAmount: numericBid,
        estimatedDelivery: deliveryTime,
        coverLetter,
      });
      setSuccess('Proposal submitted successfully!');
      setTimeout(() => {
        navigate('/consultant-dashboard');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to submit proposal', err);
      const message =
        err?.response?.data?.message ||
        (err?.response?.data?.error && String(err.response.data.error)) ||
        'Failed to submit proposal. You may have already submitted one for this job.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        py: 4,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          maxWidth: '800px',
          mx: 'auto',
          px: 3,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          sx={{
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '16px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Back
        </Button>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 700,
          }}
        >
          Submit Proposal
        </Typography>
      </Box>

      <Box
        sx={{
          maxWidth: '800px',
          mx: 'auto',
          px: 3,
        }}
      >
        {/* Job Summary Card */}
        {job && (
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              p: 3,
              mb: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 2,
              }}
            >
              {job.title}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
              }}
            >
              <Typography
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                {job.category}
              </Typography>
              <Typography
                sx={{
                  display: 'inline-block',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  background: 'rgba(13, 180, 188, 0.1)',
                  color: '#0db4bc',
                  fontSize: '14px',
                }}
              >
                {job.location}
              </Typography>
            </Box>
            <Typography sx={{ color: '#666' }}>
              <strong>Buyer Budget:</strong> {formatBudget(job.budget)}
            </Typography>
          </Box>
        )}

        {/* Proposal Form Card */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          {error && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Typography sx={{ color: '#ef4444' }}>{error}</Typography>
            </Box>
          )}

          {success && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Typography sx={{ color: '#22c55e' }}>{success}</Typography>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Your Bid Amount (PKR) *
              </Typography>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: '13px',
                  color: '#666',
                }}
              >
                Minimum: 1000 PKR
              </Typography>
              <TextField
                type="number"
                inputProps={{ min: 1000 }}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="e.g., 15000"
                disabled={loading}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Delivery Time *
              </Typography>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: '13px',
                  color: '#666',
                }}
              >
                Minimum: 3 characters (e.g., "7 days", "2 weeks", "1 month")
              </Typography>
              <TextField
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g., 7 days, 2 weeks, or 1 month"
                disabled={loading}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Cover Letter *
              </Typography>
              <Typography
                sx={{
                  mb: 1,
                  fontSize: '13px',
                  color: '#666',
                }}
              >
                Minimum: 100 characters ({coverLetter.length}/100)
              </Typography>
              <TextField
                multiline
                rows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you're a great fit for this project... (minimum 100 characters)"
                disabled={loading}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                    },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'flex-end',
              }}
            >
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
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
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
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
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SubmitProposalPage;





