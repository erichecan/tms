import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { query } from '../db-postgres';
import { User } from '../types';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-prod';
const TOKEN_EXPIRY = '24h';

export class AuthService {

    static async login(identifier: string, password: string) {
        // Find user by email
        const result = await query(
            'SELECT * FROM users WHERE email = $1',
            [identifier]
        );

        if (result.rows.length === 0) {
            throw new Error('User not found');
        }

        const user = result.rows[0];

        // Check password
        console.log(`[Login] Checking pass for user: ${user.email} (ID: ${user.id})`);

        // MAPPING: DB 'password' column contains the hash in this schema version
        const dbPasswordHash = user.password_hash || user.password; // Check both in case of schema drift

        if (!dbPasswordHash) {
            console.error('[Login] No hash found on user record.');
            throw new Error('Invalid credentials (no password set)');
        }

        let match = false;

        // 1. Try Simple String Equality (Legacy/Plain Text)
        if (password === dbPasswordHash) {
            match = true;
            console.log(`[Login] Plain text match: YES`);
        } else {
            // 2. Try Bcrypt
            try {
                match = await bcrypt.compare(password, dbPasswordHash);
            } catch (err: any) {
                // Ignore bcrypt errors (e.g. invalid salt) if we want to fail safe, 
                // but here it likely means it wasn't a hash.
                console.log(`[Login] Bcrypt compare error (likely not a hash): ${err.message}`);
            }
        }

        console.log(`[Login] Match result: ${match}`);

        if (!match) {
            console.error('[Login] Password mismatch.');
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'ACTIVE') {
            throw new Error('Account is inactive');
        }

        // Get Permissions
        let permissions: string[] = [];
        if (user.role_id || user.roleid) { // support both cases during migration
            try {
                const roleId = user.role_id || user.roleid;
                // Check if table exists implicitly by trying query, or skip if we assume light mode
                // Since this is causing crashes on some envs, let's wrap it safe
                const permResult = await query(`
                    SELECT p.id 
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permissionid
                    WHERE rp.roleid = $1
                `, [roleId]);
                permissions = permResult.rows.map(r => r.id);
            } catch (err: any) {
                console.warn(`[Login] Failed to load permissions (likely missing table): ${err.message}`);
                // Proceed with empty permissions
            }
        }

        // Generate Token
        const tokenPayload = {
            id: user.id,
            roleId: user.role_id || user.roleid,
            permissions
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

        // Update last login
        await query('UPDATE users SET lastlogin = NOW() WHERE id = $1', [user.id]); // Note casing: lastlogin based on list-users output

        return {
            user: { ...user, password_hash: undefined, password: undefined },
            role: user.role_id || user.roleid,
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

        // MAPPING: DB 'password' column 
        const dbPasswordHash = user.password_hash || user.password;

        if (dbPasswordHash) {
            const match = await bcrypt.compare(oldPass, dbPasswordHash);
            if (!match) throw new Error('Invalid old password');
        } else {
            // Should not happen if data is clean
            throw new Error('Invalid old password');
        }

        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        // Use 'password' column as per schema check
        await query('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
    }

    static async resetPassword(userId: string, newPass: string) {
        const newHash = await bcrypt.hash(newPass, SALT_ROUNDS);
        await query('UPDATE users SET password = $1 WHERE id = $2', [newHash, userId]);
    }
}
