import { Request, Response } from 'express';
import { db } from '../db';
import { User, Role } from '../types';

// --- Users ---
export const getUsers = (req: Request, res: Response) => {
    res.json(db.users);
};
export const createUser = (req: Request, res: Response) => {
    const newUser: User = {
        id: `U-${Date.now()}`,
        ...req.body,
        lastLogin: new Date().toISOString()
    };
    db.users.push(newUser);
    res.status(201).json(newUser);
};

export const updateUser = (req: Request, res: Response) => {
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    // If password is provided, prioritize it
    const updateData = { ...req.body };
    db.users[idx] = { ...db.users[idx], ...updateData };
    res.json(db.users[idx]);
};

export const deleteUser = (req: Request, res: Response) => {
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    db.users.splice(idx, 1);
    res.status(204).send();
};

// --- Roles ---
export const getRoles = (req: Request, res: Response) => {
    res.json(db.roles);
};

export const createRole = (req: Request, res: Response) => {
    const newRole: Role = {
        id: `R-${Date.now()}`,
        ...req.body
    };
    db.roles.push(newRole);
    res.status(201).json(newRole);
};
