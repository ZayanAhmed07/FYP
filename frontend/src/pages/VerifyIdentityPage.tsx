import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { FaIdCard, FaUser, FaBriefcase, FaDollarSign, FaClock, FaUpload, FaTimesCircle } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';

const VerifyIdentityPage = () => {
  const [frontIdImage, setFrontIdImage] = useState<File | null>(null);
  const [backIdImage, setBackIdImage] = useState<File | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Profile fields
  const [profileData, setProfileData] = useState({
    title: '',
    bio: '',
    specialization: [] as string[],
    hourlyRate: '',
    experience: '',
    skills: [] as string[],
    city: '',
  });
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [newSkill, setNewSkill] = useState('');
  
  const specializationOptions = [
    'LEGAL',
    'EDUCATION',
    'BUSINESS',
  ];
  
  const navigate = useNavigate();

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back' | 'supporting'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (side === 'front') {
      setFrontIdImage(files[0]);
    } else if (side === 'back') {
      setBackIdImage(files[0]);
    } else if (side === 'supporting') {
      setSupportingDocs([...supportingDocs, ...Array.from(files)]);
    }
  };

  const handleRemoveSupportingDoc = (index: number) => {
    setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
  };

  const handleAddSpecialization = () => {
    if (selectedSpecialization && !profileData.specialization.includes(selectedSpecialization)) {
      setProfileData({
        ...profileData,
        specialization: [...profileData.specialization, selectedSpecialization],
      });
      setSelectedSpecialization('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setProfileData({
      ...profileData,
      specialization: profileData.specialization.filter(s => s !== spec),
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(s => s !== skill),
    });
  };

  const handleVerify = async () => {
    setError('');
    
    // Validation
    if (!frontIdImage || !backIdImage) {
      setError('Please upload both sides of your CNIC');
      return;
    }
    
    if (!profileData.title || !profileData.bio || !profileData.hourlyRate || !profileData.experience || !profileData.city) {
      setError('Please fill all required profile fields including city');
      return;
    }
    
    if (profileData.specialization.length === 0) {
      setError('Please add at least one specialization');
      return;
    }
    
    if (profileData.skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    setLoading(true);
    
    try {
      // Convert files to base64
      const toBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      };

      const frontIdBase64 = await toBase64(frontIdImage);
      const backIdBase64 = await toBase64(backIdImage);
      const supportingDocsBase64 = await Promise.all(
        supportingDocs.map(doc => toBase64(doc))
      );

      const payload = {
        title: profileData.title,
        bio: profileData.bio,
        hourlyRate: Number(profileData.hourlyRate),
        experience: profileData.experience,
        specialization: profileData.specialization,
        skills: profileData.skills,
        city: profileData.city,
        idCardFront: frontIdBase64,
        idCardBack: backIdBase64,
        supportingDocuments: supportingDocsBase64,
      };

      await httpClient.post('/consultants/verify-profile', payload);

      // Navigate to pending approval page
      navigate('/verification-pending');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit profile for verification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          width: '40%',
          minHeight: '100vh',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Step Into<br />Expert Raah
          </Typography>
          <Typography
            sx={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
            }}
          >
            Join our platform to connect with clients seeking expert guidance in Education, Business, and Legal consultancy.
          </Typography>
        </Box>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          sx={{
            position: 'absolute',
            top: 32,
            left: 32,
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
            },
          }}
        >
          Back
        </Button>
      </Box>

      {/* Right Panel */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 4,
        }}
      >
        <Box
          sx={{
            maxWidth: '700px',
            mx: 'auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            p: 5,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 1,
            }}
          >
            Verify Your Identity
          </Typography>
          <Typography
            sx={{
              color: '#666',
              mb: 4,
              fontSize: '16px',
            }}
          >
            Complete your consultant profile to help clients find the right expertise in Education, Business, or Legal services.
          </Typography>

          {/* Upload Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
              mb: 4,
            }}
          >
            {/* Front Side Upload */}
            <Box>
              <input
                type="file"
                id="frontId"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e, 'front')}
                style={{ display: 'none' }}
              />
              <label htmlFor="frontId">
                <Box
                  sx={{
                    border: '2px dashed #667eea',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderColor: '#764ba2',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <FaIdCard style={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: '#667eea',
                      mb: 0.5,
                    }}
                  >
                    {frontIdImage ? frontIdImage.name : 'Upload'}
                  </Typography>
                </Box>
              </label>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  mt: 1,
                }}
              >
                Front Side of your Identity Card
              </Typography>
            </Box>

            {/* Back Side Upload */}
            <Box>
              <input
                type="file"
                id="backId"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={(e) => handleFileUpload(e, 'back')}
                style={{ display: 'none' }}
              />
              <label htmlFor="backId">
                <Box
                  sx={{
                    border: '2px dashed #667eea',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderColor: '#764ba2',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <FaIdCard style={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: '#667eea',
                      mb: 0.5,
                    }}
                  >
                    {backIdImage ? backIdImage.name : 'Upload'}
                  </Typography>
                </Box>
              </label>
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  mt: 1,
                }}
              >
                Back Side of your Identity Card
              </Typography>
            </Box>
          </Box>

          {/* Instructions */}
          <Box
            sx={{
              background: 'rgba(102, 126, 234, 0.05)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              borderRadius: 2,
              p: 3,
              mb: 4,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 2,
              }}
            >
              Instructions
            </Typography>
            <Box
              component="ul"
              sx={{
                pl: 2,
                m: 0,
                '& li': {
                  color: '#666',
                  mb: 1,
                  lineHeight: 1.6,
                },
              }}
            >
              <li>Upload a clear image of your ID card's front side.</li>
              <li>Upload the back side of your ID card for complete verification.</li>
              <li>Ensure all details are visible and not blurred.</li>
              <li>Accepted formats: JPG, PNG, or PDF (max size: 5MB).</li>
            </Box>
          </Box>

          {/* Profile Information Section */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <FaUser style={{ fontSize: 24, color: '#667eea' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Professional Profile
              </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Professional Title *
              </Typography>
              <TextField
                fullWidth
                value={profileData.title}
                onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                placeholder="e.g., Corporate Law Specialist, MBA Career Advisor, Business Strategy Consultant"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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

            {/* Bio */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Bio *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Describe your expertise in Education, Business, or Legal consultancy, your qualifications, and how you help clients achieve their goals..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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

            {/* Specialization */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FaBriefcase style={{ fontSize: 18, color: '#667eea' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  Specialization *
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  select
                  fullWidth
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  SelectProps={{ native: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                >
                  <option value="">Select a specialization</option>
                  {specializationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextField>
                <Button
                  onClick={handleAddSpecialization}
                  disabled={!selectedSpecialization}
                  sx={{
                    px: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    },
                    '&:disabled': {
                      background: '#ccc',
                      color: '#666',
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.specialization.map((spec, index) => (
                  <Chip
                    key={index}
                    label={spec}
                    onDelete={() => handleRemoveSpecialization(spec)}
                    deleteIcon={<FaTimesCircle />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          color: 'white',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Hourly Rate */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FaDollarSign style={{ fontSize: 18, color: '#667eea' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  Hourly Rate (PKR) *
                </Typography>
              </Box>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                value={profileData.hourlyRate}
                onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
                placeholder="e.g., 2000"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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

            {/* Experience */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FaClock style={{ fontSize: 18, color: '#667eea' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                  }}
                >
                  Years of Experience *
                </Typography>
              </Box>
              <TextField
                fullWidth
                value={profileData.experience}
                onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                placeholder="e.g., 5+ years"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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

            {/* City */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                City *
              </Typography>
              <TextField
                select
                fullWidth
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              >
                <option value="">Select your city</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
              </TextField>
            </Box>

            {/* Skills */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: '#1a1a1a',
                }}
              >
                Skills *
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="e.g., Contract Drafting, Educational Planning, Financial Analysis"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: '#667eea',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#667eea',
                      },
                    },
                  }}
                />
                <Button
                  onClick={handleAddSkill}
                  sx={{
                    px: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    deleteIcon={<FaTimesCircle />}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        '&:hover': {
                          color: 'white',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Supporting Documents Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1,
              }}
            >
              Additional Supporting Documents
            </Typography>
            <Typography
              sx={{
                color: '#666',
                mb: 3,
                fontSize: '14px',
              }}
            >
              Upload certificates, licenses, or other credentials (optional)
            </Typography>

            <input
              type="file"
              id="supportingDocs"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              multiple
              onChange={(e) => handleFileUpload(e, 'supporting')}
              style={{ display: 'none' }}
            />
            <label htmlFor="supportingDocs">
              <Button
                component="span"
                startIcon={<FaUpload />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  border: '2px solid #667eea',
                  color: '#667eea',
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                Add Documents
              </Button>
            </label>

            {/* Display uploaded supporting documents */}
            {supportingDocs.length > 0 && (
              <Box sx={{ mt: 3 }}>
                {supportingDocs.map((doc, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      background: 'rgba(102, 126, 234, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                    }}
                  >
                    <Typography sx={{ color: '#1a1a1a' }}>{doc.name}</Typography>
                    <Button
                      onClick={() => handleRemoveSupportingDoc(index)}
                      sx={{
                        minWidth: 'auto',
                        p: 0.5,
                        color: '#ef4444',
                        '&:hover': {
                          background: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      <FaTimesCircle />
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Error Message */}
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

          {/* Verify Button */}
          <Button
            fullWidth
            onClick={handleVerify}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              textTransform: 'none',
              fontSize: '18px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default VerifyIdentityPage;

