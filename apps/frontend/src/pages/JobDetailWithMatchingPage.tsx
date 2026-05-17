import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  FaArrowLeft,
  FaBriefcase,
  FaCalendar,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaEdit,
  FaEye,
  FaMapMarkerAlt,
  FaRobot,
  FaTrash,
} from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import { httpClient } from '../api/httpClient';
import { useThemeMode } from '../context/ThemeContext';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  budget: { min: number; max: number };
  timeline: string;
  location: string;
  status: string;
  createdAt: string;
}

interface MatchedConsultant {
  consultant: {
    _id: string;
    userId: { _id: string; name: string; profileImage?: string };
    title: string;
    skills: string[];
    rating: number;
    totalReviews: number;
    hourlyRate: number;
    isVerified: boolean;
  };
  matchScore: number;
  matchReasons: string[];
}

const loadingTexts = [
  'Matching skills with consultant profiles...',
  'Analyzing experience and ratings...',
  'Calculating compatibility scores...',
  'Almost done, finding best matches...',
];

const Confetti = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const pieces = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      speed: Math.random() * 3 + 2,
      size: Math.random() * 8 + 4,
      rotate: Math.random() * 360,
      wobble: Math.random() * 2 - 1,
      color: ['#00BCD4', '#FF6B9D', '#FFD700', '#10B981', '#7C3AED'][Math.floor(Math.random() * 5)],
    }));

    let opacity = 1;
    let animationId = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((piece) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotate * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        ctx.restore();

        piece.y += piece.speed;
        piece.x += piece.wobble;
        piece.rotate += 2;

        if (piece.y > canvas.height) {
          piece.y = -16;
          piece.x = Math.random() * canvas.width;
        }
      });

      opacity -= 0.01;
      if (opacity > 0) animationId = requestAnimationFrame(draw);
    };

    draw();

    const timeout = setTimeout(() => cancelAnimationFrame(animationId), 3000);

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timeout);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />;
};

const JobDetailWithMatchingPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { mode } = useThemeMode();

  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<MatchedConsultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  const isMobile = useMediaQuery('(max-width:899px)');

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!matchingLoading) return;
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [matchingLoading]);

  useEffect(() => {
    const run = async () => {
      if (!jobId) {
        setError('Job ID is required');
        setLoading(false);
        setMatchingLoading(false);
        return;
      }

      try {
        const jobResponse = await httpClient.get(`/jobs/${jobId}`);
        setJob(jobResponse.data?.data);
        setLoading(false);

        try {
          setMatchingLoading(true);
          const matchResponse = await httpClient.get(`/consultants/suggest/${jobId}`);
          const data = matchResponse.data?.data;
          setMatches(Array.isArray(data) ? data : []);
        } catch {
          setMatches([]);
        } finally {
          setMatchingLoading(false);
        }
      } catch (fetchError: any) {
        setError(fetchError?.response?.data?.message || 'Failed to load job details');
        setLoading(false);
        setMatchingLoading(false);
      }
    };

    run();
  }, [jobId]);

  const formatBudget = (min: number, max: number) => (max >= 200000 ? `PKR ${min.toLocaleString()}+` : `PKR ${min.toLocaleString()} - ${max.toLocaleString()}`);

  const descriptionText = useMemo(() => {
    if (!job) return '';
    if (showFullDescription || job.description.length <= 400) return job.description;
    return `${job.description.slice(0, 400)}...`;
  }, [job, showFullDescription]);

  const handleEditJob = () => {
    navigate(`/edit-job/${job._id}`);
  };

  const handleDeleteJob = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this job?');
    if (!confirmed) return;

    try {
      await httpClient.delete(`/jobs/${job._id}`);
      navigate('/buyer-dashboard');
    } catch (deleteError) {
      console.error('Failed to delete job:', deleteError);
      window.alert('Failed to delete job. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, background: mode === 'dark' ? '#0f1f24' : '#f5fbfc' }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 4, mb: 3 }} />
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' } }}>
            <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 4 }} />
            <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 4 }} />
          </Box>
        </Container>
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: mode === 'dark' ? '#0f1f24' : '#f5fbfc' }}>
        <Card sx={{ p: 4, maxWidth: 520, borderRadius: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>{error || 'Job not found'}</Typography>
          <Button variant="contained" onClick={() => navigate('/buyer-dashboard')} sx={{ mt: 2, bgcolor: '#00BCD4' }}>Back to Dashboard</Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 6, background: mode === 'dark' ? 'linear-gradient(180deg,#08343a 0%,#071a1f 100%)' : 'linear-gradient(180deg,#00BCD4 0%,#F3F8FA 34%,#F3F8FA 100%)' }}>
      {showConfetti && <Confetti />}

      <Box sx={{ pt: 6, pb: 8, background: 'linear-gradient(135deg,#00BCD4 0%,#0097A7 100%)', borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 5 } }}>
          <IconButton onClick={() => navigate('/buyer-dashboard')} sx={{ width: 40, height: 40, bgcolor: '#fff', boxShadow: '0 8px 18px rgba(0,0,0,0.15)', '&:hover': { bgcolor: '#fff' } }}>
            <FaArrowLeft color="#00BCD4" />
          </IconButton>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 190, damping: 12 }}>
              <Box sx={{ width: { xs: 72, md: 100 }, height: { xs: 72, md: 100 }, borderRadius: '50%', bgcolor: '#fff', display: 'grid', placeItems: 'center' }}>
                <FaCheckCircle color="#00BCD4" size={isMobile ? 34 : 46} />
              </Box>
            </motion.div>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>Job Posted Successfully! 🎉</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)', fontSize: { xs: '0.95rem', md: '1.1rem' } }}>AI is now matching you with the best consultants</Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, px: { xs: 2, md: 5 } }}>
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', mb: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <Typography sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800, color: '#1A202C', mb: 2.5 }}>{job.title}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Chip icon={<FaBriefcase />} label={job.category} sx={{ height: 36, px: 1.5, bgcolor: '#E0F7FA', color: '#00838F', fontWeight: 600 }} />
              <Chip icon={<FaMapMarkerAlt />} label={job.location} sx={{ height: 36, px: 1.5, bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 600 }} />
              <Chip icon={<FaDollarSign />} label={formatBudget(job.budget.min, job.budget.max)} sx={{ height: 36, px: 1.5, bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600 }} />
              <Chip icon={<FaClock />} label={job.timeline} sx={{ height: 36, px: 1.5, bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 600 }} />
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: '65% 35%' } }}>
          <Box>
            <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#00BCD4', mb: 2 }}>📝 Job Description</Typography>
                <Typography sx={{ fontSize: '1rem', lineHeight: 1.8, color: '#4A5568', whiteSpace: 'pre-wrap' }}>{descriptionText}</Typography>
                {job.description.length > 400 && (
                  <Button onClick={() => setShowFullDescription((v) => !v)} sx={{ p: 0, mt: 1.5, color: '#00BCD4', textTransform: 'none', fontWeight: 700 }}>
                    {showFullDescription ? 'Read less' : 'Read more'}
                  </Button>
                )}
                <Divider sx={{ my: 3 }} />
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#00BCD4', mb: 2 }}>⚡ Required Skills</Typography>
                <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
                  {job.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      sx={{
                        justifyContent: 'center',
                        py: 1,
                        bgcolor: '#E0F7FA',
                        border: '1px solid #00BCD4',
                        color: '#00838F',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#B2EBF2', boxShadow: '0 6px 14px rgba(0,188,212,0.25)', transform: 'translateY(-2px)' },
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#00BCD4', mb: 2 }}>ℹ️ Additional Information</Typography>
                <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                  {[
                    { icon: <FaCalendar />, label: 'Posted', value: new Date(job.createdAt).toLocaleDateString() },
                    { icon: <FaChartBar />, label: 'Proposals', value: '0' },
                    { icon: <FaEye />, label: 'Views', value: '0' },
                    { icon: <FaCheckCircle />, label: 'Status', value: job.status || 'Active' },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', display: 'flex', gap: 1.25, alignItems: 'center' }}>
                        <Box sx={{ color: '#00BCD4' }}>{item.icon}</Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#1F2937' }}>{item.value}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Box sx={{ position: { lg: 'sticky' }, top: 20 }}>
              <Card sx={{ borderRadius: 3, mb: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, mb: 1.5 }}>Quick Actions</Typography>
                  <Stack spacing={1.2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<FaEdit />}
                      onClick={handleEditJob}
                      sx={{ bgcolor: '#00BCD4', height: 48, textTransform: 'none', borderRadius: 1.5 }}
                    >
                      ✏️ Edit Job
                    </Button>
                    <Button
                      fullWidth
                      startIcon={<FaTrash />}
                      onClick={handleDeleteJob}
                      sx={{ color: '#EF4444', height: 48, textTransform: 'none', borderRadius: 1.5 }}
                    >
                      🗑️ Delete Job
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2.5, mb: 2.5, bgcolor: '#E0F7FA' }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Chip label="🟢 Active" sx={{ mb: 1, fontWeight: 700, bgcolor: '#D1FAE5', color: '#065F46' }} />
                  <Typography sx={{ fontSize: '0.9rem', color: '#0F172A' }}>Your job is live and visible to consultants</Typography>
                  <Button sx={{ mt: 1, p: 0, textTransform: 'none', color: '#0EA5E9' }}>Manage visibility</Button>
                </CardContent>
              </Card>

            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Box sx={{ p: 4, borderRadius: '24px 24px 0 0', background: 'linear-gradient(135deg,#7C3AED 0%,#00BCD4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 60, height: 60, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center' }}><FaRobot color="#fff" size={28} /></Box>
              <Box>
                <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.7rem' } }}>🤖 AI-Powered Consultant Recommendations</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>Smart matching based on skills, experience, and past performance</Typography>
              </Box>
            </Box>
          </Box>

          <Card sx={{ borderRadius: '0 0 24px 24px', boxShadow: '0 8px 26px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              {matchingLoading ? (
                <Box textAlign="center">
                  <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
                    <Typography sx={{ fontSize: 110, lineHeight: 1 }}>🤖</Typography>
                  </motion.div>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 700, mb: 2 }}>🔍 Analyzing consultant database...</Typography>
                  <Box sx={{ width: '60%', mx: 'auto', mb: 2.2 }}><LinearProgress sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#00BCD4' } }} /></Box>
                  <AnimatePresence mode="wait">
                    <motion.div key={loadingTextIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Typography sx={{ color: '#0284C7', mb: 1.2 }}>{loadingTexts[loadingTextIndex]}</Typography>
                    </motion.div>
                  </AnimatePresence>
                  <Typography sx={{ color: '#64748B', fontSize: '0.875rem', mb: 3 }}>Usually takes 10-15 seconds</Typography>
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
                    {[1, 2, 3].map((x) => (
                      <Skeleton key={x} variant="rectangular" height={250} sx={{ borderRadius: 2.5 }} />
                    ))}
                  </Box>
                </Box>
              ) : matches.length === 0 ? (
                <Box textAlign="center">
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }}>No matching consultants</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
                  {matches.slice(0, 6).map((match, index) => (
                    <Box key={match.consultant._id}>
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: index * 0.1 }}>
                        <Card sx={{ height: '100%', borderRadius: 2.5, p: 1.5, position: 'relative', border: '1px solid #E2E8F0', transition: 'all 0.25s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 28px rgba(0,188,212,0.22)', borderColor: '#67E8F9' } }}>
                          <Chip label={`${match.matchScore}% Match`} sx={{ position: 'absolute', right: 14, top: 14, bgcolor: '#00BCD4', color: '#fff', fontWeight: 700 }} />
                          <CardContent>
                            <Box sx={{ display: 'grid', placeItems: 'center' }}>
                              <Avatar src={match.consultant.userId.profileImage} sx={{ width: 100, height: 100, border: '3px solid #00BCD4' }}>{match.consultant.userId.name?.charAt(0)}</Avatar>
                            </Box>
                            <Typography sx={{ mt: 2, fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}>{match.consultant.userId.name}</Typography>
                            <Typography sx={{ fontSize: '0.95rem', color: '#64748B', textAlign: 'center', mb: 0.8 }}>{match.consultant.title}</Typography>
                            <Typography sx={{ fontSize: '0.86rem', textAlign: 'center', mb: 1 }}>⭐ {match.consultant.rating.toFixed(1)} | {match.consultant.totalReviews} completed jobs</Typography>
                            <Divider sx={{ my: 1.2 }} />
                            <Typography sx={{ color: '#00BCD4', fontWeight: 700, fontSize: '0.875rem' }}>✨ Why matched:</Typography>
                            <Typography sx={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{match.matchReasons.join('. ')}</Typography>
                            <Box sx={{ mt: 1.2, display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>{match.consultant.skills.slice(0, 3).map((skill) => <Chip key={skill} label={skill} size="small" sx={{ bgcolor: '#E0F7FA', color: '#00838F' }} />)}</Box>
                            <Box sx={{ mt: 2 }}>
                              <Button fullWidth variant="contained" onClick={() => navigate(`/consultant/${match.consultant._id}`)} sx={{ bgcolor: '#00BCD4', textTransform: 'none' }}>View Profile</Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
};

export default JobDetailWithMatchingPage;
