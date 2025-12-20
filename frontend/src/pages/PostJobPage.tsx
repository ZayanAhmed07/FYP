import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Avatar, IconButton, Button, Divider, Chip } from '@mui/material';
import { ChatbotWidget } from '../components/chatbot';
import SecurityIcon from '@mui/icons-material/Security';
import { authService } from '../services/authService';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';

const PostJobPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [progress, setProgress] = useState(0);
  const [jobPreview, setJobPreview] = useState<any>(null);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const handleJobDataChange = (jobData: any, progressValue: number) => {
    setProgress(progressValue);
    
    // Only show preview when we have enough data (at least description and category)
    if (jobData.description && jobData.category) {
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

      // Map budget to min/max with defaults
      const budgetMin = jobPreview.budgetMin || 5000;
      const budgetMax = jobPreview.budgetMax || budgetMin * 2;

      // Enhance the job description and generate professional title using AI
      const { title, enhancedDescription } = await sarahAI.enhanceJobPosting(
        jobPreview.description,
        jobPreview.category,
        jobPreview.skills || []
      );

      const payload = {
        category: jobPreview.category,
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
              background: '#fff',
              flexShrink: 0,
              minHeight: '200px',
            }}
          >
            {jobPreview ? (
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#1f2937',
                    mb: 2,
                  }}
                >
                  📝 Job Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {jobPreview.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                      Description:
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                      {jobPreview.description}
                    </Typography>
                  </Box>
                )}
                
                {jobPreview.category && (
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                      Category:
                    </Typography>
                    <Chip
                      label={jobPreview.category}
                      sx={{
                        bgcolor: '#e0f2fe',
                        color: '#0369a1',
                        fontWeight: 600,
                      }}
                    />
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
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {jobPreview.budgetMin && (
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', mb: 0.5 }}>
                        Budget:
                      </Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#0db4bc', fontWeight: 600 }}>
                        PKR {jobPreview.budgetMin?.toLocaleString()} 
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
                
                {/* Show Post Job button only when all required fields are filled */}
                {jobPreview.description && jobPreview.category && jobPreview.timeline && jobPreview.location && (
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

          {/* Tips Section */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#fff',
                mb: 2,
              }}
            >
              💡 How it works
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>1.</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem' }}>
                  Chat naturally with Sarah about your project
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>2.</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem' }}>
                  She'll extract category, skills, budget & timeline
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>3.</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem' }}>
                  Review the job details and post it
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography sx={{ color: '#fff', fontWeight: 600 }}>4.</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.95)', fontSize: '0.9rem' }}>
                  Get AI-matched consultant recommendations!
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default PostJobPage;