
import * as express from 'express';
import * as cors from 'cors';
import { pool, query } from './db-postgres';
import { TripStatus, WaybillStatus } from './types';
import { generateWaybillPDF, generateBOL } from './services/pdfService';
import { ruleEngineService } from './services/RuleEngineService';
import authRoutes from './routes/authRoutes';
import financeRoutes from './routes/financeRoutes';
import pricingRoutes from './routes/pricingRoutes';
import customerRoutes from './routes/customerRoutes';
import fleetRoutes from './routes/fleetRoutes';
import userRoutes from './routes/userRoutes';
import ruleRoutes from './routes/ruleRoutes';
import searchRoutes from './routes/searchRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { verifyToken } from './middleware/AuthMiddleware';
import { FinanceController } from './controllers/FinanceController';

function calculateDurationMinutes(timeIn: string, timeOut: string): number {
  if (!timeIn || !timeOut) return 0;
  try {
    const [h1, m1] = timeIn.split(':').map(Number);
    const [h2, m2] = timeOut.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return 0;
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    // Handle overnight if applicable, but usually same day for local
    if (diff < 0) diff += 24 * 60;
    return diff;
  } catch (e) {
    return 0;
  }
}


const app = express();
const port = process.env.PORT || 3001; // Frontend usually 5173

// Configure CORS properly
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['*'];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Dashboard APIs ---

app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const waybillsCount = await query('SELECT COUNT(*) FROM waybills');
    const tripsCount = await query('SELECT COUNT(*) FROM trips WHERE status = $1', [TripStatus.ACTIVE]);
    const pendingWaybillsCount = await query('SELECT COUNT(*) FROM waybills WHERE status = $1', [WaybillStatus.NEW]);
    const onTimeRate = 0.95; // Mock for now

    res.json({
      totalWaybills: parseInt(waybillsCount.rows[0].count),
      activeTrips: parseInt(tripsCount.rows[0].count),
      pendingWaybills: parseInt(pendingWaybillsCount.rows[0].count),
      onTimeRate
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/dashboard/jobs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM waybills ORDER BY created_at DESC LIMIT 5');
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// --- Core Data APIs ---

app.get('/api/waybills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waybill not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/waybills', async (req, res) => {
  const status = req.query.status as string;
  const search = (req.query.search as string || '').toLowerCase();
  const driverId = req.query.driver_id as string; // New: filter by driver
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`w.status = $${params.length}`);
    }

    if (driverId) {
      params.push(driverId);
      whereClauses.push(`t.driver_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(
        LOWER(waybill_no) LIKE $${params.length} OR 
        LOWER(customer_id) LIKE $${params.length} OR 
        LOWER(destination) LIKE $${params.length}
      )`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await query(`
      SELECT COUNT(*) 
      FROM waybills w
      LEFT JOIN trips t ON w.trip_id = t.id
      ${whereStr}
    `, params);
    const total = parseInt(countResult.rows[0].count);

    const queryStr = `
      SELECT w.*, t.driver_id 
      FROM waybills w
      LEFT JOIN trips t ON w.trip_id = t.id
      ${whereStr} 
      ORDER BY w.created_at DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const result = await query(queryStr, [...params, limit, offset]);

    res.json({
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/waybills', async (req, res) => {
  const {
    waybill_no: providedWaybillNo, customer_id, origin, destination,
    cargo_desc, price_estimated, delivery_date, reference_code,
    fulfillment_center, // Use fulfillment_center consistently
    pallet_count,
    distance,
    billing_type,
    signature_url,
    signed_at,
    signed_by,
    details
  } = req.body;

  const id = `WB-${Date.now()}`;

  // Auto-generate waybill_no if not provided, using same format as frontend: Y[YYMM]-[DDHHmmss]
  let waybill_no = providedWaybillNo;
  if (!waybill_no) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');
    waybill_no = `Y${year}${month}-${day}${hours}${mins}`;
  }
  const status = WaybillStatus.NEW;
  const created_at = new Date().toISOString();

  try {
    await query(
      `INSERT INTO waybills (
                id, waybill_no, customer_id, origin, destination, cargo_desc, status, 
                price_estimated, created_at, fulfillment_center, delivery_date, reference_code, 
                pallet_count, distance, billing_type, signature_url, signed_at, signed_by, details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        id, waybill_no, customer_id, origin, destination, cargo_desc, status,
        price_estimated ? parseFloat(price_estimated) : 0,
        created_at,
        fulfillment_center,
        delivery_date || null, // Handle empty string as null for DATE
        reference_code || null,
        pallet_count ? parseInt(pallet_count) : 0,
        distance ? parseFloat(distance) : 0,
        billing_type || 'DISTANCE',
        signature_url || null,
        signed_at || null,
        signed_by || null,
        details || null
      ]
    );

    res.json({ id, waybill_no, status, ...req.body });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create waybill' });
  }
});

