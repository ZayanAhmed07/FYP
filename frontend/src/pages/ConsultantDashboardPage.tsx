import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { orderService } from '../services/orderService';
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
import { Box, Typography, Button } from '@mui/material';

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
      const response = await httpClient.get(`/orders/consultant/${consultantId}`);
      const orders = response.data?.data || [];

      // Total earnings = sum of all order amounts (completed + in-progress)
      const total = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      
      // Paid = sum of amountPaid from all orders (regardless of status)
      const paid = orders.reduce((sum: number, order: any) => sum + (order.amountPaid || 0), 0);
      
      // Pending = sum of amountPending from in-progress orders
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
        // Set empty monthly stats when no consultant profile
        setMonthlyStats([]);
      }
    } catch (error: any) {
      console.error('💥 Failed to fetch consultant profile:', error);
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
          if (tab === 'proposals') {
            navigate('/consultant-proposals');
          } else {
            setActiveTab(tab);
          }
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
        )}

        {activeTab === 'projects' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
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
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
