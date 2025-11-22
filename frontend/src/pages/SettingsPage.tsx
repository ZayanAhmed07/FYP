import { useNavigate } from 'react-router-dom';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className={styles.card}>
          <div className={styles.icon}>⚙️</div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.description}>
            Settings page coming soon. You'll be able to manage your account preferences, notifications, and privacy settings here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;



