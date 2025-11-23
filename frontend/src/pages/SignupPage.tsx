import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaGoogle, FaApple, FaEnvelope, FaFacebookF, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { authService } from '../services/authService';
import styles from './SignupPage.module.css';
import { Link } from 'react-router-dom';

const SignupPage = () => {
  const location = useLocation();
  const [isSignup, setIsSignup] = useState(location.pathname === '/signup');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Email') {
      setShowEmailForm(true);
    } else if (provider === 'Google') {
      authService.loginWithGoogle();
    } else {
      alert(`${provider} authentication is not yet implemented. Please use email signup/login.`);
      // TODO: Implement other OAuth providers
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      
      // Navigate based on account type
      if (result.user.accountType === 'buyer') {
        navigate('/buyer-dashboard');
      } else if (result.user.accountType === 'consultant') {
        navigate('/consultant-dashboard');
      } else {
        // If account type not set, go to account type selection
        navigate('/account-type');
      }
    } catch (err) {
      setError(authService.parseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // For now, we'll set a default account type and let them choose later
      await authService.register({
        name,
        email,
        password,
        accountType: 'buyer', // Default, will be changed in account-type page
      });
      
      // Navigate to account type selection
      navigate('/account-type');
    } catch (err) {
      setError(authService.parseError(err));
    } finally {
      setLoading(false);
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
          <button className={styles.backButton} onClick={() => navigate('/')}>
            <span className={styles.backArrow}>←</span>
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.welcomeTitle}>
            {isSignup ? 'Choose a Sign-Up Method' : 'Welcome Back!'}
          </h2>
          <p className={styles.welcomeSubtitle}>
            {isSignup 
              ? 'Select an account to get started instantly.' 
              : 'Enter your credentials to continue.'}
          </p>

          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${isSignup ? styles.tabActive : ''}`}
              onClick={() => setIsSignup(true)}
            >
              Sign Up
            </button>
            <button
              className={`${styles.tab} ${!isSignup ? styles.tabActive : ''}`}
              onClick={() => setIsSignup(false)}
            >
              Login
            </button>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {isSignup ? (
            // Sign Up View
            <>
              {!showEmailForm ? (
                // Social Login Options
                <>
                  <div className={styles.socialButtons}>
                    <button 
                      className={styles.socialButton}
                      onClick={() => handleSocialLogin('Google')}
                    >
                      <FaGoogle className={styles.socialIcon} />
                      <span>Continue with Google</span>
                    </button>

                    <button 
                      className={styles.socialButton}
                      onClick={() => handleSocialLogin('Apple')}
                    >
                      <FaApple className={styles.socialIcon} />
                      <span>Continue with Apple</span>
                    </button>

                    <button 
                      className={styles.socialButton}
                      onClick={() => handleSocialLogin('Email')}
                    >
                      <FaEnvelope className={styles.socialIcon} />
                      <span>Continue with Email</span>
                    </button>

                    <div className={styles.separator}>
                      <span>Or</span>
                    </div>

                    <button 
                      className={styles.socialButton}
                      onClick={() => handleSocialLogin('Facebook')}
                    >
                      <FaFacebookF className={styles.socialIcon} />
                      <span>Continue with Facebook</span>
                    </button>

                    <button 
                      className={styles.socialButton}
                      onClick={() => handleSocialLogin('X')}
                    >
                      <FaXTwitter className={styles.socialIcon} />
                      <span>Continue with X</span>
                    </button>
                  </div>

                  <div className={styles.loginLink}>
                    Already have an account? <span className={styles.loginLinkButton} onClick={() => setIsSignup(false)}>Login</span>
                  </div>
                </>
              ) : (
                // Email Signup Form
                <>
                  <form onSubmit={handleSignupSubmit} className={styles.loginForm}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={styles.input}
                      required
                      disabled={loading}
                    />

                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                      required
                      disabled={loading}
                    />

                    <div className={styles.passwordContainer}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        required
                        disabled={loading}
                        minLength={6}
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    <div className={styles.passwordContainer}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={styles.input}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className={styles.togglePassword}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>

                    <button type="submit" className={styles.continueButton} disabled={loading}>
                      {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>

                    <button 
                      type="button" 
                      className={styles.backToOptionsButton}
                      onClick={() => setShowEmailForm(false)}
                      disabled={loading}
                    >
                      ← Back to Sign Up Options
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            // Login View - Email/Password Form
            <>
              <form onSubmit={handleLoginSubmit} className={styles.loginForm}>
                <input
                  type="email"
                  placeholder="Enter Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                />

                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.input}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>

                <button type="submit" className={styles.continueButton} disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div className={styles.separator}>
                <span>or</span>
              </div>

              <button 
                className={styles.socialButton}
                onClick={() => handleSocialLogin('Google')}
                disabled={loading}
              >
                <FaGoogle className={styles.socialIcon} />
                <span>Continue with Google</span>
              </button>

              <div className={styles.signupLink}>
                Don't have an account? <span className={styles.loginLinkButton} onClick={() => {
                  setIsSignup(true);
                  setShowEmailForm(false);
                  setError('');
                }}>Sign Up</span>
              </div>
              <div className={styles.signupLink}>
                <Link to="/forgot-password" className={styles.loginLinkButton}>
                  Forgot password?
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

