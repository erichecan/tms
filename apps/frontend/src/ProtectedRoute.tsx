import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.roleId) && user.roleId !== 'R-ADMIN') { // Admin always bypass
        return <div style={{ padding: 40, textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>You do not have permission to access this page.</p>
        </div>; // Or redirect to dashboard
    }

    return <Outlet />;
};
