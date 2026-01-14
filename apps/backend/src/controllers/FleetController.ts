import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { Driver, Vehicle, Expense, Trip } from '../types';

// --- Drivers ---
export const getDrivers = async (req: Request, res: Response) => {
    try {
        const [driversRes, usersRes] = await Promise.all([
            query('SELECT * FROM drivers'),
            query("SELECT * FROM users WHERE roleid = 'R-DRIVER' OR roleid = 'driver'")
        ]);

        const legacyDrivers: Driver[] = driversRes.rows;

        // Map users to Driver interface
        const userDrivers: Driver[] = usersRes.rows.map((u: any) => ({
            id: u.id,
            name: u.name,
            phone: '', // Users don't have phone column
            status: 'IDLE', // Default status for users
            avatar_url: u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`
        }));

        // Merge (legacy drivers take precedence if IDs conflict, though unlikely)
        const allDrivers = [...legacyDrivers, ...userDrivers];

        res.json(allDrivers);
    } catch (e) {
        console.error('Error fetching drivers:', e);
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
            'INSERT INTO expenses (id, category, amount, trip_id, date, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, category, amount, trip_id, date || new Date().toISOString(), 'PENDING']
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

        // Fetch current trip to check for status transition
        const currentRes = await query('SELECT * FROM trips WHERE id = $1', [id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        const oldStatus = currentRes.rows[0].status;

        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const result = await query(
            `UPDATE trips SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );
        const updatedTrip = result.rows[0];

        // Trigger: If status changed to COMPLETED, create a payable record for the driver
        if (updatedTrip.status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
            const amount = updatedTrip.driver_pay_total || 0;
            const recordId = `FR-${Date.now()}`;
            await query(
                `INSERT INTO financial_records (id, tenant_id, shipment_id, type, reference_id, amount, currency, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [recordId, 'DEFAULT_TENANT', updatedTrip.id, 'payable', updatedTrip.driver_id, amount, updatedTrip.driver_pay_currency || 'CAD', 'PENDING']
            );
            console.log(`Financial record ${recordId} created for completed trip ${updatedTrip.id}`);
        }

        res.json(updatedTrip);
    } catch (e) {
        console.error('Error updating trip:', e);
        res.status(500).json({ error: 'Failed to update trip' });
    }
};
