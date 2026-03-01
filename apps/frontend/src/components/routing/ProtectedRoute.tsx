import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { Loader } from '../ui/Loader';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'consultant' | 'buyer';
  requiredRoles?: string[];
};

const ProtectedRoute = ({ children, requiredRole, requiredRoles }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasRequiredRole = user?.roles.includes(requiredRole) || user?.accountType === requiredRole;
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user type
      if (user?.roles.includes('admin') || user?.accountType === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (user?.accountType === 'consultant') {
        return <Navigate to="/consultant-dashboard" replace />;
      } else {
        return <Navigate to="/buyer-dashboard" replace />;
      }
    }
  }

  // Check multiple roles access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRequiredRole = requiredRoles.some(role => 
      user?.roles.includes(role) || user?.accountType === role
    );
    if (!hasAnyRequiredRole) {
      // Redirect to appropriate dashboard
      if (user?.roles.includes('admin') || user?.accountType === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (user?.accountType === 'consultant') {
        return <Navigate to="/consultant-dashboard" replace />;
      } else {
        return <Navigate to="/buyer-dashboard" replace />;
      }
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;


