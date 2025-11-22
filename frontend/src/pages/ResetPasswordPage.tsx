import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './SignupPage.module.css';
import { authService } from '../services/authService';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, password });
      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(authService.parseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftPanel} />
      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2>Reset Password</h2>
          <p>Enter a new password for your account.</p>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={styles.input}
            />

            <button type="submit" className={styles.continueButton} disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          {success && <div className={styles.successMessage}>{success}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