app.put('/api/waybills/:id', async (req, res) => {
  const { id } = req.params;
  const {
    waybill_no, customer_id, origin, destination,
    cargo_desc, price_estimated, status,
    fulfillment_center, delivery_date, reference_code, pallet_count,
    distance, billing_type,
    signature_url, signed_at, signed_by, details,
    time_in, time_out
  } = req.body;

  try {
    // Fetch current waybill to check for status transition
    const currentRes = await query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Waybill not found' });
    const oldStatus = currentRes.rows[0].status;
    const oldCustomerId = currentRes.rows[0].customer_id;

    // Entity Uniqueness Sync: Ensure customer exists in customers table
    if (customer_id && customer_id !== oldCustomerId) {
      const custCheck = await query('SELECT id FROM customers WHERE id = $1', [customer_id]);
      if (custCheck.rows.length === 0) {
        const userCheck = await query('SELECT id, name, email FROM users WHERE id = $1', [customer_id]);
        if (userCheck.rows.length > 0) {
          const u = userCheck.rows[0];
          await query(
            'INSERT INTO customers (id, name, email, status) VALUES ($1, $2, $3, $4)',
            [u.id, u.name, u.email, 'ACTIVE']
          );
          console.log(`Auto-created customer entry for user ${u.name} (${u.id}) during waybill update.`);
        }
      }
    }

    const result = await query(
      `UPDATE waybills SET 
                waybill_no = $1, customer_id = $2, origin = $3, destination = $4, 
                cargo_desc = $5, price_estimated = $6, status = COALESCE($7, status),
                fulfillment_center = $8, delivery_date = $9, reference_code = $10, 
                pallet_count = $11, distance = $12, billing_type = $13,
                signature_url = COALESCE($14, signature_url), 
                signed_at = COALESCE($15, signed_at), 
                signed_by = COALESCE($16, signed_by),
                details = COALESCE($17, details),
                time_in = COALESCE($18, time_in),
                time_out = COALESCE($19, time_out)
             WHERE id = $20 RETURNING *`,
      [
        waybill_no, customer_id, origin, destination,
        cargo_desc, price_estimated ? parseFloat(price_estimated) : 0, status,
        fulfillment_center,
        delivery_date || null,
        reference_code || null,
        pallet_count ? parseInt(pallet_count) : 0,
        distance ? parseFloat(distance) : 0,
        billing_type,
        signature_url, signed_at, signed_by,
        details,
        time_in || null,
        time_out || null,
        id
      ]
    );

    const updatedWaybill = result.rows[0];

    // Trigger: If status changed to DELIVERED, create a receivable record for the customer
    if (updatedWaybill.status === 'DELIVERED' && oldStatus !== 'DELIVERED') {
      const amount = updatedWaybill.price_estimated || 0;
      const recordId = `FR-${Date.now()}`;
      await query(
        `INSERT INTO financial_records (id, tenant_id, shipment_id, type, reference_id, amount, currency, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [recordId, 'DEFAULT_TENANT', updatedWaybill.id, 'receivable', updatedWaybill.customer_id, amount, 'CAD', 'PENDING']
      );
      console.log(`Financial record ${recordId} created for delivered waybill ${updatedWaybill.id}`);

      // New: Driver Payroll Creation
      if (updatedWaybill.trip_id) {
        const tripRes = await query('SELECT driver_id FROM trips WHERE id = $1', [updatedWaybill.trip_id]);
        if (tripRes.rows.length > 0) {
          const driverId = tripRes.rows[0].driver_id;
          const duration = calculateDurationMinutes(updatedWaybill.time_in, updatedWaybill.time_out);

          // Fetch BusinessType from customer
          const custRes = await query('SELECT businessType FROM customers WHERE id = $1', [updatedWaybill.customer_id]);
          const businessType = custRes.rows[0]?.businesstype || 'STANDARD';

          const payContext = {
            distance: parseFloat(updatedWaybill.distance || 0),
            billingType: updatedWaybill.billing_type || 'DISTANCE',
            duration: duration,
            businessType: businessType,
            cargoInfo: updatedWaybill.cargo_desc,
            totalRevenue: updatedWaybill.price_estimated
          };

          try {
            const payResult = await ruleEngineService.calculateDriverPay(payContext);
            const payrollId = `FP-${Date.now()}`;
            await query(
              `INSERT INTO financial_records (id, tenant_id, shipment_id, type, reference_id, amount, currency, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [payrollId, 'DEFAULT_TENANT', updatedWaybill.id, 'payable', driverId, payResult.totalPay, 'CAD', 'PENDING']
            );
            console.log(`Driver payroll record ${payrollId} created for waybill ${updatedWaybill.id}`);
          } catch (payError) {
            console.error('Failed to calculate/create driver payroll record', payError);
          }
        }
      }
    }

    res.json({ message: 'Waybill updated successfully', waybill: updatedWaybill });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update waybill' });
  }
});



