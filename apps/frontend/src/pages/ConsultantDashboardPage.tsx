import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { orderService } from '../services/orderService';
import { proposalService, type Proposal } from '../services/proposalService';
import { useSocket } from '../hooks/useSocket';
import RevenueProposalsChart from '../components/charts/RevenueProposalsChart';
import DashboardHeader from '../components/consultant/DashboardHeader';
import ProposalStatsCard from '../components/consultant/ProposalStatsCard';
import RatingCard from '../components/consultant/RatingCard';
import EarningsCard from '../components/consultant/EarningsCard';
import JobsList from '../components/consultant/JobsList';
import JobDetails from '../components/consultant/JobDetails';
import OrdersList from '../components/consultant/OrdersList';
import CompletionModal from '../components/consultant/CompletionModal';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  AccessTime,
  AttachMoney,
  CheckCircle,
  Close,
  FilterList,
  HourglassEmpty,
  Search,
  ShowChart,
  Visibility,
  WorkOutline,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

type ProposalFilter = 'all' | 'pending' | 'accepted' | 'rejected';
type SortBy = 'newest' | 'oldest' | 'bid-amount' | 'status';
type DateFilter = 'all-time' | 'last-30' | 'last-7';

const ITEMS_PER_PAGE = 10;

const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 700;
    const steps = 30;
    const increment = value / steps;
    let currentStep = 0;

    const interval = window.setInterval(() => {
      currentStep += 1;
      if (currentStep >= steps) {
        setDisplayValue(value);
        window.clearInterval(interval);
      } else {
        setDisplayValue(Math.round(increment * currentStep));
      }
    }, duration / steps);

    return () => window.clearInterval(interval);
  }, [value]);

  return (
    <>
      {displayValue}
      {suffix}
    </>
  );
};

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

const ConsultantDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'projects' | 'orders' | 'proposals'
  >('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [jobs, setJobs] = useState<JobFromApi[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [ordersError, setOrdersError] = useState('');
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [consultantProfile, setConsultantProfile] = useState<any>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState<any>(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [proposalStats, setProposalStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [earnings, setEarnings] = useState({
    total: 0,
    paid: 0,
    pending: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery('(max-width:899px)');

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalsLoaded, setProposalsLoaded] = useState(false);
  const [proposalFilter, setProposalFilter] = useState<ProposalFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all-time');
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    try {
      // Get current user from localStorage
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsLoading(false);
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
                  id: backendUser.id ?? backendUser._id,
                  _id: backendUser._id ?? backendUser.id,
                };
                localStorage.setItem('expert_raah_user', JSON.stringify(normalizedUser));
                localStorage.setItem('expert_raah_user_last_update', Date.now().toString());
                setCurrentUser(normalizedUser);
              }
            } catch (err) {
              console.log('Could not refresh user data');
            }
          };
          refreshUser();
        }
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    } catch (error) {
      console.error('Error in initial useEffect:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, [navigate]);

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

  const fetchUnreadMessageCount = async () => {
    try {
      const user = authService.getCurrentUser();
      const userId = user?.id || (user as any)?._id;
      if (!userId) return;

      const response = await httpClient.get('/conversations');
      const conversations = response.data?.data || [];
      const totalUnread = conversations.reduce((sum: number, conv: any) => {
        const userUnread = conv.unreadCount?.[userId] || 0;
        return sum + userUnread;
      }, 0);
      setUnreadMessageCount(totalUnread);
    } catch (error) {
      console.error('Failed to fetch unread message count:', error);
    }
  };

  const fetchProposalStats = async (consultantId: string) => {
    try {
      const response = await httpClient.get(`/proposals/consultant/${consultantId}`);
      const proposals = response.data?.data || [];

      setProposalStats({
        total: proposals.length,
        pending: proposals.filter((p: any) => p.status === 'pending').length,
        accepted: proposals.filter((p: any) => p.status === 'accepted').length,
        rejected: proposals.filter((p: any) => p.status === 'rejected').length,
      });
    } catch (error) {
      console.error('Failed to fetch proposal stats:', error);
    }
  };

  const fetchEarnings = async (consultantId: string) => {
    try {
      const walletResponse = await httpClient.get('/withdrawals/wallet/balance');
      const wallet = walletResponse.data?.data;

      if (wallet) {
        setEarnings({
          total: wallet.totalEarnings || 0,
          paid: wallet.availableBalance || 0,
          pending: wallet.pendingBalance || 0,
        });
        return;
      }

      const response = await httpClient.get(`/orders/consultant/${consultantId}`);
      const orders = response.data?.data || [];
      const total = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      const paid = orders.reduce((sum: number, order: any) => sum + (order.amountPaid || 0), 0);
      const pending = orders
        .filter((o: any) => o.status === 'in_progress')
        .reduce((sum: number, order: any) => sum + (order.amountPending || 0), 0);

      setEarnings({ total, paid, pending });
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  const fetchMonthlyStats = async (consultantId: string) => {
    try {
      const response = await httpClient.get(`/consultants/${consultantId}/stats`);

      const statsData = response.data?.data || [];

      // Always set the real data from backend, even if empty
      setMonthlyStats(statsData);
    } catch (error: any) {
      console.error('💥 Failed to fetch monthly stats:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
      // Set empty array on error
      setMonthlyStats([]);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError('');
        const response = await httpClient.get('/jobs');
        const jobsData = response.data?.data?.jobs ?? [];
        setJobs(jobsData);
        if (jobsData.length > 0) {
          setSelectedJobId((prev) => prev ?? jobsData[0]._id);
        }
      } catch (err) {
        console.error('Could not load projects', err);
        setJobsError('Could not load projects. Please try again later.');
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
    fetchConsultantProfile();
    fetchUnreadMessageCount();

    // Connect to socket for real-time notifications
    connect();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(fetchUnreadMessageCount, 10000);
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);

  const fetchConsultantProfile = async () => {
    try {
      const user = authService.getCurrentUser();
      console.log('🔍 Current user:', user);

      // Handle both id and _id properties
      const userId = user?.id || (user as any)?._id;
      if (!userId) {
        console.log('❌ No user ID found');
        return;
      }

      console.log('🌐 Fetching consultant profile for user:', userId);
      const response = await httpClient.get(`/consultants/user/${userId}`);
      console.log('✅ Consultant profile API response:', response);
      const consultant = response.data?.data;

      if (consultant?._id) {
        console.log('👤 Consultant found:', consultant._id);
        setConsultantId(consultant._id);
        setConsultantProfile(consultant);

        // Check if consultant profile is complete and verified
        if (!consultant.isVerified) {
          // Check if profile is incomplete (no verification documents uploaded)
          const hasDocuments = consultant.idCardFront && consultant.idCardBack;
          
          if (!hasDocuments) {
            // Redirect to profile completion page
            console.log('⚠️ Consultant profile incomplete - redirecting to profile setup');
            navigate('/consultant-profile');
            return;
          } else {
            // Documents uploaded but not verified - show pending verification message
            console.log('⏳ Consultant verification pending');
          }
        }

        // Fetch all data for this consultant
        await Promise.all([
          fetchOrders(consultant._id),
          fetchProposalStats(consultant._id),
          fetchEarnings(consultant._id),
          fetchMonthlyStats(consultant._id),
        ]);
      } else {
        console.log(
          '❌ No consultant profile found - user needs to create consultant profile first',
        );
        // Redirect to profile creation
        navigate('/consultant-profile');
        // Set empty monthly stats when no consultant profile
        setMonthlyStats([]);
      }
    } catch (error: any) {
      console.error('💥 Failed to fetch consultant profile:', error);
      
      // If consultant profile doesn't exist (404), redirect to profile creation
      if (error.response?.status === 404) {
        console.log('❌ Consultant profile not found - redirecting to profile setup');
        navigate('/consultant-profile');
      }
      
      setMonthlyStats([]);
    }
  };

  const fetchOrders = async (consultantId: string) => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      
      console.log('📡 Fetching orders for consultant:', consultantId);
      const ordersData = await orderService.getOrdersByConsultant(consultantId);
      console.log('📊 Consultant orders API response:', ordersData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      setOrdersError('Failed to load orders. Please try again later.');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchConsultantProposals = async (targetConsultantId: string) => {
    try {
      setProposalsLoading(true);
      const data = await proposalService.getProposalsByConsultant(targetConsultantId);
      setProposals(data || []);
      setProposalsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch proposals', error);
      setToast({ open: true, message: 'Failed to load proposals', severity: 'error' });
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'proposals' && consultantId && !proposalsLoaded && !proposalsLoading) {
      fetchConsultantProposals(consultantId);
    }
  }, [activeTab, consultantId, proposalsLoaded, proposalsLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [proposalFilter, searchQuery, sortBy, categoryFilter, dateFilter]);

  const proposalTabStats = useMemo(() => {
    const total = proposals.length;
    const pending = proposals.filter((proposal) => proposal.status === 'pending').length;
    const accepted = proposals.filter((proposal) => proposal.status === 'accepted').length;
    const rejected = proposals.filter((proposal) => proposal.status === 'rejected').length;
    const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(1)) : 0;

    const averageBid =
      total > 0
        ? Math.round(proposals.reduce((sum, proposal) => sum + (proposal.bidAmount || 0), 0) / total)
        : 0;

    const acceptedByCategory = proposals
      .filter((proposal) => proposal.status === 'accepted')
      .reduce<Record<string, number>>((accumulator, proposal) => {
        const categoryName = proposal.jobId?.category || 'General';
        accumulator[categoryName] = (accumulator[categoryName] || 0) + 1;
        return accumulator;
      }, {});

    const mostSuccessfulCategory =
      Object.entries(acceptedByCategory).sort((left, right) => right[1] - left[1])[0]?.[0] || 'N/A';

    const acceptedHours = proposals
      .filter((proposal) => proposal.status === 'accepted')
      .map((proposal) => new Date(proposal.createdAt).getHours());

    const bestHour = acceptedHours.length
      ? Math.round(acceptedHours.reduce((sum, hour) => sum + hour, 0) / acceptedHours.length)
      : null;

    const bestSubmitTime = bestHour === null ? 'N/A' : `${bestHour}:00 - ${bestHour + 1}:00`;

    return {
      total,
      pending,
      accepted,
      rejected,
      acceptanceRate,
      averageBid,
      mostSuccessfulCategory,
      bestSubmitTime,
    };
  }, [proposals]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(proposals.map((proposal) => proposal.jobId?.category || 'General')))],
    [proposals],
  );

  const filteredProposals = useMemo(() => {
    let result = proposals.filter((proposal) => {
      if (proposalFilter !== 'all' && proposal.status !== proposalFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const title = proposal.jobId?.title?.toLowerCase() || '';
        const category = proposal.jobId?.category?.toLowerCase() || '';
        const letter = proposal.coverLetter?.toLowerCase() || '';
        if (!title.includes(query) && !category.includes(query) && !letter.includes(query)) return false;
      }

      if (categoryFilter !== 'all' && (proposal.jobId?.category || 'General') !== categoryFilter) return false;

      if (dateFilter !== 'all-time') {
        const proposalDate = new Date(proposal.createdAt).getTime();
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (dateFilter === 'last-7' && now - proposalDate > sevenDays) return false;
        if (dateFilter === 'last-30' && now - proposalDate > thirtyDays) return false;
      }

      return true;
    });

    result = [...result].sort((left, right) => {
      if (sortBy === 'oldest') return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      if (sortBy === 'bid-amount') return (right.bidAmount || 0) - (left.bidAmount || 0);
      if (sortBy === 'status') return left.status.localeCompare(right.status);
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });

    return result;
  }, [proposals, proposalFilter, searchQuery, sortBy, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / ITEMS_PER_PAGE));
  const paginatedProposals = filteredProposals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const proposalFilterTabs = [
    { value: 'all' as ProposalFilter, label: 'All', count: proposalTabStats.total },
    { value: 'pending' as ProposalFilter, label: 'Pending', count: proposalTabStats.pending },
    { value: 'accepted' as ProposalFilter, label: 'Accepted', count: proposalTabStats.accepted },
    { value: 'rejected' as ProposalFilter, label: 'Rejected', count: proposalTabStats.rejected },
  ];

  const proposalStatCards = [
    { label: 'Total', value: proposalTabStats.total, color: '#00BCD4', icon: <WorkOutline sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Pending', value: proposalTabStats.pending, color: '#F59E0B', icon: <HourglassEmpty sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Accepted', value: proposalTabStats.accepted, color: '#22C55E', icon: <CheckCircle sx={{ fontSize: 30 }} />, extra: '' },
    { label: 'Rejected', value: proposalTabStats.rejected, color: '#EF4444', icon: <Close sx={{ fontSize: 30 }} />, extra: '' },
    {
      label: 'Acceptance Rate',
      value: proposalTabStats.acceptanceRate,
      color: '#8B5CF6',
      icon: <ShowChart sx={{ fontSize: 30 }} />,
      extra: '+5% this month',
    },
  ];

  const formatDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const statusStyles = (status: string) => {
    if (status === 'accepted') return { bg: 'rgba(34,197,94,0.14)', text: '#22C55E' };
    if (status === 'rejected') return { bg: 'rgba(239,68,68,0.14)', text: '#EF4444' };
    if (status === 'pending') return { bg: 'rgba(245,158,11,0.14)', text: '#F59E0B' };
    return { bg: 'rgba(107,114,128,0.14)', text: '#6B7280' };
  };

  const handleWithdrawClick = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      await proposalService.deleteProposal(proposalId);
      setToast({ open: true, message: 'Proposal withdrawn successfully', severity: 'success' });
      
      // Refresh proposals list
      if (consultantId) {
        await fetchConsultantProposals(consultantId);
        await fetchProposalStats(consultantId);
      }
    } catch (error: any) {
      console.error('Failed to withdraw proposal', error);
      setToast({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to withdraw proposal. Please try again.', 
        severity: 'error' 
      });
    }
  };

  const handleRequestCompletion = (order: any) => {
    setSelectedOrderForCompletion(order);
    setShowCompletionModal(true);
  };

  const confirmRequestCompletion = async () => {
    if (!selectedOrderForCompletion) return;

    try {
      setCompletionLoading(true);
      await orderService.requestCompletion(selectedOrderForCompletion._id);

      // Refresh orders
      if (consultantId) {
        await fetchOrders(consultantId);
      }

      setShowCompletionModal(false);
      setSelectedOrderForCompletion(null);
      alert('Completion request sent to buyer successfully!');
    } catch (error: any) {
      console.error('Failed to request completion', error);
      alert(error.response?.data?.message || 'Failed to request completion. Please try again.');
    } finally {
      setCompletionLoading(false);
    }
  };

  // Ensure a selected job that respects current filters
  useEffect(() => {
    const filtered = jobs.filter((job) => {
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.category);
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(job.status);
      return matchesType && matchesStatus;
    });

    if (filtered.length === 0) {
      setSelectedJobId(null);
      return;
    }

    if (!selectedJobId || !filtered.some((job) => job._id === selectedJobId)) {
      setSelectedJobId(filtered[0]._id);
    }
  }, [jobs, selectedTypes, selectedStatuses, selectedJobId]);

  const handleMessageBuyer = (buyer: JobFromApi['buyerId']) => {
    if (!buyer?._id) return;
    navigate(`/messages/${buyer._id}`, {
      state: {
        user: {
          _id: buyer._id,
          name: buyer.name || 'Buyer',
          profileImage: buyer.profileImage,
        },
      },
    });
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(job.category);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(job.status);
    return matchesType && matchesStatus;
  });

  const selectedJob = filteredJobs.find((job) => job._id === selectedJobId) || null;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : '#f8fafc'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : '#f8fafc',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h5" color="error">Something went wrong</Typography>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </Box>
    );
  }

  // Don't render until we have current user
  if (!currentUser) {
    return null;
  }

  try {
    return (
      <Box sx={{ minHeight: '100vh', background: (theme) => theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : '#f8fafc' }}>
      {/* Header */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        unreadMessageCount={unreadMessageCount}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <Box
        sx={{
          minHeight: 'calc(100vh - 72px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.5, md: 3 },
          maxWidth: { xs: '100%', lg: activeTab === 'projects' ? '1800px' : '1600px' },
          margin: '0 auto',
          '&::-webkit-scrollbar': { width: '10px' },
          '&::-webkit-scrollbar-track': { background: 'rgba(13, 180, 188, 0.05)' },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
            borderRadius: '5px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, #0a8b91 0%, #0db4bc 100%)',
          },
        }}
      >
        {activeTab === 'dashboard' && (
          <Box
            sx={{
              animation: 'fadeIn 300ms ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            {/* Verification Pending Banner */}
            {consultantProfile && !consultantProfile.isVerified && consultantProfile.idCardFront && (
              <Box
                sx={{
                  mb: 3,
                  p: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  border: '2px solid #f59e0b',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ⏳
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '18px', mb: 0.5 }}>
                    Verification Pending
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                    Your consultant profile is under review by our admin team. You can browse available jobs, but you won't be able to submit proposals until your account is verified. This usually takes 24-48 hours.
                  </Typography>
                </Box>
              </Box>
            )}

            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' },
                gridTemplateRows: { xs: 'auto', md: 'auto 1fr' },
                gap: { xs: 2, md: 3 },
                height: '100%',
              }}
            >
              {/* Top Left - Proposals Card */}
              <Box>
                <ProposalStatsCard proposalStats={proposalStats} />
              </Box>

            {/* Top Right - Overview Chart */}
            <Box 
              className="glass-card" 
              sx={{ 
                p: { xs: 2, md: 3 },
                gridRow: { md: '1 / 3' },
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              <RevenueProposalsChart
                proposalStats={proposalStats}
                earnings={earnings}
                monthlyData={monthlyStats}
              />
            </Box>

            {/* Bottom Left - Rating & Earnings side by side */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: { xs: 2, md: 3 },
                alignSelf: 'start',
              }}
            >
              {/* Rating Section */}
              <RatingCard consultantProfile={consultantProfile} />

              {/* Earnings Section */}
              <EarningsCard earnings={earnings} />
            </Box>
          </Box>
          </Box>
        )}

        {activeTab === 'proposals' && (
          <Box
            sx={{
              animation: 'fadeIn 300ms ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2.5, mb: 4 }}>
              {proposalStatCards.map((card, idx) => (
                <Box key={card.label} component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} whileHover={{ scale: 1.03, y: -4 }} sx={{ minHeight: 140, borderRadius: '16px', borderTop: `4px solid ${card.color}`, background: isDark ? 'linear-gradient(180deg, rgba(18,45,57,0.95), rgba(11,31,41,0.95))' : 'linear-gradient(180deg, #ffffff, #fbfeff)', boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.28)' : '0 10px 24px rgba(15,23,42,0.08)', p: 2.2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Box sx={{ width: 58, height: 58, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `${card.color}22`, color: card.color }}>{card.icon}</Box>
                  <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, color: card.color, lineHeight: 1 }}><AnimatedNumber value={card.value} suffix={card.label === 'Acceptance Rate' ? '%' : ''} /></Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: isDark ? '#b5c9d1' : '#64748b', fontWeight: 600 }}>{card.label}</Typography>
                  {card.extra && <Typography sx={{ fontSize: '0.72rem', color: card.color, fontWeight: 700 }}>{card.extra}</Typography>}
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, mb: 4, overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 1, md: 0 } }}>
              {proposalFilterTabs.map((tab) => {
                const active = proposalFilter === tab.value;
                return (
                  <Box key={tab.value} sx={{ position: 'relative' }}>
                    {active && <Box component={motion.div} layoutId="filter-indicator" transition={{ type: 'spring', stiffness: 450, damping: 32 }} sx={{ position: 'absolute', inset: 0, borderRadius: '999px', background: '#00BCD4', zIndex: 0 }} />}
                    <Button onClick={() => setProposalFilter(tab.value)} component={motion.button} whileTap={{ scale: 0.97 }} sx={{ position: 'relative', zIndex: 1, minHeight: 44, textTransform: 'none', borderRadius: '999px', px: 3, py: 1.2, whiteSpace: 'nowrap', fontWeight: 700, gap: 1, color: active ? '#fff' : isDark ? '#d7e6eb' : '#334155', border: `2px solid ${active ? '#00BCD4' : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(100,116,139,0.30)'}`, background: active ? 'transparent' : isDark ? 'rgba(14,41,52,0.9)' : 'transparent', '&:hover': { background: active ? 'transparent' : 'rgba(0,188,212,0.10)', borderColor: '#00BCD4' } }}>
                      {tab.label}
                      <Box sx={{ minWidth: 24, height: 24, px: 0.8, borderRadius: '999px', display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: 800, color: active ? '#00BCD4' : '#fff', background: active ? '#fff' : '#00BCD4' }}>{tab.count}</Box>
                    </Button>
                  </Box>
                );
              })}
            </Box>

            {!proposalsLoading && proposals.length > 0 && (
              <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
                <TextField value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search proposals..." InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#00BCD4' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { minHeight: 44, borderRadius: '12px', background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' } }} />
                <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 220 } }}>
                  <Select value={sortBy} onChange={(e: SelectChangeEvent<SortBy>) => setSortBy(e.target.value as SortBy)} sx={{ minHeight: 44, borderRadius: '12px', background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' }}>
                    <MenuItem value="newest">Sort by: Newest</MenuItem>
                    <MenuItem value="oldest">Sort by: Oldest</MenuItem>
                    <MenuItem value="bid-amount">Sort by: Bid Amount</MenuItem>
                    <MenuItem value="status">Sort by: Status</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {!proposalsLoading && proposals.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                <Chip icon={<FilterList />} label="Quick Filters" sx={{ fontWeight: 700 }} />
                <Chip label="Last 30 days" onClick={() => setDateFilter(dateFilter === 'last-30' ? 'all-time' : 'last-30')} color={dateFilter === 'last-30' ? 'primary' : 'default'} sx={{ borderRadius: '999px' }} />
                <Chip label="Last 7 days" onClick={() => setDateFilter(dateFilter === 'last-7' ? 'all-time' : 'last-7')} color={dateFilter === 'last-7' ? 'primary' : 'default'} sx={{ borderRadius: '999px' }} />
              </Box>
            )}

            {proposalsLoading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 3 }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Box key={index} sx={{ borderRadius: '16px', p: 2, background: isDark ? 'rgba(14,41,52,0.9)' : '#fff' }}>
                    <Skeleton variant="rounded" height={24} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={18} width="60%" sx={{ mb: 2 }} />
                    <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
                    <Skeleton variant="rounded" height={36} />
                  </Box>
                ))}
              </Box>
            ) : filteredProposals.length === 0 ? (
              <Box sx={{ borderRadius: '20px', py: 10, px: 3, textAlign: 'center', background: isDark ? 'linear-gradient(135deg, rgba(14,41,52,0.95), rgba(8,27,35,0.95))' : 'linear-gradient(135deg, #fff, #f0fbff)', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,188,212,0.18)'}`, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(0,188,212,0.08), transparent 60%)', pointerEvents: 'none' }} />
                <Box component={motion.div} animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} sx={{ mb: 2, position: 'relative' }}>
                  <Box sx={{ width: 120, height: 120, borderRadius: '50%', mx: 'auto', display: 'grid', placeItems: 'center', background: 'rgba(0,188,212,0.15)' }}><WorkOutline sx={{ fontSize: 60, color: '#00BCD4' }} /></Box>
                </Box>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: isDark ? '#ecf6f9' : '#0f172a', mb: 1 }}>No proposals yet</Typography>
                <Typography sx={{ fontSize: '1rem', color: isDark ? '#b8cad1' : '#64748b', mb: 3 }}>Start submitting proposals to jobs that match your expertise</Typography>
                <Button onClick={() => setActiveTab('projects')} startIcon={<Search />} sx={{ minHeight: 48, textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 4, background: '#00BCD4', color: '#fff', '&:hover': { background: '#00a8bf' } }}>Browse Jobs</Button>
                {isMobile && <Box sx={{ position: 'fixed', left: 16, right: 16, bottom: 12, zIndex: 20 }}><Button fullWidth onClick={() => setActiveTab('projects')} startIcon={<Search />} sx={{ minHeight: 48, borderRadius: '12px', textTransform: 'none', fontWeight: 800, background: '#00BCD4', color: '#fff', boxShadow: '0 10px 24px rgba(0,188,212,0.35)', '&:hover': { background: '#00a8bf' } }}>Browse Jobs</Button></Box>}
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)', lg: 'repeat(3,1fr)' }, gap: 3, alignItems: 'stretch' }}>
                  <AnimatePresence>
                    {paginatedProposals.map((proposal, index) => {
                      const tone = statusStyles(proposal.status);
                      const coverLetterPreview = proposal.coverLetter.length > 100 ? `${proposal.coverLetter.slice(0, 100)}... Read more...` : proposal.coverLetter;
                      return (
                        <Box key={proposal._id} component={motion.div} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }} sx={{ borderRadius: '16px', p: { xs: 2, md: 2.4 }, background: isDark ? 'linear-gradient(180deg, rgba(18,45,57,0.96), rgba(11,31,41,0.96))' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.16)'}`, boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.30)' : '0 10px 24px rgba(15,23,42,0.08)', transition: 'all 0.3s ease', minHeight: 360, display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: `0 14px 32px ${tone.text}35` } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1.2, mb: 1.4 }}>
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proposal.jobId?.title || 'Job Title Unavailable'}</Typography>
                            <Chip icon={proposal.status === 'accepted' ? <CheckCircle /> : proposal.status === 'rejected' ? <Close /> : <HourglassEmpty />} label={proposal.status} sx={{ textTransform: 'capitalize', fontWeight: 700, background: tone.bg, color: tone.text }} />
                          </Box>
                          <Chip label={proposal.jobId?.category || 'General'} sx={{ mb: 1.5, background: 'rgba(0,188,212,0.16)', color: '#00BCD4', fontWeight: 700 }} />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><Avatar sx={{ width: 34, height: 34, background: 'rgba(0,188,212,0.22)', color: '#00BCD4', fontWeight: 700 }}>{(proposal.jobId?.title || 'J').charAt(0).toUpperCase()}</Avatar><Typography sx={{ fontSize: '0.86rem', color: isDark ? '#b8cad1' : '#64748b', fontWeight: 600 }}>Client Project</Typography></Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 1, mb: 1.5 }}>
                            <Box sx={{ borderRadius: '10px', p: 1.2, background: 'rgba(0,188,212,0.12)' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AttachMoney sx={{ fontSize: 17, color: '#00BCD4' }} /><Typography sx={{ fontSize: '0.72rem', color: isDark ? '#b7cad1' : '#64748b' }}>Bid Amount</Typography></Box><Typography sx={{ mt: 0.4, fontWeight: 800, color: '#00BCD4' }}>Rs {proposal.bidAmount?.toLocaleString()}</Typography></Box>
                            <Box sx={{ borderRadius: '10px', p: 1.2, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><AccessTime sx={{ fontSize: 17, color: '#8B5CF6' }} /><Typography sx={{ fontSize: '0.72rem', color: isDark ? '#b7cad1' : '#64748b' }}>Delivery</Typography></Box><Typography sx={{ mt: 0.4, fontWeight: 700, color: isDark ? '#ecf6f9' : '#0f172a' }}>{proposal.deliveryTime}</Typography></Box>
                          </Box>
                          <Typography sx={{ fontSize: '0.87rem', lineHeight: 1.5, color: isDark ? '#b7cad1' : '#475569', mb: 1.2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 62 }}>{coverLetterPreview}</Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: isDark ? '#9fb6bf' : '#64748b', mb: 1.5 }}>Timeline: {formatDate(proposal.createdAt)}</Typography>
                          <Box sx={{ height: 1, background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.20)', mb: 1.3, mt: 'auto' }} />
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Button onClick={() => setActiveTab('projects')} startIcon={<Visibility />} sx={{ minHeight: 44, flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '10px', border: '2px solid #00BCD4', color: '#00BCD4', '&:hover': { background: 'rgba(0,188,212,0.12)' } }}>View Details</Button>
                            {proposal.status === 'pending' && <Button onClick={() => handleWithdrawClick(proposal._id)} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700, color: '#EF4444', '&:hover': { background: 'rgba(239,68,68,0.10)' } }}>Withdraw</Button>}
                          </Box>
                        </Box>
                      );
                    })}
                  </AnimatePresence>
                </Box>

                {filteredProposals.length > ITEMS_PER_PAGE && <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}><Pagination count={totalPages} page={currentPage} onChange={(_, value) => setCurrentPage(value)} color="primary" sx={{ '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: '10px', minWidth: 40, minHeight: 40 } }} /></Box>}

                <Box sx={{ mt: 4, borderRadius: '16px', p: 2.5, background: isDark ? 'rgba(14,41,52,0.95)' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(100,116,139,0.16)'}`, boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.26)' : '0 10px 24px rgba(15,23,42,0.08)' }}>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#00BCD4', mb: 2 }}>Success Insights</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4,1fr)' }, gap: 2 }}>
                    <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Average Bid Amount</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>Rs {proposalTabStats.averageBid.toLocaleString()}</Typography></Box>
                    <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Most Successful Category</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>{proposalTabStats.mostSuccessfulCategory}</Typography></Box>
                    <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Best Time to Submit</Typography><Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: isDark ? '#ecf6f9' : '#0f172a' }}>{proposalTabStats.bestSubmitTime}</Typography></Box>
                    <Box><Typography sx={{ fontSize: '0.78rem', color: isDark ? '#9fb6bf' : '#64748b' }}>Win Rate Trend</Typography><Box sx={{ display: 'flex', alignItems: 'end', gap: 0.4, height: 28, mt: 0.8 }}>{[18, 22, 16, 27, 25, 31, 29].map((heightValue, barIndex) => <Box key={`spark-${barIndex}`} sx={{ width: 6, borderRadius: '3px', height: `${heightValue}px`, background: barIndex > 4 ? '#22C55E' : '#00BCD4' }} />)}</Box></Box>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        )}

        {activeTab === 'projects' && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, md: 3 },
              animation: 'fadeIn 300ms ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            {/* Top filters bar, centered */}
              <Box className="glass-card" sx={{ p: { xs: 2, md: 2.5 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1f2937', mb: 2 }}>
                Filter Projects
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', mb: 1 }}>
                    Project Type
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant={selectedTypes.includes('Education') ? 'contained' : 'outlined'}
                      onClick={() => toggleType('Education')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#0db4bc',
                        color: selectedTypes.includes('Education') ? '#fff' : '#0db4bc',
                        background: selectedTypes.includes('Education') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#0db4bc',
                          background: selectedTypes.includes('Education') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'rgba(13, 180, 188, 0.1)',
                        },
                      }}
                    >
                      Education
                    </Button>
                    <Button
                      variant={selectedTypes.includes('Legal') ? 'contained' : 'outlined'}
                      onClick={() => toggleType('Legal')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#0db4bc',
                        color: selectedTypes.includes('Legal') ? '#fff' : '#0db4bc',
                        background: selectedTypes.includes('Legal') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#0db4bc',
                          background: selectedTypes.includes('Legal') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'rgba(13, 180, 188, 0.1)',
                        },
                      }}
                    >
                      Legal
                    </Button>
                    <Button
                      variant={selectedTypes.includes('Business') ? 'contained' : 'outlined'}
                      onClick={() => toggleType('Business')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#0db4bc',
                        color: selectedTypes.includes('Business') ? '#fff' : '#0db4bc',
                        background: selectedTypes.includes('Business') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#0db4bc',
                          background: selectedTypes.includes('Business') ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' : 'rgba(13, 180, 188, 0.1)',
                        },
                      }}
                    >
                      Business
                    </Button>
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', mb: 1 }}>
                    Status
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      variant={selectedStatuses.includes('open') ? 'contained' : 'outlined'}
                      onClick={() => toggleStatus('open')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#22c55e',
                        color: selectedStatuses.includes('open') ? '#fff' : '#22c55e',
                        background: selectedStatuses.includes('open') ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#22c55e',
                          background: selectedStatuses.includes('open') ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(34, 197, 94, 0.1)',
                        },
                      }}
                    >
                      Open
                    </Button>
                    <Button
                      variant={selectedStatuses.includes('in_progress') ? 'contained' : 'outlined'}
                      onClick={() => toggleStatus('in_progress')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#f59e0b',
                        color: selectedStatuses.includes('in_progress') ? '#fff' : '#f59e0b',
                        background: selectedStatuses.includes('in_progress') ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#f59e0b',
                          background: selectedStatuses.includes('in_progress') ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(245, 158, 11, 0.1)',
                        },
                      }}
                    >
                      In Progress
                    </Button>
                    <Button
                      variant={selectedStatuses.includes('completed') ? 'contained' : 'outlined'}
                      onClick={() => toggleStatus('completed')}
                      sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        borderColor: '#6b7280',
                        color: selectedStatuses.includes('completed') ? '#fff' : '#6b7280',
                        background: selectedStatuses.includes('completed') ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'transparent',
                        '&:hover': {
                          borderColor: '#6b7280',
                          background: selectedStatuses.includes('completed') ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'rgba(107, 114, 128, 0.1)',
                        },
                      }}
                    >
                      Completed
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Centered jobs + details layout */}
              <Box sx={{ display: 'flex', gap: { xs: 2, md: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Left Column - Job List */}
              <Box sx={{ 
                flex: '1 1 auto',
              }}>
                <JobsList
                  jobs={filteredJobs}
                  jobsLoading={jobsLoading}
                  jobsError={jobsError}
                  selectedJobId={selectedJobId}
                  onSelectJob={(jobId) => setSelectedJobId(jobId)}
                />
              </Box>

              {/* Right Column - Job Details */}
              <Box sx={{ 
                flex: { xs: '1 1 auto', md: '0 0 400px' },
              }}>
                <JobDetails
                  selectedJob={selectedJob}
                  onClearSelection={() => setSelectedJobId(null)}
                  onMessageBuyer={handleMessageBuyer}
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 'orders' && (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 300ms ease-in',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box sx={{ mb: 2, flexShrink: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937', mb: 1 }}>
                My Orders
              </Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Track your ongoing projects and deliveries
              </Typography>
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <OrdersList
                orders={orders}
                ordersLoading={ordersLoading}
                ordersError={ordersError}
                onRequestCompletion={handleRequestCompletion}
              />
            </Box>
          </Box>
        )}

      </Box>

      {/* Completion Request Modal */}
      <CompletionModal
        show={showCompletionModal}
        order={selectedOrderForCompletion}
        loading={completionLoading}
        onConfirm={confirmRequestCompletion}
        onCancel={() => setShowCompletionModal(false)}
      />

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
    );
  } catch (error) {
    console.error('Render error in ConsultantDashboardPage:', error);
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: (theme) => theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
          : '#f8fafc',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h5" color="error">Error rendering dashboard</Typography>
        <Typography color="text.secondary">{String(error)}</Typography>
        <Button onClick={() => window.location.reload()}>Reload Page</Button>
      </Box>
    );
  }
};

export default ConsultantDashboardPage;
