
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
import { verifyToken } from './middleware/AuthMiddleware';


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
app.use(express.json());

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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
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

    const countResult = await query(`SELECT COUNT(*) FROM waybills ${whereStr}`, params);
    const total = parseInt(countResult.rows[0].count);

    const queryStr = `
      SELECT * FROM waybills 
      ${whereStr} 
      ORDER BY created_at DESC 
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
    waybill_no, customer_id, origin, destination,
    cargo_desc, price_estimated, delivery_date, reference_code,
    fc_alias,
    pallet_count,
    details // New JSONB field
  } = req.body;

  const id = `WB-${Date.now()}`;
  const status = WaybillStatus.NEW;
  const created_at = new Date().toISOString();

  try {
    await query(
      `INSERT INTO waybills (
                id, waybill_no, customer_id, origin, destination, cargo_desc, status, 
                price_estimated, created_at, fulfillment_center, delivery_date, reference_code, pallet_count, details
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        id, waybill_no, customer_id, origin, destination, cargo_desc, status,
        price_estimated, created_at, fc_alias, delivery_date, reference_code,
        pallet_count ? parseInt(pallet_count) : 0,
        details // Save full JSON state
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
    signature_url, signed_at, signed_by, details
  } = req.body;

  try {
    // Fetch current waybill to check for status transition
    const currentRes = await query('SELECT * FROM waybills WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) return res.status(404).json({ error: 'Waybill not found' });
    const oldStatus = currentRes.rows[0].status;

    const result = await query(
      `UPDATE waybills SET 
                waybill_no = $1, customer_id = $2, origin = $3, destination = $4, 
                cargo_desc = $5, price_estimated = $6, status = COALESCE($7, status),
                fulfillment_center = $8, delivery_date = $9, reference_code = $10, pallet_count = $11,
                signature_url = COALESCE($12, signature_url), 
                signed_at = COALESCE($13, signed_at), 
                signed_by = COALESCE($14, signed_by),
                details = COALESCE($15, details)
             WHERE id = $16 RETURNING *`,
      [
        waybill_no, customer_id, origin, destination,
        cargo_desc, price_estimated, status,
        fulfillment_center, delivery_date, reference_code, pallet_count ? parseInt(pallet_count) : 0,
        signature_url, signed_at, signed_by,
        details,
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


// Auth Routes (Public login)
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/finance', verifyToken, financeRoutes);
app.use('/api/pricing', verifyToken, pricingRoutes);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/rules', verifyToken, ruleRoutes);
app.use('/api', verifyToken, fleetRoutes);
app.use('/api', verifyToken, userRoutes);


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


