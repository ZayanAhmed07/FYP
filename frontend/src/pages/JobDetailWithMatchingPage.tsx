import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Rating,
  Skeleton,
  IconButton,
  Tooltip,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  FaArrowLeft,
  FaBriefcase,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaRobot,
  FaStar,
  FaCheckCircle,
  FaEnvelope,
  FaUser,
  FaAward,
  FaChartLine,
  FaLightbulb,
  FaCode,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { httpClient } from '../api/httpClient';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  status: string;
  createdAt: string;
}

interface MatchedConsultant {
  consultant: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
    title: string;
    bio: string;
    specialization: string[];
    hourlyRate: number;
    rating: number;
    totalReviews: number;
    skills: string[];
    isVerified: boolean;
    experience: string;
    city?: string;
  };
  matchScore: number;
  matchReasons: string[];
}

const JobDetailWithMatchingPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<MatchedConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobAndMatches = async () => {
      if (!jobId) {
        setError('Job ID is required');
        setLoading(false);
        return;
      }

      try {
        // Fetch job details
        const jobResponse = await httpClient.get(`/jobs/${jobId}`);
        const jobData = jobResponse.data?.data;
        setJob(jobData);
        setLoading(false);

        // Fetch AI-matched consultants
        setMatchingLoading(true);
        try {
          const matchResponse = await httpClient.get(`/consultants/suggest/${jobId}`);
          setMatches(matchResponse.data?.data || []);
        } catch (matchErr) {
          console.error('Error fetching matches (non-fatal):', matchErr);
          // Continue even if matching fails - show job details without matches
          setMatches([]);
        }
        setMatchingLoading(false);
      } catch (err: any) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || 'Failed to load job details');
        setLoading(false);
        setMatchingLoading(false);
      }
    };

    fetchJobAndMatches();
  }, [jobId]);

  const handleContactConsultant = (consultantId: string) => {
    // Navigate to messaging or consultant profile
    navigate(`/consultant/${consultantId}`);
  };

  const formatBudget = (min: number, max: number) => {
    if (max >= 200000) return `PKR ${min.toLocaleString()}+`;
    return `PKR ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#0db4bc'; // teal
    if (score >= 40) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Possible Match';
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Container>
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Job not found'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/buyer-dashboard')}
            sx={{
              mt: 2,
              bgcolor: '#0db4bc',
              '&:hover': { bgcolor: '#0a8b91' },
            }}
          >
            Back to Dashboard
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={() => navigate('/buyer-dashboard')}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                mr: 2,
              }}
            >
              <FaArrowLeft />
            </IconButton>
            <Typography
              sx={{
                color: '#fff',
                fontSize: '2rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              Job Posted Successfully! 🎉
            </Typography>
          </Box>
        </motion.div>

        {/* Job Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            sx={{
              mb: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                p: 3,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {job.title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip
                  icon={<FaBriefcase style={{ color: '#fff' }} />}
                  label={job.category}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  icon={<FaMapMarkerAlt style={{ color: '#fff' }} />}
                  label={job.location}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  icon={<FaDollarSign style={{ color: '#fff' }} />}
                  label={formatBudget(job.budget.min, job.budget.max)}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  icon={<FaClock style={{ color: '#fff' }} />}
                  label={job.timeline}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </Box>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: '#0db4bc',
                  fontWeight: 700,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <FaLightbulb /> Job Description
              </Typography>
              <Typography
                sx={{
                  color: '#555',
                  lineHeight: 1.8,
                  mb: 3,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {job.description}
              </Typography>

              {job.skills && job.skills.length > 0 && (
                <>
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#0db4bc',
                      fontWeight: 700,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <FaCode /> Required Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {job.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        sx={{
                          bgcolor: '#e0f7f8',
                          color: '#0a8b91',
                          fontWeight: 600,
                          border: '1px solid #0db4bc',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Matching Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaRobot style={{ fontSize: '2rem', color: '#fff' }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  color: '#fff',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                AI-Powered Consultant Recommendations
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.95rem',
                }}
              >
                Smart matching based on skills, experience, and past performance
              </Typography>
            </Box>
          </Box>

          {matchingLoading ? (
            <Box>
              {[1, 2, 3].map((i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={200}
                  sx={{ borderRadius: 2, mb: 2 }}
                />
              ))}
            </Box>
          ) : matches.length === 0 ? (
            <Card
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.95)',
              }}
            >
              <FaRobot style={{ fontSize: '4rem', color: '#0db4bc', marginBottom: '1rem' }} />
              <Typography variant="h6" sx={{ color: '#555', mb: 1 }}>
                No matching consultants found
              </Typography>
              <Typography sx={{ color: '#888' }}>
                We'll notify you when consultants matching your requirements become available.
              </Typography>
            </Card>
          ) : (
            <AnimatePresence>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {matches.map((match, index) => (
                  <Box key={match.consultant._id}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card
                        sx={{
                          borderRadius: 3,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          border: '2px solid transparent',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 32px rgba(13,180,188,0.2)',
                            borderColor: '#0db4bc',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            background: `linear-gradient(135deg, ${getMatchScoreColor(match.matchScore)} 0%, ${getMatchScoreColor(match.matchScore)}dd 100%)`,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FaChartLine style={{ color: '#fff', fontSize: '1.2rem' }} />
                            <Typography
                              sx={{
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                              }}
                            >
                              {match.matchScore}% {getMatchScoreLabel(match.matchScore)}
                            </Typography>
                          </Box>
                          <Chip
                            icon={<FaStar style={{ color: '#ffd700' }} />}
                            label={`#${index + 1} Ranked`}
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.25)',
                              color: '#fff',
                              fontWeight: 700,
                              backdropFilter: 'blur(10px)',
                            }}
                          />
                        </Box>

                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                            <Avatar
                              src={match.consultant.userId.profileImage}
                              alt={match.consultant.userId.name}
                              sx={{
                                width: 80,
                                height: 80,
                                border: '3px solid #0db4bc',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                            >
                              <FaUser />
                            </Avatar>

                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h5"
                                  sx={{
                                    fontWeight: 700,
                                    color: '#1a1a1a',
                                  }}
                                >
                                  {match.consultant.userId.name}
                                </Typography>
                                {match.consultant.isVerified && (
                                  <Tooltip title="Verified Consultant">
                                    <FaCheckCircle
                                      style={{
                                        color: '#10b981',
                                        fontSize: '1.2rem',
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>

                              <Typography
                                sx={{
                                  color: '#0db4bc',
                                  fontWeight: 600,
                                  fontSize: '1rem',
                                  mb: 1,
                                }}
                              >
                                {match.consultant.title}
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Rating
                                    value={match.consultant.rating}
                                    precision={0.1}
                                    readOnly
                                    size="small"
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: '0.9rem',
                                      fontWeight: 600,
                                      color: '#555',
                                    }}
                                  >
                                    {match.consultant.rating.toFixed(1)} ({match.consultant.totalReviews} reviews)
                                  </Typography>
                                </Box>

                                <Chip
                                  label={`$${match.consultant.hourlyRate}/hr`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#10b981',
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                />
                              </Box>

                              {match.consultant.city && (
                                <Typography
                                  sx={{
                                    fontSize: '0.9rem',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <FaMapMarkerAlt /> {match.consultant.city}, Pakistan
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Typography
                            sx={{
                              color: '#555',
                              lineHeight: 1.6,
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {match.consultant.bio}
                          </Typography>

                          {/* Skills */}
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              sx={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#0db4bc',
                                mb: 1,
                              }}
                            >
                              Skills
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {match.consultant.skills.slice(0, 6).map((skill, idx) => (
                                <Chip
                                  key={idx}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: '#e0f7f8',
                                    color: '#0a8b91',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                  }}
                                />
                              ))}
                              {match.consultant.skills.length > 6 && (
                                <Chip
                                  label={`+${match.consultant.skills.length - 6} more`}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f3f4f6',
                                    color: '#666',
                                    fontSize: '0.75rem',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Match Reasons */}
                          <Box
                            sx={{
                              bgcolor: '#f8f9fa',
                              borderRadius: 2,
                              p: 2,
                              mb: 2,
                              border: '1px solid #e9ecef',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                color: '#0db4bc',
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <FaAward /> Why This Match?
                            </Typography>
                            <Stack spacing={0.5}>
                              {match.matchReasons.map((reason, idx) => (
                                <Typography
                                  key={idx}
                                  sx={{
                                    fontSize: '0.85rem',
                                    color: '#555',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: '#0db4bc',
                                    }}
                                  />
                                  {reason}
                                </Typography>
                              ))}
                            </Stack>
                          </Box>

                          {/* Match Score Progress */}
                          <Box sx={{ mb: 2 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                mb: 0.5,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                Match Confidence
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.85rem',
                                  fontWeight: 700,
                                  color: getMatchScoreColor(match.matchScore),
                                }}
                              >
                                {match.matchScore}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={match.matchScore}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: '#e9ecef',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: getMatchScoreColor(match.matchScore),
                                  borderRadius: 4,
                                },
                              }}
                            />
                          </Box>

                          {/* Action Buttons */}
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<FaEnvelope />}
                              onClick={() => handleContactConsultant(match.consultant._id)}
                              sx={{
                                bgcolor: '#0db4bc',
                                color: '#fff',
                                fontWeight: 700,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                  bgcolor: '#0a8b91',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 6px 20px rgba(13,180,188,0.3)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              Contact Consultant
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => navigate(`/consultant/${match.consultant._id}`)}
                              sx={{
                                borderColor: '#0db4bc',
                                color: '#0db4bc',
                                fontWeight: 700,
                                py: 1.5,
                                px: 3,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                '&:hover': {
                                  borderColor: '#0a8b91',
                                  bgcolor: '#e0f7f8',
                                },
                              }}
                            >
                              View Profile
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Box>
                ))}
              </Box>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Box
            sx={{
              mt: 4,
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate('/buyer-dashboard')}
              sx={{
                borderColor: '#fff',
                color: '#fff',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  borderColor: '#fff',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Back to Dashboard
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default JobDetailWithMatchingPage;
