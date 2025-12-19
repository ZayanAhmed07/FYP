import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

interface CompletionModalProps {
  show: boolean;
  order: any;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CompletionModal = ({ show, order, loading, onConfirm, onCancel }: CompletionModalProps) => {
  return (
    <Dialog
      open={show}
      onClose={() => !loading && onCancel()}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.2 },
        sx: {
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 60px rgba(13, 180, 188, 0.3)',
        },
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
            }}
          >
            <FaCheckCircle size={24} color="#fff" />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#1f2937',
              flex: 1,
            }}
          >
            Request Order Completion
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Typography
          sx={{
            fontSize: '0.875rem',
            color: '#6b7280',
            mb: 3,
            lineHeight: 1.6,
          }}
        >
          Are you sure you want to request completion for this order?
        </Typography>

        <Box
          className="glass-card"
          sx={{
            p: 3,
            background: 'rgba(13, 180, 188, 0.05)',
            border: '1px solid rgba(13, 180, 188, 0.2)',
          }}
        >
          <Typography
            sx={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#1f2937',
              mb: 1,
            }}
          >
            {order?.jobId?.title}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: '#6b7280',
              lineHeight: 1.6,
            }}
          >
            The buyer will be notified to review and confirm the completion.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          disabled={loading}
          startIcon={<FaTimes />}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            borderColor: '#6b7280',
            color: '#6b7280',
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#6b7280',
              background: 'rgba(107, 114, 128, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          component={motion.button}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <FaCheckCircle />}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: '#fff',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
            },
            '&:disabled': {
              opacity: 0.6,
            },
          }}
        >
          {loading ? 'Requesting...' : 'Yes, Request Completion'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompletionModal;
