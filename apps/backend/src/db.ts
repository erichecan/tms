
import { Driver, Vehicle, Waybill, Trip, Expense, WaybillStatus, TripStatus, ExpenseCategory, ExpenseStatus } from './types.js';

export interface TimelineEvent {
    status: TripStatus | WaybillStatus;
    time: string;
    description: string;
}

export interface Message {
    id: string;
    trip_id: string;
    sender: 'DISPATCHER' | 'DRIVER';
    text: string;
    timestamp: string;
}

// Mock Data Store
export const db = {
    drivers: [
        { id: 'D-001', name: 'James Holloway', phone: '555-0101', status: 'BUSY', avatar_url: 'https://i.pravatar.cc/150?u=D-001' },
        { id: 'D-002', name: 'Robert McAllister', phone: '555-0102', status: 'IDLE', avatar_url: 'https://i.pravatar.cc/150?u=D-002' },
        { id: 'D-003', name: 'Michael Davidson', phone: '555-0103', status: 'BUSY', avatar_url: 'https://i.pravatar.cc/150?u=D-003' },
    ] as Driver[],

    vehicles: [
        { id: 'V-101', plate: 'TX-101', model: 'Volvo VNL', capacity: '53ft', status: 'BUSY' },
        { id: 'V-102', plate: 'TX-102', model: 'Peterbilt 579', capacity: '53ft', status: 'IDLE' },
        { id: 'V-103', plate: 'TX-103', model: 'Kenworth T680', capacity: '53ft', status: 'BUSY' },
    ] as Vehicle[],

    trips: [
        {
            id: 'T-1001',
            driver_id: 'D-001',
            vehicle_id: 'V-101',
            status: TripStatus.ACTIVE,
            start_time_est: '2026-01-08T08:00:00Z',
            end_time_est: '2026-01-08T18:00:00Z',
            timeline: [
                { status: TripStatus.PLANNED, time: '2026-01-08T07:00:00Z', description: 'Trip created' },
                { status: TripStatus.ACTIVE, time: '2026-01-08T08:15:00Z', description: 'Driver departed from Omaha' },
            ] as TimelineEvent[]
        },
        {
            id: 'T-1002',
            driver_id: 'D-003',
            vehicle_id: 'V-103',
            status: TripStatus.ACTIVE,
            start_time_est: '2026-01-08T09:00:00Z',
            end_time_est: '2026-01-09T12:00:00Z',
            timeline: [
                { status: TripStatus.PLANNED, time: '2026-01-08T08:30:00Z', description: 'Trip created' },
            ] as TimelineEvent[]
        },
    ] as (Trip & { timeline?: TimelineEvent[] })[],

    waybills: [
        { id: 'WB-001', waybill_no: 'WB-20260108-001', customer_id: 'C-01', origin: 'Omaha, NE', destination: 'Chicago, IL', cargo_desc: 'Pork Bellies - 20 Pallets', status: WaybillStatus.IN_TRANSIT, trip_id: 'T-1001', price_estimated: 1200, created_at: '2026-01-07T10:00:00Z' },
        { id: 'WB-002', waybill_no: 'WB-20260108-002', customer_id: 'C-02', origin: 'Kansas City, MO', destination: 'Dallas, TX', cargo_desc: 'Frozen Beef - 18 Pallets', status: WaybillStatus.NEW, price_estimated: 1500, created_at: '2026-01-08T09:00:00Z' },
        { id: 'WB-003', waybill_no: 'WB-20260108-003', customer_id: 'C-01', origin: 'Des Moines, IA', destination: 'Minneapolis, MN', cargo_desc: 'Live Hogs - 150 Head', status: WaybillStatus.NEW, price_estimated: 800, created_at: '2026-01-08T10:30:00Z' },
        { id: 'WB-004', waybill_no: 'WB-20260108-004', customer_id: 'C-03', origin: 'St. Louis, MO', destination: 'Nashville, TN', cargo_desc: 'Poultry - 22 Pallets', status: WaybillStatus.IN_TRANSIT, trip_id: 'T-1002', price_estimated: 1100, created_at: '2026-01-07T14:00:00Z' },
    ] as Waybill[],

    expenses: [
        { id: 'E-001', category: ExpenseCategory.FUEL, amount: 450.50, trip_id: 'T-1001', date: '2026-01-08T12:00:00Z', status: ExpenseStatus.PAID },
        { id: 'E-002', category: ExpenseCategory.SALARY, amount: 1200.00, trip_id: 'T-1001', date: '2026-01-08T18:00:00Z', status: ExpenseStatus.PENDING },
    ] as Expense[],

    messages: [
        { id: 'M-1', trip_id: 'T-1001', sender: 'DRIVER', text: 'Loaded and rolling out.', timestamp: '2026-01-08T08:16:00Z' },
        { id: 'M-2', trip_id: 'T-1001', sender: 'DISPATCHER', text: 'Copy that. Watch out for snow near Des Moines.', timestamp: '2026-01-08T08:18:00Z' },
    ] as Message[],
};
