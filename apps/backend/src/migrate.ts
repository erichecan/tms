
import { pool } from './db-postgres';

const migrate = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // --- Create Tables ---

        await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'IDLE',
        avatar_url TEXT
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(50) PRIMARY KEY,
        plate VARCHAR(20) NOT NULL,
        model VARCHAR(50),
        capacity VARCHAR(50),
        status VARCHAR(20) DEFAULT 'IDLE'
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(50) PRIMARY KEY,
        driver_id VARCHAR(50),
        vehicle_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'PLANNED',
        start_time_est TIMESTAMP,
        end_time_est TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS waybills (
        id VARCHAR(50) PRIMARY KEY,
        waybill_no VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50),
        origin VARCHAR(100),
        destination VARCHAR(100),
        cargo_desc TEXT,
        status VARCHAR(20) DEFAULT 'NEW',
        trip_id VARCHAR(50),
        price_estimated NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        fulfillment_center VARCHAR(100),
        delivery_date DATE,
        reference_code VARCHAR(100),
        pallet_count INTEGER,
        total_weight NUMERIC,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        distance NUMERIC,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50),
        amount NUMERIC,
        trip_id VARCHAR(50),
        date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'PENDING'
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        trip_id VARCHAR(50),
        sender VARCHAR(20),
        text TEXT,
        timestamp TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS trip_events (
        id SERIAL PRIMARY KEY,
        trip_id VARCHAR(50),
        status VARCHAR(20),
        time TIMESTAMP,
        description TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );
    `);

        // --- Seed Data (Idempotent) ---

        // Drivers
        await client.query(`
      INSERT INTO drivers (id, name, phone, status, avatar_url) VALUES 
      ('D-001', 'James Holloway', '555-0101', 'BUSY', 'https://i.pravatar.cc/150?u=D-001'),
      ('D-002', 'Robert McAllister', '555-0102', 'IDLE', 'https://i.pravatar.cc/150?u=D-002'),
      ('D-003', 'Michael Davidson', '555-0103', 'BUSY', 'https://i.pravatar.cc/150?u=D-003')
      ON CONFLICT (id) DO NOTHING;
    `);

        // Vehicles
        await client.query(`
      INSERT INTO vehicles (id, plate, model, capacity, status) VALUES 
      ('V-101', 'TX-101', 'Volvo VNL', '53ft', 'BUSY'),
      ('V-102', 'TX-102', 'Peterbilt 579', '53ft', 'IDLE'),
      ('V-103', 'TX-103', 'Kenworth T680', '53ft', 'BUSY')
      ON CONFLICT (id) DO NOTHING;
    `);

        // Only seed trips if table is empty to avoid dupes/fk issues
        const tripCount = await client.query('SELECT COUNT(*) FROM trips');
        if (parseInt(tripCount.rows[0].count) === 0) {
            await client.query(`
          INSERT INTO trips (id, driver_id, vehicle_id, status, start_time_est, end_time_est) VALUES 
          ('T-1001', 'D-001', 'V-101', 'ACTIVE', '2026-01-08T08:00:00Z', '2026-01-08T18:00:00Z'),
          ('T-1002', 'D-003', 'V-103', 'ACTIVE', '2026-01-08T09:00:00Z', '2026-01-09T12:00:00Z');
        `);

            // Waybills
            await client.query(`
          INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, trip_id, price_estimated, created_at) VALUES 
          ('WB-001', 'WB-20260108-001', 'C-01', 'Omaha, NE', 'Chicago, IL', 'Pork Bellies - 20 Pallets', 'IN_TRANSIT', 'T-1001', 1200, '2026-01-07T10:00:00Z'),
          ('WB-004', 'WB-20260108-004', 'C-03', 'St. Louis, MO', 'Nashville, TN', 'Poultry - 22 Pallets', 'IN_TRANSIT', 'T-1002', 1100, '2026-01-07T14:00:00Z');
        `);

            // Other Waybills
            await client.query(`
           INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, price_estimated, created_at) VALUES 
           ('WB-002', 'WB-20260108-002', 'C-02', 'Kansas City, MO', 'Dallas, TX', 'Frozen Beef - 18 Pallets', 'NEW', 1500, '2026-01-08T09:00:00Z'),
           ('WB-003', 'WB-20260108-003', 'C-01', 'Des Moines, IA', 'Minneapolis, MN', 'Live Hogs - 150 Head', 'NEW', 800, '2026-01-08T10:30:00Z');
         `);

            // Events
            await client.query(`
          INSERT INTO trip_events (trip_id, status, time, description) VALUES
          ('T-1001', 'PLANNED', '2026-01-08T07:00:00Z', 'Trip created'),
          ('T-1001', 'ACTIVE', '2026-01-08T08:15:00Z', 'Driver departed from Omaha');
        `);

            // Messages
            await client.query(`
          INSERT INTO messages (id, trip_id, sender, text, timestamp) VALUES
          ('M-1', 'T-1001', 'DRIVER', 'Loaded and rolling out.', '2026-01-08T08:16:00Z'),
          ('M-2', 'T-1001', 'DISPATCHER', 'Copy that. Watch out for snow near Des Moines.', '2026-01-08T08:18:00Z');
        `);
        }

        await client.query('COMMIT');
        console.log("Migration successful");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed", e);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));
