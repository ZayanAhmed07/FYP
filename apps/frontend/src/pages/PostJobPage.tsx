import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Avatar, IconButton, Button, Divider, Chip, TextField, Select, MenuItem, FormControl, InputLabel, LinearProgress, CircularProgress, useMediaQuery } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatbotWidget } from '../components/chatbot';
import SecurityIcon from '@mui/icons-material/Security';
import { authService } from '../services/authService';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LockIcon from '@mui/icons-material/Lock';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from '../context/ThemeContext';

// Valid options for location and category
const VALID_LOCATIONS = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Remote (Pakistan)'];
const VALID_CATEGORIES = ['Education', 'Business', 'Legal'];

// Word counter utility
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const MINIMUM_WORDS = 100;

// Step configuration for progress tracking
const STEPS = [
  { id: 1, label: 'Category Selection', progress: 16 },
  { id: 2, label: 'Sub-category Selection', progress: 33 },
  { id: 3, label: 'Project Description', progress: 50 },
  { id: 4, label: 'Location', progress: 66 },
  { id: 5, label: 'Budget Range', progress: 83 },
  { id: 6, label: 'Timeline', progress: 95 },
];

// AnimatedNumber component for count-up effect
const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(Math.round(stepValue * currentStep));
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue}</>;
};

