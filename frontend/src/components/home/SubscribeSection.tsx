import { FormEvent, useState } from 'react';
import { toast } from 'react-toastify';
import { FaLinkedinIn, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

import styles from './SubscribeSection.module.css';

const SubscribeSection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      toast.info('Please enter your email.');
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Replace with newsletter subscription endpoint.
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('You are now subscribed!');
      setEmail('');
    } catch (error) {
      toast.error('Subscription failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className={styles.wrapper}>
      <div className={styles.topSection}>
        <div className={styles.subscribeContent}>
          <h2>Subscribe!</h2>
          <p>To our Newsletter</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-label="Email"
          />
          <button type="submit" aria-label="Subscribe" disabled={isSubmitting}>
            {isSubmitting ? '...' : '→'}
          </button>
        </form>
      </div>

      <div className={styles.divider}></div>

      <div className={styles.bottomSection}>
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Quick Links</h3>
          <ul className={styles.linkList}>
            <li><a href="#hero">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Follow Us</h3>
          <ul className={styles.linkList}>
            <li>
              <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
                <FaLinkedinIn className={styles.icon} /> https://www.linkedin.com/
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                <FaFacebookF className={styles.icon} /> https://www.facebook.com/
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                <FaInstagram className={styles.icon} /> https://www.instagram.com/
              </a>
            </li>
            <li>
              <a href="https://www.x.com/" target="_blank" rel="noopener noreferrer">
                <FaTwitter className={styles.icon} /> https://www.x.com/
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Contact Us</h3>
          <ul className={styles.contactList}>
            <li>
              <span className={styles.contactIcon}>✉</span>
              <a href="mailto:expertraah@email.com">expertraah@email.com</a>
            </li>
            <li>
              <span className={styles.contactIcon}>📞</span>
              <a href="tel:+925134567">+92-51-34567</a>
            </li>
            <li>
              <span className={styles.contactIcon}>📍</span>
              <span>Khudadad Heights, E-11, Islamabad</span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default SubscribeSection;


