import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Avatar, 
  Chip,
  Modal,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  FaUser, 
  FaUserTie, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaBan, 
  FaEye, 
  FaFileAlt, 
  FaUserCircle, 
  FaStar, 
  FaTrash, 
  FaEnvelope,
  FaSignOutAlt,
  FaTimes,
  FaSearch,
  FaDollarSign
} from 'react-icons/fa';
import { httpClient } from '../api/httpClient';
import reviewService from '../services/reviewService';
import ContactManagement from '../components/admin/ContactManagement';
import { authService } from '../services/authService';

// Consultant status filter type
type ConsultantFilter = 'all' | 'verified' | 'unverified' | 'banned';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'consultants' | 'buyers' | 'reviews' | 'contacts' | 'withdrawals'>('consultants');
  const [consultants, setConsultants] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Consultants filtering & search state
  const [consultantFilter, setConsultantFilter] = useState<ConsultantFilter>('all');
  const [consultantSearch, setConsultantSearch] = useState('');
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  useEffect(() => {
    fetchConsultants();
    fetchBuyers();
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, reviewsPage]);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [activeTab]);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch ALL consultants without pagination limit
      const response = await httpClient.get('/consultants', {
        params: { limit: 1000 } // Large limit to get all consultants
      });
      
      let consultantsData = [];
      if (response.data?.data?.consultants) {
        consultantsData = response.data.data.consultants;
      } else if (response.data?.data) {
        consultantsData = Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      const transformedConsultants = consultantsData.map((c: any) => ({
        id: c._id,
        name: c.userId?.name || 'Unknown',
        email: c.userId?.email || 'N/A',
        title: c.title || 'N/A',
        experience: c.experience || 'N/A',
        specialization: c.specialization || [],
        hourlyRate: c.hourlyRate || 0,
        isVerified: c.isVerified || false,
        status: c.isVerified ? 'approved' : 'pending',
        idCardFront: c.idCardFront,
        idCardBack: c.idCardBack,
        supportingDocs: c.supportingDocuments || [],
        avatar: c.userId?.profileImage || null,
        joinedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A',
        isBanned: c.userId?.isBanned || false,
        userId: c.userId?._id,
      }));
      
      setConsultants(transformedConsultants);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load consultants';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Utility function: Filter consultants by status
  const filterConsultantsByStatus = (consultants: any[], filter: ConsultantFilter) => {
    switch (filter) {
      case 'verified':
        return consultants.filter(c => c.isVerified && !c.isBanned);
      case 'unverified':
        return consultants.filter(c => !c.isVerified && !c.isBanned);
      case 'banned':
        return consultants.filter(c => c.isBanned);
      case 'all':
      default:
        return consultants;
    }
  };

  // Utility function: Search consultants
  const searchConsultants = (consultants: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return consultants;
    
    const term = searchTerm.toLowerCase();
    return consultants.filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.title?.toLowerCase().includes(term) ||
      c.specialization?.some((s: string) => s.toLowerCase().includes(term))
    );
  };

  // Memoized filtered and searched consultants
  const filteredConsultants = useMemo(() => {
    let result = filterConsultantsByStatus(consultants, consultantFilter);
    result = searchConsultants(result, consultantSearch);
    return result;
  }, [consultants, consultantFilter, consultantSearch]);

  // Separate pending consultants (unverified and not banned)
  const pendingConsultants = useMemo(() => 
    consultants.filter(c => !c.isVerified && !c.isBanned), 
    [consultants]
  );

  const fetchBuyers = async () => {
    try {
      setBuyersLoading(true);
      console.log('Fetching buyers from /admin/users...');
      const response = await httpClient.get('/admin/users');
      console.log('Response data:', response.data);
      
      let usersData = [];
      if (response.data?.data?.users) {
        usersData = response.data.data.users;
        console.log('Found users array:', usersData.length, 'users');
      } else if (response.data?.data) {
        usersData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Using data directly:', usersData.length, 'users');
      }
      
      console.log('All users:', usersData.map((u: any) => ({ name: u.name, accountType: u.accountType, roles: u.roles })));
      
      // Filter to get only buyers (exclude admins and consultants)
      const buyersData = usersData.filter((u: any) => {
        const isAdmin = u.roles && u.roles.includes('admin');
        const isBuyer = u.accountType === 'buyer';
        console.log(`User ${u.name}: accountType=${u.accountType}, roles=${JSON.stringify(u.roles)}, isAdmin=${isAdmin}, isBuyer=${isBuyer}`);
        return isBuyer && !isAdmin;
      });
      
      console.log('Filtered buyers:', buyersData.length, 'buyers out of', usersData.length, 'total users');
      
      const transformedBuyers = await Promise.all(
        buyersData.map(async (b: any) => {
          try {
            const jobsResponse = await httpClient.get(`/jobs/buyer/${b._id}`);
            const jobs = jobsResponse.data?.data || [];
            
            return {
              id: b._id,
              name: b.name || 'Unknown',
              email: b.email || 'N/A',
              phone: b.phone || 'N/A',
              totalJobsPosted: jobs.length,
              totalSpent: 0,
              avatar: b.profileImage || null,
              joinedDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
              isBanned: b.isBanned || false,
            };
          } catch {
            return {
              id: b._id,
              name: b.name || 'Unknown',
              email: b.email || 'N/A',
              phone: b.phone || 'N/A',
              totalJobsPosted: 0,
              totalSpent: 0,
              avatar: b.profileImage || null,
              joinedDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
              isBanned: b.isBanned || false,
            };
          }
        })
      );
      
      console.log('Transformed buyers:', transformedBuyers);
      setBuyers(transformedBuyers);
    } catch (err: any) {
      console.error('Buyers error:', err.response?.data?.message || err.message);
      console.error('Full error:', err);
    } finally {
      setBuyersLoading(false);
    }
  };

  const handleApproveConsultant = async (id: string) => {
    try {
      await httpClient.patch(`/admin/consultants/${id}/verify`);
      alert('Consultant approved successfully!');
      setShowDocuments(false);
      setSelectedConsultant(null);
      await fetchConsultants();
    } catch (err) {
      console.error('Failed to approve consultant', err);
      alert('Failed to approve consultant');
    }
  };

  const handleDeclineConsultant = async (id: string) => {
    try {
      await httpClient.patch(`/admin/consultants/${id}/decline`);
      alert('Consultant declined!');
      setShowDocuments(false);
      setSelectedConsultant(null);
      await fetchConsultants();
    } catch (err) {
      console.error('Failed to decline consultant', err);
      alert('Failed to decline consultant');
    }
  };

  const handleBanConsultant = async (userId: string) => {
    if (confirm('Are you sure you want to ban this consultant?')) {
      try {
        await httpClient.patch(`/admin/users/${userId}/ban`);
        alert('Consultant banned successfully!');
        await fetchConsultants();
      } catch (err) {
        console.error('Failed to ban consultant', err);
        alert('Failed to ban consultant');
      }
    }
  };

  const handleUnbanConsultant = async (userId: string) => {
    try {
      await httpClient.patch(`/admin/users/${userId}/unban`);
      alert('Consultant unbanned successfully!');
      await fetchConsultants();
    } catch (err) {
      console.error('Failed to unban consultant', err);
      alert('Failed to unban consultant');
    }
  };

  const handleBanBuyer = async (id: string) => {
    if (confirm('Are you sure you want to ban this buyer?')) {
      try {
        await httpClient.patch(`/admin/users/${id}/ban`);
        alert('Buyer banned successfully!');
        await fetchBuyers();
      } catch (err) {
        console.error('Failed to ban buyer', err);
        alert('Failed to ban buyer');
      }
    }
  };

  const handleUnbanBuyer = async (id: string) => {
    try {
      await httpClient.patch(`/admin/users/${id}/unban`);
      alert('Buyer unbanned successfully!');
      await fetchBuyers();
    } catch (err) {
      console.error('Failed to unban buyer', err);
      alert('Failed to unban buyer');
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await reviewService.getAllReviews(reviewsPage, 20);
      setReviews(response.reviews);
      setReviewsTotalPages(response.pages);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.deleteReview(reviewId);
        alert('Review deleted successfully!');
        await fetchReviews();
      } catch (err) {
        console.error('Failed to delete review', err);
        alert('Failed to delete review');
      }
    }
  };

  // Fetch all pending withdrawal requests
  const fetchWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const response = await httpClient.get('/withdrawals/admin/requests');
      setWithdrawals(response.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch withdrawals', err);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  // Approve withdrawal request
  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      await httpClient.post(`/withdrawals/${withdrawalId}/approve`);
      alert('Withdrawal approved successfully!');
      await fetchWithdrawals();
      setShowWithdrawalModal(false);
    } catch (err: any) {
      console.error('Failed to approve withdrawal', err);
      alert(err.response?.data?.message || 'Failed to approve withdrawal');
    }
  };

  // Process withdrawal (start processing)
  const handleStartProcessing = async (withdrawalId: string) => {
    try {
      await httpClient.post(`/withdrawals/${withdrawalId}/process`);
      alert('Withdrawal processing started!');
      await fetchWithdrawals();
      setShowWithdrawalModal(false);
    } catch (err: any) {
      console.error('Failed to start processing', err);
      alert(err.response?.data?.message || 'Failed to start processing');
    }
  };

  // Complete withdrawal
  const handleCompleteWithdrawal = async (withdrawalId: string) => {
    try {
      await httpClient.post(`/withdrawals/${withdrawalId}/complete`, { 
        transactionId: `TXN-${Date.now()}` 
      });
      alert('Withdrawal completed successfully!');
      await fetchWithdrawals();
      setShowWithdrawalModal(false);
    } catch (err: any) {
      console.error('Failed to complete withdrawal', err);
      alert(err.response?.data?.message || 'Failed to complete withdrawal');
    }
  };

  // Reject withdrawal
  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      await httpClient.post(`/withdrawals/${withdrawalId}/reject`);
      alert('Withdrawal rejected successfully!');
      await fetchWithdrawals();
      setShowWithdrawalModal(false);
    } catch (err: any) {
      console.error('Failed to reject withdrawal', err);
      alert(err.response?.data?.message || 'Failed to reject withdrawal');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          px: 4,
          py: 2,
        }}
      >
        <Box
          sx={{
            maxWidth: '1400px',
            mx: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              EXPERT RAAH
            </Typography>
            <Chip 
              label="Admin Panel" 
              sx={{ 
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                color: 'white',
                fontWeight: 600
              }} 
            />
          </Box>

          <Button
            onClick={() => {
              authService.logout();
              navigate('/');
            }}
            startIcon={<FaSignOutAlt />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              border: '2px solid #0db4bc',
              color: '#0db4bc',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: 'rgba(13, 180, 188, 0.1)',
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          maxWidth: '1400px',
          mx: 'auto',
          px: 4,
          py: 4,
        }}
      >
        {/* Tabs */}
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            p: 1,
            mb: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 600,
                minHeight: 60,
                '&.Mui-selected': {
                  color: '#0db4bc',
                },
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                height: 3,
              },
            }}
          >
            <Tab 
              value="consultants" 
              icon={<FaUserTie style={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label="Consultants" 
            />
            <Tab 
              value="buyers" 
              icon={<FaUser style={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label="Buyers" 
            />
            <Tab 
              value="reviews" 
              icon={<FaStar style={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label="Reviews & Ratings" 
            />
            <Tab 
              value="contacts" 
              icon={<FaEnvelope style={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label="Contact Forms" 
            />
            <Tab 
              value="withdrawals" 
              icon={<FaDollarSign style={{ fontSize: 20 }} />} 
              iconPosition="start" 
              label="Withdrawals" 
            />
          </Tabs>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CircularProgress sx={{ color: '#0db4bc', mb: 2 }} />
            <Typography sx={{ color: '#666', fontSize: '16px' }}>Loading data...</Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Box
            sx={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: '#ef4444', mb: 2 }}>{error}</Typography>
            <Button
              onClick={() => { fetchConsultants(); fetchBuyers(); }}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Retry
            </Button>
          </Box>
        )}

        {/* Consultants Tab */}
        {!loading && activeTab === 'consultants' && (
          <Box>
            {/* Search and Filter Controls */}
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                p: 3,
                mb: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search by name, email, title, or specialization..."
                value={consultantSearch}
                onChange={(e) => setConsultantSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch style={{ color: '#0db4bc' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
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

              {/* Status Filter Tabs */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => setConsultantFilter('all')}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    background: consultantFilter === 'all' 
                      ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' 
                      : 'transparent',
                    color: consultantFilter === 'all' ? 'white' : '#666',
                    border: '2px solid',
                    borderColor: consultantFilter === 'all' ? '#0db4bc' : '#ddd',
                    '&:hover': {
                      background: consultantFilter === 'all' 
                        ? 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' 
                        : 'rgba(13, 180, 188, 0.1)',
                    },
                  }}
                >
                  All ({consultants.length})
                </Button>
                <Button
                  onClick={() => setConsultantFilter('verified')}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    background: consultantFilter === 'verified' 
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                      : 'transparent',
                    color: consultantFilter === 'verified' ? 'white' : '#666',
                    border: '2px solid',
                    borderColor: consultantFilter === 'verified' ? '#22c55e' : '#ddd',
                    '&:hover': {
                      background: consultantFilter === 'verified' 
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                        : 'rgba(34, 197, 94, 0.1)',
                    },
                  }}
                >
                  ✓ Verified ({consultants.filter(c => c.isVerified && !c.isBanned).length})
                </Button>
                <Button
                  onClick={() => setConsultantFilter('unverified')}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    background: consultantFilter === 'unverified' 
                      ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
                      : 'transparent',
                    color: consultantFilter === 'unverified' ? 'white' : '#666',
                    border: '2px solid',
                    borderColor: consultantFilter === 'unverified' ? '#ff9800' : '#ddd',
                    '&:hover': {
                      background: consultantFilter === 'unverified' 
                        ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)' 
                        : 'rgba(255, 152, 0, 0.1)',
                    },
                  }}
                >
                  ⏳ Unverified ({consultants.filter(c => !c.isVerified && !c.isBanned).length})
                </Button>
                <Button
                  onClick={() => setConsultantFilter('banned')}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    background: consultantFilter === 'banned' 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                      : 'transparent',
                    color: consultantFilter === 'banned' ? 'white' : '#666',
                    border: '2px solid',
                    borderColor: consultantFilter === 'banned' ? '#ef4444' : '#ddd',
                    '&:hover': {
                      background: consultantFilter === 'banned' 
                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                        : 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  🚫 Banned ({consultants.filter(c => c.isBanned).length})
                </Button>
              </Box>

              {/* Results Count */}
              {(consultantSearch || consultantFilter !== 'all') && (
                <Typography sx={{ mt: 2, color: '#666', fontSize: '14px', fontWeight: 500 }}>
                  Showing {filteredConsultants.length} of {consultants.length} consultant{consultants.length !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>

            {/* Empty State */}
            {filteredConsultants.length === 0 && (
              <Box
                sx={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 3,
                  p: 8,
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <FaUserTie style={{ fontSize: 64, color: '#0db4bc', marginBottom: 16 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                  {consultants.length === 0 
                    ? 'No Consultants Yet' 
                    : 'No Consultants Found'}
                </Typography>
                <Typography sx={{ color: '#666' }}>
                  {consultants.length === 0 
                    ? 'Consultants will appear here once they sign up and create their profiles.' 
                    : 'Try adjusting your search or filter criteria.'}
                </Typography>
                {(consultantSearch || consultantFilter !== 'all') && (
                  <Button
                    onClick={() => {
                      setConsultantSearch('');
                      setConsultantFilter('all');
                    }}
                    sx={{
                      mt: 2,
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            )}

            {/* Pending Consultants Section */}
            {pendingConsultants.length > 0 && consultantFilter === 'all' && !consultantSearch && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 3 }}>
                  Awaiting Verification - {pendingConsultants.length} {pendingConsultants.length === 1 ? 'Consultant' : 'Consultants'}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {pendingConsultants.map((consultant) => (
                    <Box
                      key={consultant.id}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 3,
                        p: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        border: '2px solid rgba(255, 152, 0, 0.3)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                        {consultant.avatar ? (
                          <Avatar src={consultant.avatar} alt={consultant.name} sx={{ width: 80, height: 80 }} />
                        ) : (
                          <FaUserCircle style={{ fontSize: '80px', color: '#ccc' }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                            {consultant.name}
                          </Typography>
                          <Typography sx={{ color: '#0db4bc', mb: 0.5 }}>{consultant.title}</Typography>
                          <Typography sx={{ color: '#666', fontSize: '14px' }}>{consultant.email}</Typography>
                        </Box>
                        <Chip
                          label="Pending"
                          sx={{
                            background: 'rgba(255, 152, 0, 0.1)',
                            color: '#ff9800',
                            fontWeight: 600,
                            border: '1px solid rgba(255, 152, 0, 0.3)',
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 2,
                          mb: 3,
                          p: 2,
                          background: 'rgba(13, 180, 188, 0.05)',
                          borderRadius: 2,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Experience:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>{consultant.experience}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Hourly Rate:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>PKR {consultant.hourlyRate}/hr</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Specialization:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>{consultant.specialization.join(', ')}</Typography>
                        </Box>
                      </Box>

                      <Button
                        onClick={() => { setSelectedConsultant(consultant); setShowDocuments(true); }}
                        startIcon={<FaFileAlt />}
                        sx={{
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                          color: 'white',
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                          '&:hover': {
                            boxShadow: '0 6px 16px rgba(13, 180, 188, 0.6)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        View Documents
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {filteredConsultants.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 3 }}>
                  {consultantFilter === 'all' && 'All Consultants'}
                  {consultantFilter === 'verified' && 'Verified Consultants'}
                  {consultantFilter === 'unverified' && 'Unverified Consultants'}
                  {consultantFilter === 'banned' && 'Banned Consultants'}
                </Typography>
                <TableContainer
                  component={Box}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Consultant</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Rate</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Joined</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredConsultants.map((consultant) => (
                        <TableRow key={consultant.id} sx={{ '&:hover': { background: 'rgba(13, 180, 188, 0.05)' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {consultant.avatar ? (
                                <Avatar src={consultant.avatar} sx={{ width: 40, height: 40 }} />
                              ) : (
                                <FaUserCircle style={{ fontSize: '40px', color: '#ccc' }} />
                              )}
                              <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>{consultant.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#666' }}>{consultant.email}</TableCell>
                          <TableCell sx={{ color: '#666' }}>{consultant.title}</TableCell>
                          <TableCell sx={{ color: '#666' }}>PKR {consultant.hourlyRate}/hr</TableCell>
                          <TableCell>
                            {consultant.isBanned ? (
                              <Chip label="Banned" size="small" sx={{ background: '#ef4444', color: 'white', fontWeight: 600 }} />
                            ) : consultant.isVerified ? (
                              <Chip label="Verified" size="small" sx={{ background: '#22c55e', color: 'white', fontWeight: 600 }} />
                            ) : (
                              <Chip label="Pending" size="small" sx={{ background: '#ff9800', color: 'white', fontWeight: 600 }} />
                            )}
                          </TableCell>
                          <TableCell sx={{ color: '#666' }}>{consultant.joinedDate}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {/* View Documents */}
                              <IconButton
                                onClick={() => { setSelectedConsultant(consultant); setShowDocuments(true); }}
                                sx={{ 
                                  color: '#0db4bc', 
                                  '&:hover': { background: 'rgba(13, 180, 188, 0.1)' },
                                }}
                                title="View documents"
                              >
                                <FaEye />
                              </IconButton>
                              
                              {/* Verify/Unverify (only for non-banned) */}
                              {!consultant.isBanned && (
                                consultant.isVerified ? (
                                  <IconButton
                                    onClick={() => handleDeclineConsultant(consultant.id)}
                                    sx={{ 
                                      color: '#ff9800', 
                                      '&:hover': { background: 'rgba(255, 152, 0, 0.1)' },
                                    }}
                                    title="Unverify consultant"
                                  >
                                    <FaTimesCircle />
                                  </IconButton>
                                ) : (
                                  <IconButton
                                    onClick={() => handleApproveConsultant(consultant.id)}
                                    sx={{ 
                                      color: '#22c55e', 
                                      '&:hover': { background: 'rgba(34, 197, 94, 0.1)' },
                                    }}
                                    title="Verify consultant"
                                  >
                                    <FaCheckCircle />
                                  </IconButton>
                                )
                              )}
                              
                              {/* Ban/Unban */}
                              {consultant.isBanned ? (
                                <IconButton
                                  onClick={() => handleUnbanConsultant(consultant.userId)}
                                  sx={{ 
                                    color: '#22c55e', 
                                    '&:hover': { background: 'rgba(34, 197, 94, 0.1)' },
                                  }}
                                  title="Unban consultant"
                                >
                                  <FaCheckCircle />
                                </IconButton>
                              ) : (
                                <IconButton
                                  onClick={() => handleBanConsultant(consultant.userId)}
                                  sx={{ 
                                    color: '#ef4444', 
                                    '&:hover': { background: 'rgba(239, 68, 68, 0.1)' },
                                  }}
                                  title="Ban consultant"
                                >
                                  <FaBan />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* Buyers Tab */}
        {activeTab === 'buyers' && (
          <Box>
            {buyersLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <CircularProgress sx={{ color: '#0db4bc', mb: 2 }} />
                <Typography sx={{ color: '#666' }}>Loading buyers...</Typography>
              </Box>
            )}

            {!buyersLoading && buyers.length === 0 && (
              <Box sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, p: 8, textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <FaUser style={{ fontSize: 64, color: '#0db4bc', marginBottom: 16 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>No Buyers Yet</Typography>
                <Typography sx={{ color: '#666' }}>Buyers will appear here once they sign up.</Typography>
              </Box>
            )}

            {!buyersLoading && buyers.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 3 }}>All Buyers</Typography>
                <TableContainer component={Box} sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: 'linear-gradient(135deg, #0db4bc 0%, #0a8b91 100%)' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Buyer</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Jobs Posted</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Total Spent</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Joined</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {buyers.map((buyer) => (
                        <TableRow key={buyer.id} sx={{ '&:hover': { background: 'rgba(13, 180, 188, 0.05)' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              {buyer.avatar ? (
                                <Avatar src={buyer.avatar} sx={{ width: 40, height: 40 }} />
                              ) : (
                                <FaUserCircle style={{ fontSize: '40px', color: '#ccc' }} />
                              )}
                              <Typography sx={{ fontWeight: 600, color: '#1a1a1a' }}>{buyer.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#666' }}>{buyer.email}</TableCell>
                          <TableCell sx={{ color: '#666' }}>{buyer.phone}</TableCell>
                          <TableCell sx={{ color: '#666' }}>{buyer.totalJobsPosted}</TableCell>
                          <TableCell sx={{ color: '#666' }}>PKR {buyer.totalSpent.toLocaleString()}</TableCell>
                          <TableCell sx={{ color: '#666' }}>{buyer.joinedDate}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {buyer.isBanned ? (
                                <>
                                  <Chip label="Banned" size="small" sx={{ background: '#ef4444', color: 'white', fontWeight: 600 }} />
                                  <IconButton onClick={() => handleUnbanBuyer(buyer.id)} sx={{ color: '#22c55e', '&:hover': { background: 'rgba(34, 197, 94, 0.1)' } }}>
                                    <FaCheckCircle />
                                  </IconButton>
                                </>
                              ) : (
                                <IconButton onClick={() => handleBanBuyer(buyer.id)} sx={{ color: '#ef4444', '&:hover': { background: 'rgba(239, 68, 68, 0.1)' } }}>
                                  <FaBan />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <Box>
            {reviewsLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <CircularProgress sx={{ color: '#0db4bc', mb: 2 }} />
                <Typography sx={{ color: '#666' }}>Loading reviews...</Typography>
              </Box>
            )}

            {!reviewsLoading && reviews.length === 0 && (
              <Box sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, p: 8, textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
                <FaStar style={{ fontSize: 64, color: '#0db4bc', marginBottom: 16 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>No Reviews Yet</Typography>
                <Typography sx={{ color: '#666' }}>Reviews will appear here once buyers submit them.</Typography>
              </Box>
            )}

            {!reviewsLoading && reviews.length > 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white', mb: 3 }}>All Reviews & Ratings</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reviews.map((review) => (
                    <Box
                      key={review._id}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 3,
                        p: 3,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} style={{ color: star <= review.rating ? '#ffc107' : '#e0e0e0' }} />
                          ))}
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', ml: 1 }}>({review.rating}/5)</Typography>
                        </Box>
                        <IconButton onClick={() => handleDeleteReview(review._id)} sx={{ color: '#ef4444' }}>
                          <FaTrash />
                        </IconButton>
                      </Box>

                      <Typography sx={{ color: '#666', mb: 2, fontStyle: 'italic' }}>{review.comment}</Typography>

                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, p: 2, background: 'rgba(13, 180, 188, 0.05)', borderRadius: 2 }}>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Buyer:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>
                            {review.buyerId?.firstName} {review.buyerId?.lastName}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: '#666' }}>{review.buyerId?.email}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Consultant:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>
                            {review.consultantId?.firstName} {review.consultantId?.lastName}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: '#666' }}>{review.consultantId?.email}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '12px', color: '#666', mb: 0.5 }}>Job:</Typography>
                          <Typography sx={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>
                            {review.jobId?.title || 'N/A'}
                          </Typography>
                          <Typography sx={{ fontSize: '12px', color: '#666' }}>
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>

                {reviewsTotalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
                    <Button
                      disabled={reviewsPage === 1}
                      onClick={() => setReviewsPage((prev) => prev - 1)}
                      sx={{ px: 3, py: 1, borderRadius: 2, border: '2px solid white', color: 'white', textTransform: 'none', fontWeight: 600 }}
                    >
                      Previous
                    </Button>
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      Page {reviewsPage} of {reviewsTotalPages}
                    </Typography>
                    <Button
                      disabled={reviewsPage === reviewsTotalPages}
                      onClick={() => setReviewsPage((prev) => prev + 1)}
                      sx={{ px: 3, py: 1, borderRadius: 2, border: '2px solid white', color: 'white', textTransform: 'none', fontWeight: 600 }}
                    >
                      Next
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <Box sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <ContactManagement />
          </Box>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <Box sx={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 3, p: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Withdrawal Requests
              </Typography>
              <Button
                onClick={fetchWithdrawals}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                Refresh
              </Button>
            </Box>

            {withdrawalsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : withdrawals.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: '#666', py: 4 }}>
                No withdrawal requests
              </Typography>
            ) : (
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ background: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Consultant</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Requested Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawals.map((withdrawal: any) => (
                      <TableRow key={withdrawal._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              src={withdrawal.consultantProfile?.profileImage}
                              sx={{ width: 32, height: 32 }}
                            >
                              {withdrawal.consultantName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {withdrawal.consultantName || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                {withdrawal.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography sx={{ fontWeight: 700, color: '#0db4bc' }}>
                            Rs {withdrawal.amount?.toLocaleString() || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {withdrawal.withdrawalMethod?.type?.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={withdrawal.status?.toUpperCase()}
                            color={
                              withdrawal.status === 'pending' ? 'warning' :
                              withdrawal.status === 'approved' ? 'info' :
                              withdrawal.status === 'processing' ? 'warning' :
                              withdrawal.status === 'completed' ? 'success' :
                              'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {withdrawal.requestedAt ? new Date(withdrawal.requestedAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowWithdrawalModal(true);
                            }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Box>

      {/* Documents Modal */}
      <Modal
        open={showDocuments && selectedConsultant !== null}
        onClose={() => { setShowDocuments(false); setSelectedConsultant(null); }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              Consultant Details & Documents
            </Typography>
            <IconButton onClick={() => { setShowDocuments(false); setSelectedConsultant(null); }} sx={{ color: '#666' }}>
              <FaTimes />
            </IconButton>
          </Box>

          {selectedConsultant && (
            <>
              <Box sx={{ display: 'flex', gap: 3, mb: 4, p: 3, background: 'rgba(13, 180, 188, 0.05)', borderRadius: 2 }}>
                {selectedConsultant.avatar ? (
                  <Avatar src={selectedConsultant.avatar} sx={{ width: 100, height: 100 }} />
                ) : (
                  <FaUserCircle style={{ fontSize: '100px', color: '#ccc' }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                    {selectedConsultant.name}
                  </Typography>
                  <Typography sx={{ color: '#0db4bc', mb: 1 }}>{selectedConsultant.title}</Typography>
                  <Typography sx={{ color: '#666', mb: 2 }}>{selectedConsultant.email}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: '#666' }}>Experience:</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedConsultant.experience}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: '#666' }}>Rate:</Typography>
                      <Typography sx={{ fontWeight: 600 }}>PKR {selectedConsultant.hourlyRate}/hr</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '12px', color: '#666' }}>Status:</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{selectedConsultant.status}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 2 }}>
                  Identity Documents
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  {selectedConsultant.idCardFront && (
                    <Box sx={{ border: '2px solid rgba(13, 180, 188, 0.2)', borderRadius: 2, p: 2 }}>
                      <Typography sx={{ fontWeight: 600, mb: 1 }}>ID Card (Front)</Typography>
                      {selectedConsultant.idCardFront.startsWith('data:') && (
                        <Box
                          component="img"
                          src={selectedConsultant.idCardFront}
                          alt="ID Card Front"
                          sx={{ width: '100%', borderRadius: 1 }}
                        />
                      )}
                    </Box>
                  )}
                  {selectedConsultant.idCardBack && (
                    <Box sx={{ border: '2px solid rgba(13, 180, 188, 0.2)', borderRadius: 2, p: 2 }}>
                      <Typography sx={{ fontWeight: 600, mb: 1 }}>ID Card (Back)</Typography>
                      {selectedConsultant.idCardBack.startsWith('data:') && (
                        <Box
                          component="img"
                          src={selectedConsultant.idCardBack}
                          alt="ID Card Back"
                          sx={{ width: '100%', borderRadius: 1 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>

              {selectedConsultant.status === 'pending' && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => handleDeclineConsultant(selectedConsultant.id)}
                    startIcon={<FaTimesCircle />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      border: '2px solid #ef4444',
                      color: '#ef4444',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { background: 'rgba(239, 68, 68, 0.1)' },
                    }}
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => handleApproveConsultant(selectedConsultant.id)}
                    startIcon={<FaCheckCircle />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #0db4bc 0%, #2d5a5f 100%)',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(13, 180, 188, 0.4)',
                      '&:hover': { boxShadow: '0 6px 16px rgba(13, 180, 188, 0.6)' },
                    }}
                  >
                    Approve Consultant
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Modal>

      {/* Withdrawal Management Modal */}
      <Modal
        open={showWithdrawalModal && selectedWithdrawal !== null}
        onClose={() => { setShowWithdrawalModal(false); setSelectedWithdrawal(null); }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '600px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
              Manage Withdrawal Request
            </Typography>
            <IconButton onClick={() => { setShowWithdrawalModal(false); setSelectedWithdrawal(null); }} sx={{ color: '#666' }}>
              <FaTimes />
            </IconButton>
          </Box>

          {selectedWithdrawal && (
            <>
              <Box sx={{ p: 2, background: 'rgba(13, 180, 188, 0.05)', borderRadius: 2, mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                      Consultant
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 700, mt: 0.5 }}>
                      {selectedWithdrawal.consultantName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                      Amount
                    </Typography>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#0db4bc', mt: 0.5 }}>
                      Rs {selectedWithdrawal.amount?.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                      Method
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, mt: 0.5 }}>
                      {selectedWithdrawal.withdrawalMethod?.type?.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>
                      Current Status
                    </Typography>
                    <Chip 
                      label={selectedWithdrawal.status?.toUpperCase()} 
                      size="small"
                      sx={{ mt: 0.5 }}
                      color={
                        selectedWithdrawal.status === 'pending' ? 'warning' :
                        selectedWithdrawal.status === 'approved' ? 'info' :
                        selectedWithdrawal.status === 'processing' ? 'warning' :
                        selectedWithdrawal.status === 'completed' ? 'success' :
                        'error'
                      }
                    />
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {selectedWithdrawal.status === 'pending' && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleApproveWithdrawal(selectedWithdrawal._id)}
                      sx={{
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.2,
                        '&:hover': { boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)' },
                      }}
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => {
                        if (window.confirm('Reject this withdrawal request?')) {
                          handleRejectWithdrawal(selectedWithdrawal._id);
                        }
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.2,
                        '&:hover': { boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)' },
                      }}
                    >
                      ✕ Reject
                    </Button>
                  </>
                )}

                {selectedWithdrawal.status === 'approved' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleStartProcessing(selectedWithdrawal._id)}
                    sx={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      fontWeight: 600,
                      py: 1.2,
                      '&:hover': { boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)' },
                    }}
                  >
                    ⟳ Start Processing
                  </Button>
                )}

                {selectedWithdrawal.status === 'processing' && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCompleteWithdrawal(selectedWithdrawal._id)}
                    sx={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      fontWeight: 600,
                      py: 1.2,
                      '&:hover': { boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)' },
                    }}
                  >
                    ✓ Mark as Complete
                  </Button>
                )}

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => { setShowWithdrawalModal(false); setSelectedWithdrawal(null); }}
                  sx={{ color: '#666' }}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminDashboardPage;
