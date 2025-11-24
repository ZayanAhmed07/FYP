import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect to appropriate dashboard based on user type
      if (user.roles?.includes('admin') || user.accountType === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user.accountType === 'consultant') {
        navigate('/consultant-dashboard', { replace: true });
      } else {
        navigate('/buyer-dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <section>
      <h1>Redirecting to your dashboard...</h1>
    </section>
  );
};

export default DashboardPage;




