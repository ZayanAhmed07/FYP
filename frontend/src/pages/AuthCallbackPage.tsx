import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import styles from './AuthCallbackPage.module.css';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google auth error:', error);
        navigate('/login', { state: { error: 'Google authentication failed' } });
        return;
      }

      if (token && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));

          // Clear any previous authentication state before setting new data
          localStorage.removeItem('expert_raah_user');

          // Store the token using the storage utility
          storage.setToken('expert_raah_token', token);

          // Store the new user data
          localStorage.setItem('expert_raah_user', JSON.stringify(user));

          // Dispatch a custom event to notify AuthContext of the OAuth login
          window.dispatchEvent(new CustomEvent('oauthLogin', { detail: user }));

          // Check if user needs to select account type
          if (!user.accountType) {
            navigate('/account-type');
            return;
          }

          // Redirect to dashboard based on user role
          if (user.accountType === 'consultant') {
            navigate('/consultant-dashboard');
          } else if (user.accountType === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/buyer-dashboard');
          }
        } catch (err) {
          console.error('Error processing auth callback:', err);
          navigate('/login', { state: { error: 'Authentication failed' } });
        }
      } else {
        navigate('/login', { state: { error: 'Invalid authentication response' } });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;