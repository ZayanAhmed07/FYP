import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/ui/Loader';

const LogoutPage = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        // Clear all authentication data
        logout();

        // Redirect will be handled by logout function
        // But add a fallback just in case
        const timer = setTimeout(() => {
            navigate('/', { replace: true });
        }, 500);

        return () => clearTimeout(timer);
    }, [logout, navigate]);

    return <Loader />;
};

export default LogoutPage;
