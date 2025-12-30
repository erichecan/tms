import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function createDemoData() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB');

        // 1. Get or Create a Tenant, Customer, Driver, Vehicle
        // 1. Get or Create a Tenant
        const tenantRes = await client.query('SELECT tenant_id FROM drivers LIMIT 1');
        let tenantId = tenantRes.rows[0]?.tenant_id;
        if (!tenantId) {
            tenantId = uuidv4();
        }

        // Find a driver
        const driverRes = await client.query('SELECT id, name FROM drivers LIMIT 1');
        let driverId = driverRes.rows[0]?.id;
        if (!driverId) {
            // Create dummy driver
            const newDriver = await client.query(`INSERT INTO drivers (name, status, tenant_id) VALUES ('Demo Driver', 'active', $1) RETURNING id`, [tenantId]);
            driverId = newDriver.rows[0].id;
        }

        // Find a vehicle
        const vehicleRes = await client.query('SELECT id, plate_number FROM vehicles LIMIT 1');
        let vehicleId = vehicleRes.rows[0]?.id;
        if (!vehicleId) {
            const newVehicle = await client.query(`INSERT INTO vehicles (plate_number, type, tenant_id) VALUES ('DEMO-001', 'van', $1) RETURNING id`, [tenantId]);
            vehicleId = newVehicle.rows[0].id;
        }

        // Find a customer
        const custRes = await client.query('SELECT id FROM customers LIMIT 1');
        let customerId = custRes.rows[0]?.id;
        if (!customerId) {
            const newCust = await client.query(`INSERT INTO customers (name, type, tenant_id) VALUES ('Demo Customer', 'standard', $1) RETURNING id`, [tenantId]);
            customerId = newCust.rows[0].id;
        }

        console.log(`Using Driver: ${driverId}, Vehicle: ${vehicleId}, Customer: ${customerId}`);

        // 2. Create 3 Shipments
        // Status: committed (CONFIRMED)
        // Driver/Vehicle: Assigned (Scenario 1: Same Driver/Vehicle)
        // No Trip ID yet
        const shipments = [
            { no: 'DEMO-W01', receiver: 'Receiver A' },
            { no: 'DEMO-W02', receiver: 'Receiver B' },
            { no: 'DEMO-W03', receiver: 'Receiver C' },
        ];

        for (const s of shipments) {
            // Check if exists
            const exist = await client.query('SELECT id FROM shipments WHERE shipment_number = $1', [s.no]);
            if (exist.rows.length > 0) {
                console.log(`Shipment ${s.no} exists, resetting trip_id...`);
                // Assume vehicle_id logic needs restoring too if updating
                await client.query('UPDATE shipments SET trip_id = NULL, status = \'committed\', driver_id = $1, vehicle_id = $2 WHERE id = $3', [driverId, vehicleId, exist.rows[0].id]);
            } else {
                console.log(`Creating ${s.no}...`);
                await client.query(`
                INSERT INTO shipments (
                    id, tenant_id, shipment_number, customer_id, driver_id, vehicle_id,
                    status, pickup_address, delivery_address, cargo_info,
                    created_at, updated_at,
                    shipper_name, receiver_name, driver_fee
                ) VALUES (
                    $1, $2, $3, $4, $5, $6,
                    'committed', 
                    '{"city": "Toronto", "addressLine1": "Depot"}',
                    '{"city": "Toronto", "addressLine1": "Store"}',
                    '[{"description": "Demo Goods"}]',
                    NOW(), NOW(),
                    'Demo Shipper', $7, 100
                )
            `, [uuidv4(), tenantId, s.no, customerId, driverId, vehicleId, s.receiver]);
            }
        }

        console.log('Demo data created successfully.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

createDemoData();
