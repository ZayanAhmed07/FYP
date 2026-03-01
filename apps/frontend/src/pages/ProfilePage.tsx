import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaCamera, FaSun, FaMoon, FaArrowLeft } from 'react-icons/fa';
import { Box, Typography, TextField, Button, Avatar, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { useThemeMode } from '../context/ThemeContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
 
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
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a', fontSize: '1.2rem' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(135deg, #0db4bc 0%, #47afbf 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Account Settings
          </Typography>
          
          {/* Back Button */}
          <Button
            component={motion.button}
            whileHover={{ scale: 1.03, x: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#0db4bc',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(13, 180, 188, 0.1)',
              border: (theme) => theme.palette.mode === 'dark'
                ? '2px solid rgba(255, 255, 255, 0.2)'
                : '2px solid rgba(13, 180, 188, 0.3)',
              px: 3,
              py: 1.2,
              borderRadius: '14px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(13, 180, 188, 0.2)',
              },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>

        {/* Main Content Grid */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Sidebar */}
          <Box sx={{ width: { md: '300px' }, flexShrink: 0 }}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              sx={{
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(13, 180, 188, 0.15)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(13, 180, 188, 0.1)',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                {previewUrl ? (
                  <Avatar
                    src={previewUrl}
                    alt="Profile"
                    sx={{ 
                      width: 140, 
                      height: 140, 
                      border: '4px solid #0db4bc', 
                      boxShadow: '0 8px 24px rgba(13, 180, 188, 0.3)',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 140,
                      height: 140,
                      borderRadius: '50%',
                      border: '4px solid #0db4bc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(13, 180, 188, 0.1)'
                        : 'rgba(13, 180, 188, 0.05)',
                    }}
                  >
                    <FaUserCircle style={{ fontSize: '80px', color: '#0db4bc' }} />
                  </Box>
                )}
                <>
                  <IconButton
                    component={motion.button}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    title="Click to change profile picture"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: 'white',
                      width: 44,
                      height: 44,
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '3px solid #1e293b'
                        : '3px solid white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
                        boxShadow: '0 6px 20px rgba(13, 180, 188, 0.5)',
                      },
                    }}
                  >
                    <FaCamera size={18} />
                  </IconButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5, 
                  color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                }}
              >
                {currentUser.name}
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.9rem' }}>
                {currentUser.email}
              </Typography>
              <Chip
                label={currentUser.accountType === 'consultant' ? '👔 Consultant' : '💼 Buyer'}
                sx={{
                  mt: 2,
                  background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(13, 180, 188, 0.25) 100%)',
                  color: '#0db4bc',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1.5px solid rgba(13, 180, 188, 0.3)',
                  px: 1,
                }}
              />
            </Box>
          </Box>

          {/* Main Content */}
          <Box sx={{ flex: 1 }}>
            {/* Messages */}
            {(success || error) && (
              <Box sx={{ mb: 3 }}>
                {success && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{
                      p: 3,
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : '#f0fdf4',
                      border: '2px solid #22c55e',
                      borderRadius: '16px',
                      color: (theme) => theme.palette.mode === 'dark' ? '#86efac' : '#166534',
                      fontWeight: 600,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ fontSize: '1.5rem' }}>✅</Box>
                    {success}
                  </Box>
                )}
                {error && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    sx={{
                      p: 3,
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#fef2f2',
                      border: '2px solid #ef4444',
                      borderRadius: '16px',
                      color: (theme) => theme.palette.mode === 'dark' ? '#fca5a5' : '#dc2626',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ fontSize: '1.5rem' }}>⚠️</Box>
                    {error}
                  </Box>
                )}
              </Box>
            )}

            {/* Personal Information Card */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              sx={{
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(30, 41, 59, 0.8)'
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                  : '0 8px 32px rgba(13, 180, 188, 0.1)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(13, 180, 188, 0.1)',
                p: 4,
                mb: 3,
              }}
            >
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                👤 Personal Information
              </Typography>
              <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', mb: 3, fontSize: '0.9rem' }}>
                Your account details are managed by the system
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
                    borderRadius: '14px',
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#f9fafb',
                    '& fieldset': { 
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.12)' 
                    },
                    '& input': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
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
                    borderRadius: '14px',
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(15, 23, 42, 0.6)'
                      : '#f9fafb',
                    '& fieldset': { 
                      borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.12)' 
                    },
                    '& input': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  },
                }}
              />
            </Box>

            {/* Consultant Professional Profile - Only for consultants */}
            {currentUser.accountType === 'consultant' && (
              <>
                {!consultantProfile && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    sx={{
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(10, 139, 145, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(13, 180, 188, 0.1) 0%, rgba(13, 180, 188, 0.15) 100%)',
                      border: '2px solid #0db4bc',
                      borderRadius: '20px',
                      p: 3,
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0db4bc', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📝 Complete Your Professional Profile
                    </Typography>
                    <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                      To submit proposals and attract clients, please complete your professional profile below. 
                      All fields marked with * are required.
                    </Typography>
                  </Box>
                )}
                
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(13, 180, 188, 0.1)',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(13, 180, 188, 0.1)',
                    p: 4,
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a' }}>
                    💼 Professional Profile
                  </Typography>
                  <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', mb: 3 }}>
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
                        borderRadius: '14px',
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(15, 23, 42, 0.6)'
                          : 'white',
                        '& input': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                        },
                        '& fieldset': { 
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.12)' 
                        },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                      '& .MuiInputLabel-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
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
                        borderRadius: '14px',
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(15, 23, 42, 0.6)'
                          : 'white',
                        '& textarea': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                        },
                        '& fieldset': { 
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.12)' 
                        },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                      '& .MuiInputLabel-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                      },
                      '& .MuiFormHelperText-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                      },
                    }}
                  />

                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a' }}>
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
                            borderRadius: '14px',
                            backgroundColor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(15, 23, 42, 0.6)'
                              : 'white',
                            '& input': {
                              color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                            },
                            '& fieldset': { 
                              borderColor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.12)' 
                            },
                            '&:hover fieldset': { borderColor: '#0db4bc' },
                            '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                          },
                        }}
                      />
                      <Button
                        onClick={addSpecialization}
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                          color: 'white',
                          px: 3,
                          borderRadius: '14px',
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
                            boxShadow: '0 6px 16px rgba(13, 180, 188, 0.4)',
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
                          component={motion.div}
                          whileHover={{ scale: 1.05, y: -2 }}
                          sx={{
                            background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(13, 180, 188, 0.25) 100%)',
                            color: '#0db4bc',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1.5px solid rgba(13, 180, 188, 0.3)',
                            '& .MuiChip-deleteIcon': {
                              color: '#0db4bc',
                              '&:hover': { color: '#0a8b91' },
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
                        borderRadius: '14px',
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(15, 23, 42, 0.6)'
                          : 'white',
                        '& input': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                        },
                        '& fieldset': { 
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.12)' 
                        },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                      '& .MuiInputLabel-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
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
                        borderRadius: '14px',
                        backgroundColor: (theme) => theme.palette.mode === 'dark'
                          ? 'rgba(15, 23, 42, 0.6)'
                          : 'white',
                        '& input': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                        },
                        '& fieldset': { 
                          borderColor: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.12)' 
                        },
                        '&:hover fieldset': { borderColor: '#0db4bc' },
                        '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                      },
                      '& .MuiInputLabel-root': {
                        color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                      },
                    }}
                  />
                </Box>

                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  sx={{
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(13, 180, 188, 0.1)',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(13, 180, 188, 0.1)',
                    p: 4,
                    mb: 3,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a' }}>
                    🎯 Skills & Expertise
                  </Typography>
                  <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', mb: 3 }}>
                    Add relevant skills to showcase your capabilities
                  </Typography>
                  
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 1.5, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a' }}>
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
                            borderRadius: '14px',
                            backgroundColor: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(15, 23, 42, 0.6)'
                              : 'white',
                            '& input': {
                              color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1a1a1a',
                            },
                            '& fieldset': { 
                              borderColor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.12)' 
                            },
                            '&:hover fieldset': { borderColor: '#0db4bc' },
                            '&.Mui-focused fieldset': { borderColor: '#0db4bc' },
                          },
                        }}
                      />
                      <Button
                        onClick={addSkill}
                        component={motion.button}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        variant="contained"
                        sx={{
                          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                          color: 'white',
                          px: 3,
                          borderRadius: '14px',
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
                            boxShadow: '0 6px 16px rgba(13, 180, 188, 0.4)',
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
                          component={motion.div}
                          whileHover={{ scale: 1.05, y: -2 }}
                          sx={{
                            background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.15) 0%, rgba(13, 180, 188, 0.25) 100%)',
                            color: '#0db4bc',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1.5px solid rgba(13, 180, 188, 0.3)',
                            '& .MuiChip-deleteIcon': {
                              color: '#0db4bc',
                              '&:hover': { color: '#0a8b91' },
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
            <Box 
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}
            >
              <Button
                onClick={() => navigate(-1)}
                component={motion.button}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                sx={{
                  color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'white',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '2px solid rgba(255, 255, 255, 0.1)'
                    : '2px solid #e5e7eb',
                  px: 4,
                  py: 1.5,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.2)'
                      : '#d1d5db',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : '#f9fafb',
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                component={motion.button}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: 'white',
                  px: 5,
                  py: 1.5,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1rem',
                  boxShadow: '0 8px 24px rgba(13, 180, 188, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
                    boxShadow: '0 12px 32px rgba(13, 180, 188, 0.5)',
                  },
                  '&:disabled': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.12)',
                    color: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.3)'
                      : 'rgba(0, 0, 0, 0.26)',
                  },
                  transition: 'all 0.3s ease',
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

