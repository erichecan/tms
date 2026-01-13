import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { Driver, Vehicle, Expense, Trip } from '../types';

// --- Drivers ---
export const getDrivers = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM drivers');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};

export const createDriver = async (req: Request, res: Response) => {
    const { name, phone, status, avatar_url } = req.body;
    const id = `D-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO drivers (id, name, phone, status, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, name, phone, status || 'IDLE', avatar_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create driver' });
    }
};

export const updateDriver = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, phone, status, avatar_url } = req.body;
    try {
        const result = await query(
            `UPDATE drivers SET 
                name = COALESCE($1, name), 
                phone = COALESCE($2, phone), 
                status = COALESCE($3, status), 
                avatar_url = COALESCE($4, avatar_url) 
             WHERE id = $5 RETURNING *`,
            [name, phone, status, avatar_url, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update driver' });
    }
};

export const deleteDriver = async (req: Request, res: Response) => {
    try {
        const result = await query('DELETE FROM drivers WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send();
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete driver' });
    }
};

// --- Vehicles ---
export const getVehicles = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM vehicles');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

export const createVehicle = async (req: Request, res: Response) => {
    const { plate, model, capacity, status } = req.body;
    const id = `V-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO vehicles (id, plate, model, capacity, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, plate, model, capacity, status || 'IDLE']
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
};

export const updateVehicle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { plate, model, capacity, status } = req.body;
    try {
        const result = await query(
            `UPDATE vehicles SET 
                plate = COALESCE($1, plate), 
                model = COALESCE($2, model), 
                capacity = COALESCE($3, capacity), 
                status = COALESCE($4, status) 
             WHERE id = $5 RETURNING *`,
            [plate, model, capacity, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
};

export const deleteVehicle = async (req: Request, res: Response) => {
    try {
        const result = await query('DELETE FROM vehicles WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send();
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
};

// --- Expenses ---
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM expenses');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    const { category, amount, trip_id, date } = req.body;
    const id = `E-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO expenses (id, category, amount, trip_id, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, category, amount, trip_id, date || new Date().toISOString()]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

export const updateExpense = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { category, amount, trip_id, date, status } = req.body;
    try {
        const result = await query(
            `UPDATE expenses SET 
                category = COALESCE($1, category), 
                amount = COALESCE($2, amount), 
                trip_id = COALESCE($3, trip_id), 
                date = COALESCE($4, date), 
                status = COALESCE($5, status) 
             WHERE id = $6 RETURNING *`,
            [category, amount, trip_id, date, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update expense' });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).send();
        res.status(204).send();
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete expense' });
    }
};

// --- Trips ---
export const getTrips = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM trips');
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
};

export const updateTrip = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const result = await query(
            `UPDATE trips SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        res.json(result.rows[0]);
    } catch (e) {
        res.status(500).json({ error: 'Failed to update trip' });
    }
};
