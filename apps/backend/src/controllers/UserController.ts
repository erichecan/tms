import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { User, Role } from '../types';
import { AuthService } from '../services/AuthService';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// --- Users ---
// --- Users ---
export const getUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string || '').toLowerCase();

        let params: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(username) LIKE $${params.length})`);
        }

        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRes = await query(`SELECT COUNT(*) FROM users ${whereStr}`, params);
        const total = parseInt(countRes.rows[0].count);

        const result = await query(`
            SELECT * FROM users 
            ${whereStr} 
            ORDER BY created_at DESC 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        // Filter out sensitive data
        const safeUsers = result.rows.map(u => ({
            ...u,
            password: undefined,
            roleId: u.roleid // normalizing for frontend
        }));

        res.json({
            data: safeUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        // Use AuthService to handle hashing and creation
        const { name, email, username, password, roleId, status } = req.body;
        const result: any = await AuthService.register({
            name, email, username, password, roleId
        });

        // --- Entity Uniqueness Sync: Proactive Sync on Creation ---
        const role = (roleId as string || '').toUpperCase();
        if (role === 'R-DRIVER' || role === 'DRIVER') {
            await query('INSERT INTO drivers (id, name, status) VALUES ($1, $2, $3)', [result.id, name, 'IDLE']);
        } else if (role === 'R-CUSTOMER' || role === 'R-CLIENT') {
            await query('INSERT INTO customers (id, name, email, status) VALUES ($1, $2, $3, $4)', [result.id, name, email, 'ACTIVE']);
        } else if (role === 'R-VEHICLE') {
            await query('INSERT INTO vehicles (id, plate, status) VALUES ($1, $2, $3)', [result.id, name, 'IDLE']);
        }

        res.status(201).json(result);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, username, password, roleId, status } = req.body;

    try {
        let passwordHash = undefined;
        if (password) {
            passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }

        const result = await query(
            `UPDATE users SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email), 
                username = COALESCE($3, username),
                password = COALESCE($4, password), 
                roleid = COALESCE($5, roleid), 
                status = COALESCE($6, status) 
             WHERE id = $7 RETURNING *`,
            [name, email, username, passwordHash, roleId, status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];

        // --- Entity Uniqueness Sync: Proactive Sync on Update ---
        const role = (roleId as string || '').toUpperCase();
        if (role === 'R-DRIVER' || role === 'DRIVER') {
            await query('INSERT INTO drivers (id, name, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [id, name, 'IDLE']);
        } else if (role === 'R-CUSTOMER' || role === 'R-CLIENT') {
            await query('INSERT INTO customers (id, name, email, status) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email', [id, name, email, 'ACTIVE']);
        } else if (role === 'R-VEHICLE') {
            await query('INSERT INTO vehicles (id, plate, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET plate = EXCLUDED.plate', [id, name, 'IDLE']);
        }

        res.json({
            ...user,
            password: undefined,
            roleId: user.roleid
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send();
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// --- Roles & Permissions ---

export const getRoles = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM roles');
        const roles = result.rows;

        // Fetch permissions for each role
        for (const role of roles) {
            const permResult = await query(`
                SELECT p.* FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permissionid
                WHERE rp.roleid = $1
            `, [role.id]);
            role.permissions = permResult.rows;
        }

        res.json(roles);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

export const createRole = async (req: Request, res: Response) => {
    const { name, description, permissions } = req.body;
    // permissions is array of permission IDs
    const id = `R-${Date.now()}`;
    const client = await import('../db-postgres').then(m => m.pool.connect());

    try {
        await client.query('BEGIN');

        const result = await client.query(
            'INSERT INTO roles (id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [id, name, description]
        );

        if (permissions && Array.isArray(permissions)) {
            for (const permId of permissions) {
                await client.query(
                    'INSERT INTO role_permissions (roleid, permissionid) VALUES ($1, $2)',
                    [id, permId]
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: 'Failed to create role' });
    } finally {
        client.release();
    }
};

export const updateRole = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Note: This needs full implementation (modify role, update role_permissions)
    // For MVP/Demo, basic update is fine.

    const client = await import('../db-postgres').then(m => m.pool.connect());
    try {
        await client.query('BEGIN');

        await client.query(
            'UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3',
            [name, description, id]
        );

        if (permissions && Array.isArray(permissions)) {
            // Simple replace strategy
            await client.query('DELETE FROM role_permissions WHERE roleid = $1', [id]);
            for (const permId of permissions) {
                await client.query(
                    'INSERT INTO role_permissions (roleid, permissionid) VALUES ($1, $2)',
                    [id, permId]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Role updated' });
    } catch (e) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Failed to update role' });
    } finally {
        client.release();
    }
};

export const getPermissions = async (req: Request, res: Response) => {
    try {
        // If empty, maybe seed from code? Or just return DB.
        const result = await query('SELECT * FROM permissions');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};
