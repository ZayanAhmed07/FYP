import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <section style={{ textAlign: 'center', padding: '120px 0' }}>
      <h1>Page Not Found</h1>
      <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/">Return Home</Link>
    </section>
  );
};

export default NotFoundPage;




