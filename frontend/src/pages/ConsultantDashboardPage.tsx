import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaClock, FaEdit, FaShare, FaHeart, FaUserCircle, FaEnvelope } from 'react-icons/fa';
import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'orders' | 'stats'>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [jobs, setJobs] = useState<JobFromApi[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

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
  }, []);

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

  const formatBudget = (budget: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
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

    if (!budget.min && !budget.max) return 'Not specified';
    if (budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
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
                  <span className={styles.statsYear}>2025</span>
                </div>
                <div className={styles.statsList}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Total Proposals Received</span>
                    <span className={styles.statValue}>58</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>In Progress</span>
                    <span className={styles.statValue}>33</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Completed</span>
                    <span className={styles.statValue}>25</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>On Hold</span>
                    <span className={styles.statValue}>00</span>
                  </div>
                </div>
              </div>

              {/* Earnings Section */}
              <div className={styles.statsCard}>
                <div className={styles.statsHeader}>
                  <h3 className={styles.statsTitle}>Earnings</h3>
                  <span className={styles.statsYear}>2025</span>
                </div>
                <div className={styles.earningsList}>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Total</span>
                    <span className={styles.earningValue}>+ USD 6,000.00</span>
                  </div>
                  <div className={styles.earningItem}>
                    <span className={styles.earningLabel}>Refund</span>
                    <span className={styles.earningValueRefund}>- + USD 1250.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.overviewCard}>
              <div className={styles.overviewHeader}>
                <h3 className={styles.overviewTitle}>Overview</h3>
                <span className={styles.statsYear}>2025</span>
              </div>
              <div className={styles.chartPlaceholder}>
                <p className={styles.chartText}>Revenue & Proposals Chart</p>
                <p className={styles.chartSubtext}>(Interactive chart would be integrated here)</p>
              </div>
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
            <aside className={styles.sidebar}>
              <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}>▼ Filters</h3>
                
                <div className={styles.filterGroup}>
                  <h4 className={styles.filterTitle}>Project Type</h4>
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
                  <h4 className={styles.filterTitle}>Project Status</h4>
                  <label className={styles.checkbox}>
                    <input type="checkbox" />
                    <span>Ongoing</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" />
                    <span>Completed</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" />
                    <span>On Hold</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input type="checkbox" />
                    <span>Cancelled</span>
                  </label>
                </div>
              </div>
            </aside>

            <main className={styles.orderContent}>
              <div className={styles.orderDetails}>
                <h3 className={styles.orderTitle}>Project Description</h3>
                <h4 className={styles.orderProjectTitle}>Legal Consultant Required for a property issue.</h4>
                <p className={styles.orderDescription}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. 
                  Sed dignissim, metus nec fringilla accumsan, rius sem sollicitudin lacus, ut interdum tellus elit sed rius.
                </p>
                <span className={styles.orderPostedTime}>Posted 2 days ago</span>

                <div className={styles.consultantDetails}>
                  <h3 className={styles.sectionTitle}>Consultant Details</h3>
                  <div className={styles.consultantInfo}>
                    <img src="https://i.pravatar.cc/150?img=1" alt="Consultant" className={styles.consultantAvatar} />
                    <div className={styles.consultantText}>
                      <h4 className={styles.consultantName}>John Doe</h4>
                      <p className={styles.consultantBio}>
                        Experienced legal consultant with over 10 years in corporate law. Specializing in contract review...
                      </p>
                    </div>
                  </div>
                  <div className={styles.locationInfo}>
                    <FaMapMarkerAlt /> London, United Kingdom
                  </div>
                </div>

                <div className={styles.projectStatus}>
                  <h3 className={styles.sectionTitle}>Project Status</h3>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '70%' }}></div>
                  </div>
                  <p className={styles.progressText}>70% Completed</p>
                </div>

                <div className={styles.milestones}>
                  <h3 className={styles.sectionTitle}>Milestones</h3>
                  <div className={styles.milestone}>
                    <span className={styles.milestoneIcon}>✓</span>
                    <p className={styles.milestoneText}>
                      Initial consultation and requirements gathering - <strong>Paid: $500</strong>
                    </p>
                  </div>
                  <div className={styles.milestone}>
                    <span className={styles.milestoneIcon}>✓</span>
                    <p className={styles.milestoneText}>
                      Research and analysis phase completed - <strong>Paid: $750</strong>
                    </p>
                  </div>
                  <div className={styles.milestone}>
                    <span className={styles.milestoneIconPending}>○</span>
                    <p className={styles.milestoneText}>
                      Final deliverables and documentation - <strong>Pending: $1,000</strong>
                    </p>
                  </div>
                </div>

                <div className={styles.paymentInfo}>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Total Project Value:</span>
                    <span className={styles.paymentValue}>$2,250</span>
                  </div>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Received:</span>
                    <span className={styles.paymentValueGreen}>$1,250</span>
                  </div>
                  <div className={styles.paymentRow}>
                    <span className={styles.paymentLabel}>Pending:</span>
                    <span className={styles.paymentValuePending}>$1,000</span>
                  </div>
                </div>

                <button className={styles.continueWorkButton}>Continue Working</button>
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

        {activeTab !== 'projects' && (
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
    </div>
  );
};

export default ConsultantDashboardPage;

