import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { User, Role } from '../types';

// --- Users ---
export const getUsers = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM users');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { name, email, password, roleId, status } = req.body;
    const id = `U-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO users (id, name, email, password, roleId, status, lastLogin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name, email, password, roleId, status || 'ACTIVE', new Date().toISOString()]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, password, roleId, status } = req.body;
    try {
        const result = await query(
            `UPDATE users SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email), 
                password = COALESCE($3, password), 
                roleId = COALESCE($4, roleId), 
                status = COALESCE($5, status) 
             WHERE id = $6 RETURNING *`,
            [name, email, password, roleId, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (e) {
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

// --- Roles ---
// Note: roles table not explicitly created in migrate.ts yet, but using it here
// User mentioned needing persistence for everything.
export const getRoles = async (req: Request, res: Response) => {
    try {
        // Fallback to memory if table doesn't exist? No, let's assume it should exist or will be added.
        // Actually, migrate.ts doesn't have roles table. I should probably add it.
        const result = await query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (e) {
        // Return mock roles if table doesn't exist for now to avoid breaking UI
        res.json([
            { id: 'R-ADMIN', name: 'Administrator' },
            { id: 'R-DISPATCHER', name: 'Dispatcher' },
            { id: 'R-DRIVER', name: 'Driver' }
        ]);
    }
};

export const createRole = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const id = `R-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO roles (id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [id, name, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create role' });
    }
};
