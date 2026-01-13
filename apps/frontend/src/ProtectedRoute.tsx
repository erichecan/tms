import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth(); // removed loading for now, assuming quick local check

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.roleId) && user.roleId !== 'R-ADMIN') { // Admin always bypass
        return <div style={{ padding: 40, textAlign: 'center' }}>
            <h1>Access Denied</h1>
            <p>You do not have permission to access this page.</p>
        </div>; // Or redirect to dashboard
    }

    return <Outlet />;
};
