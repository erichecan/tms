
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

export interface FinancialRecord {
    id: string;
    tenant_id: string;
    shipment_id: string;
    type: 'receivable' | 'payable';
    reference_id: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'VOID';
    statement_id?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Statement {
    id: string;
    tenant_id: string;
    type: 'customer' | 'driver';
    reference_id: string;
    period_start: string;
    period_end: string;
    total_amount: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID';
    generated_by: string;
    created_at: string;
    updated_at: string;
}

// --- Google Maps & Pricing Types ---

export interface AddressInfo {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    placeId?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
}

export interface LogisticsRouteRequest {
    pickupAddress: AddressInfo;
    deliveryAddress: AddressInfo;
    businessType?: string;
    cargoInfo?: any;
    waitingTimeLimit?: number;
}

export interface LogisticsRouteResponse {
    optimalRoute: {
        distance: number;
        duration: number;
        fuelCost: number;
        segments: any[];
        returnRoute?: any;
    };
    costBreakdown: any;
    estimatedArrival: string;
}

export interface GoogleMapsApiConfig {
    apiKey: string;
    baseUrl: string;
    rateLimit?: any;
    cacheConfig?: any;
}

export interface MapsApiError {
    code: number;
    message: string;
    details?: any;
}

export interface CostBreakdown {
    baseCost: number;
    distanceCost: number;
    cargoHandlingCost: number;
    waitingCost: number;
    fuelCost: number;
    tollCost: number;
    scenarioAdjustment: number;
    customerPremium: number;
    totalCost: number;
}

export interface PricingCalculation {
    totalRevenue: number;
    breakdown: any[];
    currency: string;
    distance: number;
    duration: number;
    appliedRules: string[];
}

export interface PricingDetail {
    componentCode: string;
    componentName: string;
    amount: number;
    currency: string;
    formula: string;
    inputValues: Record<string, any>;
    sequence: number;
    ruleId?: string;
}
