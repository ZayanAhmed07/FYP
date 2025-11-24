import React from 'react';
import { useNavigate } from 'react-router-dom';
import { heroImage, heroSectionBackground } from '../../assets';
import { useAuth } from '../../hooks/useAuth';
import styles from './HeroSection.module.css';

// react-icons (install with: npm i react-icons)
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

const socialLinks = [
  { href: 'https://www.linkedin.com/', label: 'LinkedIn', Icon: FaLinkedinIn },
  { href: 'https://www.facebook.com/', label: 'Facebook', Icon: FaFacebookF },
  { href: 'https://www.instagram.com/', label: 'Instagram', Icon: FaInstagram },
  { href: 'https://www.x.com/', label: 'X', Icon: FaTwitter },
];

const HeroSection: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on user type
      if (user.roles.includes('admin') || user.accountType === 'admin') {
        navigate('/admin');
      } else if (user.accountType === 'consultant') {
        navigate('/consultant-dashboard');
      } else {
        navigate('/buyer-dashboard');
      }
    } else {
      navigate('/signup');
    }
  };

  return (
    <section id="hero" className={styles.hero}>
      <div
        className={styles.pattern}
        aria-hidden="true"
        style={{ backgroundImage: `url(${heroSectionBackground})` }}
      />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <h1 className={styles.heading} aria-label="Expert Raah">
            <span className={styles.headingLine}>EXPERT</span>
            <span className={styles.headingLine}>RAAH</span>
          </h1>

          <span className={styles.tagline}>YOUR RAAH TO RELIABLE SOLUTIONS</span>

          <button onClick={handleButtonClick} className={styles.cta}>
            <span>{isAuthenticated ? 'Go to Dashboard' : 'Join Us Now'}</span>
            <span className={styles.ctaArrow} aria-hidden="true">
              →
            </span>
          </button>
        </div>

        <div className={styles.visual}>
          <div className={styles.imageWrapper}>
            <img src={heroImage} alt="Consultants collaborating on a laptop" />
          </div>
        </div>
      </div>

      <div className={styles.socialCard} role="region" aria-label="Social links and connect">
        <div className={styles.socialLeft}>
          <div className={styles.socialLinks}>
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className={styles.socialButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className={styles.socialIcon} />
              </a>
            ))}
          </div>
          <p className={styles.socialText}>Connect with us to stay updated.</p>
        </div>

        <div className={styles.socialStats}>
          <div className={styles.socialStatValue}>10k+</div>
          <div className={styles.socialStatLabel}>Satisfied Users from Pakistan</div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
