import * as express from 'express';
import {
    getDrivers, createDriver, updateDriver, deleteDriver, getDriverAvailability,
    getVehicles, createVehicle, updateVehicle, deleteVehicle, getVehicleAvailability,
    getExpenses, createExpense, updateExpense, deleteExpense,
    getTrips, createTrip, updateTrip
} from '../controllers/FleetController';

const router = express.Router();

router.get('/drivers', getDrivers);
router.post('/drivers', createDriver);
router.put('/drivers/:id', updateDriver);
router.get('/drivers/:id/availability', getDriverAvailability);
router.delete('/drivers/:id', deleteDriver);

router.get('/vehicles', getVehicles);
router.post('/vehicles', createVehicle);
router.put('/vehicles/:id', updateVehicle);
router.get('/vehicles/:id/availability', getVehicleAvailability);
router.delete('/vehicles/:id', deleteVehicle);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

router.get('/trips', getTrips);
router.post('/trips', createTrip);
router.put('/trips/:id', updateTrip);

export default router;
