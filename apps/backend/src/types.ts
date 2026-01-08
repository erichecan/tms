
export enum WaybillStatus {
    NEW = 'NEW',
    ASSIGNED = 'ASSIGNED',
    DISPATCHED = 'DISPATCHED',
    IN_TRANSIT = 'IN_TRANSIT',
    ARRIVED = 'ARRIVED',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
}

export enum TripStatus {
    PLANNED = 'PLANNED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
}

export enum ExpenseCategory {
    FUEL = 'FUEL',
    MAINTENANCE = 'MAINTENANCE',
    SALARY = 'SALARY',
    TOLL = 'TOLL',
}

export enum ExpenseStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PAID = 'PAID',
}

export interface Driver {
    id: string;
    name: string;
    phone: string;
    avatar_url?: string;
    status: 'IDLE' | 'BUSY';
}

export interface Vehicle {
    id: string;
    plate: string;
    model: string; // e.g., "Freightliner Cascadia"
    capacity: string; // e.g., "40 Ton"
    status: 'IDLE' | 'BUSY';
}

export interface Waybill {
    id: string;
    waybill_no: string; // "WB-2026..."
    customer_id: string; // "CUST-001"
    origin: string; // "YYZ9"
    destination: string; // "YYZ3"
    cargo_desc: string; // "Pork Bellies, 20 Pallets"
    status: WaybillStatus;
    trip_id?: string;
    price_estimated: number;
    created_at: string;
    // New Fields from Amazon Template
    fulfillment_center?: string;
    delivery_date?: string;
    reference_code?: string;
    pallet_count?: number;
    total_weight?: number;
    time_in?: string;
    time_out?: string;
    distance?: number;
}

export interface Trip {
    id: string;
    driver_id: string;
    vehicle_id: string;
    status: TripStatus;
    start_time_est: string;
    end_time_est: string;
    route_polyline?: string;
}

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    trip_id: string;
    date: string;
    status: ExpenseStatus;
}
