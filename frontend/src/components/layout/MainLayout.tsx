import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className={styles.layout}>
      <Header />
      <main className={`${styles.main} ${isHome ? styles.mainHome : ''}`}>
        {isHome ? (
          <Outlet />
        ) : (
          <div className={styles.container}>
            <Outlet />
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Expert Raah. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;


