import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '../db-postgres';
import { User } from '../types';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');
const TOKEN_EXPIRY = '24h';

export class AuthService {

    static async login(identifier: string, password: string) {
        // 2026-03-13: 支持邮箱或用户名登录，与前端「Email or Username」一致，避免 401
        // 2026-03-26 13:32:50: 登录标识改为大小写不敏感匹配，避免生产环境因大小写差异误报 User not found
        const normalizedIdentifier = identifier.trim().toLowerCase();
        const result = await query(
            `SELECT * FROM users
             WHERE LOWER(email) = $1 OR LOWER(username) = $1
             LIMIT 1`,
            [normalizedIdentifier]
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = result.rows[0];

        const dbPasswordHash = user.password;

        if (!dbPasswordHash) {
            throw new Error('Invalid credentials');
        }

        const match = await bcrypt.compare(password, dbPasswordHash);

        if (!match) {
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            throw new Error('Account is inactive');
        }

        // Get Permissions
        let permissions: string[] = [];
        // Support 'role' (DB schema) vs 'role_id'/'roleid' (Legacy/Migration)
        const userRole = user.role || user.role_id || user.roleid;

        if (userRole) {
            try {
                // Check if table exists implicitly by trying query, or skip if we assume light mode
                // Since this is causing crashes on some envs, let's wrap it safe
                // Note: If using 'role' enum (ADMIN/DRIVER), permissions might need mapping or direct usage
                if (userRole.startsWith('R-') || userRole.length > 10) {
                    const permResult = await query(`
                        SELECT p.id 
                        FROM permissions p
                        JOIN role_permissions rp ON p.id = rp.permissionid
                        WHERE rp.roleid = $1
                    `, [userRole]);
                    permissions = permResult.rows.map(r => r.id);
                } else {
                    // Simple role map if needed, or empty
                }
            } catch (err: any) {
                console.warn(`[Login] Failed to load permissions (likely missing table): ${err.message}`);
                // Proceed with empty permissions
            }
        }

        // Generate Token
        const tokenPayload = {
            id: user.id,
            roleId: userRole,
            permissions
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        // Update last login
        await query('UPDATE users SET lastlogin = NOW() WHERE id = $1', [user.id]);

        return {
            user: { ...user, password_hash: undefined, password: undefined },
            role: userRole,
            permissions,
            token
        };
    }

    static async register(userData: any) {
        // Only for admin or initialization
        const { name, email, password, roleId } = userData;

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const id = `U-${Date.now()}`; // Simple ID gen

        await query(
            `INSERT INTO users (id, name, email, password, roleid, status) 
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE')`,
            [id, name, email, hashedPassword, roleId]
        );

        return { id, name, email, roleId };
    }

    static async changePassword(userId: string, oldPass: string, newPass: string) {
        const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) throw new Error('User not found');

        const user = result.rows[0];

        const dbPasswordHash = user.password;
        if (!dbPasswordHash) throw new Error('Invalid old password');
        const match = await bcrypt.compare(oldPass, dbPasswordHash);
        if (!match) throw new Error('Invalid old password');

        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        // Use 'password' column as per schema check
        await query('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
    }

    static async resetPassword(userId: string, newPass: string) {
        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        await query('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
    }
}
