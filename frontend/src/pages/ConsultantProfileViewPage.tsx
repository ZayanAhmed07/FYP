import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaClock, FaBriefcase, FaDollarSign, FaCheckCircle } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';
import styles from './ConsultantProfileViewPage.module.css';

interface ConsultantProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  title: string;
  bio: string;
  specialization: string[];
  hourlyRate: number;
  experience: string;
  skills: string[];
  rating: number;
  averageRating?: number;
  totalReviews: number;
  totalProjects?: number;
  completedProjects: number;
  city?: string;
  location?: string;
}

const ConsultantProfileViewPage = () => {
  const { consultantId } = useParams<{ consultantId: string }>();
  const navigate = useNavigate();
  const [consultant, setConsultant] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (consultantId) {
      fetchConsultantProfile();
    }
  }, [consultantId]);

  const fetchConsultantProfile = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`/consultants/${consultantId}`);
      setConsultant(response.data.data);
    } catch (err: any) {
      console.error('Error fetching consultant profile:', err);
      setError(err.response?.data?.message || 'Failed to load consultant profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageConsultant = () => {
    if (consultant?.userId._id) {
      navigate(`/messages/${consultant.userId._id}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading consultant profile...</p>
        </div>
      </div>
    );
  }

  if (error || !consultant) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error || 'Consultant not found'}</p>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
      </div>

      <div className={styles.profileContent}>
        {/* Profile Header Section */}
        <div className={styles.profileHeader}>
          <div className={styles.avatarSection}>
            {consultant.userId.profileImage ? (
              <img
                src={consultant.userId.profileImage}
                alt={consultant.userId.name}
                className={styles.avatar}
              />
            ) : (
              <FaUserCircle className={styles.avatarDefault} />
            )}
          </div>

          <div className={styles.headerInfo}>
            <h1 className={styles.consultantName}>{consultant.userId.name}</h1>
            <p className={styles.consultantTitle}>{consultant.title}</p>
            
            <div className={styles.metaInfo}>
              <div className={styles.ratingSection}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={
                        i < Math.floor(consultant.averageRating || consultant.rating)
                          ? styles.starFilled
                          : styles.starEmpty
                      }
                    />
                  ))}
                </div>
                <span className={styles.ratingValue}>
                  {(consultant.averageRating || consultant.rating).toFixed(1)} ({consultant.totalReviews} reviews)
                </span>
              </div>
              
              {(consultant.location || consultant.city) && (
                <div className={styles.metaItem}>
                  <FaMapMarkerAlt className={styles.metaIcon} />
                  <span>{consultant.location || consultant.city}</span>
                </div>
              )}
            </div>

            <button className={styles.messageButton} onClick={handleMessageConsultant}>
              <FaEnvelope /> Message Consultant
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaBriefcase />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statValue}>{consultant.completedProjects || 0}</p>
              <p className={styles.statLabel}>Completed Projects</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaClock />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statValue}>{consultant.experience}</p>
              <p className={styles.statLabel}>Experience</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <FaDollarSign />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statValue}>Rs {consultant.hourlyRate?.toLocaleString() || 'N/A'}/hr</p>
              <p className={styles.statLabel}>Hourly Rate</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>About</h2>
          <p className={styles.bio}>{consultant.bio || 'No bio available'}</p>
        </div>

        {/* Specialization Section */}
        {consultant.specialization && consultant.specialization.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Specialization</h2>
            <div className={styles.tagContainer}>
              {consultant.specialization.map((spec, index) => (
                <span key={index} className={styles.specializationTag}>
                  <FaCheckCircle className={styles.tagIcon} />
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {consultant.skills && consultant.skills.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Skills</h2>
            <div className={styles.tagContainer}>
              {consultant.skills.map((skill, index) => (
                <span key={index} className={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Section */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <FaEnvelope className={styles.contactIcon} />
              <span>{consultant.userId.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantProfileViewPage;
