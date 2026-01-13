import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthRequest } from '../middleware/AuthMiddleware';

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Username/Email and password are required' });
        }

        const result = await AuthService.login(identifier, password);
        res.json(result);
    } catch (e: any) {
        console.error('Login error:', e);
        res.status(401).json({ error: e.message || 'Login failed' });
    }
};

export const register = async (req: Request, res: Response) => {
    // Usually protected by admin check middleware in routes
    try {
        const result = await AuthService.register(req.body);
        res.status(201).json(result);
    } catch (e: any) {
        console.error('Register error:', e);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        await AuthService.changePassword(req.user.id, oldPassword, newPassword);
        res.json({ message: 'Password updated successfully' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    // req.user is populated by verifyToken middleware
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // Check if we want to return fresh data from DB or just token data
    // For now, token data + explicit permissions check might be enough, 
    // but better to fetch fresh user to check status.
    try {
        // Reuse login logic check or just return req.user
        // Let's rely on middleware for now
        res.json(req.user);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching user' });
    }
};
