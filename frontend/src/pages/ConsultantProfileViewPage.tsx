import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaStar, 
  FaUserCircle, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaBriefcase, 
  FaDollarSign, 
  FaCheckCircle 
} from 'react-icons/fa';
import { Box, Container, Typography, Avatar, Chip, CircularProgress, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { httpClient } from '../api/httpClient';
import { analyticsService } from '../services/analytics.service';

interface ConsultantProfile {
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
  experience: string;
  skills: string[];
  rating: number;
  averageRating?: number;
  totalReviews: number;
  totalProjects?: number;
  completedProjects: number;
  city?: string;
  location?: string | { country?: string; city?: string };
}

const ConsultantProfileViewPage = () => {
  const { consultantId } = useParams<{ consultantId: string }>();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('🚀 ConsultantProfileViewPage mounting with consultantId:', consultantId);

  useEffect(() => {
    console.log('🔄 useEffect triggered with consultantId:', consultantId);
    if (consultantId) {
      fetchConsultantProfile();
    } else {
      console.warn('⚠️ No consultantId found in URL params');
      setError('No consultant ID provided');
      setLoading(false);
    }
  }, [consultantId]);

  const fetchConsultantProfile = async () => {
    try {
      console.log('🔍 Fetching consultant profile for ID:', consultantId);
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const response = await httpClient.get(`/consultants/${consultantId}`);
      console.log('✅ Consultant profile API response:', response.data);
      
      const consultantData = response.data.data;
      console.log('📊 Parsed consultant data:', consultantData);
      
      if (!consultantData) {
        console.error('❌ No consultant data in response');
        setError('Consultant profile not found');
        return;
      }
      
      setConsultant(consultantData);

      // Record profile view for analytics
      if (consultantId) {
        analyticsService.recordProfileView(consultantId);
      }
    } catch (err: any) {
      console.error('❌ Error fetching consultant profile:', err);
      console.error('❌ Error response:', err.response);
      setError(err.response?.data?.message || 'Failed to load consultant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageConsultant = () => {
    if (consultant?.userId._id) {
      navigate(`/messages/${consultant.userId._id}`);
    }
  };

  if (loading) {
    console.log('🔄 Rendering loading state');
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
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#fff', mb: 2 }} size={60} />
          <Typography sx={{ color: '#fff', fontSize: '1.125rem' }}>
            Loading consultant profile...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error || !consultant) {
    console.log('❌ Rendering error state:', error, 'consultant:', consultant);
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <Typography sx={{ color: '#ef4444', fontSize: '1.125rem', mb: 3, fontWeight: 600 }}>
            {error || 'Consultant not found'}
          </Typography>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
            sx={{
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              color: '#fff',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  // Validate consultant data structure
  if (!consultant.userId || !consultant.userId._id) {
    console.error('❌ Invalid consultant data structure - missing userId:', consultant);
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            textAlign: 'center',
            maxWidth: '500px',
          }}
        >
          <Typography sx={{ color: '#ef4444', fontSize: '1.125rem', mb: 3, fontWeight: 600 }}>
            Consultant profile data is incomplete
          </Typography>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
            sx={{
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              color: '#fff',
              px: 4,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
              },
            }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  const rating = consultant.averageRating || consultant.rating;

  console.log('✅ Rendering consultant profile for:', consultant.userId?.name);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => navigate(-1)}
            startIcon={<FaArrowLeft />}
            sx={{
              color: '#fff',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              px: 3,
              py: 1,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            Back
          </Button>
        </Box>

        {/* Profile Header Card */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            mb: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Avatar */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {consultant.userId.profileImage ? (
                <Avatar
                  src={consultant.userId.profileImage}
                  alt={consultant.userId.name}
                  sx={{
                    width: 160,
                    height: 160,
                    border: '4px solid #0db4bc',
                    boxShadow: '0 8px 24px rgba(13, 180, 188, 0.3)',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(13, 180, 188, 0.3)',
                  }}
                >
                  <FaUserCircle style={{ fontSize: '80px', color: '#fff' }} />
                </Box>
              )}
            </Box>

            {/* Header Info */}
            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 1,
                }}
              >
                {consultant.userId.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  color: '#0db4bc',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                {consultant.title}
              </Typography>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      style={{
                        color: i < Math.floor(rating) ? '#f59e0b' : '#e5e7eb',
                        fontSize: '20px',
                      }}
                    />
                  ))}
                </Box>
                <Typography sx={{ color: '#6b7280', fontSize: '1rem', fontWeight: 600 }}>
                  {rating.toFixed(1)} ({consultant.totalReviews} reviews)
                </Typography>
              </Box>

              {/* Location */}
              {(consultant.location || consultant.city) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <FaMapMarkerAlt style={{ color: '#ef4444', fontSize: '18px' }} />
                  <Typography sx={{ color: '#6b7280', fontSize: '1rem' }}>
                    {typeof consultant.location === 'object' && consultant.location
                      ? `${consultant.location.city || ''}${consultant.location.city && consultant.location.country ? ', ' : ''}${consultant.location.country || ''}`
                      : consultant.location || consultant.city}
                  </Typography>
                </Box>
              )}

              {/* Message Button */}
              <Button
                onClick={handleMessageConsultant}
                startIcon={<FaEnvelope />}
                sx={{
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: '#fff',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(13, 180, 188, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
                    boxShadow: '0 6px 20px rgba(13, 180, 188, 0.4)',
                  },
                }}
              >
                Message Consultant
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mb: 3,
          }}
        >
          {[
            {
              icon: <FaBriefcase style={{ fontSize: '28px' }} />,
              value: consultant.completedProjects || 0,
              label: 'Completed Projects',
              gradient: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            },
            {
              icon: <FaClock style={{ fontSize: '28px' }} />,
              value: consultant.experience,
              label: 'Experience',
              gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            },
            {
              icon: <FaDollarSign style={{ fontSize: '28px' }} />,
              value: `Rs ${consultant.hourlyRate?.toLocaleString() || 'N/A'}/hr`,
              label: 'Hourly Rate',
              gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            },
          ].map((stat, index) => (
            <Box
              key={index}
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(102, 126, 234, 0.25)' }}
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: stat.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: '1.75rem',
                    fontWeight: 700,
                    color: '#1f2937',
                    lineHeight: 1.2,
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 500 }}>
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* About Section */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            mb: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            About
          </Typography>
          <Typography
            sx={{
              color: '#4b5563',
              fontSize: '1rem',
              lineHeight: 1.7,
            }}
          >
            {consultant.bio || 'No bio available'}
          </Typography>
        </Box>

        {/* Specialization Section */}
        {consultant.specialization && consultant.specialization.length > 0 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              p: 4,
              mb: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1f2937',
                mb: 3,
              }}
            >
              Specialization
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {consultant.specialization.map((spec, index) => (
                <Chip
                  key={index}
                  icon={<FaCheckCircle style={{ color: '#22c55e' }} />}
                  label={spec}
                  sx={{
                    background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                    color: '#1f2937',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    px: 1,
                    py: 2.5,
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Skills Section */}
        {consultant.skills && consultant.skills.length > 0 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            sx={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '24px',
              p: 4,
              mb: 3,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography
              sx={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1f2937',
                mb: 3,
              }}
            >
              Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {consultant.skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  sx={{
                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    px: 1,
                    py: 2.5,
                    borderRadius: '12px',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Contact Section */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            p: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Typography
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1f2937',
              mb: 3,
            }}
          >
            Contact Information
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <FaEnvelope style={{ fontSize: '20px' }} />
            </Box>
            <Typography sx={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500 }}>
              {consultant.userId.email}
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ConsultantProfileViewPage;
