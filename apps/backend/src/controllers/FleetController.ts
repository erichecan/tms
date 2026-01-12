import { Request, Response } from 'express';
import { db } from '../db';
import { Driver, Vehicle, Expense, Trip } from '../types';

// --- Drivers ---
export const getDrivers = (req: Request, res: Response) => {
    res.json(db.drivers);
};
export const createDriver = (req: Request, res: Response) => {
    const newDriver = { id: `D-${Date.now()}`, ...req.body };
    db.drivers.push(newDriver);
    res.status(201).json(newDriver);
};
export const updateDriver = (req: Request, res: Response) => {
    const idx = db.drivers.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Driver not found' });
    db.drivers[idx] = { ...db.drivers[idx], ...req.body };
    res.json(db.drivers[idx]);
};
export const deleteDriver = (req: Request, res: Response) => {
    const idx = db.drivers.findIndex(d => d.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    db.drivers.splice(idx, 1);
    res.status(204).send();
};

// --- Vehicles ---
export const getVehicles = (req: Request, res: Response) => {
    res.json(db.vehicles);
};
export const createVehicle = (req: Request, res: Response) => {
    const newVehicle = { id: `V-${Date.now()}`, ...req.body };
    db.vehicles.push(newVehicle);
    res.status(201).json(newVehicle);
};
export const updateVehicle = (req: Request, res: Response) => {
    const idx = db.vehicles.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Vehicle not found' });
    db.vehicles[idx] = { ...db.vehicles[idx], ...req.body };
    res.json(db.vehicles[idx]);
};
export const deleteVehicle = (req: Request, res: Response) => {
    const idx = db.vehicles.findIndex(v => v.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    db.vehicles.splice(idx, 1);
    res.status(204).send();
};

// --- Expenses ---
export const getExpenses = (req: Request, res: Response) => {
    res.json(db.expenses);
};
export const createExpense = (req: Request, res: Response) => {
    const newExpense = { id: `E-${Date.now()}`, ...req.body };
    db.expenses.push(newExpense);
    res.status(201).json(newExpense);
};
export const updateExpense = (req: Request, res: Response) => {
    const idx = db.expenses.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Expense not found' });
    db.expenses[idx] = { ...db.expenses[idx], ...req.body };
    res.json(db.expenses[idx]);
};
export const deleteExpense = (req: Request, res: Response) => {
    const idx = db.expenses.findIndex(e => e.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    db.expenses.splice(idx, 1);
    res.status(204).send();
};
// --- Trips ---
export const getTrips = (req: Request, res: Response) => {
    res.json(db.trips);
};

export const updateTrip = (req: Request, res: Response) => {
    const idx = db.trips.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Trip not found' });
    db.trips[idx] = { ...db.trips[idx], ...req.body };
    res.json(db.trips[idx]);
};
