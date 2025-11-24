import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';

import styles from './Header.module.css';

const Header = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isHome = location.pathname === '/';

  return (
    <header className={`${styles.header} ${isHome ? styles.headerHome : ''}`}>
      <div className={styles.brand}>
        <Link to="/">Expert Raah</Link>
      </div>
      <nav className={styles.nav}>
        {isHome ? (
          <>
            <a href="#hero" className={styles.link}>
              Home
            </a>
            <a href="#services" className={styles.link}>
              Services
            </a>
            <a href="#about" className={styles.link}>
              About Us
            </a>
            <a href="#contact" className={styles.link}>
              Contact Us
            </a>
          </>
        ) : (
          <>
            <NavLink
              to="/"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`.trim()}
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`.trim()}
            >
              Dashboard
            </NavLink>
            {isAuthenticated && <NotificationDropdown />}
            <NavLink
              to="/login"
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`.trim()}
            >
              Login
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
