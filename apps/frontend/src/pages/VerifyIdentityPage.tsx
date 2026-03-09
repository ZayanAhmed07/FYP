import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { FaUser, FaBriefcase, FaDollarSign, FaClock, FaUpload, FaTimesCircle } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';

const VerifyIdentityPage = () => {
  // CNIC Upload State
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // CNIC Verification State
  const [verifyingFront, setVerifyingFront] = useState(false);
  const [verifyingBack, setVerifyingBack] = useState(false);
  const [frontVerification, setFrontVerification] = useState<any>(null);
  const [backVerification, setBackVerification] = useState<any>(null);
  
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

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Verify CNIC with Groq
  const verifyCNICImage = async (file: File, side: 'front' | 'back') => {
    try {
      const base64Image = await fileToBase64(file);
      
      const response = await httpClient.post('/consultants/verify-cnic', {
        image: base64Image
      });
      
      return response.data.data;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Verification failed');
    }
  };

  // Handle CNIC Front Upload
  const handleIdCardFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    setIdCardFront(file);
    setFrontVerification(null);
    setVerifyingFront(true);
    setError('');

    try {
      const result = await verifyCNICImage(file, 'front');
      setFrontVerification(result);
      
      if (result.verification_result === 'rejected') {
        setError('Please enter a valid CNIC');
      }
    } catch (err: any) {
      setError('Please enter a valid CNIC');
      setIdCardFront(null);
    } finally {
      setVerifyingFront(false);
    }
  };

  // Handle CNIC Back Upload
  const handleIdCardBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are allowed');
      return;
    }

    setIdCardBack(file);
    setBackVerification(null);
    setVerifyingBack(true);
    setError('');

    try {
      const result = await verifyCNICImage(file, 'back');
      setBackVerification(result);
      
      if (result.verification_result === 'rejected') {
        setError('Please enter a valid CNIC');
      }
    } catch (err: any) {
      setError('Please enter a valid CNIC');
      setIdCardBack(null);
    } finally {
      setVerifyingBack(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSupportingDocs([...supportingDocs, ...Array.from(files)]);
  };

  const handleRemoveSupportingDoc = (index: number) => {
    setSupportingDocs(supportingDocs.filter((_, i) => i !== index));
  };

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setError('Only JPG, JPEG, and PNG files are allowed for photos');
      return;
    }

    setPhoto(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
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
    
    // Validate CNIC uploads
    if (!idCardFront) {
      setError('Please upload the front side of your CNIC');
      return;
    }
    
    if (!idCardBack) {
      setError('Please upload the back side of your CNIC');
      return;
    }

    // Check CNIC verification results
    if (!frontVerification || frontVerification.verification_result !== 'approved') {
      setError('Please enter a valid CNIC');
      return;
    }

    if (!backVerification || backVerification.verification_result !== 'approved') {
      setError('Please enter a valid CNIC');
      return;
    }

    // Validate profile fields
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
    if (!photo) {
      setError('Please upload a profile photo');
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

      const [idCardFrontBase64, idCardBackBase64, photoBase64, ...supportingDocsBase64] = await Promise.all([
        toBase64(idCardFront),
        toBase64(idCardBack),
        toBase64(photo),
        ...supportingDocs.map(doc => toBase64(doc))
      ]);

      const payload = {
        title: profileData.title,
        bio: profileData.bio,
        hourlyRate: Number(profileData.hourlyRate),
        experience: profileData.experience,
        specialization: profileData.specialization,
        skills: profileData.skills,
        city: profileData.city,
        photo: photoBase64,
        idCardFront: idCardFrontBase64,
        idCardBack: idCardBackBase64,
        idCardFrontMimeType: idCardFront.type,
        idCardBackMimeType: idCardBack.type,
        idCardFrontFileName: idCardFront.name,
        idCardBackFileName: idCardBack.name,
        supportingDocuments: supportingDocsBase64,
      };
      
      await httpClient.post('/consultants/verify-profile', payload);
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
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
      }}
    >
      {/* Left Panel */}
      <Box
        sx={{
          width: '40%',
          minHeight: '100vh',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          pt: 20,
          px: 6,
          pb: 6,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              color: 'white',
              mb: 4,
              lineHeight: 1.2,
              fontSize: '56px',
              letterSpacing: '-1px',
            }}
          >
            Step Into<br />Expert Raah
          </Typography>
          <Typography
            sx={{
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.95)',
              lineHeight: 1.7,
              fontWeight: 400,
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
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'translateX(-4px)',
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
            borderRadius: 4,
            p: 6,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 2,
              fontSize: '32px',
              letterSpacing: '-0.5px',
            }}
          >
            Verify Your Identity
          </Typography>
          <Typography
            sx={{
              color: '#666',
              mb: 5,
              fontSize: '16px',
              lineHeight: 1.7,
            }}
          >
            Complete your consultant profile to help clients find the right expertise in Education, Business, or Legal services.
          </Typography>

          {/* CNIC Upload Section with AI Verification */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 3,
                fontSize: '20px',
              }}
            >
              Upload CNIC (National Identity Card)
            </Typography>

            {/* CNIC Front */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  color: '#333',
                  mb: 1.5,
                  fontSize: '15px',
                }}
              >
                Front Side *
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #0db4bc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: idCardFront ? 'rgba(13, 180, 188, 0.05)' : 'transparent',
                  '&:hover': {
                    borderColor: '#0a8b91',
                    background: 'rgba(13, 180, 188, 0.05)',
                  },
                }}
                onClick={() => document.getElementById('id-card-front')?.click()}
              >
                <input
                  type="file"
                  id="id-card-front"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleIdCardFrontUpload}
                  style={{ display: 'none' }}
                />
                {verifyingFront ? (
                  <Box>
                    <Typography sx={{ color: '#0db4bc', fontWeight: 500 }}>
                      🔍 Verifying...
                    </Typography>
                  </Box>
                ) : idCardFront ? (
                  <Box>
                    <Typography sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                      ✓ {idCardFront.name}
                    </Typography>
                    {frontVerification && (
                      <Box sx={{ mt: 2, textAlign: 'left' }}>
                        {frontVerification.verification_result === 'approved' ? (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: 'rgba(46, 125, 50, 0.1)',
                              border: '1px solid rgba(46, 125, 50, 0.3)',
                            }}
                          >
                            <Typography sx={{ color: '#2e7d32', fontWeight: 600, mb: 0.5 }}>
                              ✅ Verification passed
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: 'rgba(211, 47, 47, 0.1)',
                              border: '1px solid rgba(211, 47, 47, 0.3)',
                            }}
                          >
                            <Typography sx={{ color: '#d32f2f', fontWeight: 600, mb: 0.5 }}>
                              ❌ Please enter a valid CNIC
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <FaUpload style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                    <Typography sx={{ color: '#666', fontWeight: 500 }}>
                      Click to upload CNIC front side
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px', mt: 0.5 }}>
                      JPG, JPEG or PNG (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* CNIC Back */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  color: '#333',
                  mb: 1.5,
                  fontSize: '15px',
                }}
              >
                Back Side *
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #0db4bc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: idCardBack ? 'rgba(13, 180, 188, 0.05)' : 'transparent',
                  '&:hover': {
                    borderColor: '#0a8b91',
                    background: 'rgba(13, 180, 188, 0.05)',
                  },
                }}
                onClick={() => document.getElementById('id-card-back')?.click()}
              >
                <input
                  type="file"
                  id="id-card-back"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleIdCardBackUpload}
                  style={{ display: 'none' }}
                />
                {verifyingBack ? (
                  <Box>
                    <Typography sx={{ color: '#0db4bc', fontWeight: 500 }}>
                      🔍 Verifying...
                    </Typography>
                  </Box>
                ) : idCardBack ? (
                  <Box>
                    <Typography sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                      ✓ {idCardBack.name}
                    </Typography>
                    {backVerification && (
                      <Box sx={{ mt: 2, textAlign: 'left' }}>
                        {backVerification.verification_result === 'approved' ? (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: 'rgba(46, 125, 50, 0.1)',
                              border: '1px solid rgba(46, 125, 50, 0.3)',
                            }}
                          >
                            <Typography sx={{ color: '#2e7d32', fontWeight: 600, mb: 0.5 }}>
                              ✅ Verification passed
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: 'rgba(211, 47, 47, 0.1)',
                              border: '1px solid rgba(211, 47, 47, 0.3)',
                            }}
                          >
                            <Typography sx={{ color: '#d32f2f', fontWeight: 600, mb: 0.5 }}>
                              ❌ Please enter a valid CNIC
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <FaUpload style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                    <Typography sx={{ color: '#666', fontWeight: 500 }}>
                      Click to upload CNIC back side
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px', mt: 0.5 }}>
                      JPG, JPEG or PNG (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Instructions */}
          <Box
            sx={{
              background: 'rgba(13, 180, 188, 0.05)',
              border: '1px solid rgba(13, 180, 188, 0.2)',
              borderRadius: 3,
              p: 3.5,
              mb: 5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 2.5,
                fontSize: '18px',
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
                  color: '#555',
                  mb: 1.5,
                  lineHeight: 1.7,
                  fontSize: '15px',
                },
              }}
            >
              <li>Upload a clear image of your ID card's front side.</li>
              <li>Upload the back side of your ID card for complete verification.</li>
              <li>Ensure all details are visible and not blurred.</li>
              <li>Accepted formats: JPG, PNG, or PDF (max size: 5MB).</li>
            </Box>
          </Box>

          {/* Profile Photo Section */}
          <Box sx={{ mb: 5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 3,
              }}
            >
              <FaUser style={{ fontSize: 24, color: '#0db4bc' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '20px',
                }}
              >
                Profile Photo
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontWeight: 500,
                  color: '#333',
                  mb: 1.5,
                  fontSize: '15px',
                }}
              >
                Upload Your Photo *
              </Typography>
              <Box
                sx={{
                  border: '2px dashed #0db4bc',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  background: photo ? 'rgba(13, 180, 188, 0.05)' : 'transparent',
                  '&:hover': {
                    borderColor: '#0a8b91',
                    background: 'rgba(13, 180, 188, 0.05)',
                  },
                }}
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                {photoPreview ? (
                  <Box>
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Preview"
                      sx={{
                        width: '120px',
                        height: '120px',
                        borderRadius: 2,
                        objectFit: 'cover',
                        mb: 2,
                        mx: 'auto',
                        border: '2px solid #0db4bc',
                      }}
                    />
                    <Typography sx={{ color: '#333', fontWeight: 500, mb: 1 }}>
                      ✓ {photo.name}
                    </Typography>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      sx={{
                        color: '#ef4444',
                        textTransform: 'none',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Remove & Upload Again
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <FaUpload style={{ fontSize: '32px', color: '#0db4bc', marginBottom: '12px' }} />
                    <Typography sx={{ color: '#666', fontWeight: 500 }}>
                      Click to upload your professional photo
                    </Typography>
                    <Typography sx={{ color: '#999', fontSize: '13px', mt: 0.5 }}>
                      JPG, JPEG or PNG (Max 5MB)
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Profile Information Section */}
          <Box sx={{ mb: 5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 4,
              }}
            >
              <FaUser style={{ fontSize: 24, color: '#0db4bc' }} />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '20px',
                }}
              >
                Professional Profile
              </Typography>
            </Box>

            {/* Title */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '15px',
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
                    transition: 'all 0.2s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>

            {/* Bio */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '15px',
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
                    transition: 'all 0.2s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>

            {/* Specialization */}
            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FaBriefcase style={{ fontSize: 18, color: '#0db4bc' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '15px',
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
                      transition: 'all 0.2s ease',
                      '&:hover fieldset': {
                        borderColor: '#0db4bc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0db4bc',
                        borderWidth: '2px',
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
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                      transform: 'translateY(-2px)',
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {profileData.specialization.map((spec, index) => (
                  <Chip
                    key={index}
                    label={spec}
                    onDelete={() => handleRemoveSpecialization(spec)}
                    deleteIcon={<FaTimesCircle />}
                    sx={{
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      py: 2.5,
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(13, 180, 188, 0.3)',
                      },
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        transition: 'color 0.2s ease',
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
            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FaDollarSign style={{ fontSize: 18, color: '#0db4bc' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '15px',
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
                    transition: 'all 0.2s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>

            {/* Experience */}
            <Box sx={{ mb: 3.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <FaClock style={{ fontSize: 18, color: '#0db4bc' }} />
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '15px',
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
                    transition: 'all 0.2s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      borderWidth: '2px',
                    },
                  },
                }}
              />
            </Box>

            {/* City */}
            <Box sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '15px',
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
                    transition: 'all 0.2s ease',
                    '&:hover fieldset': {
                      borderColor: '#0db4bc',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0db4bc',
                      borderWidth: '2px',
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
            <Box sx={{ mb: 3.5 }}>
              <Typography
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  fontSize: '15px',
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
                      transition: 'all 0.2s ease',
                      '&:hover fieldset': {
                        borderColor: '#0db4bc',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#0db4bc',
                        borderWidth: '2px',
                      },
                    },
                  }}
                />
                <Button
                  onClick={handleAddSkill}
                  sx={{
                    px: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: 'white',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {profileData.skills.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => handleRemoveSkill(skill)}
                    deleteIcon={<FaTimesCircle />}
                    sx={{
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '14px',
                      py: 2.5,
                      px: 0.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(13, 180, 188, 0.3)',
                      },
                      '& .MuiChip-deleteIcon': {
                        color: 'rgba(255, 255, 255, 0.8)',
                        transition: 'color 0.2s ease',
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
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 1.5,
                fontSize: '20px',
              }}
            >
              Additional Supporting Documents
            </Typography>
            <Typography
              sx={{
                color: '#666',
                mb: 3,
                fontSize: '15px',
                lineHeight: 1.6,
              }}
            >
              Upload certificates, licenses, or other credentials (optional)
            </Typography>

            <input
              type="file"
              id="supportingDocs"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              multiple
              onChange={handleFileUpload}
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
                  border: '2px solid #0db4bc',
                  color: '#0db4bc',
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'rgba(13, 180, 188, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(13, 180, 188, 0.2)',
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
                      p: 2.5,
                      mb: 1.5,
                      background: 'rgba(13, 180, 188, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(13, 180, 188, 0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(13, 180, 188, 0.08)',
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Typography sx={{ color: '#1a1a1a', fontWeight: 500, fontSize: '15px' }}>{doc.name}</Typography>
                    <Button
                      onClick={() => handleRemoveSupportingDoc(index)}
                      sx={{
                        minWidth: 'auto',
                        p: 1,
                        color: '#ef4444',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(239, 68, 68, 0.1)',
                          transform: 'scale(1.1)',
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
                p: 3,
                mb: 4,
                borderRadius: 3,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Typography sx={{ color: '#ef4444', fontSize: '15px', lineHeight: 1.6 }}>{error}</Typography>
            </Box>
          )}

          {/* Verify Button */}
          <Button
            fullWidth
            onClick={handleVerify}
            disabled={loading}
            sx={{
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              color: 'white',
              textTransform: 'none',
              fontSize: '18px',
              fontWeight: 600,
              boxShadow: '0 4px 15px rgba(13, 180, 188, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                boxShadow: '0 6px 20px rgba(13, 180, 188, 0.6)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0px)',
              },
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