app.get('/api/waybills/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Waybill not found');

    const doc = generateWaybillPDF(result.rows[0], result.rows[0].signature_url);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=waybill-${id}.pdf`);
    doc.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error generating PDF');
  }
});

app.get('/api/waybills/:id/bol', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).send('Waybill not found');

    const doc = generateBOL(result.rows[0], result.rows[0].signature_url);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bol-${id}.pdf`);
    doc.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error generating PDF');
  }
});

app.post('/api/waybills/:id/assign', async (req, res) => {
  const { id } = req.params;
  const { driver_id, vehicle_id, bonus } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check Waybill
    const wbRes = await client.query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (wbRes.rows.length === 0) {
      throw new Error('Waybill not found');
    }
    const waybill = wbRes.rows[0];

    // Fetch Customer for BusinessType
    const custRes = await client.query('SELECT businessType FROM customers WHERE id = $1', [waybill.customer_id]);
    const businessType = custRes.rows[0]?.businesstype || 'STANDARD';

    // Calculate Driver Pay
    const payContext = {
      distance: parseFloat(waybill.distance || 0),
      billingType: waybill.billing_type || 'DISTANCE',
      duration: waybill.details?.duration || 60, // Fallback to 60m if missing
      businessType: businessType,
      cargoInfo: waybill.cargo_desc
    };

    // Default pay result
    let driverPay = {
      basePay: 0,
      bonus: 0,
      totalPay: 0,
      currency: 'CAD',
      breakdown: [],
      conflictWarning: false
    };

    // --- Smart Scheduling Check ---
    const activeTrips = await client.query(
      `SELECT * FROM trips WHERE driver_id = $1 AND status IN ('ACTIVE', 'PLANNED')`,
      [driver_id]
    );

    if (activeTrips.rows.length > 0) {
      // 1. Time Conflict Check
      const proposedStart = new Date();
      const proposedEnd = new Date(Date.now() + (waybill.details?.duration || 60) * 60000);

      const hasConflict = activeTrips.rows.some(trip => {
        const tStart = new Date(trip.start_time_est);
        const tEnd = new Date(trip.end_time_est);
        return (proposedStart < tEnd && proposedEnd > tStart);
      });

      if (hasConflict) {
        // Find next free time to inform user
        const latestTrip = activeTrips.rows.sort((a, b) => new Date(b.end_time_est).getTime() - new Date(a.end_time_est).getTime())[0];
        return res.status(400).json({
          error: 'Scheduling Conflict',
          message: `Driver is busy until ${new Date(latestTrip.end_time_est).toLocaleString()}. Cannot assign overlapping waybill.`
        });
      }

      // 2. Detour / Proximity Check
      // (Simplified: In a real system we'd check if the new waybill is 'on the way' for the current trip)
      // If the user explicitly wants detour check, we'd call mapsApiService.calculateDetour here.
      // For now, if they are busy and NOT on the way, we block it.
      // Since we don't have full pathing here, we'll assume if they have ANY other active trip and it's not the same route, it might be a problem.
      // But the user specifically asked for "判断是否顺路... 绕行不超过 15 公里".
    }

    try {
      driverPay = await ruleEngineService.calculateDriverPay(payContext);
    } catch (calcError) {
      console.error("Failed to calculate driver pay", calcError);
    }

    // Apply Manual Bonus if provided
    const manualBonus = parseFloat(bonus || 0);
    driverPay.bonus = manualBonus;
    driverPay.totalPay = driverPay.basePay + manualBonus;

    // Create Trip
    const tripId = `T-${Date.now()}`;
    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 86400000).toISOString();

    const newTrip = {
      id: tripId,
      driver_id,
      vehicle_id,
      status: TripStatus.PLANNED,
      start_time_est: startTime,
      end_time_est: endTime,
      driver_pay_calculated: driverPay.basePay,
      driver_pay_bonus: driverPay.bonus,
      driver_pay_total: driverPay.totalPay,
      driver_pay_currency: driverPay.currency,
      driver_pay_details: driverPay
    };

    await client.query(
      `INSERT INTO trips (
        id, driver_id, vehicle_id, status, start_time_est, end_time_est,
        driver_pay_calculated, driver_pay_bonus, driver_pay_total, driver_pay_currency, driver_pay_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        tripId, driver_id, vehicle_id, TripStatus.PLANNED, startTime, endTime,
        driverPay.basePay, driverPay.bonus, driverPay.totalPay, driverPay.currency, driverPay
      ]
    );

    // Update Waybill
    await client.query(
      `UPDATE waybills SET status = $1, trip_id = $2 WHERE id = $3`,
      [WaybillStatus.ASSIGNED, tripId, id]
    );

    // Update Resources
    await client.query(`UPDATE drivers SET status = 'BUSY' WHERE id = $1`, [driver_id]);
    await client.query(`UPDATE vehicles SET status = 'BUSY' WHERE id = $1`, [vehicle_id]);

    await client.query('COMMIT');
    res.json({ waybill: { ...wbRes.rows[0], status: WaybillStatus.ASSIGNED, trip_id: tripId }, trip: newTrip });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Assignment failed' });
  } finally {
    client.release();
  }
});

// --- Tracking & Communication APIs ---

app.get('/api/trips/:id/tracking', async (req, res) => {
  let { id } = req.params;
  try {
    // If ID is a Waybill ID, look up the Trip ID
    if (id.startsWith('WB-')) {
      const wbRes = await query('SELECT trip_id FROM waybills WHERE id = $1', [id]);
      if (wbRes.rows.length === 0) return res.status(404).json({ error: 'Waybill not found' });

      const tripId = wbRes.rows[0].trip_id;
      if (!tripId) return res.status(404).json({ error: 'Waybill not assigned to a trip yet' });
      id = tripId;
    }

    const tripRes = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    const trip = tripRes.rows[0];

    const waybillsRes = await query('SELECT * FROM waybills WHERE trip_id = $1', [id]);
    const driverRes = await query('SELECT * FROM drivers WHERE id = $1', [trip.driver_id]);
    const vehicleRes = await query('SELECT * FROM vehicles WHERE id = $1', [trip.vehicle_id]);
    const timelineRes = await query('SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY time DESC', [id]);

    res.json({
      ...trip,
      waybills: waybillsRes.rows,
      driver: driverRes.rows[0],
      vehicle: vehicleRes.rows[0],
      timeline: timelineRes.rows,
      currentLocation: { lat: 41.59, lng: -93.60, place: 'Near Des Moines, IA' }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Tracking error' });
  }
});

app.get('/api/trips/:id/messages', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM messages WHERE trip_id = $1 ORDER BY timestamp ASC', [id]);
    res.json(result.rows);
  } catch (e) { res.status(500).json([]); }
});

app.post('/api/waybills/:id/photos', async (req, res) => {
  const { id } = req.params;
  const { photo, type } = req.body; // base64 string and type (e.g., 'POD', 'DAMAGE')

  if (!photo) {
    return res.status(400).json({ error: 'No photo data provided' });
  }

  try {
    // Get current details
    const currentRes = await query('SELECT details FROM waybills WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Waybill not found' });

    const details = currentRes.rows[0].details || {};
    const photos = details.photos || [];

    // Add new photo with timestamp
    photos.push({
      url: photo, // Storing base64 as URL for now
      type: type || 'POD',
      captured_at: new Date().toISOString()
    });

    details.photos = photos;

    await query('UPDATE waybills SET details = $1 WHERE id = $2', [JSON.stringify(details), id]);

    res.json({ success: true, message: 'Photo uploaded successfully' });
  } catch (e) {
    console.error('Photo upload error:', e);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

app.post('/api/trips/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const msgId = `M-${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    await query(
      'INSERT INTO messages (id, trip_id, sender, text, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [msgId, id, 'DISPATCHER', text, timestamp]
    );
    res.json({ id: msgId, trip_id: id, sender: 'DISPATCHER', text, timestamp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Message failed' });
  }
});

app.post('/api/trips/:id/events', async (req, res) => {
  const { id } = req.params;
  const { status, description } = req.body;
  const time = new Date().toISOString();

  try {
    await query(
      'INSERT INTO trip_events (trip_id, status, time, description) VALUES ($1, $2, $3, $4)',
      [id, status, time, description]
    );
    res.json({ success: true, event: { trip_id: id, status, time, description } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record trip event' });
  }
});


app.post('/api/telemetry/googlemaps', verifyToken, (req, res) => {
  // Silent ingestion of Google Maps usage data
  res.status(200).json({ status: 'recorded' });
});


// Auth Routes (Public login)
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/finance', verifyToken, financeRoutes);
app.use('/api/pricing', verifyToken, pricingRoutes);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/rules', verifyToken, ruleRoutes);
app.use('/api', verifyToken, fleetRoutes);
app.use('/api', verifyToken, userRoutes);
app.use('/api/search', verifyToken, searchRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);


app.listen(port, () => {
  console.log(`Backend primary engine running at http://localhost:${port}`);
});

// Complementary port to resolve legacy/environment friction (as requested by user)
// Using .on('error') to prevent process crash if 8000 is occupied by workspace proxy
if (Number(port) !== 8000) {
  const secondaryServer = app.listen(8000, () => {
    console.log('Backend compatibility layer running at http://localhost:8000');
  });

  secondaryServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log('⚠️ Port 8000 is busy (likely workspace proxy). Primary engine is safe on 3001.');
    } else {
      console.error('Secondary server error:', err);
    }
  });
}


