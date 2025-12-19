import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaRobot, FaMagic, FaArrowLeft, FaArrowRight, FaTimes, FaCheck } from 'react-icons/fa';
import { Box, Container, Typography, TextField, Button, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { ChatbotWidget } from '../components/chatbot';

interface JobFormData {
  category: string;
  title: string;
  description: string;
  skills: string[];
  budget: string;
  timeline: string;
  location: string;
  attachments: File[];
}

const PostJobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const [step, setStep] = useState(1);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [jobData, setJobData] = useState<JobFormData>({
    category: '',
    title: '',
    description: '',
    skills: [],
    budget: '',
    timeline: '',
    location: '',
    attachments: []
  });

  const categories = ['Education', 'Business', 'Legal'];

  // Handle chatbot data pre-filling
  useEffect(() => {
    const chatbotData = location.state?.chatbotData;
    if (chatbotData) {
      // Map chatbot data to form format
      let budgetRange = '';
      const min = chatbotData.budgetMin || 0;
      const max = chatbotData.budgetMax || 0;

      // Map budget to range
      if (max <= 10000) budgetRange = 'lt-10000';
      else if (min >= 10000 && max <= 50000) budgetRange = '10000-50000';
      else if (min >= 50000 && max <= 100000) budgetRange = '50000-100000';
      else if (min >= 100000 && max <= 200000) budgetRange = '100000-200000';
      else if (min >= 200000) budgetRange = '200000+';

      // Map location to select value
      const locationMap: Record<string, string> = {
        'rawalpindi': 'rawalpindi',
        'islamabad': 'islamabad',
        'lahore': 'lahore',
        'karachi': 'karachi',
      };

      const locationValue = Object.keys(locationMap).find(key =>
        chatbotData.location?.toLowerCase().includes(key)
      ) || '';

      setJobData({
        category: chatbotData.category || '',
        title: chatbotData.description?.substring(0, 100) || '', // Use first part of description as title
        description: chatbotData.description || '',
        skills: chatbotData.skills || [],
        budget: budgetRange,
        timeline: chatbotData.timeline || '',
        location: locationValue,
        attachments: []
      });

      // Clear the navigation state to prevent re-filling on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const loadJobForEdit = async () => {
      if (!isEditMode || !jobId) return;
      try {
        const response = await httpClient.get(`/jobs/${jobId}`);
        const job = response.data?.data;
        if (!job) return;

        // Map budget min/max back to range key
        let budgetRange = '';
        const min = job.budget?.min ?? 0;
        const max = job.budget?.max ?? 0;
        if (max === 10000) budgetRange = 'lt-10000';
        else if (min === 10000 && max === 50000) budgetRange = '10000-50000';
        else if (min === 50000 && max === 100000) budgetRange = '50000-100000';
        else if (min === 100000 && max === 200000) budgetRange = '100000-200000';
        else if (min === 200000) budgetRange = '200000+';

        // Map location string back to select value
        const locationValueMap: Record<string, string> = {
          'Rawalpindi, Pakistan': 'rawalpindi',
          'Islamabad, Pakistan': 'islamabad',
          'Lahore, Pakistan': 'lahore',
          'Karachi, Pakistan': 'karachi',
        };

        setJobData({
          category: job.category,
          title: job.title,
          description: job.description,
          skills: job.skills || [],
          budget: budgetRange,
          timeline: job.timeline,
          location: locationValueMap[job.location] || '',
          attachments: [],
        });
      } catch (error) {
        console.error('Failed to load job for editing', error);
        setSubmitError('Failed to load job for editing. Please try again.');
      }
    };

    loadJobForEdit();
  }, [isEditMode, jobId]);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleAIEnhance = () => {
    // Simulate AI enhancement
    const enhancedDescription = jobData.description + '\n\n[AI Enhanced] This description has been optimized for better clarity and professionalism.';
    setJobData({ ...jobData, description: enhancedDescription });
    setShowAIAssistant(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      // Basic required-field validation
      if (
        !jobData.category ||
        !jobData.title.trim() ||
        !jobData.description.trim() ||
        !jobData.location ||
        !jobData.budget ||
        !jobData.timeline
      ) {
        setSubmitError('Please complete all required fields (category, title, description, location, budget, timeline) before posting the job.');
        return;
      }

      // Map budget range to numeric min/max in PKR
      let budgetMin = 0;
      let budgetMax = 0;

      switch (jobData.budget) {
        case 'lt-10000':
          budgetMin = 0;
          budgetMax = 10000;
          break;
        case '10000-50000':
          budgetMin = 10000;
          budgetMax = 50000;
          break;
        case '50000-100000':
          budgetMin = 50000;
          budgetMax = 100000;
          break;
        case '100000-200000':
          budgetMin = 100000;
          budgetMax = 200000;
          break;
        case '200000+':
          budgetMin = 200000;
          budgetMax = 500000; // upper bound just for storage
          break;
        default:
          budgetMin = 0;
          budgetMax = 0;
      }

      // Map location value to full label
      const locationMap: Record<string, string> = {
        rawalpindi: 'Rawalpindi, Pakistan',
        islamabad: 'Islamabad, Pakistan',
        lahore: 'Lahore, Pakistan',
        karachi: 'Karachi, Pakistan',
      };

      // Convert files to base64
      const attachmentsBase64: string[] = [];
      if (jobData.attachments && jobData.attachments.length > 0) {
        for (const file of jobData.attachments) {
          try {
            const base64 = await fileToBase64(file);
            attachmentsBase64.push(base64);
          } catch (error) {
            console.error(`Failed to convert file ${file.name} to base64`, error);
            setSubmitError(`Failed to process file: ${file.name}`);
            return;
          }
        }
      }

      const payload = {
        category: jobData.category,
        title: jobData.title,
        description: jobData.description,
        budget: {
          min: budgetMin,
          max: budgetMax,
        },
        timeline: jobData.timeline,
        location: locationMap[jobData.location] || jobData.location,
        skills: jobData.skills,
        attachments: attachmentsBase64,
      };

      if (isEditMode && jobId) {
        await httpClient.put(`/jobs/${jobId}`, payload);
      } else {
        await httpClient.post('/jobs', payload);
      }

      setSubmitError('');
      navigate('/buyer-dashboard');
    } catch (error) {
      console.error('Failed to post job', error);
      setSubmitError('Failed to post job. Please try again.');
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 4,
          mb: 3,
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontSize: '1.75rem',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          EXPERT RAAH
        </Typography>
        <IconButton
          onClick={() => navigate('/buyer-dashboard')}
          sx={{
            color: '#fff',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.25)',
            },
          }}
        >
          <FaTimes />
        </IconButton>
      </Box>

      <Container maxWidth="md">
        {/* Progress Steps */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            p: 3,
            mb: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'relative',
            }}
          >
            {[1, 2, 3, 4].map((s) => (
              <Box
                key={s}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background:
                      step >= s
                        ? 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)'
                        : 'rgba(156, 163, 175, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step >= s ? '#fff' : '#9ca3af',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    transition: 'all 0.3s ease',
                    border: step === s ? '3px solid #fff' : 'none',
                    boxShadow: step >= s ? '0 4px 12px rgba(13, 180, 188, 0.4)' : 'none',
                  }}
                >
                  {step > s ? <FaCheck /> : s}
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: step >= s ? '#0db4bc' : '#9ca3af',
                    textAlign: 'center',
                  }}
                >
                  {s === 1 && 'Category'}
                  {s === 2 && 'Details'}
                  {s === 3 && 'Requirements'}
                  {s === 4 && 'Review'}
                </Typography>
              </Box>
            ))}
            {/* Connection lines */}
            <Box
              sx={{
                position: 'absolute',
                top: '24px',
                left: 'calc(12.5% + 24px)',
                right: 'calc(12.5% + 24px)',
                height: '3px',
                background: 'rgba(156, 163, 175, 0.2)',
                zIndex: 1,
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #0db4bc 0%, #2d5a5f 100%)',
                  width: `${((step - 1) / 3) * 100}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Main Form */}
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
          {/* Step 1: Category Selection */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <Box
                component={motion.div}
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography
                  sx={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 1,
                  }}
                >
                  What type of consultant do you need?
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    mb: 4,
                  }}
                >
                  Select the category that best matches your needs
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  {categories.map((category) => (
                    <Box
                      key={category}
                      component={motion.div}
                      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(13, 180, 188, 0.25)' }}
                      onClick={() => setJobData({ ...jobData, category })}
                      sx={{
                        p: 4,
                        borderRadius: '16px',
                        background:
                          jobData.category === category
                            ? 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)'
                            : 'rgba(13, 180, 188, 0.05)',
                        border:
                          jobData.category === category
                            ? '2px solid #0db4bc'
                            : '2px solid rgba(13, 180, 188, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: jobData.category === category ? '#fff' : '#1f2937',
                        }}
                      >
                        {category}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Step 2: Job Details */}
            {step === 2 && (
              <Box
                component={motion.div}
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Typography
                  sx={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    mb: 1,
                  }}
                >
                  Tell us about your project
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    color: '#6b7280',
                    mb: 4,
                  }}
                >
                  Provide details to help consultants understand your needs
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1,
                    }}
                  >
                    Job Title *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., Legal Consultant for Contract Review"
                    value={jobData.title}
                    onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                      }}
                    >
                      Job Description *
                    </Typography>
                    <Button
                      onClick={() => setShowAIAssistant(!showAIAssistant)}
                      startIcon={<FaRobot />}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        px: 2,
                        py: 0.75,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        },
                      }}
                    >
                      AI Assistant
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    placeholder="Describe your project, goals, and what you're looking for in a consultant..."
                    value={jobData.description}
                    onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                  />

                  {showAIAssistant && (
                    <Box
                      component={motion.div}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      sx={{
                        mt: 2,
                        p: 3,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <FaRobot style={{ color: '#0db4bc', fontSize: '20px' }} />
                        <Typography sx={{ fontWeight: 700, color: '#0db4bc' }}>
                          AI Writing Assistant
                        </Typography>
                      </Box>
                      <Typography sx={{ color: '#4b5563', fontSize: '0.875rem', mb: 2 }}>
                        I can help enhance your job description to make it more professional and attractive to top consultants.
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Button
                          onClick={handleAIEnhance}
                          startIcon={<FaMagic />}
                          size="small"
                          sx={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': {
                              background: 'rgba(102, 126, 234, 0.2)',
                            },
                          }}
                        >
                          Enhance Description
                        </Button>
                        <Button
                          startIcon={<FaMagic />}
                          size="small"
                          sx={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': {
                              background: 'rgba(102, 126, 234, 0.2)',
                            },
                          }}
                        >
                          Add Key Points
                        </Button>
                        <Button
                          startIcon={<FaMagic />}
                          size="small"
                          sx={{
                            background: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': {
                              background: 'rgba(102, 126, 234, 0.2)',
                            },
                          }}
                        >
                          Improve Clarity
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1f2937',
                      mb: 1,
                    }}
                  >
                    Location
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={jobData.location}
                    onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                    SelectProps={{
                      native: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        '&:hover fieldset': {
                          borderColor: '#667eea',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#667eea',
                        },
                      },
                    }}
                  >
                    <option value="">Select location</option>
                    <option value="rawalpindi">Rawalpindi</option>
                    <option value="islamabad">Islamabad</option>
                    <option value="lahore">Lahore</option>
                    <option value="karachi">Karachi</option>
                  </TextField>
                </Box>
              </Box>
            )}

            {/* Step 3: Requirements */}
            {step === 3 && (
              <Box
                component={motion.div}
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  p: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', mb: 1 }}>
                  Project requirements
                </Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '1rem', mb: 4 }}>
                  Specify timeline and budget for your project
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
                    Required Skills
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g., Contract Law, Business Strategy (comma separated)"
                    onChange={(e) => setJobData({ ...jobData, skills: e.target.value.split(',') })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        background: '#fff',
                        '& fieldset': { borderColor: '#e5e7eb' },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
                      Budget Range
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      SelectProps={{ native: true }}
                      value={jobData.budget}
                      onChange={(e) => setJobData({ ...jobData, budget: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          background: '#fff',
                          '& fieldset': { borderColor: '#e5e7eb' },
                          '&:hover fieldset': { borderColor: '#0db4bc' },
                          '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                        },
                      }}
                    >
                      <option value="">Select budget</option>
                      <option value="lt-10000">Less than Rs 10,000</option>
                      <option value="10000-50000">Rs 10,000 - Rs 50,000</option>
                      <option value="50000-100000">Rs 50,000 - Rs 100,000</option>
                      <option value="100000-200000">Rs 100,000 - Rs 200,000</option>
                      <option value="200000+">Rs 200,000+</option>
                    </TextField>
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
                      Project Timeline
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      SelectProps={{ native: true }}
                      value={jobData.timeline}
                      onChange={(e) => setJobData({ ...jobData, timeline: e.target.value })}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          background: '#fff',
                          '& fieldset': { borderColor: '#e5e7eb' },
                          '&:hover fieldset': { borderColor: '#0db4bc' },
                          '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                        },
                      }}
                    >
                      <option value="">Select timeline</option>
                      <option value="less-than-1-week">Less than 1 week</option>
                      <option value="1-2-weeks">1-2 weeks</option>
                      <option value="2-4-weeks">2-4 weeks</option>
                      <option value="1-3-months">1-3 months</option>
                      <option value="3-6-months">3-6 months</option>
                      <option value="6-months+">6+ months</option>
                    </TextField>
                  </Box>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
                    Attachments (Optional)
                  </Typography>
                  <Button
                    component="label"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      px: 3,
                      py: 1.5,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                      '&:hover': { background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)' },
                    }}
                  >
                    📎 Upload Documents
                    <input
                      type="file"
                      multiple
                      hidden
                      onChange={(e) => {
                        if (e.target.files) {
                          setJobData({ ...jobData, attachments: Array.from(e.target.files) });
                        }
                      }}
                    />
                  </Button>

                  {jobData.attachments && jobData.attachments.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
                        Selected Files:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {jobData.attachments.map((file, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              background: 'rgba(102, 126, 234, 0.05)',
                              borderRadius: '8px',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#1f2937' }}>
                                {file.name}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                ({(file.size / 1024).toFixed(2)} KB)
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setJobData({
                                  ...jobData,
                                  attachments: jobData.attachments.filter((_, i) => i !== index),
                                });
                              }}
                              sx={{ color: '#ef4444' }}
                            >
                              <FaTimes />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <Box
                component={motion.div}
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  p: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography sx={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937', mb: 1 }}>
                  {isEditMode ? 'Review your job updates' : 'Review your job posting'}
                </Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '1rem', mb: 3 }}>
                  Make sure everything looks good before posting
                </Typography>

                {submitError && (
                  <Typography sx={{ color: '#ef4444', fontSize: '0.95rem', mb: 3, p: 2, background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}>
                    {submitError}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'Category', value: jobData.category },
                    { label: 'Title', value: jobData.title },
                    { label: 'Description', value: jobData.description, isLong: true },
                    { label: 'Location', value: jobData.location || 'Not specified' },
                    { label: 'Budget', value: jobData.budget || 'Not specified' },
                    { label: 'Timeline', value: jobData.timeline || 'Not specified' },
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        background: 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', mb: 0.5 }}>
                        {item.label}:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: item.isLong ? '0.95rem' : '1rem',
                          fontWeight: item.isLong ? 400 : 600,
                          color: '#1f2937',
                          lineHeight: item.isLong ? 1.6 : 1.4,
                        }}
                      >
                        {item.value}
                      </Typography>
                    </Box>
                  ))}

                  {jobData.attachments && jobData.attachments.length > 0 && (
                    <Box
                      sx={{
                        p: 2,
                        background: 'rgba(102, 126, 234, 0.05)',
                        borderRadius: '12px',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', mb: 1 }}>
                        Attachments:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {jobData.attachments.map((file, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                              background: '#fff',
                              borderRadius: '8px',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.875rem', color: '#1f2937' }}>
                              {file.name}
                            </Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              ({(file.size / 1024).toFixed(2)} KB)
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
              {step > 1 && (
                <Button
                  onClick={handlePrevious}
                  startIcon={<FaArrowLeft />}
                  sx={{
                    background: 'rgba(156, 163, 175, 0.15)',
                    color: '#4b5563',
                    px: 4,
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    '&:hover': { background: 'rgba(156, 163, 175, 0.25)' },
                  }}
                >
                  Previous
                </Button>
              )}
              <Box sx={{ flex: 1 }} />
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  endIcon={<FaArrowRight />}
                  sx={{
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8e94 100%)',
                    color: '#fff',
                    px: 4,
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0a8e94 0%, #0db4bc 100%)',
                      boxShadow: '0 6px 20px rgba(13, 180, 188, 0.4)',
                    },
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  startIcon={<FaCheck />}
                  sx={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff',
                    px: 4,
                    py: 1.5,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                      boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                    },
                  }}
                >
                  {isEditMode ? 'Update Job' : 'Post Job'}
                </Button>
              )}
            </Box>
          </AnimatePresence>
        </Box>
      </Container>
      <ChatbotWidget />
    </Box>
  );
};

export default PostJobPage;

