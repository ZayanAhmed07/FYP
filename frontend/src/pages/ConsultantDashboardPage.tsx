import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaClock, FaEdit, FaShare, FaHeart, FaUserCircle, FaEnvelope, FaDownload } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import { orderService } from '../services/orderService';
import { useSocket } from '../hooks/useSocket';
import { useNotification } from '../context/NotificationContext';
import RevenueProposalsChart from '../components/charts/RevenueProposalsChart';
import styles from './ConsultantDashboardPage.module.css';

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
  const { showNotification, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'orders' | 'stats' | 'proposals'>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
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
              id: backendUser.id ?? backendUser._id ?? user.id,
            };
            // Update localStorage with latest data
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
    onMessageReceive: (data) => {
      // Increment unread count when new message arrives
      setUnreadMessageCount(prev => prev + 1);
    },
    onUnreadCountUpdate: (data) => {
      // Update unread count in real-time
      fetchUnreadMessageCount();
    },
  });

  const fetchUnreadMessageCount = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.id) return;

      const response = await httpClient.get('/conversations');
      const conversations = response.data?.data || [];
      const totalUnread = conversations.reduce((sum: number, conv: any) => {
        const userUnread = conv.unreadCount?.[user.id] || 0;
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
      
      const total = orders.reduce((sum: number, order: any) => sum + (order.amountPaid || 0), 0);
      const paid = orders
        .filter((o: any) => o.status === 'completed')
        .reduce((sum: number, order: any) => sum + (order.amountPaid || 0), 0);
      const pending = orders
        .filter((o: any) => o.status === 'in_progress')
        .reduce((sum: number, order: any) => sum + (order.amountPending || 0), 0);
      
      setEarnings({ total, paid, pending });
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
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
      if (!user?.id) return;

      const response = await httpClient.get(`/consultants/user/${user.id}`);
      const consultant = response.data?.data;
      if (consultant?._id) {
        setConsultantId(consultant._id);
        setConsultantProfile(consultant);
        fetchOrders(consultant._id);
        fetchProposalStats(consultant._id);
        fetchEarnings(consultant._id);
      }
    } catch (error) {
      console.error('Failed to fetch consultant profile', error);
    }
  };

  const fetchOrders = async (consultantId: string) => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      
      const ordersData = await orderService.getOrdersByConsultant(consultantId);
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
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(job.category);
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(job.status);
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

  const formatBudget = (budget: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    if (!budget.min && !budget.max) return 'Not specified';
    if (budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
  };

  const getFilenameFromBase64 = (base64String: string): string => {
    try {
      const parts = base64String.split(',');
      if (parts.length > 1) {
        const metadata = parts[0];
        if (metadata.includes('filename=')) {
          const match = metadata.match(/filename=([^;]+)/);
          if (match) return decodeURIComponent(match[1]);
        }
      }
    } catch (e) {
      console.error('Error parsing filename from base64', e);
    }
    return `attachment_${new Date().getTime()}`;
  };

  const downloadFile = (base64String: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64String;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download file', error);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(job.category);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(job.status);
    return matchesType && matchesStatus;
  });

  const selectedJob =
    filteredJobs.find((job) => job._id === selectedJobId) || null;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
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
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'projects' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'proposals' ? styles.navItemActive : ''}`}
            onClick={() => navigate('/consultant-proposals')}
          >
            My Proposals
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
            🔔
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
                <img src={currentUser.profileImage} alt={currentUser?.name || 'User'} className={styles.userAvatar} />
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
      <div
        className={`${styles.mainContent} ${
          activeTab === 'projects' ? styles.mainContentProjects : ''
        }`}
      >
        {activeTab === 'dashboard' && (
          <div className={styles.dashboardView}>
            <div className={styles.dashboardLeft}>
              {/* Proposals Section */}
              <div className={styles.statsCard}>
                <div className={styles.statsHeader}>
                  <h3 className={styles.statsTitle}>Proposals</h3>
                  <span className={styles.statsYear}>{new Date().getFullYear()}</span>
                </div>
                <div className={styles.statsList}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Proposals Submitted</span>
                    <span className={styles.statValue}>{proposalStats.total}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Pending</span>
                    <span className={styles.statValue}>{proposalStats.pending}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Accepted</span>
                    <span className={styles.statValue}>{proposalStats.accepted}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Rejected</span>
                    <span className={styles.statValue}>{proposalStats.rejected}</span>
                  </div>
                </div>
              </div>

              {/* Rating Section */}
              <div className={styles.statsCard}>
                <div className={styles.statsHeader}>
                  <h3 className={styles.statsTitle}>Your Rating</h3>
                  <span className={styles.statsYear}>{new Date().getFullYear()}</span>
                </div>
                <div className={styles.statsList}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Average Rating</span>
                    <span className={styles.statValue}>{(consultantProfile?.averageRating || consultantProfile?.rating || 0).toFixed(1)}/5</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Reviews</span>
                    <span className={styles.statValue}>{consultantProfile?.totalReviews || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Completed Projects</span>
                    <span className={styles.statValue}>{consultantProfile?.totalProjects || 0}</span>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div className={styles.statsCard}>
                <div className={styles.statsHeader}>
                  <h3 className={styles.statsTitle}>Earnings</h3>
                  <span className={styles.statsYear}>{new Date().getFullYear()}</span>
                </div>
                <div className={styles.earningsList}>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Total Paid</span>
                    <span className={styles.earningValue}>Rs {earnings.paid.toLocaleString()}</span>
                  </div>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Pending</span>
                    <span className={styles.earningValueRefund}>Rs {earnings.pending.toLocaleString()}</span>
                  </div>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Total Earnings</span>
                    <span className={styles.earningValue}>Rs {earnings.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.overviewCard}>
              <RevenueProposalsChart 
                proposalStats={proposalStats}
                earnings={earnings}
              />
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <>
            {/* Top filters bar, centered */}
            <div className={styles.projectsFiltersTop}>
              <h3 className={styles.filtersTitle}>Filter Projects</h3>
              <div className={styles.filtersRow}>
                <div>
                  <h4 className={styles.filterTitle}>Project Type</h4>
                  <div className={styles.filterChips}>
                    <button
                      className={`${styles.filterChip} ${
                        selectedTypes.includes('Education')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleType('Education')}
                    >
                      Education
                    </button>
                    <button
                      className={`${styles.filterChip} ${
                        selectedTypes.includes('Legal')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleType('Legal')}
                    >
                      Legal
                    </button>
                    <button
                      className={`${styles.filterChip} ${
                        selectedTypes.includes('Business')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleType('Business')}
                    >
                      Business
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className={styles.filterTitle}>Status</h4>
                  <div className={styles.filterChips}>
                    <button
                      className={`${styles.filterChip} ${
                        selectedStatuses.includes('open')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleStatus('open')}
                    >
                      Open
                    </button>
                    <button
                      className={`${styles.filterChip} ${
                        selectedStatuses.includes('in_progress')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleStatus('in_progress')}
                    >
                      In Progress
                    </button>
                    <button
                      className={`${styles.filterChip} ${
                        selectedStatuses.includes('completed')
                          ? styles.filterChipActive
                          : ''
                      }`}
                      onClick={() => toggleStatus('completed')}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Centered jobs + details layout */}
            <div className={styles.projectsLayout}>
              {/* Left Column - Job List */}
              <main className={styles.centerContent}>
                <div className={styles.projectList}>
                  {jobsLoading && <p>Loading projects...</p>}
                  {jobsError && <p>{jobsError}</p>}
                  {!jobsLoading && !jobsError && filteredJobs.length === 0 && (
                    <p>
                      No projects match your filters. Try clearing some filters to
                      see more jobs.
                    </p>
                  )}
                  {!jobsLoading &&
                    !jobsError &&
                    filteredJobs.map((job) => (
                      <div
                        key={job._id}
                        className={`${styles.projectCard} ${
                          selectedJobId === job._id
                            ? styles.projectCardActive
                            : ''
                        }`}
                        onClick={() => setSelectedJobId(job._id)}
                      >
                        <div className={styles.categoryBadge}>{job.category}</div>

                        <h4 className={styles.jobTitle}>{job.title}</h4>

                        <p className={styles.jobDescription}>{job.description}</p>

                        <div className={styles.jobMeta}>
                          <span className={styles.postedTime}>
                            <FaClock /> Posted on{' '}
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className={styles.jobLocation}>
                            <FaMapMarkerAlt /> {job.location}
                          </span>
                        </div>

                        <div className={styles.jobStats}>
                          <div className={styles.statBox}>
                            <div className={styles.statBoxValue}>
                              {job.proposalsCount}
                            </div>
                            <div className={styles.statBoxLabel}>Proposals</div>
                          </div>
                          <div className={styles.statBox}>
                            <div className={styles.statBoxValue}>
                              {job.status === 'open' ? 'Open' : 'Closed'}
                            </div>
                            <div className={styles.statBoxLabel}>Status</div>
                          </div>
                        </div>

                        <div className={styles.jobFooter}>
                          <span className={styles.jobBudget}>
                            {formatBudget(job.budget)}
                          </span>
                          <div className={styles.jobActions}>
                            <button
                              className={styles.actionBtn}
                              title="View details"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedJobId(job._id);
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={styles.actionBtn}
                              title="Save"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaHeart />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </main>

              {/* Right Column - Job Details */}
              <aside className={styles.rightSidebar}>
                {selectedJob ? (
                  <div className={styles.projectDetails}>
                    <h3 className={styles.projectDetailsTitle}>{selectedJob.title}</h3>
                    <div className={styles.projectDetailsMeta}>
                      <span className={styles.projectDetailsMetaItem}>
                        <FaClock /> Posted on{' '}
                        {new Date(selectedJob.createdAt).toLocaleDateString()}
                      </span>
                      <span className={styles.projectDetailsMetaItem}>
                        <FaMapMarkerAlt /> {selectedJob.location}
                      </span>
                      <span className={styles.projectDetailsStatus}>
                        {selectedJob.status === 'open' ? 'Open' : selectedJob.status}
                      </span>
                    </div>

                    <div className={styles.projectDetailsSection}>
                      <h4 className={styles.projectDetailsSectionTitle}>Budget</h4>
                      <p className={styles.projectDetailsValue}>
                        {formatBudget(selectedJob.budget)}
                      </p>
                    </div>

                    <div className={styles.projectDetailsSection}>
                      <h4 className={styles.projectDetailsSectionTitle}>Timeline</h4>
                      <p className={styles.projectDetailsValue}>
                        {selectedJob.timeline || 'Not specified'}
                      </p>
                    </div>

                    <div className={styles.projectDetailsSection}>
                      <h4 className={styles.projectDetailsSectionTitle}>Description</h4>
                      <p className={styles.projectDetailsDescription}>
                        {selectedJob.description}
                      </p>
                    </div>

                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <div className={styles.projectDetailsSection}>
                        <h4 className={styles.projectDetailsSectionTitle}>Required Skills</h4>
                        <div className={styles.projectDetailsSkills}>
                          {selectedJob.skills.map((skill: string) => (
                            <span
                              key={skill}
                              className={styles.projectDetailsSkillBadge}
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                      <div className={styles.projectDetailsSection}>
                        <h4 className={styles.projectDetailsSectionTitle}>Attachments</h4>
                        <div className={styles.projectDetailsAttachments}>
                          {selectedJob.attachments.map((attachment: string, index: number) => (
                            <div key={index} className={styles.projectDetailsAttachmentItem}>
                              <span className={styles.projectDetailsAttachmentName}>
                                {getFilenameFromBase64(attachment)}
                              </span>
                              <button
                                className={styles.projectDetailsDownloadButton}
                                onClick={() =>
                                  downloadFile(
                                    attachment,
                                    getFilenameFromBase64(attachment)
                                  )
                                }
                                title="Download attachment"
                              >
                                <FaDownload />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.projectDetailsActions}>
                      <button
                        className={styles.projectDetailsMessageButton}
                        onClick={() => handleMessageBuyer(selectedJob.buyerId)}
                        disabled={!selectedJob.buyerId?._id}
                      >
                        <FaEnvelope /> Message Buyer
                      </button>
                      <button
                        className={styles.projectDetailsSecondaryButton}
                        onClick={() => setSelectedJobId(null)}
                      >
                        Clear
                      </button>
                      <button
                        className={styles.projectDetailsPrimaryButton}
                        onClick={() =>
                          selectedJob &&
                          navigate(`/submit-proposal/${selectedJob._id}`)
                        }
                        disabled={selectedJob.status !== 'open'}
                      >
                        {selectedJob.status === 'open'
                          ? 'Submit Proposal'
                          : 'Project Closed'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.projectDetailsEmpty}>
                    <p>Select a project to view full details here.</p>
                  </div>
                )}
              </aside>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className={styles.ordersView}>
            <main className={styles.ordersContent}>
              <h2 className={styles.ordersTitle}>My Orders</h2>
              <p className={styles.ordersSubtitle}>Track your ongoing projects and deliveries</p>

              {ordersLoading && <p className={styles.jobsInfoText}>Loading orders...</p>}
              {ordersError && <p className={styles.jobsErrorText}>{ordersError}</p>}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className={styles.jobsEmpty}>
                  <p className={styles.jobsEmptyText}>No active orders yet.</p>
                  <p className={styles.jobsEmptySubtext}>Once a buyer accepts your proposal, your orders will appear here.</p>
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

                    <div className={styles.orderBuyer}>
                      <img 
                        src={order.buyerId?.profileImage || 'https://i.pravatar.cc/150?img=5'} 
                        alt={order.buyerId?.name || 'Buyer'} 
                        className={styles.orderBuyerAvatar} 
                      />
                      <div className={styles.orderBuyerInfo}>
                        <h4 className={styles.orderBuyerName}>
                          {order.buyerId?.name || 'Unknown Buyer'}
                        </h4>
                        <p className={styles.orderBuyerEmail}>
                          {order.buyerId?.email || ''}
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
                        <span className={styles.detailLabel}>Received</span>
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

                    <div className={styles.milestones}>
                      <h4 className={styles.milestonesTitle}>Milestones ({order.milestones?.length || 0})</h4>
                      {order.milestones && order.milestones.length > 0 ? (
                        <div className={styles.milestonesList}>
                          {order.milestones.map((milestone: any) => (
                            <div key={milestone._id} className={styles.milestoneItem}>
                              <span className={styles.milestoneDescription}>{milestone.description}</span>
                              <span className={`${styles.milestoneStatus} ${styles[milestone.status]}`}>
                                {milestone.status}
                              </span>
                              <span className={styles.milestoneAmount}>
                                Rs {milestone.amount?.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.noMilestones}>No milestones defined yet</p>
                      )}
                    </div>

                    <div className={styles.orderActions}>
                      <button className={styles.viewDetailsButton}>View Details</button>
                      <button 
                        className={styles.messageBuyerButton}
                        onClick={() => order.buyerId?._id && 
                          navigate(`/messages/${order.buyerId._id}`)
                        }
                      >
                        <FaEnvelope /> Message Buyer
                      </button>
                      {order.status === 'in_progress' && !order.completionRequestedAt && (
                        <button 
                          className={styles.requestCompletionButton}
                          onClick={() => handleRequestCompletion(order)}
                        >
                          Request Completion
                        </button>
                      )}
                      {order.completionRequestedAt && order.status === 'in_progress' && (
                        <span className={styles.completionRequested}>
                          ✓ Completion Requested - Waiting for buyer confirmation
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className={styles.statsView}>
            <h2 className={styles.pageTitle}>Statistics & Analytics</h2>
            <p className={styles.pageSubtitle}>Coming soon...</p>
          </div>
        )}

        {activeTab !== 'projects' && activeTab !== 'proposals' && activeTab !== 'orders' && (
          <aside className={styles.rightSidebar}>
            <div className={styles.messagesSection}>
              <div className={styles.messagesSectionHeader}>
                <h3 className={styles.messagesTitle}>Messages</h3>
              </div>
              <p className={styles.messagesDescription}>
                Your conversations with buyers now live in the dedicated Messaging Center.
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
              <p className={styles.messagesHint}>Reach out to buyers, answer questions, and close deals faster.</p>
            </div>
          </aside>
        )}
      </div>

      {/* Completion Request Modal */}
      {showCompletionModal && (
        <div className={styles.modalOverlay} onClick={() => !completionLoading && setShowCompletionModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Request Order Completion</h3>
            <p className={styles.modalMessage}>
              Are you sure you want to request completion for this order?
            </p>
            <div className={styles.modalOrderInfo}>
              <strong>{selectedOrderForCompletion?.jobId?.title}</strong>
              <p>The buyer will be notified to review and confirm the completion.</p>
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelButton}
                onClick={() => setShowCompletionModal(false)}
                disabled={completionLoading}
              >
                Cancel
              </button>
              <button 
                className={styles.modalConfirmButton}
                onClick={confirmRequestCompletion}
                disabled={completionLoading}
              >
                {completionLoading ? 'Requesting...' : 'Yes, Request Completion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantDashboardPage;

