
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/backend/.env (parent of scripts/)
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    console.log('🚀 Starting Payroll Simulation Data Seeding (PG Mode)...');
    console.log('Database URL found:', !!process.env.DATABASE_URL);

    const client = await pool.connect();
    try {
        // 0. Get a Tenant
        let tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
        let tenantId;
        if (tenantRes.rows.length === 0) {
            console.log('Creating Default Tenant...');
            tenantId = uuidv4();
            await client.query(`
            INSERT INTO tenants (id, name, domain, schema_name, status, settings, created_at, updated_at)
            VALUES ($1, 'Simulation Tenant', 'sim.example.com', 'public', 'active', '{}', NOW(), NOW())
        `, [tenantId]);
        } else {
            tenantId = tenantRes.rows[0].id;
        }
        console.log(`✅ Using Tenant ID: ${tenantId}`);

        // 1. Get or Create a Driver
        const driverName = 'Simulation Driver';
        let driverRes = await client.query('SELECT id FROM drivers WHERE name = $1 AND tenant_id = $2', [driverName, tenantId]);
        let driverId;

        if (driverRes.rows.length === 0) {
            console.log('Creating Simulation Driver...');
            driverId = uuidv4();
            await client.query(`
        INSERT INTO drivers (id, tenant_id, name, phone, license_number, status, created_at, updated_at)
        VALUES ($1, $2, $3, '1234567890', 'SIM-LIC-001', 'active', NOW(), NOW())
      `, [driverId, tenantId, driverName]);
        } else {
            driverId = driverRes.rows[0].id;
        }
        console.log(`✅ Driver Ready: ${driverName} (${driverId})`);

        // 2. Get or Create a Vehicle
        const plate = 'SIM-TRUCK-01';
        let vehicleRes = await client.query('SELECT id FROM vehicles WHERE plate_number = $1 AND tenant_id = $2', [plate, tenantId]);
        let vehicleId; // Not strictly needed for payroll but good for completeness

        if (vehicleRes.rows.length === 0) {
            console.log('Creating Simulation Vehicle...');
            vehicleId = uuidv4();
            // Check schema cols for vehicles from sql file: plate_number, type, capacity_kg...
            await client.query(`
            INSERT INTO vehicles (id, tenant_id, plate_number, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, 'Truck', 'active', NOW(), NOW())
        `, [vehicleId, tenantId, plate]);
        } else {
            vehicleId = vehicleRes.rows[0].id;
        }
        console.log(`✅ Vehicle Ready: ${plate}`);

        // Debug: Check columns
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments'");
        console.log('Shipment Columns:', cols.rows.map(r => r.column_name).join(', '));

        // 3. Create Waybills (Shipments)
        // We need 2 completed shipments.
        const s1Id = uuidv4();
        const s2Id = uuidv4();
        const now = new Date();
        const yesterday = dayjs().subtract(1, 'day').toDate();

        const timeline = JSON.stringify({
            created: yesterday.toISOString(),
            picked_up: yesterday.toISOString(),
            delivered: now.toISOString(),
            completed: now.toISOString()
        });

        // Need a customer ID potentially?
        // Let's grab first customer
        let custRes = await client.query('SELECT id FROM customers WHERE tenant_id = $1 LIMIT 1', [tenantId]);
        let customerId = custRes.rows[0]?.id || 'dummy_customer';
        if (!custRes.rows[0]) {
            // Create dummy customer if needed
            await client.query(`
            INSERT INTO customers (id, tenant_id, name, email, phone, level, created_at, updated_at)
            VALUES ($1, $2, 'Sim Customer', 'sim@test.com', '111', 'standard', NOW(), NOW())
        `, [customerId, tenantId]);
        }

        // Insert Shipment 1
        await client.query(`
        INSERT INTO shipments (
            id, tenant_id, shipment_number, customer_id, driver_id, status, 
            pickup_address, delivery_address,
            estimated_cost, final_cost, 
            timeline, created_at, updated_at,
            pickup_at, delivery_at,
            cargo_info
        ) VALUES (
            $1, $2, $3, $4, $5, 'completed',
            '{}', '{}',
            100.00, 100.00,
            $6::jsonb, $7, $8,
            $9, $10,
            '[]'::jsonb
        )
    `, [
            s1Id, tenantId, `SIM-WB-${dayjs().format('HHmmss')}-1`, customerId, driverId,
            timeline, yesterday, now,
            yesterday, now
        ]);
        console.log(`✅ Shipment 1 Created: SIM-WB-...-1 ($100)`);

        // Insert Shipment 2
        await client.query(`
        INSERT INTO shipments (
            id, tenant_id, shipment_number, customer_id, driver_id, status, 
            pickup_address, delivery_address,
            estimated_cost, final_cost, 
            timeline, created_at, updated_at,
            pickup_at, delivery_at,
            cargo_info
        ) VALUES (
            $1, $2, $3, $4, $5, 'completed',
            '{}', '{}',
            200.00, 200.00,
            $6::jsonb, $7, $8,
            $9, $10,
            '[]'::jsonb
        )
    `, [
            s2Id, tenantId, `SIM-WB-${dayjs().format('HHmmss')}-2`, customerId, driverId,
            timeline, yesterday, now,
            yesterday, now
        ]);
        console.log(`✅ Shipment 2 Created: SIM-WB-...-2 ($200)`);

        console.log('\n🎉 Simulation Data Ready!');
        console.log('👉 Go to the Driver Salary Page and select "Simulation Driver".');
        console.log('👉 Verify income is present.');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
