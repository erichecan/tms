import { createContext, useContext, useState, type ReactNode } from 'react';

// 2026-03-13: 报价管理权限 — user.permissions 来自 /api/auth/login 或 /me；R-ADMIN 视为拥有所有权限

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

/** 首帧同步从 localStorage 恢复会话，避免 ProtectedRoute 在 useEffect 前误判未登录而跳 /login（刷新子路由、E2E 直链 /pricing 等）— 2026-03-23T18:22:00 */
function readSessionFromStorage(): { user: User | null; token: string | null; isAuthenticated: boolean } {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
        try {
            return {
                token: storedToken,
                user: JSON.parse(storedUser) as User,
                isAuthenticated: true,
            };
        } catch (e) {
            console.error('Failed to parse stored user', e);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }
    return { user: null, token: storedToken, isAuthenticated: false };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const initial = readSessionFromStorage();
    const [user, setUser] = useState<User | null>(initial.user);
    const [token, setToken] = useState<string | null>(initial.token);
    const [isAuthenticated, setIsAuthenticated] = useState(initial.isAuthenticated);

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

    // R-ADMIN/ADMIN 视为拥有所有权限（含 P-PRICING-VIEW / P-PRICING-MANAGE）
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
