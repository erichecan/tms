import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../apiConfig';

interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    roleId: string;
    permissions?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                // Verify if token is expired? Ideally call /api/auth/me here
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        // Redirect logic usually handled by protected routes
    };

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.roleId === 'R-ADMIN' || user.roleId === 'ADMIN') return true;
        return user.permissions?.includes(permission) || false;
    };

    const hasRole = (role: string) => {
        if (!user) return false;
        return user.roleId === role;
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, hasPermission, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
