import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaStar, FaMapMarkerAlt, FaUserCircle, FaEnvelope, FaBriefcase, FaClock, FaDollarSign, FaCheckCircle, FaTimesCircle, FaFileAlt, FaAward, FaChevronDown, FaChevronUp, FaComments } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { orderService } from '../services/orderService';
import reviewService from '../services/reviewService';
import { analyticsService } from '../services/analytics.service';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../context/NotificationContext';
import styles from './BuyerDashboardPage.module.css';


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
  const { showNotification, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState<'browse' | 'myJobs' | 'proposals' | 'orders' | 'stats'>('browse');
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
  const [orders, setOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    city: '',
    specialization: '',
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
      // Refresh user data from backend to get latest profile image
      const refreshUser = async () => {
        try {
          const response = await httpClient.get('/users/me');
          if (response.data?.data) {
            const backendUser = response.data.data;
            const normalizedUser = {
              ...backendUser,
              // Ensure we always have an `id` field for client-side logic
              id: backendUser.id ?? backendUser._id ?? user.id,
            };
            // Update localStorage with latest normalized data
            localStorage.setItem('expert_raah_user', JSON.stringify(normalizedUser));
            setCurrentUser(normalizedUser);
          }
        } catch (err) {
          // Silently fail, use cached data
          console.log('Could not refresh user data');
        }
      };
      refreshUser();
    } else {
      // Redirect to login if not authenticated
      navigate('/login');
    }
  }, [navigate]);

  const fetchMyJobs = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.id) {
        setJobsLoading(false);
        setMyJobs([]);
        return;
      }
      setJobsLoading(true);
      setJobsError('');
      const response = await httpClient.get(`/jobs/buyer/${user.id}`);
      const jobsData = response.data?.data ?? [];
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
      setUnreadMessageCount(prev => prev + 1);
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
    
    // Connect to socket
    connect();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchUnreadMessageCount, 10000);
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, []);

  const fetchConsultants = async () => {
    try {
      setConsultantsLoading(true);
      const response = await httpClient.get('/consultants?isVerified=true');
      const consultantsData = response.data?.data?.consultants || response.data?.data || [];
      
      // Transform data to match component structure
      const transformedConsultants = consultantsData.map((c: any) => ({
        id: c._id,
        userId: c.userId?._id,
        name: c.userId?.name || 'Unknown',
        title: c.title,
        category: c.specialization?.[0] || 'General',
        rating: c.averageRating || c.rating || 0,
        totalReviews: c.totalReviews || 0,
        location: c.city || 'Pakistan',
        city: c.city || '',
        specialization: Array.isArray(c.specialization) ? c.specialization.join(', ') : c.specialization,
        specializationArray: Array.isArray(c.specialization) ? c.specialization : [c.specialization],
        bio: c.bio || '',
        hourlyRate: `Rs ${c.hourlyRate?.toLocaleString()}/hr`,
        availability: c.availability === 'available' ? 'Available' : 
                     c.availability === 'limited' ? 'Limited Availability' : 'Unavailable',
        avatar: c.userId?.profileImage || null,
        isOnline: c.userId?.isOnline ?? false,
      }));
      
      setConsultants(transformedConsultants);
    } catch (error) {
      console.error('Failed to fetch consultants', error);
    } finally {
      setConsultantsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.id) {
        setOrdersLoading(false);
        setOrders([]);
        return;
      }

      setOrdersLoading(true);
      setOrdersError('');

      setOrdersLoading(true);
      setOrdersError('');
      
      const ordersData = await orderService.getOrdersByBuyer(user.id);
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
      showNotification(error.response?.data?.message || 'Failed to confirm completion. Please try again.', 'error');
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
      showNotification(error.response?.data?.message || 'Failed to submit review. Please try again.', 'error');
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
      if (!user?.id) {
        setProposalsLoading(false);
        setProposals([]);
        return;
      }
      setProposalsLoading(true);
      setProposalsError('');
      const response = await httpClient.get(`/proposals/buyer/${user.id}`);
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
    showConfirm(
      'Are you sure you want to delete this job?',
      async () => {
        try {
          await httpClient.delete(`/jobs/${jobId}`);
          await fetchMyJobs();
          showNotification('Job deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete job', error);
          showNotification('Failed to delete job. Please try again.', 'error');
        }
      }
    );
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
          await httpClient.patch(`/proposals/${proposalId}/accept`);
          // Navigate to payment page with bid amount
          navigate('/payment', { state: { amount: bidAmount, proposalId } });
          // Refresh proposals list
          await fetchProposals();
        } catch (error) {
          console.error('Failed to accept proposal', error);
          showNotification('Failed to accept proposal. Please try again.', 'error');
        }
      }
    );
  };

  const handleRejectProposal = async (proposalId: string) => {
    showConfirm(
      'Are you sure you want to decline this proposal?',
      async () => {
        try {
          await httpClient.patch(`/proposals/${proposalId}/reject`);
          showNotification('Proposal declined successfully.', 'success');
          // Refresh proposals list
          await fetchProposals();
        } catch (error) {
          console.error('Failed to reject proposal', error);
          showNotification('Failed to decline proposal. Please try again.', 'error');
        }
      }
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/src/assets/logo.png" alt="Expert Raah" className={styles.logoImage} />
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${activeTab === 'browse' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'myJobs' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('myJobs')}
          >
            My Jobs
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'proposals' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            Proposals
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'stats' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
        </nav>

        <div className={styles.headerActions}>
          <button className={styles.notificationButton} onClick={() => navigate('/messages')}>
            <FaComments />
            {unreadMessageCount > 0 && (
              <span className={styles.notificationBadge}>{unreadMessageCount}</span>
            )}
          </button>
          <div className={styles.userProfileContainer}>
            <div 
              className={styles.userProfile} 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              style={{ cursor: 'pointer' }}
            >
              {currentUser?.profileImage ? (
                <img 
                  src={currentUser.profileImage} 
                  alt={currentUser?.name || 'User'} 
                  className={styles.userAvatar} 
                />
              ) : (
                <FaUserCircle className={styles.defaultAvatar} />
              )}
              <span className={styles.userName}>{currentUser?.name || 'Loading...'}</span>
              <span className={`${styles.userDropdown} ${showProfileDropdown ? styles.dropdownOpen : ''}`}>▼</span>
            </div>

            {showProfileDropdown && (
              <div className={styles.profileDropdownMenu}>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate('/profile');
                    setShowProfileDropdown(false);
                  }}
                >
                  👤 My Profile
                </button>
                <button 
                  className={styles.dropdownItem}
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileDropdown(false);
                  }}
                >
                  ⚙️ Settings
                </button>
                <div className={styles.dropdownDivider}></div>
                <button 
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {activeTab === 'stats' ? (
          <>
            {/* Stats View */}
            <main className={styles.comingSoonContent}>
              <div className={styles.comingSoonCard}>
                <div className={styles.comingSoonIcon}>📊</div>
                <h2 className={styles.comingSoonTitle}>Statistics Dashboard</h2>
                <p className={styles.comingSoonText}>Coming Soon</p>
                <p className={styles.comingSoonDescription}>
                  We're working on bringing you detailed analytics and insights about your projects, spending, and consultant performance.
                </p>
              </div>
            </main>
          </>
        ) : activeTab === 'orders' ? (
          <>
            {/* Orders View */}
            <main className={styles.ordersContent}>
              <h2 className={styles.ordersTitle}>Active Orders</h2>
              <p className={styles.ordersSubtitle}>Track your ongoing projects</p>

              {ordersLoading && <p className={styles.myJobsInfoText}>Loading orders...</p>}
              {ordersError && <p className={styles.myJobsErrorText}>{ordersError}</p>}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className={styles.myJobsEmpty}>
                  <p className={styles.myJobsEmptyText}>No active orders yet.</p>
                  <p className={styles.myJobsEmptySubtext}>Accept a proposal to start your first order.</p>
                </div>
              )}

              <div className={styles.ordersList}>
                {!ordersLoading && !ordersError && orders.map((order) => (
                  <div key={order._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderTitleSection}>
                        <h3 className={styles.orderJobTitle}>{order.jobId?.title || 'Untitled Job'}</h3>
                        <span className={styles.orderIdBadge}>
                          {order._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                        {order.status === 'in_progress' ? 'In Progress' : 
                         order.status === 'completed' ? 'Completed' : 
                         order.status === 'cancelled' ? 'Cancelled' : order.status}
                      </span>
                    </div>

                    <div className={styles.orderConsultant}>
                      <img 
                        src={order.consultantId?.userId?.profileImage || 'https://i.pravatar.cc/150?img=1'} 
                        alt={order.consultantId?.userId?.name || 'Consultant'} 
                        className={styles.orderConsultantAvatar} 
                      />
                      <div className={styles.orderConsultantInfo}>
                        <h4 className={styles.orderConsultantName}>
                          {order.consultantId?.userId?.name || 'Unknown Consultant'}
                        </h4>
                        <p className={styles.orderConsultantTitle}>
                          {order.consultantId?.title || 'Consultant'}
                        </p>
                      </div>
                    </div>

                    <div className={styles.orderDetails}>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Total Amount</span>
                        <span className={styles.detailValue}>
                          Rs {order.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Paid</span>
                        <span className={styles.detailValue}>
                          Rs {order.amountPaid?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Pending</span>
                        <span className={styles.detailValue}>
                          Rs {order.amountPending?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Progress</span>
                        <span className={styles.detailValue}>{order.progress || 0}%</span>
                      </div>
                    </div>

                    <div className={styles.orderProgressBar}>
                      <div 
                        className={styles.orderProgressFill} 
                        style={{ width: `${order.progress || 0}%` }}
                      ></div>
                    </div>

                    {order.completionRequestedAt && order.status === 'in_progress' && (
                      <div className={styles.completionAlert}>
                        <strong>🔔 Completion Request</strong>
                        <p>The consultant has requested to mark this order as complete. Please review and confirm.</p>
                      </div>
                    )}

                    <div className={styles.orderActions}>
                      <button 
                        className={styles.viewProfileButton}
                        onClick={() => order.consultantId?._id && 
                          navigate(`/consultant/${order.consultantId._id}`)
                        }
                      >
                        View Profile
                      </button>
                      <button 
                        className={styles.messageConsultantButton}
                        onClick={() => order.consultantId?.userId?._id && 
                          navigate(`/messages/${order.consultantId.userId._id}`)
                        }
                      >
                        <FaEnvelope /> Message
                      </button>
                      {order.completionRequestedAt && order.status === 'in_progress' && (
                        <button 
                          className={styles.confirmCompletionButton}
                          onClick={() => handleConfirmCompletion(order)}
                        >
                          Confirm Completion
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </>
        ) : activeTab === 'proposals' ? (
          <>
            {/* Proposals View */}
            <main className={styles.proposalsContent}>
              <h2 className={styles.proposalsTitle}>Proposals Received</h2>
              <p className={styles.proposalsSubtitle}>Review and accept proposals from consultants</p>

              {proposalsLoading && <p className={styles.myJobsInfoText}>Loading proposals...</p>}
              {proposalsError && <p className={styles.myJobsErrorText}>{proposalsError}</p>}

              {!proposalsLoading && !proposalsError && proposals.length === 0 && (
                <div className={styles.myJobsEmpty}>
                  <p>No proposals received yet. Post a job to receive proposals from consultants.</p>
                </div>
              )}

              {!proposalsLoading && !proposalsError && proposals.length > 0 && (
                <div className={styles.proposalsList}>
                  {proposals.map((proposal) => {
                    // Safely access nested properties
                    const jobTitle = proposal.jobId?.title || 'Untitled Job';
                    const jobDescription = proposal.jobId?.description || 'No description available';
                    const jobCategory = proposal.jobId?.category || 'General';
                    const jobBudget = proposal.jobId?.budget || { min: 0, max: 0 };
                    
                    const consultantName = proposal.consultantId?.userId?.name || 'Unknown Consultant';
                    const consultantTitle = proposal.consultantId?.title || 'Consultant';
                    const consultantImage = proposal.consultantId?.userId?.profileImage;
                    const consultantRating = proposal.consultantId?.averageRating || proposal.consultantId?.rating || 0;
                    const consultantTotalReviews = proposal.consultantId?.totalReviews || 0;
                    const consultantExperience = proposal.consultantId?.experience || 'N/A';

                    return (
                      <div key={proposal._id} className={styles.proposalCard}>
                        <div className={styles.proposalHeader}>
                          <div className={styles.jobTitleSection}>
                            <div className={styles.jobTitleWrapper}>
                              <FaBriefcase className={styles.jobIcon} />
                              <button
                                type="button"
                                className={styles.proposalJobTitleButton}
                                onClick={() => {
                                  // Track proposal click for analytics
                                  analyticsService.recordProposalClick(proposal.consultantId._id, proposal._id);
                                  
                                  setExpandedProposalId(
                                    expandedProposalId === proposal._id ? null : proposal._id,
                                  );
                                }}
                              >
                                {jobTitle}
                                {expandedProposalId === proposal._id ? <FaChevronUp className={styles.chevronIcon} /> : <FaChevronDown className={styles.chevronIcon} />}
                              </button>
                            </div>
                            <span className={`${styles.categoryBadge} ${styles[jobCategory.toLowerCase()]}`}>
                              {jobCategory}
                            </span>
                          </div>
                        </div>

                        <div className={styles.proposalContent}>
                          <div className={styles.consultantSection}>
                            {consultantImage ? (
                              <img 
                                src={consultantImage} 
                                alt={consultantName} 
                                className={styles.proposalAvatar} 
                              />
                            ) : (
                              <FaUserCircle className={styles.proposalAvatarDefault} />
                            )}
                            <div className={styles.consultantDetails}>
                              <h4 className={styles.proposalConsultantName}>
                                {consultantName}
                              </h4>
                              <p className={styles.proposalConsultantTitle}>
                                {consultantTitle}
                              </p>
                              <div className={styles.consultantMeta}>
                                <div className={styles.rating}>
                                  {[...Array(5)].map((_, i) => (
                                    <FaStar 
                                      key={i} 
                                      className={
                                        i < Math.floor(consultantRating) 
                                          ? styles.starFilled 
                                          : styles.starEmpty
                                      } 
                                    />
                                  ))}
                                  <span className={styles.ratingValue}>
                                    {consultantRating.toFixed(1)}
                                  </span>
                                  <span className={styles.reviewCount}>
                                    ({consultantTotalReviews} {consultantTotalReviews === 1 ? 'review' : 'reviews'})
                                  </span>
                                </div>
                                <div className={styles.experienceWrapper}>
                                  <FaAward className={styles.experienceIcon} />
                                  <span className={styles.experience}>
                                    {consultantExperience}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className={styles.proposalDetails}>
                            <div className={styles.proposalBid}>
                              <div className={styles.bidItem}>
                                <div className={styles.bidIconLabel}>
                                  <FaDollarSign className={styles.bidIcon} />
                                  <span className={styles.bidLabel}>Bid Amount</span>
                                </div>
                                <span className={styles.bidValue}>
                                  Rs {proposal.bidAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className={styles.bidItem}>
                                <div className={styles.bidIconLabel}>
                                  <FaClock className={styles.bidIcon} />
                                  <span className={styles.bidLabel}>Delivery Time</span>
                                </div>
                                <span className={styles.bidValue}>{proposal.deliveryTime}</span>
                              </div>
                              <div className={styles.bidItem}>
                                <div className={styles.bidIconLabel}>
                                  {proposal.status === 'accepted' ? <FaCheckCircle className={styles.bidIcon} /> : 
                                   proposal.status === 'rejected' ? <FaTimesCircle className={styles.bidIcon} /> : 
                                   <FaFileAlt className={styles.bidIcon} />}
                                  <span className={styles.bidLabel}>Status</span>
                                </div>
                                <span className={`${styles.bidValue} ${styles[`status_${proposal.status}`]}`}>
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </span>
                              </div>
                            </div>

                            {expandedProposalId === proposal._id && (
                              <div className={styles.jobDescriptionBlock}>
                                <h5 className={styles.jobDescriptionTitle}>Job Description</h5>
                                <p className={styles.jobDescriptionText}>
                                  {jobDescription}
                                </p>
                                <div className={styles.jobBudgetInfo}>
                                  <span className={styles.bidLabel}>Job Budget:</span>
                                  <span className={styles.bidValue}>
                                    {formatBudget(jobBudget)}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className={styles.coverLetter}>
                              <div className={styles.sectionTitleWrapper}>
                                <FaFileAlt className={styles.sectionIcon} />
                                <h5 className={styles.coverLetterTitle}>Cover Letter</h5>
                              </div>
                              <p className={styles.coverLetterText}>{proposal.coverLetter}</p>
                            </div>

                            <div className={styles.proposalActions}>
                              <button 
                                className={styles.viewProfileButton}
                                onClick={() => proposal.consultantId?._id && 
                                  navigate(`/consultant/${proposal.consultantId._id}`)
                                }
                              >
                                View Profile
                              </button>
                              {proposal.status === 'pending' && (
                                <>
                                  <button 
                                    className={styles.acceptButton}
                                    onClick={() => handleAcceptProposal(proposal._id, proposal.bidAmount)}
                                  >
                                    Accept & Pay
                                  </button>
                                  <button 
                                    className={styles.rejectButton}
                                    onClick={() => handleRejectProposal(proposal._id)}
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                            </div>

                            {proposal.status === 'accepted' && (
                              <div className={styles.proposalStatusMessage}>
                                <FaCheckCircle className={styles.statusIcon} />
                                <span className={styles.acceptedMessage}>
                                  Proposal Accepted - Order Created
                                </span>
                              </div>
                            )}

                            {proposal.status === 'rejected' && (
                              <div className={styles.proposalStatusMessage}>
                                <FaTimesCircle className={styles.statusIcon} />
                                <span className={styles.rejectedMessage}>
                                  Proposal Declined
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </>
        ) : activeTab === 'myJobs' ? (
          <>
            {/* My Jobs View */}
            <main className={styles.myJobsContent}>
              <h2 className={styles.myJobsTitle}>My Posted Jobs</h2>
              <p className={styles.myJobsSubtitle}>Manage jobs you have posted for consultants</p>

              {jobsLoading && <p className={styles.myJobsInfoText}>Loading your jobs...</p>}
              {jobsError && <p className={styles.myJobsErrorText}>{jobsError}</p>}

              {!jobsLoading && !jobsError && myJobs.length === 0 && (
                <div className={styles.myJobsEmpty}>
                  <p>You haven't posted any jobs yet.</p>
                  <button className={styles.postJobButton} onClick={() => navigate('/post-job')}>
                    <FaPlus /> Post your first Job
                  </button>
                </div>
              )}

              {!jobsLoading && !jobsError && myJobs.length > 0 && (
                <div className={styles.myJobsList}>
                  {myJobs.map((job) => (
                    <div key={job._id} className={styles.myJobCard}>
                      <div className={styles.myJobHeader}>
                        <div>
                          <h3 className={styles.myJobTitle}>{job.title}</h3>
                          <div className={styles.myJobMeta}>
                            <span className={styles.myJobCategory}>{job.category}</span>
                            <span className={styles.myJobLocation}>{job.location}</span>
                            <span className={styles.myJobDate}>
                              Posted on {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <span className={`${styles.myJobStatus} ${styles[job.status]}`}>
                          {job.status === 'open' ? 'Open' : job.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className={styles.myJobDescription}>{job.description}</p>

                      <div className={styles.myJobFooter}>
                        <span className={styles.myJobBudgetLabel}>Budget:</span>
                        <span className={styles.myJobBudgetValue}>{formatBudget(job.budget)}</span>

                        <div className={styles.myJobActions}>
                          <button
                            className={styles.editJobButton}
                            onClick={() => navigate(`/post-job/${job._id}`)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteJobButton}
                            onClick={() => handleDeleteJob(job._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        ) : (
          <>
            {/* Sidebar Filters */}
            <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3 className={styles.sidebarTitle}>▼ Filters</h3>
            
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Consultancy Type</h4>
              <select className={styles.select} value={filters.specialization} onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}>
                <option value="">All Types</option>
                <option value="LEGAL">Legal</option>
                <option value="EDUCATION">Education</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Location</h4>
              <select className={styles.select} value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
                <option value="">All Cities</option>
                <option value="Rawalpindi">Rawalpindi</option>
                <option value="Islamabad">Islamabad</option>
                <option value="Lahore">Lahore</option>
                <option value="Karachi">Karachi</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Center Content */}
        <main className={styles.centerContent}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <input type="text" placeholder="Search Consultants" className={styles.searchInput} />
          </div>

          {/* Post Job Button */}
          <button className={styles.postJobButton} onClick={() => navigate('/post-job')}>
            <FaPlus /> Post a Job
          </button>

          {/* Consultant Listings */}
          <div className={styles.projectList}>
            {consultantsLoading ? (
              <div className={styles.loadingState}>Loading consultants...</div>
            ) : consultants.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No consultants available at the moment.</p>
              </div>
            ) : (
              consultants
                .filter(consultant => {
                  // Filter by city
                  if (filters.city && consultant.city !== filters.city) {
                    return false;
                  }
                  // Filter by specialization
                  if (filters.specialization && !consultant.specializationArray?.includes(filters.specialization)) {
                    return false;
                  }
                  return true;
                })
                .map((consultant) => (
                <div key={consultant.id} className={styles.projectCard}>
                  {/* Card Header with Avatar and Basic Info */}
                  <div className={styles.consultantCardHeader}>
                    <div className={styles.avatarSection}>
                      {consultant.avatar ? (
                        <img src={consultant.avatar} alt={consultant.name} className={styles.consultantAvatarLarge} />
                      ) : (
                        <FaUserCircle className={styles.consultantAvatarDefault} style={{ fontSize: '70px', color: '#ccc' }} />
                      )}
                      {consultant.isOnline && <div className={styles.onlineIndicator}></div>}
                    </div>
                    
                    <div className={styles.headerInfoSection}>
                      <div className={styles.nameAndBadge}>
                        <h3 className={styles.consultantNameLarge}>{consultant.name}</h3>
                        <span className={`${styles.categoryBadge} ${styles[consultant.category.toLowerCase()]}`}>
                          {consultant.category}
                        </span>
                      </div>
                      <p className={styles.consultantTitleLarge}>{consultant.title}</p>
                      
                      {/* Location Display */}
                      <div className={styles.locationSection}>
                        <FaMapMarkerAlt className={styles.locationIconSmall} />
                        <span className={styles.locationText}>{consultant.location}</span>
                      </div>
                      
                      {/* Rating Display */}
                      <div className={styles.ratingSection}>
                        <div className={styles.ratingStars}>
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < Math.floor(consultant.rating) ? styles.starFilled : styles.starEmpty} />
                          ))}
                        </div>
                        <span className={styles.ratingValueLarge}>{consultant.rating.toFixed(1)}/5</span>
                        <span className={styles.reviewCount}>({consultant.totalReviews || 0} {consultant.totalReviews === 1 ? 'review' : 'reviews'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialization Section */}
                  <div className={styles.consultantSpecializationEnhanced}>
                    <strong>Specialization:</strong> {consultant.specialization}
                  </div>

                  {/* Bio/Description */}
                  <p className={styles.projectDescription}>{consultant.bio}</p>

                  {/* Footer with Rate and Actions */}
                  <div className={styles.projectFooter}>
                    <div className={styles.rateAndAvailability}>
                      <div className={styles.rateDisplay}>
                        <FaDollarSign className={styles.rateIcon} />
                        <span className={styles.rateValue}>{consultant.hourlyRate}</span>
                      </div>
                      <span className={styles.availability}>{consultant.availability}</span>
                    </div>
                    <div className={styles.projectActions}>
                      <button
                        className={styles.messageButton}
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
                        title={
                          consultant.userId
                            ? 'Message Consultant'
                            : 'Consultant profile incomplete'
                        }
                      >
                        <FaEnvelope /> Message
                      </button>
                      <button 
                        className={styles.viewProfileButton}
                        onClick={() => consultant.id && navigate(`/consultant/${consultant.id}`)}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
          </>
        )}

        {/* Right Sidebar - Messages */}
        {activeTab !== 'proposals' && activeTab !== 'orders' && (
          <aside className={styles.rightSidebar}>
            <div className={styles.messagesSection}>
              <div className={styles.messagesSectionHeader}>
                <h3 className={styles.messagesTitle}>Messages</h3>
              </div>
              <p className={styles.messagesDescription}>
                Your conversations with consultants now live in the dedicated Messaging Center.
              </p>
              <button
                className={styles.openMessagesButton}
                onClick={() =>
                  navigate('/messages', {
                    state: currentUser
                      ? {
                          user: {
                            _id: currentUser.id,
                            name: currentUser.name,
                            profileImage: currentUser.profileImage,
                            accountType: currentUser.accountType,
                          },
                        }
                      : undefined,
                  })
                }
              >
                Open Messaging Center
              </button>
              <p className={styles.messagesHint}>Connect with consultants, discuss project details, and manage all communications in one place.</p>
            </div>
          </aside>
        )}
      </div>

      {/* Confirm Completion Modal */}
      {showConfirmCompletionModal && (
        <div className={styles.modalOverlay} onClick={() => !confirmationLoading && setShowConfirmCompletionModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Order Completion</h3>
            <p className={styles.modalMessage}>
              The consultant has requested to mark this order as complete.
            </p>
            <div className={styles.modalOrderInfo}>
              <strong>{selectedOrderForConfirmation?.jobId?.title}</strong>
              <p>By confirming, you acknowledge that the work has been completed satisfactorily.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => setShowConfirmCompletionModal(false)}
                disabled={confirmationLoading}
              >
                Not Yet
              </button>
              <button 
                className={styles.modalConfirmButton}
                onClick={confirmOrderCompletion}
                disabled={confirmationLoading}
              >
                {confirmationLoading ? 'Confirming...' : 'Yes, Mark as Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className={styles.modalOverlay} onClick={() => !reviewLoading && skipReview()}>
          <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Rate Your Experience</h3>
            <p className={styles.modalMessage}>
              How was your experience with this consultant?
            </p>
            <div className={styles.modalOrderInfo}>
              <strong>{reviewOrderData?.jobId?.title || 'Project'}</strong>
              <p>Consultant: {reviewOrderData?.consultantId?.userId?.name || 'Unknown'}</p>
            </div>

            {/* Star Rating */}
            <div className={styles.reviewRating}>
              <label>Rating:</label>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={star <= reviewRating ? styles.starFilled : styles.starEmpty}
                    onClick={() => setReviewRating(star)}
                    style={{ cursor: 'pointer', fontSize: '28px' }}
                  />
                ))}
              </div>
              <span style={{ display: 'inline-block', marginLeft: '16px', fontSize: '16px', fontWeight: '600', color: '#014751' }}>{reviewRating}/5</span>
            </div>

            {/* Comment */}
            <div className={styles.reviewComment}>
              <label>Your Review:</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience working with this consultant..."
                rows={5}
                disabled={reviewLoading}
              />
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelButton}
                onClick={skipReview}
                disabled={reviewLoading}
              >
                Skip for Now
              </button>
              <button 
                className={styles.modalConfirmButton}
                onClick={submitReview}
                disabled={reviewLoading || !reviewComment.trim()}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboardPage;

