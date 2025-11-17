import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaUserTie } from 'react-icons/fa';
import { httpClient } from '../api/httpClient';
import { authService } from '../services/authService';
import styles from './AccountTypePage.module.css';

const AccountTypePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountTypeSelect = async (type: 'consultant' | 'buyer') => {
    setIsLoading(true);
    try {
      // Update account type in backend
      const response = await httpClient.patch('/users/me', { accountType: type });
      
      // Update localStorage with new account type
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, accountType: type };
        localStorage.setItem('expert_raah_user', JSON.stringify(updatedUser));
      }

      // Navigate based on account type
      if (type === 'consultant') {
        // Consultants need to verify their identity
        navigate('/verify-identity');
      } else {
        // Buyers go to buyer dashboard
        navigate('/buyer-dashboard');
      }
    } catch (error) {
      console.error('Failed to update account type:', error);
      alert('Failed to update account type. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftPanel}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Step Into<br />Expert Raah
          </h1>
          <p className={styles.subtitle}>
            Join or log in to experience a secure, professional platform built for meaningful client–consultant connections.
          </p>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <span className={styles.backArrow}>←</span>
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.welcomeTitle}>Welcome!</h2>
          <p className={styles.welcomeSubtitle}>Select Account Type</p>

          <div className={styles.accountTypeCards}>
            <button
              className={styles.accountCard}
              onClick={() => handleAccountTypeSelect('consultant')}
              disabled={isLoading}
            >
              <div className={styles.iconWrapper}>
                <FaUserShield className={styles.cardIcon} />
              </div>
              <h3 className={styles.cardTitle}>Consultant</h3>
              <p className={styles.cardDescription}>(Provide consultancy)</p>
            </button>

            <button
              className={styles.accountCard}
              onClick={() => handleAccountTypeSelect('buyer')}
              disabled={isLoading}
            >
              <div className={styles.iconWrapper}>
                <FaUserTie className={styles.cardIcon} />
              </div>
              <h3 className={styles.cardTitle}>Buyer</h3>
              <p className={styles.cardDescription}>(Hire a consultant)</p>
            </button>
          </div>
          
          {isLoading && (
            <p className={styles.loadingText}>Updating account type...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountTypePage;

