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

// 运单状态枚举 - 符合PRD v3.0-PC状态机设计
export enum ShipmentStatus {
  CREATED = 'created',           // 运单已创建 = 已确认
  ASSIGNED = 'assigned',         // 已指派司机
  PICKED_UP = 'picked_up',       // 已取货
  IN_TRANSIT = 'in_transit',     // 运输途中
  DELIVERED = 'delivered',       // 已送达，待结算
  COMPLETED = 'completed',       // 完成闭环，已生成财务
  EXCEPTION = 'exception',       // 异常中断
  CANCELED = 'canceled',         // 终止
}

// 地址接口 - 符合PRD v3.0-PC设计
export interface ShipmentAddress {
  country: string;
  province: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2?: string;
  isResidential: boolean;
}

// 运单接口 - 符合PRD v3.0-PC设计
export interface Shipment {
  id: string;
  shipmentNo: string;                    // 运单号
  customerId: string;
  status: ShipmentStatus;
  shipperAddress: ShipmentAddress;       // 发货地址
  receiverAddress: ShipmentAddress;      // 收货地址
  weightKg: number;                      // 重量(kg)
  lengthCm: number;                      // 长度(cm)
  widthCm: number;                       // 宽度(cm)
  heightCm: number;                      // 高度(cm)
  description?: string;                  // 货物描述
  tags: string[];                        // 标签
  services: {                            // 附加服务
    needAppointment?: boolean;
    needSignature?: boolean;
    loadingAssist?: boolean;
    fragile?: boolean;
    insured?: boolean;
    insuranceAmount?: number;
  };
  estimatedCost?: number;                // 预估费用
  pricingComponents: any[];              // 价格组件(预留)
  pricingRuleTrace: any[];               // 规则追踪(预留)
  finalCost?: number;                    // 最终费用
  costCurrency: string;                  // 币种
  assignedDriverId?: string;             // 指派司机ID
  assignedVehicleId?: string;            // 指派车辆ID
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

// 客户接口 - 符合PRD v3.0-PC设计
export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  defaultPickupAddress?: ShipmentAddress;    // 默认取货地址
  defaultDeliveryAddress?: ShipmentAddress;  // 默认送货地址
  billingInfo?: any;                         // 账单信息(预留)
  createdAt: string;
  updatedAt: string;
}

// 司机接口 - 符合PRD v3.0-PC设计
export enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export interface Driver {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  status: DriverStatus;
  level?: string;                    // 司机等级(预留)
  homeCity?: string;                 // 家乡城市(预留)
  currentTripId?: string;            // 当前行程ID
  createdAt: string;
  updatedAt: string;
}

// 车辆接口 - 符合PRD v3.0-PC设计
export enum VehicleStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
}

export interface Vehicle {
  id: string;
  tenantId: string;
  plateNumber: string;               // 车牌号
  type: string;                      // 车辆类型
  capacityKg: number;                // 载重(kg)
  status: VehicleStatus;
  currentTripId?: string;            // 当前行程ID
  createdAt: string;
  updatedAt: string;
}

// 行程接口 - 符合PRD v3.0-PC设计
export enum TripStatus {
  PLANNING = 'planning',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export interface Trip {
  id: string;
  tenantId: string;
  tripNo: string;                    // 行程号
  status: TripStatus;
  driverId: string;                  // 司机ID
  vehicleId: string;                 // 车辆ID
  legs: any[];                       // 行程段(预留)
  shipments: string[];               // 挂载的运单ID列表
  startTimePlanned?: string;         // 计划开始时间
  endTimePlanned?: string;           // 计划结束时间
  startTimeActual?: string;          // 实际开始时间
  endTimeActual?: string;            // 实际结束时间
  routePath?: any;                   // 路线路径(预留)
  createdAt: string;
  updatedAt: string;
}

// 指派记录接口
export enum AssignmentType {
  DIRECT = 'direct',
  VIA_TRIP = 'via_trip',
}

export interface Assignment {
  id: string;
  tenantId: string;
  shipmentId: string;
  driverId: string;
  vehicleId: string;
  assignedAt: string;
  assignedBy: string;
  type: AssignmentType;
  notes?: string;
}

// 时间线事件接口
export enum EventType {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  POD_UPLOADED = 'POD_UPLOADED',
  EXCEPTION_SET = 'EXCEPTION_SET',
  EXCEPTION_RESOLVED = 'EXCEPTION_RESOLVED',
  CANCELED = 'CANCELED',
}

export enum ActorType {
  SYSTEM = 'system',
  USER = 'user',
  DRIVER = 'driver',
}

export interface TimelineEvent {
  id: string;
  tenantId: string;
  shipmentId: string;
  eventType: EventType;
  fromStatus?: string;
  toStatus?: string;
  actorType: ActorType;
  actorId?: string;
  timestamp: string;
  extra?: any;
}

// POD接口
export interface POD {
  id: string;
  tenantId: string;
  shipmentId: string;
  filePath: string;
  uploadedAt: string;
  uploadedBy: string;
  note?: string;
}
