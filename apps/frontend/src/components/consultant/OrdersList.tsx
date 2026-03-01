import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Avatar, Chip, LinearProgress, CircularProgress, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaCheckCircle } from 'react-icons/fa';

interface OrdersListProps {
  orders: any[];
  ordersLoading: boolean;
  ordersError: string;
  onRequestCompletion: (order: any) => void;
}

const OrdersList = ({ orders, ordersLoading, ordersError, onRequestCompletion }: OrdersListProps) => {
  const navigate = useNavigate();

  if (ordersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#0db4bc' }} />
      </Box>
    );
  }

  if (ordersError) {
    return (
      <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>
        {ordersError}
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <Box
        sx={{
          p: 6,
          textAlign: 'center',
          borderRadius: '16px',
          border: '2px dashed rgba(13, 180, 188, 0.2)',
          background: 'linear-gradient(135deg, rgba(13, 180, 188, 0.03) 0%, rgba(13, 180, 188, 0.01) 100%)',
        }}
      >
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', mb: 1 }}>
          No active orders yet
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: '#6b7280' }}>
          Once a buyer accepts your proposal, your orders will appear here
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <AnimatePresence>
        {orders.map((order, index) => (
          <Box
            key={order._id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="glass-card"
            sx={{
              p: 3,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 12px 40px rgba(13, 180, 188, 0.25)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                  {order.jobId?.title || 'Untitled Job'}
                </Typography>
                <Chip
                  label={`ID: ${order._id.slice(-8).toUpperCase()}`}
                  size="small"
                  sx={{
                    background: 'rgba(13, 180, 188, 0.1)',
                    color: '#0db4bc',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              <Chip
                label={
                  order.status === 'in_progress'
                    ? 'In Progress'
                    : order.status === 'completed'
                      ? 'Completed'
                      : order.status === 'cancelled'
                        ? 'Cancelled'
                        : order.status
                }
                sx={{
                  background:
                    order.status === 'completed'
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : order.status === 'in_progress'
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                src={order.buyerId?.profileImage || 'https://i.pravatar.cc/150?img=5'}
                alt={order.buyerId?.name || 'Buyer'}
                sx={{
                  width: 56,
                  height: 56,
                  border: '2px solid #0db4bc',
                  boxShadow: '0 4px 12px rgba(13, 180, 188, 0.3)',
                }}
              />
              <Box>
                <Typography sx={{ fontWeight: 600, color: '#1f2937', fontSize: '0.875rem' }}>
                  {order.buyerId?.name || 'Unknown Buyer'}
                </Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {order.buyerId?.email || ''}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 3 }}>
              <Box
                className="glass-card"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  background: 'rgba(13, 180, 188, 0.05)',
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mb: 0.5 }}>
                  Total Amount
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937' }}>
                  Rs {order.totalAmount?.toLocaleString()}
                </Typography>
              </Box>
              <Box
                className="glass-card"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  background: 'rgba(34, 197, 94, 0.05)',
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mb: 0.5 }}>
                  Received
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e' }}>
                  Rs {order.amountPaid?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box
                className="glass-card"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  background: 'rgba(245, 158, 11, 0.05)',
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mb: 0.5 }}>
                  Pending
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
                  Rs {order.amountPending?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box
                className="glass-card"
                sx={{
                  p: 2,
                  textAlign: 'center',
                  background: 'rgba(13, 180, 188, 0.05)',
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: '#6b7280', mb: 0.5 }}>
                  Progress
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0db4bc' }}>
                  {order.progress || 0}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280' }}>
                  Order Progress
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#0db4bc' }}>
                  {order.progress || 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={order.progress || 0}
                sx={{
                  height: 8,
                  borderRadius: '8px',
                  backgroundColor: 'rgba(13, 180, 188, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #0db4bc 0%, #22c55e 100%)',
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 1.5,
                }}
              >
                Milestones ({order.milestones?.length || 0})
              </Typography>
              {order.milestones && order.milestones.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {order.milestones.map((milestone: any) => (
                    <Box
                      key={milestone._id}
                      className="glass-card"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        background: 'rgba(13, 180, 188, 0.03)',
                      }}
                    >
                      <Typography sx={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>
                        {milestone.description}
                      </Typography>
                      <Chip
                        label={milestone.status}
                        size="small"
                        sx={{
                          background:
                            milestone.status === 'completed'
                              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                              : milestone.status === 'paid'
                                ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          color: '#22c55e',
                          minWidth: '80px',
                          textAlign: 'right',
                        }}
                      >
                        Rs {milestone.amount?.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
                  No milestones defined yet
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Button
                variant="outlined"
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                sx={{
                  borderColor: '#0db4bc',
                  color: '#0db4bc',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#0db4bc',
                    background: 'rgba(13, 180, 188, 0.1)',
                  },
                }}
              >
                View Details
              </Button>
              <Button
                variant="outlined"
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                startIcon={<FaEnvelope />}
                onClick={() => order.buyerId?._id && navigate(`/messages/${order.buyerId._id}`)}
                sx={{
                  borderColor: '#0db4bc',
                  color: '#0db4bc',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#0db4bc',
                    background: 'rgba(13, 180, 188, 0.1)',
                  },
                }}
              >
                Message Buyer
              </Button>
              {order.status === 'in_progress' && !order.completionRequestedAt && (
                <Button
                  variant="contained"
                  component={motion.button}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  startIcon={<FaCheckCircle />}
                  onClick={() => onRequestCompletion(order)}
                  sx={{
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                    },
                  }}
                >
                  Request Completion
                </Button>
              )}
              {order.completionRequestedAt && order.status === 'in_progress' && (
                <Alert
                  icon={<FaCheckCircle />}
                  severity="success"
                  sx={{
                    flex: '1 1 100%',
                    borderRadius: '8px',
                    '& .MuiAlert-message': { fontWeight: 600 },
                  }}
                >
                  Completion Requested - Waiting for buyer confirmation
                </Alert>
              )}
            </Box>
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default OrdersList;
