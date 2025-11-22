import { useState } from 'react';
import { authService } from '../services/authService';
import styles from './SignupPage.module.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword({ email });
      setMessage(res?.resetLink ? `Reset link generated (development) — check server logs` : 'If the email exists, a reset link will be sent');
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
          <h2>Forgot Password</h2>
          <p>Enter your email to receive password reset instructions.</p>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />

            <button type="submit" className={styles.continueButton} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>

          {message && <div className={styles.successMessage}>{message}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
