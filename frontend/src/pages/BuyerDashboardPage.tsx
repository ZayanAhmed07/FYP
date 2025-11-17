import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaStar, FaMapMarkerAlt, FaUserCircle, FaEnvelope } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './BuyerDashboardPage.module.css';

// No mock data - fetching real consultants from database

// Mock proposals data

// Mock orders data - Active projects
const mockOrders = [
  {
    id: 1,
    orderId: 'ORD-2025-001',
    jobTitle: 'Business Technology Solution for E-Commerce',
    category: 'Business',
    consultant: {
      name: 'Usman Malik',
      avatar: 'https://i.pravatar.cc/150?img=14',
      rating: 4.8,
      title: 'Business Technology Consultant'
    },
    totalAmount: 'Rs 200,000',
    paidAmount: 'Rs 100,000',
    pendingAmount: 'Rs 100,000',
    progress: 60,
    status: 'in_progress',
    startDate: '2025-11-01',
    expectedDelivery: '2025-11-15',
    milestones: [
      { id: 1, title: 'Project Setup & Design', status: 'completed', payment: 'Rs 50,000', paid: true },
      { id: 2, title: 'Frontend Development', status: 'completed', payment: 'Rs 50,000', paid: true },
      { id: 3, title: 'Backend & Database', status: 'in_progress', payment: 'Rs 50,000', paid: false },
      { id: 4, title: 'Testing & Deployment', status: 'pending', payment: 'Rs 50,000', paid: false }
    ]
  },
  {
    id: 2,
    orderId: 'ORD-2025-002',
    jobTitle: 'Legal Advisory for Company Registration',
    category: 'Legal',
    consultant: {
      name: 'Ahmed Hassan',
      avatar: 'https://i.pravatar.cc/150?img=12',
      rating: 4.9,
      title: 'Legal Consultant'
    },
    totalAmount: 'Rs 120,000',
    paidAmount: 'Rs 60,000',
    pendingAmount: 'Rs 60,000',
    progress: 50,
    status: 'in_progress',
    startDate: '2025-11-05',
    expectedDelivery: '2025-11-20',
    milestones: [
      { id: 1, title: 'Document Review & Compliance', status: 'completed', payment: 'Rs 40,000', paid: true },
      { id: 2, title: 'SECP Registration Process', status: 'in_progress', payment: 'Rs 40,000', paid: false },
      { id: 3, title: 'Legal Documentation & Finalization', status: 'pending', payment: 'Rs 40,000', paid: false }
    ]
  },
  {
    id: 3,
    orderId: 'ORD-2025-003',
    jobTitle: 'Education & Training Program Development',
    category: 'Education',
    consultant: {
      name: 'Dr. Ali Raza',
      avatar: 'https://i.pravatar.cc/150?img=13',
      rating: 4.7,
      title: 'Education Consultant'
    },
    totalAmount: 'Rs 90,000',
    paidAmount: 'Rs 30,000',
    pendingAmount: 'Rs 60,000',
    progress: 35,
    status: 'in_progress',
    startDate: '2025-11-08',
    expectedDelivery: '2025-11-22',
    milestones: [
      { id: 1, title: 'Curriculum Assessment & Analysis', status: 'completed', payment: 'Rs 30,000', paid: true },
      { id: 2, title: 'Training Materials Development', status: 'in_progress', payment: 'Rs 30,000', paid: false },
      { id: 3, title: 'Implementation & Evaluation', status: 'pending', payment: 'Rs 30,000', paid: false }
    ]
  }
];

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

  useEffect(() => {
    fetchMyJobs();
    fetchConsultants();
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
        rating: c.rating || 0,
        location: 'Pakistan', // Can be added to consultant model later
        specialization: Array.isArray(c.specialization) ? c.specialization.join(', ') : c.specialization,
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
    const confirmDelete = window.confirm('Are you sure you want to delete this job?');
    if (!confirmDelete) return;

    try {
      await httpClient.delete(`/jobs/${jobId}`);
      await fetchMyJobs();
    } catch (error) {
      console.error('Failed to delete job', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAcceptProposal = async (proposalId: string, bidAmount: number) => {
    const confirmAccept = window.confirm(
      `Are you sure you want to accept this proposal for Rs ${bidAmount.toLocaleString()}? This will create an order and you will be redirected to payment.`
    );
    if (!confirmAccept) return;

    try {
      await httpClient.patch(`/proposals/${proposalId}/accept`);
      // Navigate to payment page with bid amount
      navigate('/payment', { state: { amount: bidAmount, proposalId } });
      // Refresh proposals list
      await fetchProposals();
    } catch (error) {
      console.error('Failed to accept proposal', error);
      alert('Failed to accept proposal. Please try again.');
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    const confirmReject = window.confirm('Are you sure you want to decline this proposal?');
    if (!confirmReject) return;

    try {
      await httpClient.patch(`/proposals/${proposalId}/reject`);
      alert('Proposal declined successfully.');
      // Refresh proposals list
      await fetchProposals();
    } catch (error) {
      console.error('Failed to reject proposal', error);
      alert('Failed to decline proposal. Please try again.');
    }
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
          <button className={styles.notificationButton}>
            🔔
            <span className={styles.notificationBadge}>3</span>
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

              <div className={styles.ordersList}>
                {mockOrders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderTitleSection}>
                        <h3 className={styles.orderJobTitle}>{order.jobTitle}</h3>
                        <span className={styles.orderIdBadge}>{order.orderId}</span>
                      </div>
                      <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                        {order.status === 'in_progress' ? 'In Progress' : order.status}
                      </span>
                    </div>

                    <div className={styles.orderConsultant}>
                      <img 
                        src={order.consultant.avatar} 
                        alt={order.consultant.name} 
                        className={styles.orderConsultantAvatar} 
                      />
                      <div className={styles.orderConsultantInfo}>
                        <h4 className={styles.orderConsultantName}>{order.consultant.name}</h4>
                        <p className={styles.orderConsultantTitle}>{order.consultant.title}</p>
                      </div>
                    </div>

                    <div className={styles.orderDetails}>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Amount</span>
                        <span className={styles.detailValue}>{order.totalAmount}</span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Started</span>
                        <span className={styles.detailValue}>{order.startDate}</span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Delivery</span>
                        <span className={styles.detailValue}>{order.expectedDelivery}</span>
                      </div>
                      <div className={styles.orderDetailItem}>
                        <span className={styles.detailLabel}>Progress</span>
                        <span className={styles.detailValue}>{order.progress}%</span>
                      </div>
                    </div>

                    <div className={styles.orderProgressBar}>
                      <div 
                        className={styles.orderProgressFill} 
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>

                    <div className={styles.orderActions}>
                      <button className={styles.viewDetailsButton}>View Details</button>
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
                    const consultantRating = proposal.consultantId?.rating || 0;
                    const consultantExperience = proposal.consultantId?.experience || 'N/A';

                    return (
                      <div key={proposal._id} className={styles.proposalCard}>
                        <div className={styles.proposalHeader}>
                          <div className={styles.jobTitleSection}>
                            <button
                              type="button"
                              className={styles.proposalJobTitleButton}
                              onClick={() =>
                                setExpandedProposalId(
                                  expandedProposalId === proposal._id ? null : proposal._id,
                                )
                              }
                            >
                              For: {jobTitle}
                            </button>
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
                                </div>
                                <span className={styles.experience}>
                                  {consultantExperience}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={styles.proposalDetails}>
                            <div className={styles.proposalBid}>
                              <div className={styles.bidItem}>
                                <span className={styles.bidLabel}>Bid Amount:</span>
                                <span className={styles.bidValue}>
                                  Rs {proposal.bidAmount.toLocaleString()}
                                </span>
                              </div>
                              <div className={styles.bidItem}>
                                <span className={styles.bidLabel}>Delivery Time:</span>
                                <span className={styles.bidValue}>{proposal.deliveryTime}</span>
                              </div>
                              <div className={styles.bidItem}>
                                <span className={styles.bidLabel}>Status:</span>
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
                              <h5 className={styles.coverLetterTitle}>Cover Letter</h5>
                              <p className={styles.coverLetterText}>{proposal.coverLetter}</p>
                            </div>

                            {proposal.status === 'pending' && (
                              <div className={styles.proposalActions}>
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
                              </div>
                            )}

                            {proposal.status === 'accepted' && (
                              <div className={styles.proposalStatusMessage}>
                                <span className={styles.acceptedMessage}>
                                  ✓ Proposal Accepted - Order Created
                                </span>
                              </div>
                            )}

                            {proposal.status === 'rejected' && (
                              <div className={styles.proposalStatusMessage}>
                                <span className={styles.rejectedMessage}>
                                  ✗ Proposal Declined
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
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Education</span>
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Legal</span>
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span>Business</span>
              </label>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Location</h4>
              <select className={styles.select}>
                <option>Select Location</option>
                <option>London, United Kingdom</option>
                <option>New York, USA</option>
                <option>Dubai, UAE</option>
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
              consultants.map((consultant) => (
                <div key={consultant.id} className={styles.projectCard}>
                  <div className={styles.projectHeader}>
                    {consultant.avatar ? (
                      <img src={consultant.avatar} alt={consultant.name} className={styles.consultantAvatar} />
                    ) : (
                      <FaUserCircle className={styles.consultantAvatar} style={{ fontSize: '60px', color: '#ccc' }} />
                    )}
                    <div className={styles.consultantInfo}>
                      <div className={styles.consultantNameRow}>
                        <h3 className={styles.consultantName}>{consultant.name}</h3>
                        <span className={`${styles.categoryBadge} ${styles[consultant.category.toLowerCase()]}`}>
                          {consultant.category}
                        </span>
                      </div>
                      <p className={styles.consultantTitle}>{consultant.title}</p>
                      <div className={styles.rating}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < Math.floor(consultant.rating) ? styles.starFilled : styles.starEmpty} />
                        ))}
                        <span className={styles.ratingValue}>({consultant.rating.toFixed(1)})</span>
                      </div>
                    </div>
                    <div className={styles.projectLocation}>
                      <FaMapMarkerAlt className={styles.locationIcon} />
                      <span>{consultant.location}</span>
                    </div>
                  </div>

                  <div className={styles.consultantSpecialization}>
                    <strong>Specialization:</strong> {consultant.specialization}
                  </div>

                  <p className={styles.projectDescription}>{consultant.bio}</p>

                  <div className={styles.projectFooter}>
                    <div className={styles.consultantRate}>
                      <strong>{consultant.hourlyRate}</strong>
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
                      <button className={styles.viewProfileButton}>View Profile</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
          </>
        )}

        {/* Messages moved to dedicated /messages page */}
      </div>
    </div>
  );
};

export default BuyerDashboardPage;

