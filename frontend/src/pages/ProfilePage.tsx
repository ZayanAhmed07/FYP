import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCamera } from 'react-icons/fa';
import { Box, Typography, TextField, Button, Avatar, Chip, IconButton } from '@mui/material';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Consultant-specific fields
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [consultantData, setConsultantData] = useState({
    title: '',
    bio: '',
    specialization: [] as string[],
    hourlyRate: '',
    experience: '',
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFormData({ name: user.name, email: user.email });
      if (user.profileImage) {
        setPreviewUrl(user.profileImage);
      }
      
      // Fetch consultant profile if user is a consultant
      if (user.accountType === 'consultant') {
        fetchConsultantProfile(user.id);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchConsultantProfile = async (userId: string) => {
    try {
      const response = await httpClient.get(`/consultants/user/${userId}`);
      const myProfile = response.data?.data;
      
      if (myProfile) {
        console.log('Fetched consultant profile:', myProfile);
        setConsultantProfile(myProfile);
        setConsultantData({
          title: myProfile.title || '',
          bio: myProfile.bio || '',
          specialization: myProfile.specialization || [],
          hourlyRate: myProfile.hourlyRate?.toString() || '',
          experience: myProfile.experience || '',
          skills: myProfile.skills || [],
        });
      } else {
        console.log('No consultant profile found for user:', userId);
        // Reset to empty state if no profile exists
        setConsultantProfile(null);
        setConsultantData({
          title: '',
          bio: '',
          specialization: [],
          hourlyRate: '',
          experience: '',
          skills: [],
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch consultant profile:', err);
      // If 404, it means no profile exists yet (which is fine)
      if (err.response?.status === 404) {
        setConsultantProfile(null);
        setConsultantData({
          title: '',
          bio: '',
          specialization: [],
          hourlyRate: '',
          experience: '',
          skills: [],
        });
      }
    }
  };

  const handleConsultantInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConsultantData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const addSkill = () => {
    if (newSkill.trim() && !consultantData.skills.includes(newSkill.trim())) {
      setConsultantData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setConsultantData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addSpecialization = () => {
    if (newSpecialization.trim() && !consultantData.specialization.includes(newSpecialization.trim())) {
      setConsultantData(prev => ({
        ...prev,
        specialization: [...prev.specialization, newSpecialization.trim()]
      }));
      setNewSpecialization('');
    }
  };

  const removeSpecialization = (spec: string) => {
    setConsultantData(prev => ({
      ...prev,
      specialization: prev.specialization.filter(s => s !== spec)
    }));
  };

  const compressImage = (file: File, callback: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large (max 800px width)
        if (width > 800) {
          height = (height * 800) / width;
          width = 800;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          callback(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfileImage(file);
      compressImage(file, (compressedBase64) => {
        setPreviewUrl(compressedBase64);
      });
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updates: any = {};

      // Update name if changed
      if (formData.name !== currentUser.name) {
        updates.name = formData.name;
      }

      // Update email if changed
      if (formData.email !== currentUser.email) {
        updates.email = formData.email;
      }

      // Handle image upload if changed
      if (profileImage) {
        // Convert image to base64
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            updates.profileImage = reader.result as string;
            
            // Send update to backend
            await httpClient.patch('/users/me', updates);
            
            // Update consultant profile if user is consultant
            if (currentUser.accountType === 'consultant') {
              await saveConsultantProfile();
            }
            
            // Update localStorage
            const updatedUser = { ...currentUser, ...updates };
            localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            
            setSuccess('Profile updated successfully!');
            setProfileImage(null);
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
          } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
            setLoading(false);
          }
        };
        reader.readAsDataURL(profileImage);
        return;
      } else {
        // Send user update to backend if there are changes
        if (Object.keys(updates).length > 0) {
          await httpClient.patch('/users/me', updates);
          
          // Update localStorage
          const updatedUser = { ...currentUser, ...updates };
          localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
        }

        // Update consultant profile if user is consultant
        if (currentUser.accountType === 'consultant') {
          await saveConsultantProfile();
        }
        
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const saveConsultantProfile = async () => {
    // Validate consultant data
    if (!consultantData.title.trim()) {
      throw new Error('Professional title is required');
    }
    if (!consultantData.bio.trim()) {
      throw new Error('Bio/description is required');
    }
    if (consultantData.specialization.length === 0) {
      throw new Error('At least one specialization is required');
    }
    if (!consultantData.hourlyRate || Number(consultantData.hourlyRate) <= 0) {
      throw new Error('Valid hourly rate is required');
    }
    if (!consultantData.experience.trim()) {
      throw new Error('Experience is required');
    }

    const consultantPayload = {
      userId: currentUser.id, // Add userId to the payload
      title: consultantData.title,
      bio: consultantData.bio,
      specialization: consultantData.specialization,
      hourlyRate: Number(consultantData.hourlyRate),
      experience: consultantData.experience,
      skills: consultantData.skills,
    };

    if (consultantProfile) {
      // Update existing profile (don't send userId for updates)
      const { userId, ...updatePayload } = consultantPayload;
      await httpClient.patch(`/consultants/${consultantProfile._id}`, updatePayload);
    } else {
      // Create new profile (include userId)
      await httpClient.post('/consultants', consultantPayload);
      if (currentUser?.id) {
        await fetchConsultantProfile(currentUser.id); // Refresh to get the created profile
      }
    }
  };

  if (!currentUser) {
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
        <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
            Account Settings
          </Typography>
          <Button
            onClick={() => navigate(-1)}
            sx={{
              color: 'white',
              border: '2px solid white',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            ← Back to Dashboard
          </Button>
        </Box>

        {/* Main Content Grid */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Sidebar */}
          <Box sx={{ width: { md: '280px' }, flexShrink: 0 }}>
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                {previewUrl ? (
                  <Avatar
                    src={previewUrl}
                    alt="Profile"
                    sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                ) : (
                  <FaUserCircle style={{ fontSize: '120px', color: '#9ca3af' }} />
                )}
                <IconButton
                  component="label"
                  title="Click to change profile picture"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: 'white',
                    width: 40,
                    height: 40,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0a8b91 0%, #2d5a5f 100%)',
                    },
                  }}
                >
                  <FaCamera />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </IconButton>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a' }}>
                {currentUser.name}
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>
                {currentUser.email}
              </Typography>
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            {/* Messages */}
            {(success || error) && (
              <Box sx={{ mb: 3 }}>
                {success && (
                  <Box
                    sx={{
                      p: 2,
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '12px',
                      color: '#166534',
                      mb: 2,
                    }}
                  >
                    {success}
                  </Box>
                )}
                {error && (
                  <Box
                    sx={{
                      p: 2,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '12px',
                      color: '#dc2626',
                    }}
                  >
                    {error}
                  </Box>
                )}
              </Box>
            )}

            {/* Personal Information Card */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                p: 4,
                mb: 3,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a1a1a' }}>
                Personal Information
              </Typography>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                disabled
                placeholder="Enter your full name"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                disabled
                placeholder="Enter your email address"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#f9fafb',
                    '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                  },
                }}
              />
            </Box>

            {/* Consultant Professional Profile - Only for consultants */}
            {currentUser.accountType === 'consultant' && (
              <>
                {!consultantProfile && (
                  <Box
                    sx={{
                      background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.1) 0%, rgba(10, 139, 145, 0.1) 100%)',
                      border: '2px solid #0db4bc',
                      borderRadius: '16px',
                      p: 3,
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0db4bc' }}>
                      📝 Complete Your Professional Profile
                    </Typography>
                    <Typography sx={{ color: '#6b7280' }}>
                      To submit proposals and attract clients, please complete your professional profile below. 
                      All fields marked with * are required.
                    </Typography>
                  </Box>
                )}
                
                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    p: 4,
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Professional Profile
                  </Typography>
                  <Typography sx={{ color: '#6b7280', mb: 3 }}>
                    Build your consultant portfolio to attract clients
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Professional Title *"
                    name="title"
                    value={consultantData.title}
                    onChange={handleConsultantInputChange}
                    placeholder="e.g., Senior Legal Consultant, Business Strategy Expert"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Professional Bio / Description *"
                    name="bio"
                    value={consultantData.bio}
                    onChange={handleConsultantInputChange}
                    multiline
                    rows={6}
                    placeholder="Write a compelling description of your expertise, experience, and what makes you unique..."
                    helperText={`${consultantData.bio.length} characters (Recommended: 200-500 characters)`}
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                    }}
                  />

                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5, color: '#1a1a1a' }}>
                      Specialization / Areas of Expertise *
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                        placeholder="e.g., Education, Business, Legal"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                            '&:hover fieldset': { borderColor: '#667eea' },
                            '&.Mui-focused fieldset': { borderColor: '#667eea' },
                          },
                        }}
                      />
                      <Button
                        onClick={addSpecialization}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          px: 3,
                          borderRadius: '12px',
                          textTransform: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                          },
                        }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {consultantData.specialization.map((spec) => (
                        <Chip
                          key={spec}
                          label={spec}
                          onDelete={() => removeSpecialization(spec)}
                          sx={{
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            color: '#667eea',
                            fontWeight: 600,
                            '& .MuiChip-deleteIcon': {
                              color: '#667eea',
                              '&:hover': { color: '#5568d3' },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    label="Years of Experience *"
                    name="experience"
                    value={consultantData.experience}
                    onChange={handleConsultantInputChange}
                    placeholder="e.g., 10 years, 5+ years"
                    sx={{
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' },
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Hourly Rate (PKR) *"
                    name="hourlyRate"
                    type="number"
                    value={consultantData.hourlyRate}
                    onChange={handleConsultantInputChange}
                    placeholder="e.g., 5000"
                    inputProps={{ min: 0 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                        '&:hover fieldset': { borderColor: '#667eea' },
                        '&.Mui-focused fieldset': { borderColor: '#667eea' },
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    p: 4,
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Skills & Expertise
                  </Typography>
                  <Typography sx={{ color: '#6b7280', mb: 3 }}>
                    Add relevant skills to showcase your capabilities
                  </Typography>
                  
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 1.5, color: '#1a1a1a' }}>
                      Skills
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="e.g., Contract Law, Market Research, Curriculum Design"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
                            '&:hover fieldset': { borderColor: '#667eea' },
                            '&.Mui-focused fieldset': { borderColor: '#667eea' },
                          },
                        }}
                      />
                      <Button
                        onClick={addSkill}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          px: 3,
                          borderRadius: '12px',
                          textTransform: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                          },
                        }}
                      >
                        Add Skill
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {consultantData.skills.map((skill) => (
                        <Chip
                          key={skill}
                          label={skill}
                          onDelete={() => removeSkill(skill)}
                          sx={{
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            color: '#667eea',
                            fontWeight: 600,
                            '& .MuiChip-deleteIcon': {
                              color: '#667eea',
                              '&:hover': { color: '#5568d3' },
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </>
            )}

            {/* Save All Changes Button - Single button for entire profile */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button
                onClick={() => navigate(-1)}
                disabled={loading}
                sx={{
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: '#d1d5db',
                    background: '#f9fafb',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 0, 0, 0.12)',
                    color: 'rgba(0, 0, 0, 0.26)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Saving Changes...' : 'Save All Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;

