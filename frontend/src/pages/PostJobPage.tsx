import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Avatar, IconButton, Button, Divider, Chip, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ChatbotWidget } from '../components/chatbot';
import SecurityIcon from '@mui/icons-material/Security';
import { authService } from '../services/authService';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Valid options for location and category
const VALID_LOCATIONS = ['Rawalpindi', 'Islamabad', 'Lahore', 'Karachi', 'Remote (Pakistan)'];
const VALID_CATEGORIES = ['Education', 'Business', 'Legal'];

// Word counter utility
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const MINIMUM_WORDS = 100;

const PostJobPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [progress, setProgress] = useState(0);
  const [jobPreview, setJobPreview] = useState<any>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [isPreviewLocked, setIsPreviewLocked] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleJobDataChange = (jobData: any, progressValue: number) => {
    setProgress(progressValue);
    
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
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          py: 2,
          px: 4,
          flexShrink: 0,
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
                color: '#0db4bc',
                '&:hover': { bgcolor: 'rgba(13, 180, 188, 0.1)' },
              }}
              title="Go Back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0db4bc',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              Expert Raah
            </Typography>
          </Box>
          
          {currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  color: '#6b7280',
                }}
              >
                {currentUser.name}
              </Typography>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#0db4bc',
                  fontSize: '0.875rem',
                }}
              >
                {currentUser.name?.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#6b7280',
                  '&:hover': { color: '#0db4bc' },
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
                color: '#6b7280',
                cursor: 'pointer',
                '&:hover': { color: '#0db4bc' },
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
          gap: 3,
          p: 3,
        }}
      >
        {/* Left Side - Chat Interface (70% Width) */}
        <Box
          sx={{
            flex: '0 0 70%',
            width: '70%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              height: '100%',
              width: '100%',
              borderRadius: 3,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ChatbotWidget initialOpen={true} onJobDataChange={handleJobDataChange} />
          </Paper>
        </Box>

        {/* Right Side - Information Panel (Remaining Width) */}
        <Box
          sx={{
            flex: '1',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            overflowY: 'auto',
            minHeight: 0,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '3px',
            },
          }}
        >
          {/* Progress Section */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#1f2937',
                }}
              >
                Let's keep it going
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  fontWeight: 500,
                }}
              >
                {progress}%
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                background: '#f9fafb',
                borderRadius: 2,
              }}
            >
              <SecurityIcon sx={{ color: '#6b7280' }} />
              <Typography
                sx={{
                  fontSize: '0.9rem',
                  color: '#374151',
                  fontWeight: 500,
                }}
              >
                All your info will be Safe & Secure
              </Typography>
            </Box>
          </Paper>

          {/* Job Preview Section */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: progress < 95 ? '#f9fafb' : '#fff',
              flexShrink: 0,
              minHeight: '200px',
              position: 'relative',
              border: progress < 95 ? '2px dashed #d1d5db' : '2px solid #0db4bc',
            }}
          >
            {/* Lock Overlay - Show until all steps completed */}
            {progress < 95 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(249, 250, 251, 0.95)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 3,
                  zIndex: 1,
                  gap: 2,
                }}
              >
                <SecurityIcon sx={{ fontSize: 64, color: '#9ca3af' }} />
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    textAlign: 'center',
                  }}
                >
                  🔒 Job Preview Locked
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.9rem',
                    color: '#9ca3af',
                    textAlign: 'center',
                    maxWidth: '80%',
                  }}
                >
                  Complete all 6 steps in the chat to unlock editing
                </Typography>
              </Box>
            )}
            
            {jobPreview ? (
              <Box sx={{ opacity: progress < 95 ? 0.3 : 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      color: '#1f2937',
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
                        color: '#0db4bc',
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
                      sx={{ ml: 1, textTransform: 'none', color: '#6b7280' }}
                    >
                      Unlock Sync
                    </Button>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {!isEditingPreview ? (
                  // READ-ONLY VIEW
                  <>
                    {(jobPreview.category || jobPreview.subCategory) && (
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                          Category:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={jobPreview.category || 'Not set'}
                            sx={{
                              bgcolor: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: 600,
                            }}
                          />
                          {jobPreview.subCategory && (
                            <>
                              <Typography sx={{ color: '#9ca3af' }}>→</Typography>
                              <Chip
                                label={jobPreview.subCategory}
                                size="small"
                                sx={{
                                  bgcolor: '#f0f9ff',
                                  color: '#0284c7',
                                  fontWeight: 500,
                                }}
                              />
                            </>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    {(jobPreview.enhancedDescription || jobPreview.description) && (
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                          Description ({countWords(jobPreview.enhancedDescription || jobPreview.description)} words):
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                          {jobPreview.enhancedDescription || jobPreview.description}
                        </Typography>
                        {jobPreview.rawDescription && jobPreview.enhancedDescription && jobPreview.rawDescription !== jobPreview.enhancedDescription && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#0db4bc', fontStyle: 'italic', mt: 0.5 }}>
                            ✨ AI-enhanced for clarity and professionalism
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      {(jobPreview.budgetMin || jobPreview.budgetMax) && (
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                            Budget:
                          </Typography>
                          <Typography sx={{ fontSize: '0.95rem', color: '#0db4bc', fontWeight: 600 }}>
                            PKR {jobPreview.budgetMin?.toLocaleString() || '0'} 
                            {jobPreview.budgetMax && ` - ${jobPreview.budgetMax?.toLocaleString()}`}
                          </Typography>
                        </Box>
                      )}
                      {jobPreview.timeline && (
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                            Timeline:
                          </Typography>
                          <Typography sx={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>
                            {jobPreview.timeline}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {jobPreview.location && (
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                          Location:
                        </Typography>
                        <Typography sx={{ fontSize: '0.95rem', color: '#374151', fontWeight: 500 }}>
                          {jobPreview.location}
                        </Typography>
                      </Box>
                    )}
                    
                    {jobPreview.skills && jobPreview.skills.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                          Skills:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {jobPreview.skills.map((skill: string, index: number) => (
                            <Chip
                              key={index}
                              label={skill}
                              size="small"
                              sx={{
                                bgcolor: '#f0fdf4',
                                color: '#15803d',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    {/* Show Post Job button only when unlocked and all required fields are filled */}
                    {progress >= 95 && jobPreview.description && jobPreview.category && jobPreview.timeline && jobPreview.location && countWords(jobPreview.enhancedDescription || jobPreview.description) >= MINIMUM_WORDS && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handlePostJob}
                        sx={{
                          mt: 2,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0a8b91 0%, #087579 100%)',
                          },
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        Post Job
                      </Button>
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
                    />
                    
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={editedData?.category || ''}
                        onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
                        label="Category"
                      >
                        {VALID_CATEGORIES.map((cat) => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth required>
                      <InputLabel>Location</InputLabel>
                      <Select
                        value={editedData?.location || ''}
                        onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                        label="Location"
                      >
                        {VALID_LOCATIONS.map((loc) => (
                          <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        label="Min Budget (PKR)"
                        type="number"
                        value={editedData?.budgetMin || ''}
                        onChange={(e) => setEditedData({ ...editedData, budgetMin: parseInt(e.target.value) || 0 })}
                        fullWidth
                        required
                      />
                      <TextField
                        label="Max Budget (PKR)"
                        type="number"
                        value={editedData?.budgetMax || ''}
                        onChange={(e) => setEditedData({ ...editedData, budgetMax: parseInt(e.target.value) || 0 })}
                        fullWidth
                        required
                      />
                    </Box>

                    <TextField
                      label="Timeline"
                      value={editedData?.timeline || ''}
                      onChange={(e) => setEditedData({ ...editedData, timeline: e.target.value })}
                      placeholder="e.g., 2 weeks, 1 month, ASAP"
                      fullWidth
                      required
                    />

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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
                        fullWidth
                        sx={{
                          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0a8b91 0%, #087579 100%)',
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
                        fullWidth
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
                  py: 4,
                }}
              >
                <WorkOutlineIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
                <Typography
                  sx={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    lineHeight: 1.6,
                    textAlign: 'center',
                  }}
                >
                  Provide your job description in the chat to unlock the generated Job preview.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default PostJobPage;