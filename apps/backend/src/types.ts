
export enum WaybillStatus {
    NEW = 'NEW',
    ASSIGNED = 'ASSIGNED',
    DISPATCHED = 'DISPATCHED',
    IN_TRANSIT = 'IN_TRANSIT',
    ARRIVED = 'ARRIVED',
    DELIVERED = 'DELIVERED',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

// ... (skip lines)

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
    // Signature
    signature_url?: string;
    signed_at?: string;
    signed_by?: string;
    details?: any; // Full JSON state
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



export interface Trip {
    id: string;
    driver_id: string;
    vehicle_id: string;
    status: TripStatus;
    start_time_est: string;
    end_time_est: string;
    route_polyline?: string;
    // Driver Compensation
    driver_pay_calculated?: number;
    driver_pay_bonus?: number;
    driver_pay_total?: number;
    driver_pay_currency?: string; // 'CAD' | 'CNY'
    driver_pay_details?: any; // Snapshot of calculation logic

}

export interface Permission {
    id: string;
    resource: string;
    action: 'READ' | 'WRITE' | 'DELETE' | 'ADMIN';
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    password?: string;
    roleId: string;
    status: 'ACTIVE' | 'INACTIVE';
    lastLogin: string;
}

export interface Expense {
    id: string;
    category: ExpenseCategory;
    amount: number;
    trip_id: string;
    date: string;
    status: ExpenseStatus;
}

export interface Customer {
    id: string;
    name: string;
    company?: string;
    phone: string;
    email: string;
    address: string;
    businessType?: string;
    taxId?: string;
    creditLimit: number;
    status: 'ACTIVE' | 'INACTIVE';
    created_at: string;
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
    billingType?: 'DISTANCE' | 'TIME';
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

export interface DriverPayCalculation {
    basePay: number;
    bonus: number;
    totalPay: number;
    currency: string;
    breakdown: PricingDetail[]; // Reusing PricingDetail for consistency
    conflictWarning?: boolean; // If multiple rules matched
    appliedRuleName?: string;
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

export interface PricingRule {
    id: string;
    name: string;
    type: 'BASE_RATE' | 'DISTANCE' | 'WEIGHT' | 'QUANTITY' | 'LUMP_SUM' | 'DISCOUNT';
    value: number;
    unit?: string; // e.g., 'PER_KM', 'PER_KG'
    condition?: string; // JSON logic or simple string
    priority: number;
}

export interface PricingTemplate {
    id: string;
    name: string;
    description: string;
    currency: string;
    rules: PricingRule[];
    isDefault: boolean;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    created_at: string;
    updated_at: string;
}

// --- Universal Rules (JSON Rules Engine) ---

export enum RuleType {
    PRICING = 'pricing',
    PAYROLL = 'payroll',
}

export enum RuleStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export interface RuleCondition {
    fact: string;
    operator: string;
    value: string | number | boolean;
}

export interface RuleAction {
    type: string;
    params: Record<string, any>;
}

export interface Rule {
    id: string;
    name: string;
    description: string;
    type: RuleType;
    priority: number;
    status: RuleStatus;
    conditions: RuleCondition[];
    actions: RuleAction[];
    created_at: string;
}
