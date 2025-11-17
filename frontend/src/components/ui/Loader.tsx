import styles from './Loader.module.css';

export const Loader = () => {
  return (
    <div className={styles.wrapper} role="status" aria-label="Loading">
      <span className={styles.spinner} />
      <span className={styles.label}>Loading...</span>
    </div>
  );
};


