import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './SubmitProposalPage.module.css';

interface JobSummary {
  _id: string;
  title: string;
  category: string;
  location: string;
  budget?: {
    min: number;
    max: number;
  };
}

const SubmitProposalPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobSummary | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const response = await httpClient.get(`/jobs/${jobId}`);
        if (response.data?.data) {
          setJob(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load job for proposal', err);
        setError('Failed to load job. Please go back and try again.');
      }
    };

    fetchJob();
  }, [jobId]);

  const formatBudget = (budget?: { min: number; max: number }) => {
    if (!budget) return 'Not specified';
    if (!budget.min && !budget.max) return 'Not specified';
    if (!budget.max || budget.max <= 0) return `Rs ${budget.min.toLocaleString()}`;
    return `Rs ${budget.min.toLocaleString()} - Rs ${budget.max.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    setError('');
    setSuccess('');

    const numericBid = Number(bidAmount);
    if (Number.isNaN(numericBid) || numericBid <= 0) {
      setError('Please enter a valid bid amount in PKR.');
      return;
    }
    if (!deliveryTime.trim()) {
      setError('Please specify a delivery time (e.g., 7 days).');
      return;
    }
    if (!coverLetter.trim()) {
      setError('Please write a brief cover letter.');
      return;
    }

    try {
      setLoading(true);
      await httpClient.post('/proposals', {
        jobId,
        bidAmount: numericBid,
        deliveryTime,
        coverLetter,
      });
      setSuccess('Proposal submitted successfully!');
      setTimeout(() => {
        navigate('/consultant-dashboard');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to submit proposal', err);
      const message =
        err?.response?.data?.message ||
        (err?.response?.data?.error && String(err.response.data.error)) ||
        'Failed to submit proposal. You may have already submitted one for this job.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className={styles.title}>Submit Proposal</h1>
      </header>

      <main className={styles.content}>
        {job && (
          <section className={styles.jobSummary}>
            <h2 className={styles.jobTitle}>{job.title}</h2>
            <p className={styles.jobMeta}>
              <span className={styles.category}>{job.category}</span>
              <span className={styles.location}>{job.location}</span>
            </p>
            <p className={styles.jobBudget}>
              <strong>Buyer Budget:</strong> {formatBudget(job.budget)}
            </p>
          </section>
        )}

        <section className={styles.formCard}>
          {error && <p className={styles.errorText}>{error}</p>}
          {success && <p className={styles.successText}>{success}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Your Bid Amount (PKR)</label>
              <input
                type="number"
                min={1}
                className={styles.input}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="e.g., 150000"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Delivery Time</label>
              <input
                type="text"
                className={styles.input}
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="e.g., 7 days"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Cover Letter</label>
              <textarea
                className={styles.textarea}
                rows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Explain why you're a great fit for this project..."
                disabled={loading}
                required
              />
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SubmitProposalPage;



