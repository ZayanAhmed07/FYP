import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <section>
      <h1>Welcome back, {user?.name ?? 'Partner'}!</h1>
      <p>
        This is a secure area for managing your consultations, tracking client requests, and receiving tailored updates.
      </p>
    </section>
  );
};

export default DashboardPage;




