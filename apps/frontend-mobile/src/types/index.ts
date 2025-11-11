// 2025-11-11 10:15:05 新增：移动端运单类型定义
export enum ShipmentStatus {
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

export interface Address {
  city?: string;
  province?: string;
  addressLine1?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber?: string;
  shipmentNo?: string;
  status: ShipmentStatus | string;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  customerName?: string;
  estimatedCost?: number;
  timeline?: Array<{
    id: string;
    eventType: string;
    timestamp: string;
  }>;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  tenant?: {
    id: string;
    name: string;
    domain: string;
  };
  profile?: Record<string, unknown>;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
} // 2025-11-11T15:33:24Z Added by Assistant: Auth response contract

