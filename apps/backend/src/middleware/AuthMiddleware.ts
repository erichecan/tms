import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';

export interface AuthRequest extends Request {
    user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !allowedRoles.includes(req.user.roleId)) {
            return res.status(403).json({ error: 'Access denied: Insufficient Role' });
        }
        next();
    };
};

export const requirePermission = (requiredPermission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
            // Admins usually have all permissions, but strict RBAC checks permissions explicitly.
            // For simplicity, let's say ADMIN has wildcard access or we check permission.
            if (req.user.roleId === 'R-ADMIN' || req.user.roleId === 'ADMIN') {
                return next();
            }
            return res.status(403).json({ error: `Access denied: Missing permission ${requiredPermission}` });
        }
        next();
    };
};
