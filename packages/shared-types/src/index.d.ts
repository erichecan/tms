export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface Tenant extends BaseEntity {
    name: string;
    domain: string;
    schemaName: string;
    status: 'active' | 'inactive' | 'suspended';
    settings: Record<string, any>;
}
export interface User extends BaseEntity {
    tenantId: string;
    email: string;
    role: UserRole;
    profile: UserProfile;
    status: 'active' | 'inactive' | 'suspended';
    lastLoginAt?: Date;
}
export type UserRole = 'admin' | 'manager' | 'operator' | 'driver' | 'customer';
export interface UserProfile {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
    preferences: Record<string, any>;
}
export interface Rule extends BaseEntity {
    tenantId: string;
    name: string;
    description?: string;
    type: RuleType;
    priority: number;
    conditions: RuleCondition[];
    actions: RuleAction[];
    status: 'active' | 'inactive';
}
export type RuleType = 'pricing' | 'payroll';
export interface RuleCondition {
    fact: string;
    operator: RuleOperator;
    value: any;
}
export type RuleOperator = 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanInclusive' | 'lessThanInclusive' | 'contains' | 'doesNotContain' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty';
export interface RuleAction {
    type: RuleActionType;
    params: Record<string, any>;
}
export type RuleActionType = 'applyDiscount' | 'addFee' | 'setBaseRate' | 'setDriverCommission' | 'setCustomerLevel' | 'sendNotification' | 'logEvent';
export interface RuleExecution {
    id: string;
    tenantId: string;
    ruleId: string;
    context: Record<string, any>;
    result: Record<string, any>;
    executionTime: number;
    createdAt: Date;
}
export interface Customer extends BaseEntity {
    tenantId: string;
    name: string;
    level: CustomerLevel;
    contactInfo: ContactInfo;
    billingInfo?: BillingInfo;
}
export type CustomerLevel = 'standard' | 'vip' | 'premium';
export interface ContactInfo {
    email: string;
    phone: string;
    address: Address;
    contactPerson?: string;
}
export interface BillingInfo {
    companyName: string;
    taxId: string;
    billingAddress: Address;
    paymentTerms: string;
}
export interface Driver extends BaseEntity {
    tenantId: string;
    name: string;
    phone: string;
    licenseNumber: string;
    vehicleInfo: VehicleInfo;
    status: 'active' | 'inactive' | 'suspended';
    performance: DriverPerformance;
}
export interface VehicleInfo {
    type: VehicleType;
    licensePlate: string;
    capacity: number;
    dimensions: VehicleDimensions;
    features: string[];
}
export type VehicleType = 'van' | 'truck' | 'trailer' | 'refrigerated';
export interface VehicleDimensions {
    length: number;
    width: number;
    height: number;
}
export interface DriverPerformance {
    rating: number;
    totalDeliveries: number;
    onTimeRate: number;
    customerSatisfaction: number;
}
export interface Shipment extends BaseEntity {
    tenantId: string;
    shipmentNumber: string;
    customerId: string;
    driverId?: string;
    pickupAddress: Address;
    deliveryAddress: Address;
    cargoInfo: CargoInfo;
    estimatedCost: number;
    actualCost?: number;
    additionalFees: AdditionalFee[];
    appliedRules: string[];
    status: ShipmentStatus;
    timeline: ShipmentTimeline;
}
export interface Address {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    instructions?: string;
}
export interface CargoInfo {
    description: string;
    weight: number;
    volume: number;
    dimensions: CargoDimensions;
    value: number;
    specialRequirements: string[];
    hazardous: boolean;
}
export interface CargoDimensions {
    length: number;
    width: number;
    height: number;
}
export interface AdditionalFee {
    id: string;
    type: FeeType;
    description: string;
    amount: number;
    appliedAt: Date;
    appliedBy: string;
}
export type FeeType = 'fuel' | 'toll' | 'waiting' | 'overtime' | 'special' | 'other';
export type ShipmentStatus = 'draft' | 'pending_confirmation' | 'confirmed' | 'scheduled' | 'pickup_in_progress' | 'in_transit' | 'delivered' | 'pod_pending_review' | 'completed' | 'cancelled' | 'exception';
export interface ShipmentTimeline {
    created: Date | string;
    draft?: Date | string;
    pendingConfirmation?: Date | string;
    confirmed?: Date | string;
    scheduled?: Date | string;
    pickupInProgress?: Date | string;
    inTransit?: Date | string;
    delivered?: Date | string;
    podPendingReview?: Date | string;
    completed?: Date | string;
    cancelled?: Date | string;
    assignmentAcknowledged?: Date | string;
    assignmentDeclined?: Date | string;
}
export interface FinancialRecord extends BaseEntity {
    tenantId: string;
    type: FinancialType;
    referenceId: string;
    amount: number;
    currency: string;
    status: FinancialStatus;
    dueDate?: Date;
    paidAt?: Date;
    description?: string;
}
export type FinancialType = 'receivable' | 'payable' | 'revenue' | 'expense';
export type FinancialStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export interface Statement {
    id: string;
    tenantId: string;
    type: StatementType;
    referenceId: string;
    period: {
        start: Date;
        end: Date;
    };
    items: StatementItem[];
    totalAmount: number;
    status: StatementStatus;
    generatedAt: Date;
    generatedBy: string;
}
export type StatementType = 'customer' | 'driver';
export interface StatementItem {
    id: string;
    description: string;
    amount: number;
    date: Date;
    reference: string;
}
export type StatementStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: ApiError;
    timestamp: string;
    requestId: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface QueryParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}
export interface RuleEditorState {
    rules: Rule[];
    selectedRule?: Rule;
    isEditing: boolean;
    validationErrors: Record<string, string>;
}
export interface RuleConflict {
    type: 'duplicate' | 'contradiction' | 'priority';
    ruleId: string;
    message: string;
    severity: 'warning' | 'error';
}
export interface DashboardStats {
    totalShipments: number;
    activeDrivers: number;
    totalRevenue: number;
    pendingPayments: number;
    recentActivity: ActivityItem[];
}
export interface ActivityItem {
    id: string;
    type: string;
    description: string;
    timestamp: Date;
    userId: string;
    metadata?: Record<string, any>;
}
export interface Notification extends BaseEntity {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    read: boolean;
    readAt?: Date;
}
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export * from './enums';
export * from './constants';
//# sourceMappingURL=index.d.ts.map