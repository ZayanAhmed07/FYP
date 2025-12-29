import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  FaPlus,
  FaStar,
  FaMapMarkerAlt,
  FaUserCircle,
  FaEnvelope,
  FaBriefcase,
  FaClock,
  FaDollarSign,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaAward,
  FaChevronDown,
  FaChevronUp,
  FaComments,
  FaSearch,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import { useThemeMode } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { orderService } from '../services/orderService';
import reviewService from '../services/reviewService';
import { analyticsService } from '../services/analytics.service';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Chip, 
  Button,
  IconButton,
  Avatar,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../context/NotificationContext';

// No mock data - fetching real data from backend

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
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
}

interface ProposalFromApi {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    budget: {
      min: number;
      max: number;
    };
    status: string;
  };
  consultantId: {
    _id: string;
    title: string;
    rating: number;
    averageRating?: number;
    totalReviews?: number;
    experience: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      profileImage?: string;
    };
  };
  bidAmount: number;
  deliveryTime: string;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const BuyerDashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification, showConfirm } = useNotification();
  const { mode, toggleTheme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<
    'browse' | 'myJobs' | 'proposals' | 'orders'
  >('browse');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [myJobs, setMyJobs] = useState<JobFromApi[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalFromApi[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsError, setProposalsError] = useState('');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantPage, setConsultantPage] = useState(1);
  const [consultantTotalPages, setConsultantTotalPages] = useState(1);
  const [consultantHasMore, setConsultantHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    city: '',
    specialization: '',
    search: '',
  });
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [showConfirmCompletionModal, setShowConfirmCompletionModal] = useState(false);
  const [selectedOrderForConfirmation, setSelectedOrderForConfirmation] = useState<any>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderData, setReviewOrderData] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    // Get current user from localStorage
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      // Only refresh user data if it's been more than 5 minutes since last update
      const lastUpdate = localStorage.getItem('expert_raah_user_last_update');
      const shouldRefresh = !lastUpdate || Date.now() - parseInt(lastUpdate) > 5 * 60 * 1000;
      
      if (shouldRefresh) {
        const refreshUser = async () => {
          try {
            const response = await httpClient.get('/users/me');
            if (response.data?.data) {
              const backendUser = response.data.data;
              const normalizedUser = {
                ...backendUser,
                // Ensure we always have an `id` field for client-side logic
                id: backendUser.id ?? backendUser._id,
                _id: backendUser._id ?? backendUser.id,
              };
              // Update localStorage with latest normalized data
              localStorage.setItem('expert_raah_user', JSON.stringify(normalizedUser));
              localStorage.setItem('expert_raah_user_last_update', Date.now().toString());
              setCurrentUser(normalizedUser);
            }
          } catch (err) {
            // Silently fail, use cached data
            console.log('Could not refresh user data');
          }
        };
        refreshUser();
      }
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  const fetchMyJobs = async () => {
    try {
      const user = authService.getCurrentUser();
      console.log('🔍 fetchMyJobs - Current user:', user);
      const userId = user?.id || (user as any)?._id;
      if (!userId) {
        console.log('❌ No user ID found');
        setJobsLoading(false);
        setMyJobs([]);
        return;
      }
      setJobsLoading(true);
      setJobsError('');
      console.log('📡 Fetching jobs for buyer:', userId);
      const response = await httpClient.get(`/jobs/buyer/${userId}`);
      console.log('📊 Jobs API response:', response.data);
      const jobsData = response.data?.data ?? [];
      console.log('✅ Jobs data parsed:', jobsData);
      setMyJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs', error);
      setJobsError('Failed to load your posted jobs. Please try again later.');
      setMyJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchUnreadMessageCount = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.id) return;

      const response = await httpClient.get('/messages/conversations');
      const conversations = response.data?.data || [];

      let totalUnread = 0;
      conversations.forEach((conv: any) => {
        const unread = conv.unreadCount?.[user.id] || 0;
        totalUnread += unread;
      });

      setUnreadMessageCount(totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread message count', error);
    }
  };

  // Socket connection for real-time notifications
  const { connect, disconnect } = useSocket({
    onNewMessageNotification: (data) => {
      const { senderName } = data;
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Message', {
          body: `You have a new message from ${senderName}`,
          icon: '/src/assets/logo.png',
        });
      }
      // Refresh unread count
      fetchUnreadMessageCount();
    },
    onMessageReceive: () => {
      // Increment unread count when new message arrives
      setUnreadMessageCount((prev) => prev + 1);
    },
    onUnreadCountUpdate: () => {
      // Update unread count in real-time
      fetchUnreadMessageCount();
    },
  });

  useEffect(() => {
    fetchMyJobs();
    fetchConsultants();
    fetchOrders();
    fetchUnreadMessageCount();

    // Connect to socket only once
    connect();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Poll for new messages every 30 seconds (increased from 10)
    const interval = setInterval(fetchUnreadMessageCount, 30000);
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);

  // Refetch consultants when filters change OR when switching to browse tab
  useEffect(() => {
    if (activeTab === 'browse') {
      setConsultantPage(1);
      fetchConsultants(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.city, filters.specialization, filters.search]);

  // Refetch consultants when switching to browse tab
  useEffect(() => {
    if (activeTab === 'browse') {
      setConsultantPage(1);
      fetchConsultants(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      // Clear the state to prevent re-setting on re-renders
      navigate(location.pathname, { replace: true, state: {} });
      // Refresh data when navigating to specific tab
      if (location.state.tab === 'orders') {
        fetchOrders();
      } else if (location.state.tab === 'myJobs') {
        fetchMyJobs();
      }
    }
  }, [location.state, navigate]);

  // Handle Stripe payment redirect
  useEffect(() => {
    const payment = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (payment === 'success' && sessionId) {
      // Switch to orders tab and show success message
      setActiveTab('orders');
      showNotification('Payment successful! Your order has been updated.', 'success');
      // Refresh orders to show updated payment
      fetchOrders();
      // Clear URL params
      setSearchParams({});
    } else if (payment === 'cancelled') {
      showNotification('Payment was cancelled.', 'info');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchConsultants = async (page = 1, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setConsultantsLoading(true);
      }
      
      // Build query params with filters
      const params = new URLSearchParams();
      params.append('isVerified', 'true');
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (filters.city) params.append('city', filters.city);
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.search) params.append('search', filters.search);
      
      const response = await httpClient.get(`/consultants?${params.toString()}`);
      const consultantsData = response.data?.data?.consultants || response.data?.data || [];
      const pagination = response.data?.data?.pagination;

      // Transform data to match component structure
      const transformedConsultants = consultantsData.map((c: any) => {
        console.log('Consultant data:', { _id: c._id, userId: c.userId?._id, name: c.userId?.name });
        return {
          id: c._id,
          userId: c.userId?._id,
          name: c.userId?.name || 'Unknown',
          title: c.title,
          category: c.specialization?.[0] || 'General',
          rating: c.averageRating || c.rating || 0,
          totalReviews: c.totalReviews || 0,
          location: c.city || 'Pakistan',
          city: c.city || '',
          specialization: Array.isArray(c.specialization)
            ? c.specialization.join(', ')
            : c.specialization,
          specializationArray: Array.isArray(c.specialization)
            ? c.specialization
            : [c.specialization],
          bio: c.bio || '',
          hourlyRate: `Rs ${c.hourlyRate?.toLocaleString()}/hr`,
          availability:
            c.availability === 'available'
              ? 'Available'
              : c.availability === 'limited'
                ? 'Limited Availability'
                : 'Unavailable',
          avatar: c.userId?.profileImage || null,
          isOnline: c.userId?.isOnline ?? false,
        };
      });

      if (append) {
        setConsultants(prev => [...prev, ...transformedConsultants]);
      } else {
        setConsultants(transformedConsultants);
      }
      
      // Update pagination state
      if (pagination) {
        setConsultantPage(pagination.page);
        setConsultantTotalPages(pagination.pages);
        setConsultantHasMore(pagination.page < pagination.pages);
      } else {
        setConsultantHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch consultants', error);
    } finally {
      setConsultantsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const user = authService.getCurrentUser();
      console.log('🔍 fetchOrders - Current user:', user);
      const userId = user?.id || (user as any)?._id;
      if (!userId) {
        console.log('❌ No user ID found for orders');
        setOrdersLoading(false);
        setOrders([]);
        return;
      }

      setOrdersLoading(true);
      setOrdersError('');
      
      console.log('📡 Fetching orders for buyer:', userId);
      const ordersData = await orderService.getOrdersByBuyer(userId);
      console.log('📊 Orders API response:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrdersError('Failed to load orders. Please try again later.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleConfirmCompletion = (order: any) => {
    setSelectedOrderForConfirmation(order);
    setShowConfirmCompletionModal(true);
  };

  const confirmOrderCompletion = async () => {
    if (!selectedOrderForConfirmation) return;

    try {
      setConfirmationLoading(true);
      await orderService.confirmCompletion(selectedOrderForConfirmation._id);

      // Refresh orders
      await fetchOrders();

      setShowConfirmCompletionModal(false);

      // Show review modal after successful completion
      setReviewOrderData(selectedOrderForConfirmation);
      setSelectedOrderForConfirmation(null);
      setShowReviewModal(true);
      setReviewRating(5);
      setReviewComment('');
    } catch (error: any) {
      console.error('Failed to confirm completion', error);
      showNotification(
        error.response?.data?.message || 'Failed to confirm completion. Please try again.',
        'error',
      );
    } finally {
      setConfirmationLoading(false);
    }
  };

  const submitReview = async () => {
    if (!reviewOrderData) return;

    if (!reviewComment.trim()) {
      showNotification('Please provide a review comment', 'error');
      return;
    }

    try {
      setReviewLoading(true);
      const consultantId = reviewOrderData.consultantId?._id || reviewOrderData.consultantId;
      const jobId = reviewOrderData.jobId?._id || reviewOrderData.jobId;

      if (!consultantId || !jobId) {
        showNotification('Unable to submit review: Missing consultant or job information', 'error');
        return;
      }

      await reviewService.createReview({
        jobId,
        consultantId,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setShowReviewModal(false);
      setReviewOrderData(null);
      setReviewRating(5);
      setReviewComment('');
      showNotification('Review submitted successfully! Thank you for your feedback.', 'success');
    } catch (error: any) {
      console.error('Failed to submit review', error);
      showNotification(
        error.response?.data?.message || 'Failed to submit review. Please try again.',
        'error',
      );
    } finally {
      setReviewLoading(false);
    }
  };

  const skipReview = () => {
    setShowReviewModal(false);
    setReviewOrderData(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const fetchProposals = async () => {
    try {
      const user = authService.getCurrentUser();
      const userId = user?.id || (user as any)?._id;
      if (!userId) {
        setProposalsLoading(false);
        setProposals([]);
        return;
      }
      setProposalsLoading(true);
      setProposalsError('');
      const response = await httpClient.get(`/proposals/buyer/${userId}`);
      const proposalsData = response.data?.data ?? [];
      setProposals(proposalsData);
    } catch (error) {
      console.error('Failed to load proposals', error);
      setProposalsError('Failed to load proposals. Please try again later.');
      setProposals([]);
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'proposals') {
      fetchProposals();
    }
  }, [activeTab]);

  const formatBudget = (budget: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    if (!budget.min && !budget.max) return 'Not specified';
    if (!budget.max || budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
  };

  const handleDeleteJob = async (jobId: string) => {
    showConfirm('Are you sure you want to delete this job?', async () => {
      try {
        await httpClient.delete(`/jobs/${jobId}`);
        await fetchMyJobs();
        showNotification('Job deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete job', error);
        showNotification('Failed to delete job. Please try again.', 'error');
      }
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAcceptProposal = async (proposalId: string, bidAmount: number) => {
    showConfirm(
      `Are you sure you want to accept this proposal for Rs ${bidAmount.toLocaleString()}? This will create an order and you will be redirected to payment.`,
      async () => {
        try {
          const response = await httpClient.patch(`/proposals/${proposalId}/accept`);
          const orderId = response.data.data.order._id;
          // Navigate to payment page with bid amount and order ID
          navigate('/payment', { state: { amount: bidAmount, proposalId, orderId } });
          // Refresh proposals list
          await fetchProposals();
        } catch (error) {
          console.error('Failed to accept proposal', error);
          showNotification('Failed to accept proposal. Please try again.', 'error');
        }
      },
    );
  };

  const handleRejectProposal = async (proposalId: string) => {
    showConfirm('Are you sure you want to decline this proposal?', async () => {
      try {
        await httpClient.patch(`/proposals/${proposalId}/reject`);
        showNotification('Proposal declined successfully.', 'success');
        // Refresh proposals list
        await fetchProposals();
      } catch (error) {
        console.error('Failed to reject proposal', error);
        showNotification('Failed to decline proposal. Please try again.', 'error');
      }
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a0e0f 0%, #0f2729 30%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f0f9ff 0%, #e0f7f9 30%, #ffffff 100%)',
      }}
    >
      {/* Premium Header */}
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18, 35, 37, 0.95) 0%, rgba(10, 25, 27, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(13, 180, 188, 0.15)'
            : '1px solid rgba(13, 180, 188, 0.1)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 2,
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src="/src/assets/logo.png"
                alt="Expert Raah"
                sx={{
                  height: 56,
                  width: 'auto',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/buyer-dashboard')}
              />
            </Box>

            {/* Navigation Tabs */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                background: (theme) => theme.palette.mode === 'dark'
                  ? 'rgba(0, 0, 0, 0.3)'
                  : 'rgba(0, 0, 0, 0.04)',
                borderRadius: '16px',
                p: 0.5,
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            >

              {[
                { value: 'browse', label: 'Browse' },
                { value: 'myJobs', label: 'My Jobs' },
                { value: 'proposals', label: 'Proposals' },
                { value: 'orders', label: 'Orders' },
              ].map((tab) => (
                <Button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value as any)}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: activeTab === tab.value
                      ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)'
                      : 'transparent',
                    color: activeTab === tab.value ? '#ffffff' : 'text.primary',
                    boxShadow: activeTab === tab.value ? '0 4px 15px rgba(13, 180, 188, 0.3)' : 'none',
                    '&:hover': {
                      background: activeTab === tab.value
                        ? 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)'
                        : (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Messages Button */}
              <IconButton
                onClick={() => navigate('/messages')}
                sx={{
                  position: 'relative',
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(13, 180, 188, 0.1)'
                    : 'rgba(13, 180, 188, 0.05)',
                  color: '#0db4bc',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(13, 180, 188, 0.2)'
                      : 'rgba(13, 180, 188, 0.1)',
                  },
                }}
              >
                <FaComments />
                {unreadMessageCount > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                      color: '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark' ? '#12232 5' : '#ffffff',
                    }}
                  >
                    {unreadMessageCount}
                  </Box>
                )}
              </IconButton>

              {/* Theme Toggle Button */}
              <IconButton
                onClick={toggleTheme}
                sx={{
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'rgba(13, 180, 188, 0.1)'
                    : 'rgba(13, 180, 188, 0.05)',
                  color: '#0db4bc',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(13, 180, 188, 0.2)'
                      : 'rgba(13, 180, 188, 0.1)',
                  },
                }}
              >
                {mode === 'dark' ? <FaSun /> : <FaMoon />}
              </IconButton>

              {/* User Profile Dropdown */}
              <Box sx={{ position: 'relative' }}>
                <Box
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1,
                    borderRadius: '12px',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(13, 180, 188, 0.1)'
                      : 'rgba(13, 180, 188, 0.05)',
                    cursor: 'pointer',
                    '&:hover': {
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(13, 180, 188, 0.15)'
                        : 'rgba(13, 180, 188, 0.08)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {currentUser?.profileImage ? (
                    <Box
                      component="img"
                      src={currentUser.profileImage}
                      alt={currentUser?.name}
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '2px solid rgba(13, 180, 188, 0.3)',
                      }}
                    />
                  ) : (
                    <FaUserCircle style={{ fontSize: '36px', color: '#0db4bc' }} />
                  )}
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'block' },
                      color: 'text.primary',
                    }}
                  >
                    {currentUser?.name || 'Loading...'}
                  </Typography>
                  <FaChevronDown
                    style={{
                      fontSize: '12px',
                      color: '#0db4bc',
                      transform: showProfileDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </Box>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '120%',
                      right: 0,
                      minWidth: 200,
                      borderRadius: '16px',
                      background: (theme) => theme.palette.mode === 'dark'
                        ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.95) 0%, rgba(10, 25, 27, 0.95) 100%)'
                        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.98) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(13, 180, 188, 0.2)'
                        : '1px solid rgba(13, 180, 188, 0.15)',
                      boxShadow: '0 15px 45px rgba(0, 0, 0, 0.2)',
                      p: 1,
                      zIndex: 1200,
                    }}
                  >
                    <Button
                      fullWidth
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileDropdown(false);
                      }}
                      startIcon={<span>👤</span>}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 2,
                        py: 1.25,
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        color: 'text.primary',
                        '&:hover': {
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'rgba(13, 180, 188, 0.1)'
                            : 'rgba(13, 180, 188, 0.05)',
                        },
                      }}
                    >
                      My Profile
                    </Button>
                    <Box sx={{ height: '1px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', my: 1 }} />
                    <Button
                      fullWidth
                      onClick={handleLogout}
                      startIcon={<span>🚪</span>}
                      sx={{
                        justifyContent: 'flex-start',
                        px: 2,
                        py: 1.25,
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        color: '#f44336',
                        '&:hover': {
                          background: 'rgba(244, 67, 54, 0.1)',
                        },
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Active Orders
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Track your ongoing projects
                </Typography>
              </Box>

              {ordersLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#0db4bc' }} />
                </Box>
              )}

              {ordersError && (
                <Alert severity="error" sx={{ borderRadius: '16px', mb: 3 }}>
                  {ordersError}
                </Alert>
              )}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <Card
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: '24px',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.5) 0%, rgba(10, 25, 27, 0.7) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(13, 180, 188, 0.1)'
                      : '1px solid rgba(13, 180, 188, 0.08)',
                  }}
                >
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 600 }}>
                    No active orders yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Accept a proposal to start your first order
                  </Typography>
                </Card>
              )}

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {!ordersLoading &&
                  !ordersError &&
                  orders.map((order) => (
                      <Card
                        component={motion.div}
                        whileHover={{ y: -8 }}
                        sx={{
                          height: '100%',
                          borderRadius: '24px',
                          background: (theme) => theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.7) 0%, rgba(10, 25, 27, 0.85) 100%)'
                            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.95) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: (theme) => theme.palette.mode === 'dark'
                            ? '2px solid rgba(13, 180, 188, 0.15)'
                            : '2px solid rgba(13, 180, 188, 0.1)',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 15px 50px rgba(13, 180, 188, 0.2)',
                            borderColor: '#0db4bc',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                                {order.jobId?.title || 'Untitled Job'}
                              </Typography>
                              <Chip
                                label={`#${order._id.slice(-8).toUpperCase()}`}
                                size="small"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(13, 180, 188, 0.15)'
                                    : 'rgba(13, 180, 188, 0.1)',
                                  color: '#0db4bc',
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
                                fontWeight: 600,
                                background: order.status === 'completed'
                                  ? 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                                  : order.status === 'in_progress'
                                  ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                                  : 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                                color: '#ffffff',
                              }}
                            />
                          </Box>

                          {/* Consultant Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: '16px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)' }}>
                            <Avatar
                              src={order.consultantId?.userId?.profileImage || 'https://i.pravatar.cc/150?img=1'}
                              alt={order.consultantId?.userId?.name}
                              sx={{ width: 50, height: 50, border: '2px solid rgba(13, 180, 188, 0.3)' }}
                            />
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {order.consultantId?.userId?.name || 'Unknown Consultant'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                                {order.consultantId?.title || 'Consultant'}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Financial Details */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: 2,
                              mb: 3,
                            }}
                          >
                            <Box>
                              <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '12px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(13, 180, 188, 0.1)' : 'rgba(13, 180, 188, 0.05)' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                  Total Amount
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0db4bc' }}>
                                  Rs {order.totalAmount?.toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Box>
                              <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: '12px', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                  Paid
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#4caf50' }}>
                                  Rs {order.amountPaid?.toLocaleString() || 0}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Progress */}
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Progress
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#0db4bc', fontWeight: 700 }}>
                                {order.progress || 0}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={order.progress || 0}
                              sx={{
                                height: 8,
                                borderRadius: '4px',
                                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: '4px',
                                  background: 'linear-gradient(90deg, #0db4bc 0%, #0a8b91 100%)',
                                },
                              }}
                            />
                          </Box>

                          {/* Completion Alert */}
                          {order.completionRequestedAt && order.status === 'in_progress' && (
                            <Alert
                              severity="info"
                              sx={{
                                mb: 2,
                                borderRadius: '12px',
                                background: (theme) => theme.palette.mode === 'dark'
                                  ? 'rgba(33, 150, 243, 0.1)'
                                  : 'rgba(33, 150, 243, 0.05)',
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                🔔 Completion Request
                              </Typography>
                              <Typography variant="caption">
                                The consultant has requested to mark this order as complete. Please review and confirm.
                              </Typography>
                            </Alert>
                          )}

                          {/* Actions */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => order.consultantId?._id && navigate(`/consultant/${order.consultantId._id}`)}
                              sx={{
                                flex: 1,
                                minWidth: '120px',
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(13, 180, 188, 0.3)' : 'rgba(13, 180, 188, 0.2)',
                                color: '#0db4bc',
                                '&:hover': {
                                  borderColor: '#0db4bc',
                                  background: 'rgba(13, 180, 188, 0.05)',
                                },
                              }}
                            >
                              View Profile
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<FaEnvelope />}
                              onClick={() => order.consultantId?.userId?._id && navigate(`/messages/${order.consultantId.userId._id}`)}
                              sx={{
                                flex: 1,
                                minWidth: '120px',
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 600,
                                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                                },
                              }}
                            >
                              Message
                            </Button>
                            {order.completionRequestedAt && order.status === 'in_progress' && (
                              <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                onClick={() => handleConfirmCompletion(order)}
                                sx={{
                                  borderRadius: '10px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                                  },
                                }}
                              >
                                Confirm Completion
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                  ))}
              </Box>
            </motion.div>
          ) : activeTab === 'proposals' ? (
            <motion.div
              key="proposals"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Proposals Received
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Review and accept proposals from consultants
                </Typography>
              </Box>

              {proposalsLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#0db4bc' }} />
                </Box>
              )}

              {proposalsError && (
                <Alert severity="error" sx={{ borderRadius: '16px', mb: 3 }}>
                  {proposalsError}
                </Alert>
              )}

              {!proposalsLoading && !proposalsError && proposals.length === 0 && (
                <Card
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: '24px',
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(145deg, rgba(20, 35, 37, 0.5) 0%, rgba(10, 25, 27, 0.7) 100%)'
                      : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 249, 255, 0.9) 100%)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No proposals received yet. Post a job to receive proposals from consultants.
                  </Typography>
                </Card>
              )}

              {!proposalsLoading && !proposalsError && proposals.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {proposals.map((proposal) => {
                    // Safely access nested properties
                    const jobTitle = proposal.jobId?.title || 'Untitled Job';
                    const jobDescription =
                      proposal.jobId?.description || 'No description available';
                    const jobCategory = proposal.jobId?.category || 'General';
                    const jobBudget = proposal.jobId?.budget || { min: 0, max: 0 };

                    const consultantName =
                      proposal.consultantId?.userId?.name || 'Unknown Consultant';
                    const consultantTitle = proposal.consultantId?.title || 'Consultant';
                    const consultantImage = proposal.consultantId?.userId?.profileImage;
                    const consultantRating =
                      proposal.consultantId?.averageRating || proposal.consultantId?.rating || 0;
                    const consultantTotalReviews = proposal.consultantId?.totalReviews || 0;
                    const consultantExperience = proposal.consultantId?.experience || 'N/A';

                    return (
                      <Card
                        key={proposal._id}
                        component={motion.div}
                        whileHover={{ y: -4 }}
                        sx={{
                          p: 3,
                          borderRadius: '24px',
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(20, 35, 37, 0.7)'
                              : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid',
                          borderColor: 'rgba(13, 180, 188, 0.15)',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 15px 50px rgba(13, 180, 188, 0.25)',
                            borderColor: 'rgba(13, 180, 188, 0.3)',
                          },
                        }}
                      >
                        {/* Proposal Header */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                              <FaBriefcase style={{ fontSize: '1.2rem', color: '#0db4bc' }} />
                              <Button
                                onClick={() => {
                                  analyticsService.recordProposalClick(
                                    proposal.consultantId._id,
                                    proposal._id,
                                  );
                                  setExpandedProposalId(
                                    expandedProposalId === proposal._id ? null : proposal._id,
                                  );
                                }}
                                endIcon={
                                  expandedProposalId === proposal._id ? (
                                    <FaChevronUp />
                                  ) : (
                                    <FaChevronDown />
                                  )
                                }
                                sx={{
                                  textAlign: 'left',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '1.1rem',
                                  color: 'text.primary',
                                  '&:hover': {
                                    background: 'transparent',
                                    color: '#0db4bc',
                                  },
                                }}
                              >
                                {jobTitle}
                              </Button>
                            </Box>
                            <Chip
                              label={jobCategory}
                              sx={{
                                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Box>

                        {/* Proposal Content */}
                        <Box>
                          {/* Consultant Section */}
                          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            {consultantImage ? (
                              <Avatar
                                src={consultantImage}
                                alt={consultantName}
                                sx={{
                                  width: 60,
                                  height: 60,
                                  border: '2px solid #0db4bc',
                                }}
                              />
                            ) : (
                              <FaUserCircle style={{ fontSize: '60px', color: '#ccc' }} />
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {consultantName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {consultantTitle}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar
                                      key={i}
                                      style={{
                                        fontSize: '0.9rem',
                                        color: i < Math.floor(consultantRating) ? '#fbbf24' : '#d1d5db',
                                      }}
                                    />
                                  ))}
                                  <Typography variant="body2" sx={{ fontWeight: 600, ml: 0.5 }}>
                                    {consultantRating.toFixed(1)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({consultantTotalReviews}{' '}
                                    {consultantTotalReviews === 1 ? 'review' : 'reviews'})
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FaAward style={{ fontSize: '0.9rem', color: '#fbbf24' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {consultantExperience}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>

                          {/* Proposal Details */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: 2,
                              mb: 3,
                            }}
                          >
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                background: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(34, 197, 94, 0.1)'
                                    : 'rgba(34, 197, 94, 0.05)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <FaDollarSign style={{ fontSize: '1rem', color: '#22c55e' }} />
                                <Typography variant="caption" color="text.secondary">
                                  Bid Amount
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                                Rs {proposal.bidAmount.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                background: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(13, 180, 188, 0.1)'
                                    : 'rgba(13, 180, 188, 0.05)',
                                border: '1px solid rgba(13, 180, 188, 0.2)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <FaClock style={{ fontSize: '1rem', color: '#0db4bc' }} />
                                <Typography variant="caption" color="text.secondary">
                                  Delivery Time
                                </Typography>
                              </Box>
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                {proposal.deliveryTime}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                p: 2,
                                borderRadius: '12px',
                                background: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? proposal.status === 'accepted'
                                      ? 'rgba(34, 197, 94, 0.1)'
                                      : proposal.status === 'rejected'
                                        ? 'rgba(239, 68, 68, 0.1)'
                                        : 'rgba(251, 191, 36, 0.1)'
                                    : proposal.status === 'accepted'
                                      ? 'rgba(34, 197, 94, 0.05)'
                                      : proposal.status === 'rejected'
                                        ? 'rgba(239, 68, 68, 0.05)'
                                        : 'rgba(251, 191, 36, 0.05)',
                                border: `1px solid ${
                                  proposal.status === 'accepted'
                                    ? 'rgba(34, 197, 94, 0.2)'
                                    : proposal.status === 'rejected'
                                      ? 'rgba(239, 68, 68, 0.2)'
                                      : 'rgba(251, 191, 36, 0.2)'
                                }`,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                {proposal.status === 'accepted' ? (
                                  <FaCheckCircle style={{ fontSize: '1rem', color: '#22c55e' }} />
                                ) : proposal.status === 'rejected' ? (
                                  <FaTimesCircle style={{ fontSize: '1rem', color: '#ef4444' }} />
                                ) : (
                                  <FaFileAlt style={{ fontSize: '1rem', color: '#fbbf24' }} />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Status
                                </Typography>
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color:
                                    proposal.status === 'accepted'
                                      ? '#22c55e'
                                      : proposal.status === 'rejected'
                                        ? '#ef4444'
                                        : '#fbbf24',
                                }}
                              >
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Expanded Job Description */}
                          {expandedProposalId === proposal._id && (
                            <Box
                              sx={{
                                mb: 3,
                                p: 2,
                                borderRadius: '12px',
                                background: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(13, 180, 188, 0.1)'
                                    : 'rgba(13, 180, 188, 0.05)',
                                border: '1px solid rgba(13, 180, 188, 0.2)',
                              }}
                            >
                              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                                Job Description
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {jobDescription}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Job Budget:
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#22c55e', fontWeight: 700 }}>
                                  {formatBudget(jobBudget)}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Cover Letter */}
                          <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <FaFileAlt style={{ fontSize: '1rem', color: '#0db4bc' }} />
                              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                Cover Letter
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {proposal.coverLetter}
                            </Typography>
                          </Box>

                          {/* Proposal Actions */}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant="outlined"
                              onClick={() =>
                                proposal.consultantId?._id &&
                                navigate(`/consultant/${proposal.consultantId._id}`)
                              }
                              sx={{
                                borderRadius: '10px',
                                borderColor: '#0db4bc',
                                color: '#0db4bc',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#0a8b91',
                                  backgroundColor: 'rgba(13, 180, 188, 0.1)',
                                },
                              }}
                            >
                              View Profile
                            </Button>
                            {proposal.status === 'pending' && (
                              <>
                                <Button
                                  variant="contained"
                                  onClick={() =>
                                    handleAcceptProposal(proposal._id, proposal.bidAmount)
                                  }
                                  sx={{
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                    color: 'white',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #0a8b91 0%, #086f78 100%)',
                                    },
                                  }}
                                >
                                  Accept & Pay
                                </Button>
                                <Button
                                  variant="outlined"
                                  onClick={() => handleRejectProposal(proposal._id)}
                                  sx={{
                                    borderRadius: '10px',
                                    borderColor: '#ef4444',
                                    color: '#ef4444',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                      borderColor: '#dc2626',
                                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    },
                                  }}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                          </Box>

                          {/* Status Messages */}
                          {proposal.status === 'accepted' && (
                            <Alert
                              severity="success"
                              icon={<FaCheckCircle />}
                              sx={{
                                mt: 2,
                                borderRadius: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Proposal Accepted - Order Created
                            </Alert>
                          )}

                          {proposal.status === 'rejected' && (
                            <Alert
                              severity="error"
                              icon={<FaTimesCircle />}
                              sx={{
                                mt: 2,
                                borderRadius: '12px',
                                fontWeight: 600,
                              }}
                            >
                              Proposal Declined
                            </Alert>
                          )}
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </motion.div>
          ) : activeTab === 'myJobs' ? (
            <motion.div
              key="myJobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* My Jobs View */}
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                  My Posted Jobs
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Manage jobs you have posted for consultants
                </Typography>

                {jobsLoading && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#0db4bc' }} />
                    <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                      Loading your jobs...
                    </Typography>
                  </Box>
                )}
                {jobsError && (
                  <Alert severity="error" sx={{ borderRadius: '16px', mb: 3 }}>
                    {jobsError}
                  </Alert>
                )}

                {!jobsLoading && !jobsError && myJobs.length === 0 && (
                  <Card
                    sx={{
                      p: 6,
                      textAlign: 'center',
                      borderRadius: '24px',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(20, 35, 37, 0.7)'
                          : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid',
                      borderColor: 'rgba(13, 180, 188, 0.15)',
                    }}
                  >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                      You haven't posted any jobs yet.
                    </Typography>
                    <Button
                      onClick={() => navigate('/post-job')}
                      startIcon={<FaPlus />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0a8b91 0%, #086f75 100%)',
                        },
                      }}
                    >
                      Post your first Job
                    </Button>
                  </Card>
                )}

                {!jobsLoading && !jobsError && myJobs.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {myJobs.map((job) => (
                      <Card
                        key={job._id}
                        component={motion.div}
                        whileHover={{ y: -4 }}
                        sx={{
                          p: 3,
                          borderRadius: '24px',
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(20, 35, 37, 0.7)'
                              : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid',
                          borderColor: 'rgba(13, 180, 188, 0.15)',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 15px 50px rgba(13, 180, 188, 0.25)',
                            borderColor: 'rgba(13, 180, 188, 0.3)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                              {job.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Chip label={job.category} size="small" sx={{ background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)', color: 'white' }} />
                              <Chip label={job.location} size="small" icon={<FaMapMarkerAlt />} />
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                Posted on {new Date(job.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={job.status === 'open' ? 'Open' : job.status.replace('_', ' ')}
                            sx={{
                              background: job.status === 'open' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          {job.description}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.1)'
                                : 'rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Budget:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                              {formatBudget(job.budget)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              onClick={() => navigate(`/job-detail/${job._id}`)}
                              sx={{
                                borderRadius: '10px',
                                borderColor: '#0db4bc',
                                color: '#0db4bc',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#0a8b91',
                                  backgroundColor: 'rgba(13, 180, 188, 0.1)',
                                },
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => handleDeleteJob(job._id)}
                              sx={{
                                borderRadius: '10px',
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: '#dc2626',
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                },
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', gap: 3 }}>
                {/* Sidebar Filters */}
                <Box
                  sx={{
                    width: 280,
                    flexShrink: 0,
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: '24px',
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(20, 35, 37, 0.7)'
                          : 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid',
                      borderColor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(13, 180, 188, 0.15)'
                          : 'rgba(13, 180, 188, 0.2)',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 8px 30px rgba(0, 0, 0, 0.4)'
                          : '0 8px 30px rgba(13, 180, 188, 0.15)',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        mb: 3,
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      ▼ Filters
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        Consultancy Type
                      </Typography>
                      <Select
                        fullWidth
                        value={filters.specialization}
                        onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                        sx={{
                          borderRadius: '12px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(13, 180, 188, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0db4bc',
                          },
                        }}
                      >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="LEGAL">Legal</MenuItem>
                        <MenuItem value="EDUCATION">Education</MenuItem>
                        <MenuItem value="BUSINESS">Business</MenuItem>
                      </Select>
                    </Box>

                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: 'text.primary',
                        }}
                      >
                        Location
                      </Typography>
                      <Select
                        fullWidth
                        value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                        sx={{
                          borderRadius: '12px',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(13, 180, 188, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0db4bc',
                          },
                        }}
                      >
                        <MenuItem value="">All Cities</MenuItem>
                        <MenuItem value="Rawalpindi">Rawalpindi</MenuItem>
                        <MenuItem value="Islamabad">Islamabad</MenuItem>
                        <MenuItem value="Lahore">Lahore</MenuItem>
                        <MenuItem value="Karachi">Karachi</MenuItem>
                      </Select>
                    </Box>
                  </Box>
                </Box>

                {/* Center Content */}
                <Box sx={{ flex: 1 }}>
                  {/* Search Bar */}
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder="Search Consultants"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <Box component="span" sx={{ mr: 1, display: 'flex', color: '#0db4bc' }}>
                            <FaSearch />
                          </Box>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '16px',
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(20, 35, 37, 0.6)'
                              : 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          '& fieldset': {
                            borderColor: 'rgba(13, 180, 188, 0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: '#0db4bc',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Post Job Button */}
                  <Button
                    fullWidth
                    onClick={() => navigate('/post-job')}
                    startIcon={<FaPlus />}
                    sx={{
                      mb: 3,
                      py: 1.5,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: 'white',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 20px rgba(13, 180, 188, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0a8b91 0%, #086f75 100%)',
                        boxShadow: '0 6px 30px rgba(13, 180, 188, 0.5)',
                      },
                    }}
                  >
                    Post a Job
                  </Button>

                  {/* Consultant Listings */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {consultantsLoading ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#0db4bc' }} />
                        <Typography sx={{ mt: 2, color: 'text.secondary' }}>
                          Loading consultants...
                        </Typography>
                      </Box>
                    ) : consultants.length === 0 ? (
                      <Card
                        sx={{
                          p: 6,
                          textAlign: 'center',
                          borderRadius: '24px',
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(20, 35, 37, 0.7)'
                              : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid',
                          borderColor: 'rgba(13, 180, 188, 0.15)',
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          No consultants available at the moment.
                        </Typography>
                      </Card>
                    ) : (
                      <>
                        {consultants.map((consultant) => (
                          <Card
                            key={consultant.id}
                            component={motion.div}
                            whileHover={{ y: -4 }}
                            sx={{
                              p: 3,
                              borderRadius: '24px',
                              background: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(20, 35, 37, 0.7)'
                                  : 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(20px)',
                              border: '2px solid',
                              borderColor: 'rgba(13, 180, 188, 0.15)',
                              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 15px 50px rgba(13, 180, 188, 0.25)',
                                borderColor: 'rgba(13, 180, 188, 0.3)',
                              },
                            }}
                          >
                            {/* Card Header with Avatar and Basic Info */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                              <Box sx={{ position: 'relative' }}>
                                {consultant.avatar ? (
                                  <Avatar
                                    src={consultant.avatar}
                                    alt={consultant.name}
                                    sx={{
                                      width: 70,
                                      height: 70,
                                      border: '2px solid #0db4bc',
                                    }}
                                  />
                                ) : (
                                  <FaUserCircle style={{ fontSize: '70px', color: '#ccc' }} />
                                )}
                                {consultant.isOnline && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      bottom: 2,
                                      right: 2,
                                      width: 14,
                                      height: 14,
                                      borderRadius: '50%',
                                      backgroundColor: '#22c55e',
                                      border: '2px solid',
                                      borderColor: (theme) =>
                                        theme.palette.mode === 'dark' ? '#142325' : '#fff',
                                    }}
                                  />
                                )}
                              </Box>

                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                    {consultant.name}
                                  </Typography>
                                  <Chip
                                    label={consultant.category}
                                    size="small"
                                    sx={{
                                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                    }}
                                  />
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {consultant.title}
                                </Typography>

                                {/* Location Display */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                  <FaMapMarkerAlt style={{ fontSize: '0.9rem', color: '#0db4bc' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {consultant.location}
                                  </Typography>
                                </Box>

                                {/* Rating Display */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                                    {[...Array(5)].map((_, i) => (
                                      <FaStar
                                        key={i}
                                        style={{
                                          fontSize: '0.9rem',
                                          color:
                                            i < Math.floor(consultant.rating) ? '#fbbf24' : '#d1d5db',
                                        }}
                                      />
                                    ))}
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {consultant.rating.toFixed(1)}/5
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({consultant.totalReviews || 0}{' '}
                                    {consultant.totalReviews === 1 ? 'review' : 'reviews'})
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>

                            {/* Specialization Section */}
                            <Box
                              sx={{
                                mb: 2,
                                p: 1.5,
                                borderRadius: '12px',
                                background: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(13, 180, 188, 0.1)'
                                    : 'rgba(13, 180, 188, 0.05)',
                                border: '1px solid rgba(13, 180, 188, 0.2)',
                              }}
                            >
                              <Typography variant="body2">
                                <strong>Specialization:</strong> {consultant.specialization}
                              </Typography>
                            </Box>

                            {/* Bio/Description */}
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              {consultant.bio}
                            </Typography>

                            {/* Footer with Rate and Actions */}
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                pt: 2,
                                borderTop: '1px solid',
                                borderColor: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(0, 0, 0, 0.1)',
                              }}
                            >
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                  <FaDollarSign style={{ fontSize: '1.1rem', color: '#22c55e' }} />
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#22c55e' }}>
                                    {consultant.hourlyRate}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {consultant.availability}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  disabled={!consultant.userId}
                                  onClick={() =>
                                    consultant.userId &&
                                    navigate(`/messages/${consultant.userId}`, {
                                      state: {
                                        user: {
                                          _id: consultant.userId,
                                          name: consultant.name,
                                          profileImage: consultant.avatar,
                                          isOnline: consultant.isOnline,
                                        },
                                      },
                                    })
                                  }
                                  startIcon={<FaEnvelope />}
                                  sx={{
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #0a8b91 0%, #086f75 100%)',
                                    },
                                  }}
                                  title={
                                    consultant.userId
                                      ? 'Message Consultant'
                                      : 'Consultant profile incomplete'
                                  }
                                >
                                  Message
                                </Button>
                                <Button
                                  component={Link}
                                  to={`/consultant/${consultant.id}`}
                                  variant="outlined"
                                  sx={{
                                    borderRadius: '10px',
                                    borderColor: '#0db4bc',
                                    color: '#0db4bc',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    '&:hover': {
                                      borderColor: '#0a8b91',
                                      backgroundColor: 'rgba(13, 180, 188, 0.1)',
                                    },
                                  }}
                                >
                                  View Profile
                                </Button>
                              </Box>
                            </Box>
                          </Card>
                        ))}
                        
                        {/* Load More Button */}
                        {consultantHasMore && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                fetchConsultants(consultantPage + 1, true);
                              }}
                              disabled={isLoadingMore}
                              sx={{
                                py: 1.5,
                                px: 4,
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '1rem',
                                boxShadow: '0 4px 20px rgba(13, 180, 188, 0.4)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0a8b91 0%, #086f75 100%)',
                                  boxShadow: '0 6px 30px rgba(13, 180, 188, 0.5)',
                                },
                                '&:disabled': {
                                  background: 'rgba(13, 180, 188, 0.3)',
                                },
                              }}
                            >
                              {isLoadingMore ? (
                                <CircularProgress size={24} sx={{ color: 'white' }} />
                              ) : (
                                'Load More Consultants'
                              )}
                            </Button>
                          </Box>
                        )}
                        
                        {/* Pagination Info */}
                        {consultants.length > 0 && (
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              Showing {consultants.length} consultant{consultants.length !== 1 ? 's' : ''}
                              {consultantTotalPages > 1 && ` (Page ${consultantPage} of ${consultantTotalPages})`}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Confirm Completion Modal */}
      {showConfirmCompletionModal && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => !confirmationLoading && setShowConfirmCompletionModal(false)}
        >
          <Box
            sx={{
              width: '90%',
              maxWidth: 500,
              p: 4,
              borderRadius: '24px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(20, 35, 37, 0.95)'
                  : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '2px solid',
              borderColor: 'rgba(13, 180, 188, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Confirm Order Completion
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              The consultant has requested to mark this order as complete.
            </Typography>
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '12px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(13, 180, 188, 0.1)'
                    : 'rgba(13, 180, 188, 0.05)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {selectedOrderForConfirmation?.jobId?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                By confirming, you acknowledge that the work has been completed satisfactorily.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowConfirmCompletionModal(false)}
                disabled={confirmationLoading}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'text.primary',
                  },
                }}
              >
                Not Yet
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={confirmOrderCompletion}
                disabled={confirmationLoading}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  },
                }}
              >
                {confirmationLoading ? 'Confirming...' : 'Yes, Mark as Complete'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => !reviewLoading && skipReview()}
        >
          <Box
            sx={{
              width: '90%',
              maxWidth: 550,
              p: 4,
              borderRadius: '24px',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(20, 35, 37, 0.95)'
                  : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '2px solid',
              borderColor: 'rgba(13, 180, 188, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              Rate Your Experience
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              How was your experience with this consultant?
            </Typography>
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '12px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(13, 180, 188, 0.1)'
                    : 'rgba(13, 180, 188, 0.05)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                {reviewOrderData?.jobId?.title || 'Project'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Consultant: {reviewOrderData?.consultantId?.userId?.name || 'Unknown'}
              </Typography>
            </Box>

            {/* Star Rating */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Rating:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        cursor: 'pointer',
                        fontSize: '28px',
                        color: star <= reviewRating ? '#fbbf24' : '#d1d5db',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fbbf24' }}>
                  {reviewRating}/5
                </Typography>
              </Box>
            </Box>

            {/* Comment */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                Your Review:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience working with this consultant..."
                disabled={reviewLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    background: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={skipReview}
                disabled={reviewLoading}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.12)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'text.primary',
                    background: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Skip for Now
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={submitReview}
                disabled={reviewLoading || !reviewComment.trim()}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                  color: '#ffffff',
                  boxShadow: '0 8px 25px rgba(13, 180, 188, 0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a8b91 0%, #08767b 100%)',
                    transform: 'translateY(-2px)',
                  },
                  '&:disabled': {
                    opacity: 0.6,
                  },
                }}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default BuyerDashboardPage;
