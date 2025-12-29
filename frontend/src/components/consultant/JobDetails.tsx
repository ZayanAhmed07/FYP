import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, Divider, IconButton, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaClock, FaDownload, FaEnvelope, FaTimes, FaPaperPlane, FaUser, FaFileAlt, FaDollarSign, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
import { MdWorkOutline } from 'react-icons/md';

interface JobFromApi {
  _id: string;
  category: string;
  title: string;
  description: string;
  budget: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  skills: string[];
  attachments?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposalsCount: number;
  createdAt: string;
  buyerId?: {
    _id: string;
    name: string;
    email?: string;
    profileImage?: string;
  };
}

interface JobDetailsProps {
  selectedJob: JobFromApi | null;
  onClearSelection: () => void;
  onMessageBuyer: (buyerId: any) => void;
}

const JobDetails = ({ selectedJob, onClearSelection, onMessageBuyer }: JobDetailsProps) => {
  const navigate = useNavigate();

  const formatBudget = (budget: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    return `Rs ${budget.min?.toLocaleString()} - Rs ${budget.max?.toLocaleString()}`;
  };

  const getFilenameFromBase64 = (base64: string): string => {
    if (!base64) return 'attachment';
    const match = base64.match(/data:[^;]+;name=([^;,]+)/);
    return match ? match[1] : 'attachment';
  };

  const downloadFile = (base64Data: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download the file. Please try again.');
    }
  };

  if (!selectedJob) {
    return (
      <Box
        component={motion.aside}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="glass-card"
        sx={{
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.03) 0%, rgba(13, 180, 188, 0.08) 100%)',
          border: '2px dashed rgba(13, 180, 188, 0.2)',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.1) 0%, rgba(13, 180, 188, 0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <MdWorkOutline size={40} color="#0db4bc" />
        </Box>
        <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937', fontSize: '1rem', fontWeight: 600, mb: 1 }}>
          No Project Selected
        </Typography>
        <Typography sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem', maxWidth: '250px' }}>
          Select a project from the list to view full details and submit a proposal
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component={motion.aside}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass-card"
      sx={{
        position: 'sticky',
        top: 80,
        height: 'fit-content',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        p: 0,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(13, 180, 188, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          borderRadius: '3px',
        },
      }}
    >
      {/* Header Section with Gradient Background */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
          borderRadius: '24px 24px 0 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative', zIndex: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#fff',
                mb: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              {selectedJob.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={selectedJob.category}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
              <Chip
                icon={<FaFileAlt style={{ color: '#fff', fontSize: '12px' }} />}
                label={`${selectedJob.proposalsCount || 0} Proposals`}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={selectedJob.status === 'open' ? <FaCheckCircle style={{ color: '#fff', fontSize: '12px' }} /> : undefined}
              label={selectedJob.status === 'open' ? 'Open' : 'Closed'}
              size="small"
              sx={{
                background:
                  selectedJob.status === 'open'
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            />
            <IconButton
              size="small"
              onClick={onClearSelection}
              sx={{
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': { 
                  background: 'rgba(239, 68, 68, 0.9)',
                  transform: 'rotate(90deg)',
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <FaTimes />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Budget Section with Icon */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.25) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaDollarSign size={16} color="#22c55e" />
            </Box>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Budget
            </Typography>
          </Box>
          <Box
            component={motion.div}
            whileHover={{ scale: 1.02 }}
            sx={{
              p: 3,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.15) 100%)',
              border: '2px solid rgba(34, 197, 94, 0.25)',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)',
            }}
          >
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.5px' }}>
              {formatBudget(selectedJob.budget)}
            </Typography>
          </Box>
        </Box>

        {/* Location & Timeline Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box
            component={motion.div}
            whileHover={{ y: -2 }}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.05) 0%, rgba(13, 180, 188, 0.12) 100%)',
              border: '1px solid rgba(13, 180, 188, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FaMapMarkerAlt size={14} color="#0db4bc" />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Location
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937', fontWeight: 600 }}>
              {selectedJob.location}
            </Typography>
          </Box>
          <Box
            component={motion.div}
            whileHover={{ y: -2 }}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.12) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <FaCalendarAlt size={14} color="#f59e0b" />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Timeline
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937', fontWeight: 600 }}>
              {selectedJob.timeline || 'Not specified'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(13, 180, 188, 0.15)' }} />
        <Divider sx={{ my: 3, borderColor: 'rgba(13, 180, 188, 0.15)' }} />

        {/* Description Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#0db4bc',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              mb: 2,
            }}
          >
            📋 Project Description
          </Typography>
          <Box
            sx={{
              p: 3,
              borderRadius: '12px',
              background: (theme) => theme.palette.mode === 'dark'
                ? 'rgba(30, 41, 59, 0.6)'
                : 'linear-gradient(135deg, rgba(249, 250, 251, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%)',
              border: (theme) => theme.palette.mode === 'dark'
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(209, 213, 219, 0.3)',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: (theme) => theme.palette.mode === 'dark' ? '#d1d5db' : '#374151',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedJob.description}
            </Typography>
          </Box>
        </Box>

        {/* Required Skills */}
        {selectedJob.skills && selectedJob.skills.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0db4bc',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                mb: 2,
              }}
            >
              🎯 Required Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {selectedJob.skills.map((skill: string, index: number) => (
                <Chip
                  key={skill}
                  label={skill.trim()}
                  size="medium"
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.08, y: -2 }}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.12) 0%, rgba(13, 180, 188, 0.2) 100%)',
                    color: '#0a8b91',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    border: '1.5px solid rgba(13, 180, 188, 0.3)',
                    px: 1.5,
                    py: 2.5,
                    boxShadow: '0 2px 6px rgba(13, 180, 188, 0.15)',
                    '&:hover': {
                      borderColor: '#0db4bc',
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.25)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Client Info */}
        {selectedJob.buyerId && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0db4bc',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                mb: 2,
              }}
            >
              👤 Client Information
            </Typography>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2.5,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.12) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Avatar
                src={selectedJob.buyerId.profileImage}
                sx={{
                  width: 48,
                  height: 48,
                  border: '3px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                }}
              >
                <FaUser size={20} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937', mb: 0.25 }}>
                  {selectedJob.buyerId.name}
                </Typography>
                {selectedJob.buyerId.email && (
                  <Typography sx={{ fontSize: '0.75rem', color: (theme) => theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' }}>
                    {selectedJob.buyerId.email}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Attachments */}
        {selectedJob.attachments && selectedJob.attachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#0db4bc',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                mb: 2,
              }}
            >
              📎 Attachments ({selectedJob.attachments.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedJob.attachments.map((attachment: string, index: number) => (
                <Box
                  key={index}
                  component={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.05) 0%, rgba(13, 180, 188, 0.1) 100%)',
                    border: '1px solid rgba(13, 180, 188, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.1) 0%, rgba(13, 180, 188, 0.15) 100%)',
                      borderColor: 'rgba(13, 180, 188, 0.3)',
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FaFileAlt size={16} color="#fff" />
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: (theme) => theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937', fontWeight: 600 }}>
                      {getFilenameFromBase64(attachment)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(attachment, getFilenameFromBase64(attachment));
                    }}
                    sx={{
                      color: '#0db4bc',
                      background: 'rgba(13, 180, 188, 0.1)',
                      '&:hover': { 
                        background: 'rgba(13, 180, 188, 0.2)',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <FaDownload size={14} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3, borderColor: 'rgba(13, 180, 188, 0.15)' }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            startIcon={<FaPaperPlane />}
            onClick={() => selectedJob && navigate(`/submit-proposal/${selectedJob._id}`)}
            disabled={selectedJob.status !== 'open'}
            sx={{
              py: 2,
              borderRadius: '14px',
              background:
                selectedJob.status === 'open'
                  ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                  : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow:
                selectedJob.status === 'open'
                  ? '0 6px 20px rgba(13, 180, 188, 0.4)'
                  : 'none',
              '&:hover': {
                background:
                  selectedJob.status === 'open'
                    ? 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)'
                    : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                boxShadow:
                  selectedJob.status === 'open'
                    ? '0 8px 28px rgba(13, 180, 188, 0.5)'
                    : 'none',
              },
              '&:disabled': {
                opacity: 0.7,
                color: '#fff',
              },
            }}
          >
            {selectedJob.status === 'open' ? 'Submit Proposal' : 'Project Closed'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            component={motion.button}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            startIcon={<FaEnvelope />}
            onClick={() => onMessageBuyer(selectedJob.buyerId)}
            disabled={!selectedJob.buyerId?._id}
            sx={{
              py: 2,
              borderRadius: '14px',
              borderWidth: '2px',
              borderColor: '#0db4bc',
              color: '#0db4bc',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                borderWidth: '2px',
                borderColor: '#0db4bc',
                background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.1) 0%, rgba(13, 180, 188, 0.15) 100%)',
                boxShadow: '0 4px 16px rgba(13, 180, 188, 0.2)',
              },
              '&:disabled': {
                borderColor: '#d1d5db',
                color: '#9ca3af',
              },
            }}
          >
            Message Client
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default JobDetails;
