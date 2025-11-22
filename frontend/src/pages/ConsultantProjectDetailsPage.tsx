import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaDownload } from 'react-icons/fa';

import { authService } from '../services/authService';
import { httpClient } from '../api/httpClient';
import styles from './ConsultantProjectDetailsPage.module.css';

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
  skills?: string[];
  attachments?: string[];
  createdAt: string;
}

const ConsultantProjectDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobFromApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setLoading(true);
        setError('');
        const response = await httpClient.get(`/jobs/${jobId}`);
        if (response.data?.data) {
          setJob(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load project details', err);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
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

  const getFilenameFromBase64 = (base64String: string): string => {
    // Extract filename from data URL or generate a default one
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

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.content}>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.content}>
          <p className={styles.errorText}>{error || 'Project not found.'}</p>
          <button className={styles.backButton} onClick={() => navigate('/consultant-dashboard')}>
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className={styles.title}>Project Details</h1>
      </header>

      <main className={styles.content}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.categoryBadge}>{job.category}</span>
            <h2 className={styles.jobTitle}>{job.title}</h2>
            <div className={styles.metaRow}>
              <span className={styles.metaItem}>
                <FaClock /> Posted on {new Date(job.createdAt).toLocaleDateString()}
              </span>
              <span className={styles.metaItem}>
                <FaMapMarkerAlt /> {job.location}
              </span>
              <span className={styles.statusBadge}>{job.status === 'open' ? 'Open' : job.status}</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            <p className={styles.description}>{job.description}</p>
          </div>

          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Budget</h3>
              <p className={styles.highlightValue}>{formatBudget(job.budget)}</p>
            </div>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Timeline</h3>
              <p className={styles.highlightValue}>{job.timeline || 'Not specified'}</p>
            </div>
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Required Skills</h3>
              <div className={styles.skillsList}>
                {job.skills.map((skill: string) => (
                  <span key={skill} className={styles.skillBadge}>
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.attachments && job.attachments.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Attachments</h3>
              <div className={styles.attachmentsList}>
                {job.attachments.map((attachment: string, index: number) => (
                  <div key={index} className={styles.attachmentItem}>
                    <span className={styles.attachmentName}>
                      {getFilenameFromBase64(attachment)}
                    </span>
                    <button
                      className={styles.downloadButton}
                      onClick={() =>
                        downloadFile(
                          attachment,
                          getFilenameFromBase64(attachment)
                        )
                      }
                      title="Download attachment"
                    >
                      <FaDownload /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate('/consultant-dashboard')}
            >
              Cancel
            </button>
            <button
              className={styles.primaryButton}
              onClick={() => navigate(`/submit-proposal/${job._id}`)}
              disabled={job.status !== 'open'}
            >
              {job.status === 'open' ? 'Submit Proposal' : 'Project Closed'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ConsultantProjectDetailsPage;




