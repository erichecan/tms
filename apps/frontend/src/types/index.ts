// 临时类型定义文件，用于替代shared-types包

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    refreshToken: string;
    user: User;
  };
  timestamp: string;
  requestId: string;
}

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
  value: string;
}

export interface RuleAction {
  type: string;
  parameters: Record<string, any>;
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
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export enum ShipmentStatus {
  PENDING = 'pending',
  QUOTED = 'quoted',
  CONFIRMED = 'confirmed',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception',
}

export interface ShipmentAddress {
  city: string;
  state: string;
  street: string;
  postalCode: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  customerId: string | null;
  customerName: string;
  driverId: string | null;
  driverName: string;
  status: ShipmentStatus;
  pickupAddress: ShipmentAddress;
  deliveryAddress: ShipmentAddress;
  pickupDate: string;
  deliveryDate?: string;
  estimatedCost: number;
  actualCost?: number;
  weight: number;
  description?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export enum StatementType {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
}

export interface FinancialRecord {
  id: string;
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  shipmentId?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Statement {
  id: string;
  statementNumber: string;
  type: StatementType;
  entityId: string;
  entityName: string;
  totalAmount: number;
  status: string;
  period: {
    start: string;
    end: string;
  };
  items: any[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  level: 'standard' | 'vip' | 'premium';
  contactInfo: {
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    contactPerson?: string;
  };
  billingInfo?: {
    companyName: string;
    taxId: string;
    billingAddress: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    paymentTerms: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  vehicleInfo: {
    type: 'van' | 'truck' | 'trailer' | 'refrigerated';
    licensePlate: string;
    capacity: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    features: string[];
  };
  status: 'active' | 'inactive' | 'suspended';
  performance: {
    rating: number;
    totalDeliveries: number;
    onTimeRate: number;
    customerSatisfaction: number;
  };
  createdAt: string;
  updatedAt: string;
}
