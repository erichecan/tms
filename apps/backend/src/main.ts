
import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { TripStatus, WaybillStatus } from './types.js';

const app = express();
const port = process.env.PORT || 3001; // Frontend usually 5173

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Dashboard APIs ---

app.get('/api/dashboard/metrics', (req, res) => {
  const totalWaybills = db.waybills.length;
  const activeTrips = db.trips.filter(t => t.status === TripStatus.ACTIVE).length;
  const pendingWaybills = db.waybills.filter(w => w.status === WaybillStatus.NEW).length;
  // Mock On-time rate
  const onTimeRate = 0.95;

  res.json({
    totalWaybills,
    activeTrips,
    pendingWaybills,
    onTimeRate
  });
});

app.get('/api/dashboard/jobs', (req, res) => {
  // Return last 5 waybills
  const recentWaybills = [...db.waybills]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  res.json(recentWaybills);
});


// --- Core Data APIs ---

app.get('/api/waybills', (req, res) => {
  const status = req.query.status as string;
  let result = db.waybills;
  if (status) {
    result = result.filter(w => w.status === status);
  }
  res.json(result);
});

app.post('/api/waybills', (req, res) => {
  const newWaybill = {
    id: `WB-${Date.now()}`,
    created_at: new Date().toISOString(),
    status: WaybillStatus.NEW,
    ...req.body
  };
  db.waybills.push(newWaybill);
  res.json(newWaybill);
});

app.post('/api/waybills/:id/assign', (req, res) => {
  const { id } = req.params;
  const { driver_id, vehicle_id } = req.body;

  const waybill = db.waybills.find(w => w.id === id);
  if (!waybill) return res.status(404).json({ error: 'Waybill not found' });

  // Create a new Trip for this assignment (Simple logic for MVP)
  const newTrip = {
    id: `T-${Date.now()}`,
    driver_id,
    vehicle_id,
    status: TripStatus.PLANNED,
    start_time_est: new Date().toISOString(),
    end_time_est: new Date(Date.now() + 86400000).toISOString(), // +1 day
  };

  db.trips.push(newTrip);

  // Update Waybill
  waybill.status = WaybillStatus.ASSIGNED;
  waybill.trip_id = newTrip.id;

  // Update Driver/Vehicle Status
  const driver = db.drivers.find(d => d.id === driver_id);
  if (driver) driver.status = 'BUSY';

  const vehicle = db.vehicles.find(v => v.id === vehicle_id);
  if (vehicle) vehicle.status = 'BUSY';

  res.json({ waybill, trip: newTrip });
});

app.get('/api/drivers', (req, res) => {
  res.json(db.drivers);
});

app.get('/api/vehicles', (req, res) => {
  res.json(db.vehicles);
});


app.get('/api/expenses', (req, res) => {
  res.json(db.expenses);
});

// --- Tracking & Communication APIs ---

app.get('/api/trips/:id/tracking', (req, res) => {
  const { id } = req.params;
  const trip = db.trips.find(t => t.id === id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const waybills = db.waybills.filter(w => w.trip_id === id);
  const driver = db.drivers.find(d => d.id === trip.driver_id);
  const vehicle = db.vehicles.find(v => v.id === trip.vehicle_id);

  res.json({
    ...trip,
    waybills,
    driver,
    vehicle,
    // Add mock location for map
    currentLocation: { lat: 41.59, lng: -93.60, place: 'Near Des Moines, IA' }
  });
});

app.get('/api/trips/:id/messages', (req, res) => {
  const { id } = req.params;
  const messages = db.messages.filter(m => m.trip_id === id);
  res.json(messages);
});

app.post('/api/trips/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const newMessage = {
    id: `M-${Date.now()}`,
    trip_id: id,
    sender: 'DISPATCHER', // Hardcoded for now
    text,
    timestamp: new Date().toISOString()
  };
  // @ts-ignore
  db.messages.push(newMessage);
  res.json(newMessage);
});



app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

