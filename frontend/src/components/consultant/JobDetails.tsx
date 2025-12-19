import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Chip, Divider, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaClock, FaDownload, FaEnvelope, FaTimes, FaPaperPlane } from 'react-icons/fa';

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
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Select a project to view full details here
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
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#1f2937',
              mb: 1,
            }}
          >
            {selectedJob.title}
          </Typography>
          <Chip
            label={selectedJob.category}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={selectedJob.status === 'open' ? 'Open' : 'Closed'}
            size="small"
            sx={{
              background:
                selectedJob.status === 'open'
                  ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: '#fff',
              fontWeight: 600,
            }}
          />
          <IconButton
            size="small"
            onClick={onClearSelection}
            sx={{
              color: '#6b7280',
              '&:hover': { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' },
            }}
          >
            <FaTimes />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ mb: 3, borderColor: 'rgba(13, 180, 188, 0.1)' }} />

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mb: 1,
          }}
        >
          Budget
        </Typography>
        <Box
          sx={{
            p: 2,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <Typography sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#22c55e' }}>
            {formatBudget(selectedJob.budget)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1,
            }}
          >
            <FaMapMarkerAlt size={12} /> Location
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#374151' }}>
            {selectedJob.location}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1,
            }}
          >
            <FaClock size={12} /> Timeline
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#374151' }}>
            {selectedJob.timeline || 'Not specified'}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            mb: 1,
          }}
        >
          Description
        </Typography>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: '#374151',
            lineHeight: 1.7,
          }}
        >
          {selectedJob.description}
        </Typography>
      </Box>

      {selectedJob.skills && selectedJob.skills.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1,
            }}
          >
            Required Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedJob.skills.map((skill: string) => (
              <Chip
                key={skill}
                label={skill.trim()}
                size="small"
                component={motion.div}
                whileHover={{ scale: 1.05 }}
                sx={{
                  background: 'rgba(13, 180, 188, 0.1)',
                  color: '#0db4bc',
                  fontWeight: 600,
                  border: '1px solid rgba(13, 180, 188, 0.2)',
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {selectedJob.attachments && selectedJob.attachments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              mb: 1,
            }}
          >
            Attachments
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {selectedJob.attachments.map((attachment: string, index: number) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: '8px',
                  background: 'rgba(13, 180, 188, 0.05)',
                  border: '1px solid rgba(13, 180, 188, 0.1)',
                  '&:hover': {
                    background: 'rgba(13, 180, 188, 0.1)',
                    borderColor: 'rgba(13, 180, 188, 0.2)',
                  },
                }}
              >
                <Typography sx={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                  {getFilenameFromBase64(attachment)}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => downloadFile(attachment, getFilenameFromBase64(attachment))}
                  sx={{
                    color: '#0db4bc',
                    '&:hover': { background: 'rgba(13, 180, 188, 0.1)' },
                  }}
                >
                  <FaDownload size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 3, borderColor: 'rgba(13, 180, 188, 0.1)' }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          startIcon={<FaPaperPlane />}
          onClick={() => selectedJob && navigate(`/submit-proposal/${selectedJob._id}`)}
          disabled={selectedJob.status !== 'open'}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            background:
              selectedJob.status === 'open'
                ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow:
              selectedJob.status === 'open'
                ? '0 4px 16px rgba(13, 180, 188, 0.3)'
                : '0 4px 16px rgba(107, 114, 128, 0.3)',
            '&:hover': {
              background:
                selectedJob.status === 'open'
                  ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                  : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              boxShadow:
                selectedJob.status === 'open'
                  ? '0 6px 20px rgba(13, 180, 188, 0.4)'
                  : '0 6px 20px rgba(107, 114, 128, 0.4)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          {selectedJob.status === 'open' ? 'Submit Proposal' : 'Project Closed'}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          startIcon={<FaEnvelope />}
          onClick={() => onMessageBuyer(selectedJob.buyerId)}
          disabled={!selectedJob.buyerId?._id}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            borderColor: '#0db4bc',
            color: '#0db4bc',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#0db4bc',
              background: 'rgba(13, 180, 188, 0.1)',
            },
          }}
        >
          Message Buyer
        </Button>
      </Box>
    </Box>
  );
};

export default JobDetails;
