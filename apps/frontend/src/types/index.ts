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
  settings: Record<string, unknown>;
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
  parameters: Record<string, unknown>;
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
  PENDING = 'pending',           // 待处理
  QUOTED = 'quoted',             // 已报价
  CONFIRMED = 'confirmed',       // 已确认
  ASSIGNED = 'assigned',         // 已指派司机
  PICKED_UP = 'picked_up',       // 已取货
  IN_TRANSIT = 'in_transit',     // 运输途中
  DELIVERED = 'delivered',       // 已送达，待结算
  COMPLETED = 'completed',       // 完成闭环，已生成财务
  EXCEPTION = 'exception',       // 异常中断
  CANCELED = 'canceled',         // 终止
  CANCELLED = 'cancelled',       // 已取消（兼容性字段）
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
  pricingComponents: unknown[];              // 价格组件(预留)
  pricingRuleTrace: unknown[];               // 规则追踪(预留)
  finalCost?: number;                    // 最终费用
  costCurrency: string;                  // 币种
  assignedDriverId?: string;             // 指派司机ID
  assignedVehicleId?: string;            // 指派车辆ID
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  
  // BOL专用字段 - 2025-10-10 11:25:00
  customerOrderNumber?: string;          // 客户订单号
  purchaseOrderNumber?: string;          // 采购订单号
  shipperName?: string;                  // 发货人姓名
  shipperPhone?: string;                 // 发货人电话
  shipperCompany?: string;               // 发货人公司
  receiverName?: string;                 // 收货人姓名
  receiverPhone?: string;                // 收货人电话
  receiverCompany?: string;              // 收货人公司
  paymentType?: 'prepaid' | 'collect' | 'third_party'; // 付款方式
  declaredValue?: number;                // 申报价值
  codAmount?: number;                    // 货到付款金额
  deliveryInstructions?: string;         // 配送说明
  pickupDate?: string;                   // 取件日期
  deliveryDate?: string;                 // 配送日期
  shipperSignature?: string;             // 发货人签名
  driverSignature?: string;              // 司机签名
  packageCount?: number;                 // 包裹数量
  palletCount?: number;                  // 托盘数量
  hazardousMaterial?: boolean;           // 危险品标识
  
  // 兼容性字段 - 用于修复编译错误
  cargoWeight?: number;                   // 货物重量
  cargoLength?: number;                   // 货物长度
  cargoWidth?: number;                    // 货物宽度
  cargoHeight?: number;                   // 货物高度
  cargoDescription?: string;              // 货物描述
  shipmentNumber?: string;                // 运单编号
  pickupAddress?: ShipmentAddress;        // 取货地址
  deliveryAddress?: ShipmentAddress;      // 送货地址
  currentLocation?: unknown;                  // 当前位置
  driverName?: string;                    // 司机姓名
  driverId?: string;                      // 司机ID
  tripNo?: string;                       // 行程编号
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
  items: unknown[];
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
  billingInfo?: unknown;                         // 账单信息(预留)
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
  currentLocation?: unknown;             // 当前位置
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
  legs: unknown[];                       // 行程段(预留)
  shipments: string[];               // 挂载的运单ID列表
  startTimePlanned?: string;         // 计划开始时间
  endTimePlanned?: string;           // 计划结束时间
  startTimeActual?: string;          // 实际开始时间
  endTimeActual?: string;            // 实际结束时间
  routePath?: unknown;                   // 路线路径(预留)
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
  extra?: unknown;
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
