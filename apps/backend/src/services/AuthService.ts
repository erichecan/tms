import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '../db-postgres';
import { User } from '../types';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
const TOKEN_EXPIRY = '24h';

export class AuthService {

    static async login(identifier: string, password: string) {
        // Find user by email or username
        const result = await query(
            'SELECT * FROM users WHERE email = $1 OR username = $1',
            [identifier]
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = result.rows[0];

        // Check password
        if (!user.password_hash) {
            // Fallback for legacy users with plain text password (if any) or migration
            if (user.password !== password) {
                throw new Error('Invalid credentials');
            }
            // Auto-upgrade to hash? Not for now, keep simple.
        } else {
            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                throw new Error('Invalid credentials');
            }
        }

        if (user.status !== 'ACTIVE') {
            throw new Error('Account is inactive');
        }

        // Get Permissions
        let permissions: string[] = [];
        if (user.role_id || user.roleid) { // support both cases during migration
            const roleId = user.role_id || user.roleid;
            const permResult = await query(`
                SELECT p.id 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = $1
             `, [roleId]);
            permissions = permResult.rows.map(r => r.id);
        }

        // Generate Token
        const tokenPayload = {
            id: user.id,
            roleId: user.role_id || user.roleid,
            permissions
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        // Update last login
        await query('UPDATE users SET lastLogin = NOW() WHERE id = $1', [user.id]);

        return {
            user: { ...user, password_hash: undefined, password: undefined },
            role: user.role_id || user.roleid,
            permissions,
            token
        };
    }

    static async register(userData: any) {
        // Only for admin or initialization
        const { name, email, username, password, roleId } = userData;

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const id = `U-${Date.now()}`; // Simple ID gen

        await query(
            `INSERT INTO users (id, name, email, username, password_hash, role_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
            [id, name, email, username, hashedPassword, roleId]
        );

        return { id, name, email, roleId };
    }

    static async changePassword(userId: string, oldPass: string, newPass: string) {
        const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) throw new Error('User not found');

        const user = result.rows[0];

        if (user.password_hash) {
            const match = await bcrypt.compare(oldPass, user.password_hash);
            if (!match) throw new Error('Invalid old password');
        } else if (user.password !== oldPass) {
            throw new Error('Invalid old password');
        }

        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    }

    static async resetPassword(userId: string, newPass: string) {
        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
    }
}
