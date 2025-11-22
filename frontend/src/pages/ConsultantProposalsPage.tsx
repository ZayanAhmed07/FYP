import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaDollarSign, FaEye, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { authService } from '../services/authService';
import { proposalService, type Proposal } from '../services/proposalService';
import { httpClient } from '../api/httpClient';
import styles from './ConsultantProposalsPage.module.css';

const ConsultantProposalsPage = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConsultantProfile(user.id);
  }, [navigate]);

  const fetchConsultantProfile = async (userId: string) => {
    try {
      const response = await httpClient.get(`/consultants/user/${userId}`);
      const consultant = response.data?.data;
      if (consultant?._id) {
        fetchProposals(consultant._id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch consultant profile', error);
      setLoading(false);
    }
  };

  const fetchProposals = async (consultantId: string) => {
    try {
      setLoading(true);
      const data = await proposalService.getProposalsByConsultant(consultantId);
      setProposals(data);
    } catch (error) {
      console.error('Failed to fetch proposals', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <FaCheckCircle className={styles.statusIconAccepted} />;
      case 'rejected':
        return <FaTimesCircle className={styles.statusIconRejected} />;
      default:
        return <FaHourglassHalf className={styles.statusIconPending} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'accepted':
        return styles.statusAccepted;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateStats = () => {
    const total = proposals.length;
    const pending = proposals.filter((p) => p.status === 'pending').length;
    const accepted = proposals.filter((p) => p.status === 'accepted').length;
    const rejected = proposals.filter((p) => p.status === 'rejected').length;
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';

    return { total, pending, accepted, rejected, acceptanceRate };
  };

  const stats = calculateStats();

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/consultant-dashboard')}>
          <FaArrowLeft /> Back to Dashboard
        </button>
        <h1 className={styles.pageTitle}>My Proposals</h1>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Proposals</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.accepted}</div>
            <div className={styles.statLabel}>Accepted</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>❌</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.rejected}</div>
            <div className={styles.statLabel}>Rejected</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📈</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.acceptanceRate}%</div>
            <div className={styles.statLabel}>Acceptance Rate</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <button
          className={`${styles.filterButton} ${filter === 'all' ? styles.filterActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({proposals.length})
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'pending' ? styles.filterActive : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'accepted' ? styles.filterActive : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted ({stats.accepted})
        </button>
        <button
          className={`${styles.filterButton} ${filter === 'rejected' ? styles.filterActive : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({stats.rejected})
        </button>
      </div>

      {/* Proposals List */}
      <div className={styles.proposalsContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading proposals...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3>No proposals {filter !== 'all' ? filter : 'yet'}</h3>
            <p>
              {filter === 'all'
                ? 'Start submitting proposals to jobs that match your expertise'
                : `You don't have any ${filter} proposals`}
            </p>
            {filter === 'all' && (
              <button className={styles.browseJobsButton} onClick={() => navigate('/consultant-dashboard')}>
                Browse Jobs
              </button>
            )}
          </div>
        ) : (
          <div className={styles.proposalsList}>
            {filteredProposals.map((proposal) => (
              <div key={proposal._id} className={styles.proposalCard}>
                <div className={styles.proposalHeader}>
                  <div className={styles.proposalTitle}>
                    <h3>{proposal.jobId?.title || 'Job Title Unavailable'}</h3>
                    <span className={styles.proposalCategory}>{proposal.jobId?.category || 'General'}</span>
                  </div>
                  <div className={`${styles.statusBadge} ${getStatusClass(proposal.status)}`}>
                    {getStatusIcon(proposal.status)}
                    <span>{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>
                  </div>
                </div>

                <div className={styles.proposalMeta}>
                  <div className={styles.metaItem}>
                    <FaDollarSign className={styles.metaIcon} />
                    <span className={styles.metaLabel}>Bid Amount:</span>
                    <span className={styles.metaValue}>${proposal.bidAmount}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <FaClock className={styles.metaIcon} />
                    <span className={styles.metaLabel}>Delivery:</span>
                    <span className={styles.metaValue}>{proposal.deliveryTime}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Submitted:</span>
                    <span className={styles.metaValue}>{formatDate(proposal.createdAt)}</span>
                  </div>
                </div>

                <div className={styles.proposalContent}>
                  <h4>Cover Letter:</h4>
                  <p className={styles.coverLetterPreview}>{proposal.coverLetter}</p>
                </div>

                {proposal.jobId?.budget && (
                  <div className={styles.jobBudget}>
                    <span className={styles.budgetLabel}>Client Budget:</span>
                    <span className={styles.budgetValue}>
                      ${proposal.jobId.budget.min} - ${proposal.jobId.budget.max}
                    </span>
                  </div>
                )}

                <div className={styles.proposalActions}>
                  <button
                    className={styles.viewJobButton}
                    onClick={() => navigate(`/consultant-dashboard`)}
                  >
                    <FaEye /> View Job Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantProposalsPage;
