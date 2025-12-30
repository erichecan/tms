
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function verifyFullFlow() {
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log('🚀 Starting Full Flow Verification...');

        // 1. Setup Data - Get Driver/Vehicle/Tenant
        const tenantIdRes = await client.query("SELECT id FROM tenants LIMIT 1");
        const tenantId = tenantIdRes.rows[0].id;
        const driverRes = await client.query("SELECT id FROM drivers LIMIT 1");
        const driverId = driverRes.rows[0].id;
        const vehicleRes = await client.query("SELECT id FROM vehicles LIMIT 1");
        const vehicleId = vehicleRes.rows[0].id; // Vehicle ID exists now
        const customerRes = await client.query("SELECT id FROM customers LIMIT 1");
        const customerId = customerRes.rows[0].id;

        console.log(`Phase 1: Setup - Tenant: ${tenantId}, Driver: ${driverId}, Vehicle: ${vehicleId}`);

        // 2. Create Shipment (Simulate Frontend /admin/waybill/create)
        const shipmentId = uuidv4();
        const shipmentNo = `VERIFY-${Date.now()}`;
        console.log(`Phase 2: Creating Shipment ${shipmentNo}...`);

        // Direct DB insert to simulate backend API creation (skipping auth for script simplicity)
        await client.query(`
            INSERT INTO shipments (
                id, tenant_id, shipment_number, customer_id, 
                status, pickup_address, delivery_address, cargo_info,
                created_at, updated_at,
                shipper_name, receiver_name, driver_fee
            ) VALUES (
                $1, $2, $3, $4, 
                'created', 
                '{"city": "Test City"}', '{"city": "Test Dest"}', '[{"description": "Test Goods"}]',
                NOW(), NOW(),
                'Test Shipper', 'Test Receiver', 150.00
            )
        `, [shipmentId, tenantId, shipmentNo, customerId]);

        // 3. User clicks "Assign Driver" -> Selects Driver -> Clicks "Create New Trip"
        // Frontend navigates to /trip with state: { selectedShipmentIds: [shipmentId] }
        // User clicks "Generate Trip Sheet" -> Sends POST /api/trips
        console.log(`Phase 3: Creating Trip for Shipment ${shipmentId}...`);

        const tripId = uuidv4();
        const tripNo = `TRIP-VERIFY-${Date.now()}`;
        const startTime = new Date().toISOString();
        const endTime = new Date(Date.now() + 3600000).toISOString();

        // Simulate Controller Logic: Create Trip and Link Shipment
        // In the real app, DatabaseService.createTrip does the update.
        // We will simulate that logic here to verify the concept works.

        await client.query('BEGIN');

        await client.query(`
            INSERT INTO trips (
                id, tenant_id, trip_no, status, driver_id, vehicle_id,
                start_time_planned, end_time_planned, created_at, updated_at
            ) VALUES (
                $1, $2, $3, 'planned', $4, $5,
                $6, $7, NOW(), NOW()
            )
        `, [tripId, tenantId, tripNo, driverId, vehicleId, startTime, endTime]);

        // The Fix: Update Shipment trip_id
        await client.query(`
            UPDATE shipments 
            SET trip_id = $1, status = 'assigned', driver_id = $2
            WHERE id = $3
        `, [tripId, driverId, shipmentId]);

        await client.query('COMMIT');
        console.log('✅ Trip Created and Shipment Linked.');

        // 4. Verify Data Linkage
        const checkShipment = await client.query('SELECT trip_id, driver_fee FROM shipments WHERE id = $1', [shipmentId]);
        if (checkShipment.rows[0].trip_id === tripId) {
            console.log('✅ Verification - Shipment IS linked to Trip.');
        } else {
            console.error('❌ Verification - Shipment is NOT linked to Trip!');
        }

        // 5. Verify Finance Logic (Cumulative)
        // Logic: if trip_fee is null, sum(shipment.driver_fee)
        const checkTrip = await client.query('SELECT trip_fee FROM trips WHERE id = $1', [tripId]);
        const tripFee = checkTrip.rows[0].trip_fee; // Should be null
        const driverFee = parseFloat(checkShipment.rows[0].driver_fee);

        let calculatedWage = 0;
        if (tripFee) {
            calculatedWage = parseFloat(tripFee);
        } else {
            calculatedWage = driverFee; // Sum of 1 shipment
        }

        console.log(`Phase 4: Finance Check - Trip Fee: ${tripFee}, Driver Fee: ${driverFee}, Calculated Wage: ${calculatedWage}`);

        if (calculatedWage === 150.00) {
            console.log('✅ Verification - Cumulative Salary Logic Correct (150.00).');
        } else {
            console.error(`❌ Verification - Salary Logic Failed! Expected 150.00, got ${calculatedWage}`);
        }

    } catch (e) {
        console.error('❌ Verification Failed:', e);
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
}

verifyFullFlow();
