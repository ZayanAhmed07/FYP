import { useNavigate } from 'react-router-dom';
import { foundersImage, polygonBackground } from '../../assets';
import { useAuth } from '../../hooks/useAuth';
import styles from './AboutSection.module.css';

const AboutSection = () => {
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
      navigate('/login');
    }
  };

  return (
    <section id="about" className={styles.wrapper}>
      <div className={styles.content}>
        <h2>About Us</h2>
        <p>
          Expert Raah is revolutionizing consultancy in Pakistan by connecting clients with verified legal, business,
          and educational experts through a secure, user-friendly platform. Our unique bidding system empowers both
          clients and consultants with transparency, trust, and innovation at every step.
        </p>
        <p>
          Founded by Daim Ali (CEO) and Zayan Ahmed (Co-Founder), Expert Raah exists to transform the way consultancy
          works. We are building a reliable pathway to expertise, creating meaningful opportunities, and delivering
          consistent value to the communities we serve.
        </p>
        <div className={styles.actions}>
          <button className={styles.primaryButton} onClick={handleButtonClick}>
            {isAuthenticated ? 'Go to Dashboard' : 'Join Us Now'}
          </button>
        </div>
      </div>
      <div className={styles.founders}>
        <img src={polygonBackground} alt="" className={styles.background} />
        <img src={foundersImage} alt="Expert Raah founders" className={styles.foreground} />
      </div>
    </section>
  );
};

export default AboutSection;

