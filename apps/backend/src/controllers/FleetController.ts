import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { Driver, Vehicle, Expense, Trip, AddressInfo } from '../types';
import { AuthService } from '../services/AuthService';
import { mapsApiService } from '../services/MapsApiService';

// --- Drivers ---
// --- Drivers ---
export const getDrivers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string || '').toLowerCase();
        const status = req.query.status as string;

        // We want anyone in drivers table OR anyone in users table with a Driver role
        let whereClauses = ["(d.id IS NOT NULL OR u.roleid IN ('R-DRIVER', 'DRIVER', 'R-DRIVER-MOBILE'))"];
        let params: any[] = [];

        if (status && status !== 'ALL') {
            params.push(status);
            whereClauses.push(`COALESCE(d.status, 'IDLE') = $${params.length}`);
        } else {
            // Do not show deleted drivers unless explicitly requested
            whereClauses.push(`COALESCE(d.status, 'IDLE') != 'DELETED'`);
        }

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(LOWER(COALESCE(u.name, d.name)) LIKE $${params.length} OR LOWER(COALESCE(d.phone, '')) LIKE $${params.length})`);
        }

        const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

        // Count query
        const countRes = await query(`
            SELECT COUNT(DISTINCT COALESCE(u.id, d.id)) 
            FROM drivers d
            FULL OUTER JOIN users u ON d.id = u.id
            ${whereStr}
        `, params);

        const total = parseInt(countRes.rows[0].count);

        // Data query: Primary source of truth is the User record if it exists, otherwise the Driver record
        const dataRes = await query(`
            SELECT 
                COALESCE(u.id, d.id) as id,
                COALESCE(u.name, d.name) as name,
                COALESCE(d.phone, '') as phone,
                COALESCE(d.status, 'IDLE') as status,
                COALESCE(d.avatar_url, 'https://ui-avatars.com/api/?name=' || COALESCE(u.name, d.name) || '&background=random') as avatar_url,
                u.roleid,
                u.email
            FROM drivers d
            FULL OUTER JOIN users u ON d.id = u.id
            ${whereStr}
            ORDER BY COALESCE(u.name, d.name) ASC, id ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        res.json({
            data: dataRes.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (e) {
        console.error('Error fetching drivers:', e);
        res.status(500).json({ error: 'Failed to fetch drivers' });
    }
};

export const createDriver = async (req: Request, res: Response) => {
    const { name, phone, status, avatar_url, email, password } = req.body;
    // Use "U-" prefix for unified identity if we want them in User Management
    const id = `U-${Date.now()}`;
    try {
        await query('BEGIN');

        // 1. Create Driver Registry
        const driverResult = await query(
            'INSERT INTO drivers (id, name, phone, status, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, name, phone, status || 'IDLE', avatar_url]
        );

        // 2. Create User Account for User Management
        // Generate a placeholder email if none provided to satisfy DB/Auth constraints
        const userEmail = email || `${phone || id}@tms.local`;
        const userPassword = password || 'Driver123!'; // Default password for new drivers

        await AuthService.register({
            name,
            email: userEmail,
            username: userEmail,
            password: userPassword,
            roleId: 'DRIVER'
        });

        // Link the user record to the same ID
        // Note: register already generates an id, so we might need to adjust AuthService 
        // to allow passing a pre-generated ID or update the user record after.
        // For now, let's update the user record ID to match driver ID for the FULL OUTER JOIN logic
        const tempUserId = `U-${Date.now()}`; // register logic usually does this
        // Actually, let's modify AuthService.register or just query directly to ensure ID match
        await query('UPDATE users SET id = $1 WHERE email = $2', [id, userEmail]);

        await query('COMMIT');
        res.status(201).json(driverResult.rows[0]);
    } catch (e) {
        await query('ROLLBACK');
        console.error('Error creating driver with sync:', e);
        res.status(500).json({ error: 'Failed to create driver and user account' });
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
    const { id } = req.params;
    try {
        // 1. Try Soft delete existing driver record
        const result = await query("UPDATE drivers SET status = 'DELETED' WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            // 2. If not found in drivers, check if it's a User meant to be a driver
            const userCheck = await query('SELECT name FROM users WHERE id = $1', [id]);
            if (userCheck.rows.length > 0) {
                // Create a "Tombstone" record in drivers table so it gets filtered out by the list query
                const name = userCheck.rows[0].name;
                await query("INSERT INTO drivers (id, name, status) VALUES ($1, $2, 'DELETED')", [id, name]);
                return res.status(204).send();
            }
            // 3. If neither, it's truly 404
            return res.status(404).send();
        }
        res.status(204).send();
    } catch (e) {
        console.error("Delete driver failed", e);
        res.status(500).json({ error: 'Failed to delete driver' });
    }
};

export const getDriverAvailability = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { start_time_proposed, end_time_proposed, origin_address, dest_address } = req.query;

    try {
        // 1. Fetch all active/planned trips for this driver
        const activeTripsRes = await query(
            `SELECT * FROM trips 
             WHERE driver_id = $1 
             AND status IN ('ACTIVE', 'PLANNED')
             ORDER BY end_time_est DESC`,
            [id]
        );

        const currentTrips = activeTripsRes.rows;
        const isCurrentlyBusy = currentTrips.length > 0;

        // 2. Calculate Next Free Time
        const nextFreeTime = isCurrentlyBusy ? currentTrips[0].end_time_est : new Date().toISOString();

        // 3. Check for direct time conflict
        let conflict = false;
        if (start_time_proposed && end_time_proposed) {
            const proposedStart = new Date(start_time_proposed as string);
            const proposedEnd = new Date(end_time_proposed as string);

            conflict = currentTrips.some(trip => {
                const tripStart = new Date(trip.start_time_est);
                const tripEnd = new Date(trip.end_time_est);
                // Overlap condition
                return (proposedStart < tripEnd && proposedEnd > tripStart);
            });
        }

        // 4. Detour Logic (if they are busy but we want to see if they can take it "on the way")
        let detourCheck = null;
        if (isCurrentlyBusy && origin_address && dest_address) {
            const currentTrip = currentTrips[0]; // Check against the latest/most relevant trip

            // We need coordinates. For simplicity, we assume we can geocode the strings.
            try {
                // In a real system, we'd fetch the trip's destination geocode from DB or cache
                // Here we geocode on the fly for the POC
                const tripDestLoc = await mapsApiService.geocodeAddress(currentTrip.vehicle_id); // Using vehicle_id as placeholder for current location or fetching from a real field
                // Actually, let's assume we have current_location in the trip record or we use the trip's destination as the point to return to.

                // For this demo, we'll try to geocode the strings provided
                const startLoc = await mapsApiService.geocodeAddress(origin_address as string);
                const endLoc = await mapsApiService.geocodeAddress(dest_address as string);

                // Mocking current route as [Current Loc -> Current Trip End]
                // and checking detour for [New Start -> New End]
                // This is a simplified version of the logic
                // detourCheck = await mapsApiService.calculateDetour(currentLoc, currentTripEnd, startLoc, endLoc);
            } catch (mapsErr) {
                console.error('Maps check failed during availability check', mapsErr);
            }
        }

        res.json({
            driver_id: id,
            status: isCurrentlyBusy ? 'BUSY' : 'IDLE',
            next_free_time: nextFreeTime,
            has_time_conflict: conflict,
            active_trips_count: currentTrips.length,
            detour_info: detourCheck
        });

    } catch (e) {
        console.error('Error checking driver availability:', e);
        res.status(500).json({ error: 'Failed to check availability' });
    }
};

// --- Vehicles ---
export const getVehicles = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string || '').toLowerCase();
        const status = req.query.status as string;

        // Note: u.roleid = 'R-VEHICLE' is used for virtual assets or IoT trackers registered as users
        let whereClauses = ["(v.id IS NOT NULL OR u.roleid = 'R-VEHICLE')"];
        let params: any[] = [];

        if (status && status !== 'ALL') {
            params.push(status);
            whereClauses.push(`COALESCE(v.status, u.status, 'IDLE') = $${params.length}`);
        } else {
            whereClauses.push(`COALESCE(v.status, u.status, 'IDLE') != 'DELETED'`);
        }

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(LOWER(COALESCE(v.plate, u.name)) LIKE $${params.length} OR LOWER(COALESCE(v.model, '')) LIKE $${params.length})`);
        }

        const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

        const countRes = await query(`
            SELECT COUNT(DISTINCT COALESCE(v.id, u.id))
            FROM vehicles v
            FULL OUTER JOIN users u ON v.id = u.id
            ${whereStr}
        `, params);

        const total = parseInt(countRes.rows[0].count);

        const dataRes = await query(`
            SELECT 
                COALESCE(v.id, u.id) as id,
                COALESCE(v.plate, u.name) as plate,
                COALESCE(v.model, 'Asset') as model,
                COALESCE(v.capacity, 'Standard') as capacity,
                COALESCE(v.status, u.status, 'IDLE') as status
            FROM vehicles v
            FULL OUTER JOIN users u ON v.id = u.id
            ${whereStr}
            ORDER BY plate ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        res.json({
            data: dataRes.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (e) {
        console.error('Error fetching vehicles:', e);
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
    const { id } = req.params;
    try {
        // 1. Try Soft delete
        const result = await query("UPDATE vehicles SET status = 'DELETED' WHERE id = $1 RETURNING id", [id]);

        if (result.rows.length === 0) {
            // 2. If not found, check Users (Role=R-VEHICLE)
            const userCheck = await query('SELECT name FROM users WHERE id = $1', [id]);
            if (userCheck.rows.length > 0) {
                // Create Tombstone with name as plate
                const plate = userCheck.rows[0].name; // In users table, plate is stored as name for vehicles
                await query("INSERT INTO vehicles (id, plate, status) VALUES ($1, $2, 'DELETED')", [id, plate]);
                return res.status(204).send();
            }
            return res.status(404).send();
        }
        res.status(204).send();
    } catch (e) {
        console.error("Delete vehicle failed", e);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
};

// --- Expenses ---
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string || '').toLowerCase();

        let params: any[] = [];
        let whereClauses: string[] = [];

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(LOWER(category) LIKE $${params.length} OR LOWER(status) LIKE $${params.length})`);
        }

        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countRes = await query(`SELECT COUNT(*) FROM expenses ${whereStr}`, params);
        const total = parseInt(countRes.rows[0].count);

        const dataRes = await query(`
            SELECT * FROM expenses 
            ${whereStr} 
            ORDER BY date DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        res.json({
            data: dataRes.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
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
        // Enriched query: Join trips with waybills to provide context in the schedule
        const result = await query(`
            SELECT 
                t.*,
                COALESCE(u.name, d.name, t.driver_id) as driver_name,
                (
                    SELECT json_agg(json_build_object(
                        'id', w.id,
                        'waybill_no', w.waybill_no,
                        'origin', w.origin,
                        'destination', w.destination,
                        'pallet_count', w.pallet_count,
                        'client_name', COALESCE(c.company, c.name, w.customer_id)
                    ))
                    FROM waybills w
                    LEFT JOIN customers c ON w.customer_id = c.id
                    WHERE w.trip_id = t.id
                ) as waybills
            FROM trips t
            LEFT JOIN users u ON t.driver_id = u.id
            LEFT JOIN drivers d ON t.driver_id = d.id
        `);
        res.json(result.rows);
    } catch (e) {
        console.error('Error fetching trips:', e);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
};

export const createTrip = async (req: Request, res: Response) => {
    const { driver_id, vehicle_id, start_time_est, end_time_est, status } = req.body;
    const id = `T-${Date.now()}`;
    try {
        await query('BEGIN');

        const result = await query(
            'INSERT INTO trips (id, driver_id, vehicle_id, start_time_est, end_time_est, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [id, driver_id, vehicle_id, start_time_est, end_time_est, status || 'PLANNED']
        );

        // Update driver and vehicle status to BUSY
        if (driver_id) {
            await query("UPDATE drivers SET status = 'BUSY' WHERE id = $1", [driver_id]);
        }
        if (vehicle_id) {
            await query("UPDATE vehicles SET status = 'BUSY' WHERE id = $1", [vehicle_id]);
        }

        await query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (e) {
        await query('ROLLBACK');
        console.error('Error creating trip:', e);
        res.status(500).json({ error: 'Failed to create trip' });
    }
};

export const updateTrip = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { driver_id } = req.body;
        const fields = Object.keys(req.body);
        const values = Object.values(req.body);
        if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

        // Fetch current trip to check for status transition
        const currentRes = await query('SELECT * FROM trips WHERE id = $1', [id]);
        if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
        const oldTrip = currentRes.rows[0];

        // Ensure driver and vehicle exist in their respective tables to satisfy FK constraint
        if (driver_id && driver_id !== oldTrip.driver_id) {
            const drCheck = await query('SELECT id FROM drivers WHERE id = $1', [driver_id]);
            if (drCheck.rows.length === 0) {
                const userCheck = await query('SELECT id, name FROM users WHERE id = $1', [driver_id]);
                if (userCheck.rows.length > 0) {
                    const u = userCheck.rows[0];
                    await query('INSERT INTO drivers (id, name, status) VALUES ($1, $2, $3)', [u.id, u.name, 'BUSY']);
                    console.log(`Auto-created driver registry for user ${u.name} (${u.id}) during trip assignment.`);
                }
            }
        }

        const { vehicle_id } = req.body;
        if (vehicle_id && vehicle_id !== oldTrip.vehicle_id) {
            const vCheck = await query('SELECT id FROM vehicles WHERE id = $1', [vehicle_id]);
            if (vCheck.rows.length === 0) {
                const userCheck = await query('SELECT id, name FROM users WHERE id = $1', [vehicle_id]);
                if (userCheck.rows.length > 0) {
                    const u = userCheck.rows[0];
                    await query('INSERT INTO vehicles (id, plate, status) VALUES ($1, $2, $3)', [u.id, u.name, 'BUSY']);
                    console.log(`Auto-created vehicle registry for user/IoT ${u.name} (${u.id}) during trip assignment.`);
                }
            }
        }

        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const result = await query(
            `UPDATE trips SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Trip not found after update' });
        }

        const updatedTrip = result.rows[0];

        // Trigger: If status changed to COMPLETED, create a payable record for the driver
        if (updatedTrip.status === 'COMPLETED' && oldTrip.status !== 'COMPLETED') {
            try {
                const amount = updatedTrip.driver_pay_total || 0;
                const recordId = `FR-${Date.now()}`;
                await query(
                    `INSERT INTO financial_records (id, tenant_id, shipment_id, type, reference_id, amount, currency, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [recordId, 'DEFAULT_TENANT', updatedTrip.id, 'payable', updatedTrip.driver_id, amount, updatedTrip.driver_pay_currency || 'CAD', 'PENDING']
                );
                console.log(`Financial record ${recordId} created for completed trip ${updatedTrip.id}`);
            } catch (triggerError) {
                console.error('Trigger logic failed but trip was updated:', triggerError);
            }
        }

        res.json(updatedTrip);
    } catch (e) {
        console.error('Error updating trip:', e);
        res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to update trip' });
    }
};
