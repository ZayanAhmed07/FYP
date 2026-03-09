import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  LinearProgress,
  Modal,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ArrowBack, ArrowForward, AutoAwesome, ExpandMore } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';

interface JobSummary {
  _id: string;
  title: string;
  category: string;
  location: string;
  timeline?: string;
  description?: string;
  createdAt?: string;
  proposalsCount?: number;
  budget?: {
    min: number;
    max: number;
  };
}

interface ProposalLite {
  bidAmount: number;
}

const SubmitProposalPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:767px)');
  const isTablet = useMediaQuery('(min-width:768px) and (max-width:1199px)');

  const [job, setJob] = useState<JobSummary | null>(null);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [showTips, setShowTips] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [enhancedText, setEnhancedText] = useState('');
  const [enhancedDraft, setEnhancedDraft] = useState('');
  const [isEditingEnhanced, setIsEditingEnhanced] = useState(false);
  const [usedAiEnhancement, setUsedAiEnhancement] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const enhanceCooldownRef = useRef(0);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Check consultant verification status
    const checkVerification = async () => {
      try {
        const userId = user.id || (user as any)._id;
        if (!userId) {
          setError('User ID not found. Please log in again.');
          setCheckingVerification(false);
          return;
        }
        
        const response = await httpClient.get(`/consultants/user/${userId}`);
        if (response.data?.data) {
          setIsVerified(response.data.data.isVerified);
          if (!response.data.data.isVerified) {
            setError('Your consultant account is pending verification. Please wait for admin approval before submitting proposals.');
          }
        }
      } catch (err) {
        console.error('Failed to check verification status', err);
        setError('Failed to verify your consultant status. Please try again later.');
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [navigate]);

  useEffect(() => {
    const fetchJobAndStats = async () => {
      if (!jobId) return;

      try {
        const [jobResponse, proposalsResponse] = await Promise.all([
          httpClient.get(`/jobs/${jobId}`),
          httpClient.get(`/proposals/job/${jobId}`),
        ]);

        if (jobResponse.data?.data) {
          setJob(jobResponse.data.data);
        }

        if (proposalsResponse.data?.data) {
          setProposals(Array.isArray(proposalsResponse.data.data) ? proposalsResponse.data.data : []);
        }
      } catch (err) {
        console.error('Failed to load job for proposal', err);
        setError('Failed to load job. Please go back and try again.');
      }
    };

    fetchJobAndStats();
  }, [jobId]);

  const formatBudget = (budget?: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    if (!budget.min && !budget.max) return 'Not specified';
    if (!budget.max || budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
  };

  const avgBid = useMemo(() => {
    if (!proposals.length) return 0;
    const total = proposals.reduce((sum, p) => sum + (p.bidAmount || 0), 0);
    return Math.round(total / proposals.length);
  }, [proposals]);

  const numericBid = Number(bidAmount);

  const charCount = coverLetter.length;
  const charBandColor = charCount < 100 ? '#ef4444' : charCount < 300 ? '#f59e0b' : '#22c55e';
  const charProgress = Math.min(100, Math.round((charCount / 400) * 100));

  const showToast = (message: string, severity: 'success' | 'error' | 'warning') => {
    setToast({ open: true, message, severity });
  };

  const handleEnhanceCoverLetter = async () => {
    if (!coverLetter.trim() || !job) return;

    const now = Date.now();
    if (now - enhanceCooldownRef.current < 2500) {
      return;
    }
    enhanceCooldownRef.current = now;

    try {
      setEnhancing(true);
      const response = await httpClient.post('/proposals/enhance-cover-letter', {
        coverLetter,
        jobTitle: job.title,
        jobDescription: job.description || '',
      });

      const enhanced = response.data?.data?.enhancedText;
      if (!enhanced) {
        showToast('Unable to enhance. Please try again.', 'error');
        return;
      }

      setEnhancedText(enhanced);
      setEnhancedDraft(enhanced);
      setIsEditingEnhanced(false);
      setPreviewOpen(true);
      showToast('✅ Cover letter enhanced successfully', 'success');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.response?.data?.error;

      if (status === 429) {
        const retryAfterRaw = err?.response?.headers?.['retry-after'];
        const retrySeconds = retryAfterRaw ? Number(retryAfterRaw) : NaN;
        const retryMinutes = Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.ceil(retrySeconds / 60) : null;
        showToast(
          retryMinutes
            ? `Enhancement limit reached. Try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.`
            : 'Enhancement limit reached. Try again in a few minutes.',
          'warning',
        );
      } else {
        showToast(msg || 'Unable to enhance. Please try again.', 'error');
      }
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhancedVersion = () => {
    setCoverLetter(enhancedDraft || enhancedText);
    setUsedAiEnhancement(true);
    setPreviewOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    // Check verification status before submission
    if (isVerified === false) {
      setError('Your consultant account is pending verification. Please wait for admin approval before submitting proposals.');
      return;
    }

    if (checkingVerification) {
      setError('Checking verification status. Please wait...');
      return;
    }

    setError('');
    setSuccess('');

    if (Number.isNaN(numericBid) || numericBid <= 0) {
      setError('Please enter a valid bid amount in PKR.');
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
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #062228 0%, #0a2f36 55%, #0d1c22 100%)'
            : 'linear-gradient(135deg, #dff7fb 0%, #edfafd 55%, #f7fdff 100%)',
        py: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          maxWidth: '1320px',
          mx: 'auto',
          px: { xs: 2, md: 3 },
          mb: 3.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          sx={{
            color: theme.palette.mode === 'dark' ? '#ddf8fb' : '#0b4e58',
            background: theme.palette.mode === 'dark' ? 'rgba(6, 38, 45, 0.7)' : 'rgba(255, 255, 255, 0.88)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0,188,212,0.25)' : 'rgba(0,188,212,0.35)'}`,
            px: 3,
            py: 1,
            borderRadius: 3,
            textTransform: 'none',
            fontSize: '16px',
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(11, 66, 78, 0.85)' : 'rgba(255,255,255,1)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Back
        </Button>
        <Typography
          variant="h3"
          sx={{
            color: theme.palette.mode === 'dark' ? '#f3feff' : '#06333b',
            fontWeight: 800,
            fontSize: { xs: '1.6rem', md: '2rem' },
          }}
        >
          Submit Proposal
        </Typography>
      </Box>

      <Box
        sx={{
          maxWidth: '1320px',
          mx: 'auto',
          px: { xs: 2, md: 3 },
          py: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', xl: '0.35fr 0.65fr' },
          gap: { xs: 2, md: 3 },
        }}
      >
        {/* LEFT COLUMN */}
        {!isTablet && !isMobile && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <Box
              sx={{
                position: 'sticky',
                top: 24,
                borderRadius: '20px',
                p: 3,
                background: theme.palette.mode === 'dark' ? 'rgba(8, 45, 53, 0.93)' : 'rgba(255, 255, 255, 0.96)',
                boxShadow: theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.32)' : '0 10px 30px rgba(0,0,0,0.11)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0,188,212,0.2)' : 'rgba(0,188,212,0.16)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: theme.palette.mode === 'dark' ? '#e9fcff' : '#082f36', mb: 1.4 }}>
                {job?.title || 'Financial Planner'}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip label={job?.category || 'Legal'} sx={{ background: 'rgba(0,188,212,0.16)', color: '#00BCD4', fontWeight: 700 }} />
                <Chip label={job?.location || 'Karachi'} sx={{ background: 'rgba(45,90,95,0.16)', color: theme.palette.mode === 'dark' ? '#d1eef3' : '#2d5a5f', fontWeight: 700 }} />
              </Stack>

              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: '0.82rem', color: theme.palette.mode === 'dark' ? '#97bac2' : '#6b7280', mb: 0.3 }}>💵 Budget Range</Typography>
                <Typography sx={{ color: '#00BCD4', fontWeight: 800, fontSize: '1.45rem' }}>{formatBudget(job?.budget)}</Typography>
              </Box>

              <Divider sx={{ mb: 2, borderColor: theme.palette.mode === 'dark' ? 'rgba(131,186,196,0.18)' : 'rgba(107,114,128,0.22)' }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                <Box sx={{ p: 1.4, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(7,37,43,0.9)' : 'rgba(0,188,212,0.07)' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: theme.palette.mode === 'dark' ? '#9ac4cc' : '#6b7280' }}>📍 Location</Typography>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#effbfe' : '#0b2c33' }}>{job?.location || 'Karachi'}</Typography>
                </Box>
                <Box sx={{ p: 1.4, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(7,37,43,0.9)' : 'rgba(0,188,212,0.07)' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: theme.palette.mode === 'dark' ? '#9ac4cc' : '#6b7280' }}>⏱️ Timeline</Typography>
                  <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#effbfe' : '#0b2c33' }}>{job?.timeline || '1 month'}</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 1.6, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.16)' : 'rgba(17,24,39,0.04)', mb: 2 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: theme.palette.mode === 'dark' ? '#acd0d7' : '#4b5563', mb: 0.7 }}>
                  Project Description
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: theme.palette.mode === 'dark' ? '#d8eff4' : '#1f2937',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {job?.description || 'Project description will appear here once loaded.'}
                </Typography>
              </Box>

              <Box sx={{ p: 1.6, borderRadius: 2, background: theme.palette.mode === 'dark' ? 'rgba(6,30,35,0.95)' : 'rgba(6,78,89,0.06)', mb: 2 }}>
                <Typography sx={{ fontSize: '0.76rem', color: theme.palette.mode === 'dark' ? '#8fb5bd' : '#6b7280' }}>
                  Posted {job?.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'recently'}
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: theme.palette.mode === 'dark' ? '#8fb5bd' : '#6b7280' }}>
                  {proposals.length || job?.proposalsCount || 0} proposals received
                </Typography>
                <Typography sx={{ fontSize: '0.76rem', color: theme.palette.mode === 'dark' ? '#8fb5bd' : '#6b7280' }}>
                  Avg bid: {avgBid > 0 ? `Rs ${avgBid.toLocaleString()}` : 'N/A'}
                </Typography>
              </Box>

              <Chip
                label="💡 Tip: Competitive bids increase your chances"
                sx={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  background: 'rgba(0,188,212,0.15)',
                  color: '#00BCD4',
                  fontWeight: 700,
                  borderRadius: '10px',
                }}
              />
            </Box>
          </motion.div>
        )}

        {/* TABLET/MOBILE JOB DETAILS */}
        {(isTablet || isMobile) && (
          <Accordion
            defaultExpanded={isTablet}
            sx={{
              borderRadius: '16px !important',
              mb: 1,
              background: theme.palette.mode === 'dark' ? 'rgba(8,45,53,0.93)' : 'rgba(255,255,255,0.96)',
              boxShadow: theme.palette.mode === 'dark' ? '0 10px 26px rgba(0,0,0,0.3)' : '0 10px 26px rgba(0,0,0,0.08)',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: theme.palette.mode === 'dark' ? '#ccf5fb' : '#0b4e58' }} />}>
              <Typography sx={{ fontWeight: 700, color: theme.palette.mode === 'dark' ? '#effbfe' : '#0f2f36' }}>View Job Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontWeight: 700, mb: 1, color: theme.palette.mode === 'dark' ? '#f0fdff' : '#102f34' }}>{job?.title || 'Financial Planner'}</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip label={job?.category || 'Legal'} size="small" sx={{ background: 'rgba(0,188,212,0.16)', color: '#00BCD4' }} />
                <Chip label={job?.location || 'Karachi'} size="small" sx={{ background: 'rgba(45,90,95,0.16)', color: theme.palette.mode === 'dark' ? '#d1eef3' : '#2d5a5f' }} />
              </Stack>
              <Typography sx={{ color: '#00BCD4', fontWeight: 800, mb: 1 }}>💵 {formatBudget(job?.budget)}</Typography>
              <Typography sx={{ color: theme.palette.mode === 'dark' ? '#d8eff4' : '#374151', fontSize: '0.92rem' }}>
                {job?.description || 'Project description not available.'}
              </Typography>
            </AccordionDetails>
          </Accordion>
        )}

        {/* RIGHT COLUMN */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Box
            sx={{
              background: theme.palette.mode === 'dark' ? 'rgba(8, 52, 61, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              p: { xs: 2.5, md: 5 },
              display: 'flex',
              flexDirection: 'column',
              boxShadow: theme.palette.mode === 'dark' ? '0 14px 36px rgba(0,0,0,0.35)' : '0 14px 36px rgba(0,0,0,0.1)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0,188,212,0.2)' : 'rgba(0,188,212,0.12)'}`,
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

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#00BCD4',
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
                Enter your bid amount in PKR
              </Typography>
              <TextField
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="e.g., 15000"
                disabled={loading}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">💵</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    p: '2px 4px',
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      boxShadow: '0 0 0 4px rgba(0, 188, 212, 0.14)',
                    },
                  },
                }}
              />

              <Typography sx={{ mt: 1.2, fontSize: '12px', color: theme.palette.mode === 'dark' ? '#b8d8df' : '#4b5563' }}>
                Your bid: {Number.isNaN(numericBid) || !bidAmount ? 'Rs 0' : `Rs ${numericBid.toLocaleString()}`}
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#00BCD4',
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
                placeholder="e.g., 7 days, 2 weeks, 1 month"
                disabled={loading}
                required
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">⏰</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      boxShadow: '0 0 0 4px rgba(0, 188, 212, 0.14)',
                    },
                  },
                }}
              />
              <Typography sx={{ mt: 1, fontSize: '12px', color: theme.palette.mode === 'dark' ? '#acd0d7' : '#6b7280' }}>
                💡 Suggested: 2-4 weeks for this project
              </Typography>
            </Box>

            <Box sx={{ mb: { xs: 2, xl: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#00BCD4' }}>
                  Cover Letter * ({charCount}/100)
                </Typography>
                {usedAiEnhancement && <Chip size="small" label="AI-enhanced" sx={{ background: 'rgba(0,188,212,0.16)', color: '#00BCD4', fontWeight: 700 }} />}
              </Box>

              <Tooltip title={!coverLetter.trim() ? 'Write something first' : ''}>
                <span>
                  <Button
                    onClick={handleEnhanceCoverLetter}
                    disabled={enhancing || loading || !coverLetter.trim()}
                    startIcon={enhancing ? <CircularProgress size={16} /> : <AutoAwesome />}
                    variant="outlined"
                    fullWidth
                    sx={{
                      mb: 1.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: '#00BCD4',
                      color: '#00BCD4',
                      borderRadius: 3,
                      py: 1.2,
                      '&:hover': {
                        borderColor: '#00BCD4',
                        background: 'rgba(0,188,212,0.08)',
                        transform: 'scale(1.02)',
                      },
                      '&:disabled': {
                        borderColor: 'rgba(0,188,212,0.3)',
                        color: 'rgba(0,188,212,0.3)',
                      },
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {enhancing ? 'Enhancing...' : '✨ Enhance with AI'}
                  </Button>
                </span>
              </Tooltip>

              <TextField
                multiline
                minRows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="📝 Explain why you're a strong fit, relevant experience, and approach..."
                disabled={loading || enhancing}
                required
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    alignItems: 'flex-start',
                    pt: 1,
                    transition: 'all 0.3s ease',
                    '& textarea': { minHeight: '160px !important', maxHeight: '260px', overflowY: 'auto' },
                    '&:hover fieldset': { borderColor: '#0db4bc' },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      boxShadow: '0 0 0 4px rgba(0, 188, 212, 0.14)',
                    },
                  },
                }}
              />

              <Box sx={{ mt: 1.2 }}>
                <LinearProgress
                  variant="determinate"
                  value={charProgress}
                  sx={{
                    height: 8,
                    borderRadius: 8,
                    backgroundColor: `${charBandColor}33`,
                    '& .MuiLinearProgress-bar': { backgroundColor: '#00BCD4' },
                  }}
                />
                <Typography sx={{ mt: 0.6, fontSize: '12px', color: charBandColor, fontWeight: 700 }}>
                  {charCount < 100 ? 'Too short (minimum 100 characters)' : charCount < 300 ? 'Good — can be stronger with more detail' : 'Strong length'}
                </Typography>
              </Box>

              <Accordion
                expanded={showTips}
                onChange={() => setShowTips((prev) => !prev)}
                sx={{ mt: 1.5, borderRadius: '12px !important', boxShadow: 'none', border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(173,216,230,0.2)' : 'rgba(0,0,0,0.08)'}` }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>💬 Writing tips</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box component="ul" sx={{ pl: 2.4, my: 0, '& li': { mb: 0.7, color: theme.palette.mode === 'dark' ? '#d8eff4' : '#374151', fontSize: '0.9rem' } }}>
                    <li>Highlight relevant experience</li>
                    <li>Mention specific skills</li>
                    <li>Keep it professional</li>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <Button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
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
                endIcon={<ArrowForward />}
                disabled={loading || isVerified === false || checkingVerification}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  background: (isVerified === false || checkingVerification) 
                    ? 'linear-gradient(135deg, #999 0%, #666 100%)' 
                    : 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  boxShadow: (isVerified === false || checkingVerification) 
                    ? 'none' 
                    : '0 4px 15px rgba(13, 180, 188, 0.4)',
                  opacity: (isVerified === false || checkingVerification) ? 0.6 : 1,
                  cursor: (isVerified === false || checkingVerification) ? 'not-allowed' : 'pointer',
                  '&:hover': {
                    boxShadow: (isVerified === false || checkingVerification) 
                      ? 'none' 
                      : '0 8px 24px rgba(0, 188, 212, 0.58)',
                    transform: (isVerified === false || checkingVerification) 
                      ? 'none' 
                      : 'translateY(-2px) scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {checkingVerification 
                  ? 'Checking Status...' 
                  : isVerified === false 
                  ? 'Verification Pending' 
                  : loading 
                  ? 'Submitting...' 
                  : 'Submit Proposal'}
              </Button>
            </Box>
          </Box>
          </Box>
        </motion.div>
      </Box>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                p: { xs: 1.5, md: 3 },
                backdropFilter: 'blur(8px)',
              }}
            >
              <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', maxWidth: 1200 }}>
                <Box
                  sx={{
                    borderRadius: 3,
                    p: { xs: 2, md: 3 },
                    background: theme.palette.mode === 'dark' ? 'rgba(8, 45, 53, 0.98)' : 'rgba(255, 255, 255, 0.99)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 2 }}>AI Cover Letter Enhancement</Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}` }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, mb: 1 }}>Original</Typography>
                      <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', color: theme.palette.mode === 'dark' ? '#dcf2f6' : '#374151', maxHeight: 360, overflowY: 'auto' }}>
                        {coverLetter}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0,188,212,0.35)' : 'rgba(0,188,212,0.2)'}` }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>Enhanced</Typography>
                        <Button size="small" onClick={() => setIsEditingEnhanced((prev) => !prev)} sx={{ textTransform: 'none', color: '#00BCD4', fontWeight: 700 }}>
                          {isEditingEnhanced ? 'Done Editing' : 'Edit Enhanced'}
                        </Button>
                      </Stack>
                      {isEditingEnhanced ? (
                        <TextField
                          multiline
                          minRows={10}
                          fullWidth
                          value={enhancedDraft}
                          onChange={(e) => setEnhancedDraft(e.target.value)}
                        />
                      ) : (
                        <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', color: theme.palette.mode === 'dark' ? '#dcf2f6' : '#374151', maxHeight: 360, overflowY: 'auto' }}>
                          {enhancedDraft}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Stack direction="row" spacing={1.2} justifyContent="flex-end" sx={{ mt: 2.2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setPreviewOpen(false)}
                      sx={{ textTransform: 'none', borderColor: '#00BCD4', color: '#00BCD4', fontWeight: 700 }}
                    >
                      Keep Original
                    </Button>
                    <Button
                      variant="contained"
                      onClick={applyEnhancedVersion}
                      sx={{ textTransform: 'none', background: '#00BCD4', color: '#fff', fontWeight: 800, '&:hover': { background: '#00a9be' } }}
                    >
                      Use Enhanced Version
                    </Button>
                  </Stack>
                </Box>
              </motion.div>
            </Box>
          </Modal>

          <Snackbar
            open={toast.open}
            autoHideDuration={3000}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity={toast.severity}
              onClose={() => setToast((prev) => ({ ...prev, open: false }))}
              sx={{ width: '100%' }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
    </Box>
  );
};

export default SubmitProposalPage;