const PostJobPage = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const currentUser = authService.getCurrentUser();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [jobPreview, setJobPreview] = useState<any>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isPreviewLocked, setIsPreviewLocked] = useState(false);
  const isMobile = useMediaQuery('(max-width:899px)');
  const isTablet = useMediaQuery('(min-width:900px) and (max-width:1199px)');

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleJobDataChange = (jobData: any, progressValue: number) => {
    setProgress(progressValue);
    
    // Calculate current step based on progress
    const step = STEPS.findIndex(s => s.progress >= progressValue);
    setCurrentStep(step === -1 ? STEPS.length : step);
    
    // Only show preview when we have enough data (at least description and category)
    // If preview is locked by user edits, do not overwrite with chatbot data
    if (!isPreviewLocked && jobData.description && jobData.category) {
      setJobPreview(jobData);
    }
  };

  const handlePostJob = async () => {
    if (!jobPreview) return;
    
    // Handle job posting logic
    try {
      const { httpClient } = await import('../api/httpClient');
      const { sarahAI } = await import('../services/rachelAI.service');
      
      // Validate required fields
      if (!jobPreview.category || !jobPreview.description || !jobPreview.timeline || !jobPreview.location) {
        alert('Missing required information. Please provide all job details in the chat.');
        return;
      }

      // Validate description word count (use enhanced or original)
      const descriptionToCheck = jobPreview.enhancedDescription || jobPreview.description;
      const wordCount = countWords(descriptionToCheck);
      if (wordCount < MINIMUM_WORDS) {
        alert(`Description must be at least ${MINIMUM_WORDS} words. Current: ${wordCount} words.`);
        return;
      }

      // Validate category
      if (!VALID_CATEGORIES.includes(jobPreview.category)) {
        alert('Please select a valid category: Education, Business, or Legal.');
        return;
      }

      // Validate location
      if (!VALID_LOCATIONS.includes(jobPreview.location)) {
        alert('Please select a valid location from the provided options.');
        return;
      }

      // Map budget to min/max with defaults
      const budgetMin = jobPreview.budgetMin || 5000;
      const budgetMax = jobPreview.budgetMax || budgetMin * 2;

      // Generate professional title using AI (only if not already generated)
      let title = jobPreview.title;
      let enhancedDescription = jobPreview.enhancedDescription || jobPreview.description;
      
      if (!title) {
        const enhancement = await sarahAI.enhanceJobPosting(
          jobPreview.description,
          jobPreview.category,
          jobPreview.skills || []
        );
        title = enhancement.title;
        enhancedDescription = enhancement.enhancedDescription || enhancedDescription;
      }

      const payload = {
        category: jobPreview.category,
        subCategory: jobPreview.subCategory,
        title: title,
        description: enhancedDescription,
        budget: {
          min: budgetMin,
          max: budgetMax,
        },
        timeline: jobPreview.timeline,
        location: jobPreview.location,
        skills: jobPreview.skills || [],
        attachments: [],
      };

      const response = await httpClient.post('/jobs', payload);
      const createdJobId = response.data?.data?._id;

      // Redirect to job detail page with AI matching
      if (createdJobId) {
        navigate(`/job-detail/${createdJobId}`);
      } else {
        navigate('/buyer-dashboard');
      }
    } catch (error: any) {
      console.error('Failed to post job:', error);
      alert('Failed to post job. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #0a4f55 0%, #064147 100%)'
          : 'linear-gradient(135deg, #F0FAFB 0%, #FFFFFF 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #00BCD4 0%, #00838F 100%)'
            : 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
          borderBottom: mode === 'dark' ? '1px solid rgba(0,188,212,0.2)' : '1px solid rgba(0,188,212,0.1)',
          py: 2.5,
          px: 4,
          flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,188,212,0.15)',
        }}
      >
        <Box
          sx={{
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
              title="Go Back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              onClick={() => navigate('/')}
            >
              Expert Raah
            </Typography>
          </Box>
          
          {currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!isMobile && (
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: '#fff',
                    fontWeight: 500,
                  }}
                >
                  {currentUser.name}
                </Typography>
              )}
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {currentUser.name?.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
                title="Toggle Theme"
              >
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#fff',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#ffebee' },
                }}
                title="Logout"
              >
                <LogoutIcon />
              </IconButton>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '0.95rem',
                color: '#fff',
                cursor: 'pointer',
                px: 2,
                py: 1,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
              onClick={() => navigate('/login')}
            >
              Login
            </Typography>
          )}
        </Box>
      </Box>

      {/* Main Content - Two Column Layout */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          minHeight: 0,
          width: '100%',
          alignItems: 'stretch',
          gap: { xs: 0, md: 3 },
          p: { xs: 0, md: 3 },
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Left Side - Chat Interface (65% Width on desktop) */}
        <Box
          sx={{
            flex: { xs: 1, md: '0 0 65%' },
            width: { xs: '100%', md: '65%' },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%' }}
          >
            <Paper
              elevation={isMobile ? 0 : 4}
              sx={{
                height: '100%',
                width: '100%',
                borderRadius: { xs: 0, md: 3 },
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: mode === 'dark' 
                  ? 'linear-gradient(180deg, #1a2f35 0%, #0d1f24 100%)'
                  : '#FFFFFF',
                boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,188,212,0.12)',
              }}
            >
              <ChatbotWidget initialOpen={true} onJobDataChange={handleJobDataChange} />
            </Paper>
          </motion.div>
        </Box>

        {/* Right Side - Progress Sidebar (35% Width on desktop) */}
        <Box
          sx={{
            flex: { xs: '0 0 auto', md: 1 },
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto',
            minHeight: { xs: 'auto', md: 0 },
            maxHeight: { xs: '50vh', md: 'none' },
            position: { xs: 'fixed', md: 'relative' },
            bottom: { xs: 0, md: 'auto' },
            left: { xs: 0, md: 'auto' },
            right: { xs: 0, md: 'auto' },
            zIndex: { xs: 1200, md: 'auto' },
            p: { xs: 2, md: 0 },
            bgcolor: { xs: mode === 'dark' ? '#0d1f24' : '#f5f5f5', md: 'transparent' },
            borderTopLeftRadius: { xs: 20, md: 0 },
            borderTopRightRadius: { xs: 20, md: 0 },
            boxShadow: { xs: '0 -4px 20px rgba(0,0,0,0.1)', md: 'none' },
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? 'rgba(0,188,212,0.3)' : 'rgba(0,188,212,0.2)',
              borderRadius: '3px',
            },
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Progress Section */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, #1a2f35 0%, #0d1f24 100%)'
                  : '#FFFFFF',
                flexShrink: 0,
                border: mode === 'dark' ? '1px solid rgba(0,188,212,0.1)' : 'none',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Typography
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: mode === 'dark' ? '#E0F7FA' : '#1f2937',
                    mb: 2,
                  }}
                >
                  Let's keep it going
                </Typography>
                
                {/* Circular Progress */}
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={120}
                    thickness={4}
                    sx={{ color: mode === 'dark' ? 'rgba(0,188,212,0.1)' : '#E0F2F1' }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={progress}
                    size={120}
                    thickness={4}
                    sx={{
                      color: '#00BCD4',
                      position: 'absolute',
                      left: 0,
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
                    }}
                  >
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{ 
                        fontWeight: 700,
                        color: '#00BCD4',
                      }}
                    >
                      <AnimatedNumber value={progress} />%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  background: mode === 'dark' 
                    ? 'rgba(0,188,212,0.05)'
                    : 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)',
                  borderRadius: 3,
                  border: mode === 'dark' ? '1px solid rgba(0,188,212,0.2)' : 'none',
                }}
              >
                <SecurityIcon sx={{ color: '#00BCD4', fontSize: 24 }} />
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: mode === 'dark' ? '#B2EBF2' : '#00838F',
                    fontWeight: 600,
                  }}
                >
                  🛡️ All your info will be Safe & Secure
                </Typography>
              </Box>

              {/* Step Indicators */}
              <Box sx={{ mt: 3 }}>
                {STEPS.map((step, index) => (
                  <Box
                    key={step.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: index < STEPS.length - 1 ? 2.5 : 0,
                      position: 'relative',
                    }}
                  >
                    {/* Connector Line */}
                    {index < STEPS.length - 1 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 14,
                          top: 32,
                          width: 2,
                          height: 28,
                          background: progress >= step.progress
                            ? '#00BCD4'
                            : mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E0E0E0',
                        }}
                      />
                    )}
                    
                    {/* Step Icon */}
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        flexShrink: 0,
                        background: progress > step.progress
                          ? '#00BCD4'
                          : progress === step.progress
                          ? 'transparent'
                          : 'transparent',
                        border: progress === step.progress
                          ? '2px solid #00BCD4'
                          : progress > step.progress
                          ? 'none'
                          : `2px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#E0E0E0'}`,
                      }}
                    >
                      {progress > step.progress ? (
                        <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />
                      ) : progress === step.progress ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <FiberManualRecordIcon sx={{ color: '#00BCD4', fontSize: 14 }} />
                        </motion.div>
                      ) : (
                        <RadioButtonUncheckedIcon 
                          sx={{ 
                            color: mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#E0E0E0',
                            fontSize: 20,
                          }} 
                        />
                      )}
                    </Box>
                    
                    {/* Step Label */}
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: progress >= step.progress ? 600 : 400,
                        color: progress >= step.progress
                          ? (mode === 'dark' ? '#E0F7FA' : '#00838F')
                          : (mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#9E9E9E'),
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Job Preview Section */}
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                background: progress < 95 
                  ? (mode === 'dark' ? 'rgba(26,47,53,0.5)' : '#F9FAFB')
                  : (mode === 'dark' ? 'linear-gradient(135deg, #1a2f35 0%, #0d1f24 100%)' : '#FFFFFF'),
                flexShrink: 0,
                minHeight: '250px',
                position: 'relative',
                border: progress < 95 
                  ? `2px dashed ${mode === 'dark' ? 'rgba(0,188,212,0.2)' : '#D1D5DB'}`
                  : `2px solid ${mode === 'dark' ? 'rgba(0,188,212,0.3)' : '#00BCD4'}`,
              }}
            >
              {/* Lock Overlay - Show until all steps completed */}
              <AnimatePresence>
                {progress < 95 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: mode === 'dark' 
                        ? 'rgba(13,31,36,0.95)'
                        : 'rgba(249, 250, 251, 0.95)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '12px',
                      zIndex: 1,
                      gap: '16px',
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <LockIcon sx={{ fontSize: 80, color: mode === 'dark' ? 'rgba(0,188,212,0.3)' : '#9CA3AF' }} />
                    </motion.div>
                    <Typography
                      sx={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        color: mode === 'dark' ? '#B2EBF2' : '#6B7280',
                        textAlign: 'center',
                      }}
                    >
                      🔒 Job Preview Locked
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.95rem',
                        color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#9CA3AF',
                        textAlign: 'center',
                        maxWidth: '85%',
                        lineHeight: 1.6,
                      }}
                    >
                      Complete all 6 steps in the chat to unlock editing
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {jobPreview ? (
                <Box sx={{ opacity: progress < 95 ? 0.3 : 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                      sx={{
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        color: mode === 'dark' ? '#E0F7FA' : '#1f2937',
                      }}
                    >
                      📝 Job Preview
                    </Typography>
                    {!isEditingPreview && progress >= 95 && (
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setIsEditingPreview(true);
                          setEditedData({ ...jobPreview });
                        }}
                        size="small"
                        sx={{
                          textTransform: 'none',
                          color: '#00BCD4',
                          '&:hover': { bgcolor: 'rgba(0,188,212,0.08)' },
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {isPreviewLocked && (
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={() => setIsPreviewLocked(false)}
                        size="small"
                        sx={{ 
                          ml: 1, 
                          textTransform: 'none', 
                          color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6b7280',
                        }}
                      >
                        Unlock Sync
                      </Button>
                    )}
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: mode === 'dark' ? 'rgba(0,188,212,0.1)' : '#E5E7EB' }} />
                  
                  {!isEditingPreview ? (
                    // READ-ONLY VIEW
                    <>
                      {(jobPreview.category || jobPreview.subCategory) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                            Category:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                              label={jobPreview.category || 'Not set'}
                              sx={{
                                bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.15)' : '#E0F7FA',
                                color: mode === 'dark' ? '#B2EBF2' : '#00838F',
                                fontWeight: 600,
                                border: mode === 'dark' ? '1px solid rgba(0,188,212,0.3)' : 'none',
                              }}
                            />
                            {jobPreview.subCategory && (
                              <>
                                <Typography sx={{ color: mode === 'dark' ? 'rgba(178,235,242,0.5)' : '#9ca3af' }}>→</Typography>
                                <Chip
                                  label={jobPreview.subCategory}
                                  size="small"
                                  sx={{
                                    bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.08)' : '#F0F9FF',
                                    color: mode === 'dark' ? '#80DEEA' : '#0284C7',
                                    fontWeight: 500,
                                    border: mode === 'dark' ? '1px solid rgba(0,188,212,0.2)' : 'none',
                                  }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      {(jobPreview.enhancedDescription || jobPreview.description) && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                            Description ({countWords(jobPreview.enhancedDescription || jobPreview.description)} words):
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '0.9rem', 
                            color: mode === 'dark' ? 'rgba(224,247,250,0.9)' : '#374151',
                            lineHeight: 1.6,
                            p: 2,
                            bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.03)' : '#F9FAFB',
                            borderRadius: 2,
                            border: mode === 'dark' ? '1px solid rgba(0,188,212,0.1)' : '1px solid #E5E7EB',
                          }}>
                            {jobPreview.enhancedDescription || jobPreview.description}
                          </Typography>
                          {jobPreview.rawDescription && jobPreview.enhancedDescription && jobPreview.rawDescription !== jobPreview.enhancedDescription && (
                            <Typography sx={{ fontSize: '0.75rem', color: '#00BCD4', fontStyle: 'italic', mt: 0.5 }}>
                              ✨ AI-enhanced for clarity and professionalism
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        {(jobPreview.budgetMin || jobPreview.budgetMax) && (
                          <Box sx={{ flex: { xs: '1 1 100%', sm: 1 } }}>
                            <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                              Budget:
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '1rem', 
                              color: '#00BCD4',
                              fontWeight: 700,
                              p: 1.5,
                              bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.08)' : 'rgba(0,188,212,0.08)',
                              borderRadius: 2,
                              border: mode === 'dark' ? '1px solid rgba(0,188,212,0.2)' : '1px solid rgba(0,188,212,0.2)',
                            }}>
                              PKR {jobPreview.budgetMin?.toLocaleString() || '0'} 
                              {jobPreview.budgetMax && ` - ${jobPreview.budgetMax?.toLocaleString()}`}
                            </Typography>
                          </Box>
                        )}
                        {jobPreview.timeline && (
                          <Box sx={{ flex: { xs: '1 1 100%', sm: 1 } }}>
                            <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                              Timeline:
                            </Typography>
                            <Typography sx={{ 
                              fontSize: '0.95rem', 
                              color: mode === 'dark' ? '#E0F7FA' : '#374151',
                              fontWeight: 600,
                              p: 1.5,
                              bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.05)' : '#F9FAFB',
                              borderRadius: 2,
                              border: mode === 'dark' ? '1px solid rgba(0,188,212,0.1)' : '1px solid #E5E7EB',
                            }}>
                              {jobPreview.timeline}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      
                      {jobPreview.location && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                            Location:
                          </Typography>
                          <Typography sx={{ 
                            fontSize: '0.95rem', 
                            color: mode === 'dark' ? '#E0F7FA' : '#374151',
                            fontWeight: 600,
                            p: 1.5,
                            bgcolor: mode === 'dark' ? 'rgba(0,188,212,0.05)' : '#F9FAFB',
                            borderRadius: 2,
                            border: mode === 'dark' ? '1px solid rgba(0,188,212,0.1)' : '1px solid #E5E7EB',
                          }}>
                            📍 {jobPreview.location}
                          </Typography>
                        </Box>
                      )}
                      
                      {jobPreview.skills && jobPreview.skills.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6b7280', mb: 0.5 }}>
                            Skills:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {jobPreview.skills.map((skill: string, index: number) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                sx={{
                                  bgcolor: mode === 'dark' ? 'rgba(76,175,80,0.15)' : '#F0FDF4',
                                  color: mode === 'dark' ? '#81C784' : '#15803D',
                                  fontWeight: 500,
                                  border: mode === 'dark' ? '1px solid rgba(76,175,80,0.3)' : 'none',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Show Post Job button only when unlocked and all required fields are filled */}
                      {progress >= 95 && jobPreview.description && jobPreview.category && jobPreview.timeline && jobPreview.location && countWords(jobPreview.enhancedDescription || jobPreview.description) >= MINIMUM_WORDS && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={handlePostJob}
                            sx={{
                              mt: 2,
                              py: 1.8,
                              background: 'linear-gradient(135deg, #00BCD4 0%, #00838F 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #00838F 0%, #006064 100%)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 20px rgba(0,188,212,0.3)',
                              },
                              transition: 'all 0.3s ease',
                              textTransform: 'none',
                              fontSize: '1.05rem',
                              fontWeight: 700,
                              borderRadius: 3,
                              boxShadow: '0 4px 12px rgba(0,188,212,0.25)',
                            }}
                          >
                            🚀 Post Job
                          </Button>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    // EDIT MODE
                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Description"
                        multiline
                        rows={6}
                        value={editedData?.description || ''}
                        onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                        helperText={`${countWords(editedData?.description || '')} / ${MINIMUM_WORDS} words minimum`}
                        error={countWords(editedData?.description || '') < MINIMUM_WORDS}
                        fullWidth
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#00BCD4',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#00BCD4',
                          },
                        }}
                      />
                      
                      <FormControl fullWidth required>
                        <InputLabel sx={{ '&.Mui-focused': { color: '#00BCD4' } }}>Category</InputLabel>
                        <Select
                          value={editedData?.category || ''}
                          onChange={(e: SelectChangeEvent) => setEditedData({ ...editedData, category: e.target.value })}
                          label="Category"
                          sx={{
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#00BCD4',
                            },
                          }}
                        >
                          {VALID_CATEGORIES.map((cat) => (
                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth required>
                        <InputLabel sx={{ '&.Mui-focused': { color: '#00BCD4' } }}>Location</InputLabel>
                        <Select
                          value={editedData?.location || ''}
                          onChange={(e: SelectChangeEvent) => setEditedData({ ...editedData, location: e.target.value })}
                          label="Location"
                          sx={{
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#00BCD4',
                            },
                          }}
                        >
                          {VALID_LOCATIONS.map((loc) => (
                            <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                          label="Min Budget (PKR)"
                          type="number"
                          value={editedData?.budgetMin || ''}
                          onChange={(e) => setEditedData({ ...editedData, budgetMin: parseInt(e.target.value) || 0 })}
                          fullWidth
                          required
                          sx={{
                            flex: 1,
                            minWidth: '150px',
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: '#00BCD4',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#00BCD4',
                            },
                          }}
                        />
                        <TextField
                          label="Max Budget (PKR)"
                          type="number"
                          value={editedData?.budgetMax || ''}
                          onChange={(e) => setEditedData({ ...editedData, budgetMax: parseInt(e.target.value) || 0 })}
                          fullWidth
                          required
                          sx={{
                            flex: 1,
                            minWidth: '150px',
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused fieldset': {
                                borderColor: '#00BCD4',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#00BCD4',
                            },
                          }}
                        />
                      </Box>

                      <TextField
                        label="Timeline"
                        value={editedData?.timeline || ''}
                        onChange={(e) => setEditedData({ ...editedData, timeline: e.target.value })}
                        placeholder="e.g., 2 weeks, 1 month, ASAP"
                        fullWidth
                        required
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&.Mui-focused fieldset': {
                              borderColor: '#00BCD4',
                            },
                          },
                          '& .MuiInputLabel-root.Mui-focused': {
                            color: '#00BCD4',
                          },
                        }}
                      />

                      <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={() => {
                            // Validate before saving
                            const wordCount = countWords(editedData.description);
                            if (wordCount < MINIMUM_WORDS) {
                              alert(`Description must be at least ${MINIMUM_WORDS} words. Current: ${wordCount} words.`);
                              return;
                            }
                            if (!editedData.category || !editedData.location || !editedData.timeline) {
                              alert('Please fill all required fields.');
                              return;
                            }
                            if (!editedData.budgetMin || !editedData.budgetMax || editedData.budgetMin >= editedData.budgetMax) {
                              alert('Please enter valid budget range (min must be less than max).');
                              return;
                            }
                            setJobPreview(editedData);
                            setIsEditingPreview(false);
                            setEditedData(null);
                            setIsPreviewLocked(true); // Prevent chatbot from overwriting saved changes
                          }}
                          sx={{
                            flex: 1,
                            minWidth: '140px',
                            background: 'linear-gradient(135deg, #00BCD4 0%, #00838F 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #00838F 0%, #006064 100%)',
                            },
                          }}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => {
                            setIsEditingPreview(false);
                            setEditedData(null);
                          }}
                          sx={{
                            flex: 1,
                            minWidth: '120px',
                            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : '#D1D5DB',
                            color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#6B7280',
                            '&:hover': {
                              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                              bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                            },
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '200px',
                    py: 4,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <WorkOutlineIcon sx={{ fontSize: 64, color: mode === 'dark' ? 'rgba(0,188,212,0.3)' : '#D1D5DB', mb: 2 }} />
                  </motion.div>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      color: mode === 'dark' ? 'rgba(178,235,242,0.7)' : '#6B7280',
                      lineHeight: 1.6,
                      textAlign: 'center',
                      maxWidth: '90%',
                    }}
                  >
                    Provide your job description in the chat to unlock the generated Job preview.
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default PostJobPage;