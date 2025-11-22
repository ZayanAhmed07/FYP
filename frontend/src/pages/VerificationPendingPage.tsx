import { useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import styles from './VerificationPendingPage.module.css';

const VerificationPendingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <FaClock className={styles.icon} />
        </div>
        
        <h1 className={styles.title}>Verification Pending</h1>
        
        <p className={styles.message}>
          Thank you for submitting your profile! Our admin team is currently reviewing your documents and information.
        </p>

        <div className={styles.infoCard}>
          <FaCheckCircle className={styles.infoIcon} />
          <div className={styles.infoContent}>
            <h3 className={styles.infoTitle}>What's Next?</h3>
            <ul className={styles.infoList}>
              <li>Our team will review your CNIC and profile details</li>
              <li>Verification typically takes 24-48 hours</li>
              <li>You'll receive an email once your profile is approved</li>
              <li>After approval, you can access your consultant dashboard</li>
            </ul>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.homeButton} 
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
          <button 
            className={styles.loginButton} 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPendingPage;
