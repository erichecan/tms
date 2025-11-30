// 枚举类型定义
// 创建时间: 2025-01-27 15:30:45

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  DRIVER = 'driver',
  CUSTOMER = 'customer'
}

// 规则类型枚举
export enum RuleType {
  PRICING = 'pricing',
  PAYROLL = 'payroll'
}

// 规则操作符枚举
export enum RuleOperator {
  EQUAL = 'equal',
  NOT_EQUAL = 'notEqual',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_INCLUSIVE = 'greaterThanInclusive',
  LESS_THAN_INCLUSIVE = 'lessThanInclusive',
  CONTAINS = 'contains',
  DOES_NOT_CONTAIN = 'doesNotContain',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty'
}

// 规则动作类型枚举
export enum RuleActionType {
  APPLY_DISCOUNT = 'applyDiscount',
  ADD_FEE = 'addFee',
  SET_BASE_RATE = 'setBaseRate',
  SET_DRIVER_COMMISSION = 'setDriverCommission',
  SET_CUSTOMER_LEVEL = 'setCustomerLevel',
  SEND_NOTIFICATION = 'sendNotification',
  LOG_EVENT = 'logEvent'
}

// 客户等级枚举
export enum CustomerLevel {
  STANDARD = 'standard',
  VIP = 'vip',
  PREMIUM = 'premium'
}

// 车辆类型枚举
export enum VehicleType {
  VAN = 'van',
  TRUCK = 'truck',
  TRAILER = 'trailer',
  REFRIGERATED = 'refrigerated'
}

// 费用类型枚举
export enum FeeType {
  FUEL = 'fuel',
  TOLL = 'toll',
  WAITING = 'waiting',
  OVERTIME = 'overtime',
  SPECIAL = 'special',
  OTHER = 'other'
}

// 运单状态枚举 // 2025-11-11 14:07:30 对齐 PRD 状态机
export enum ShipmentStatus {
  DRAFT = 'draft', // 草稿 // 2025-11-11 14:07:30
  PENDING_CONFIRMATION = 'pending_confirmation', // 待确认 // 2025-11-11 14:07:30
  CONFIRMED = 'confirmed', // 已确认/待调度 // 2025-11-11 14:07:30
  SCHEDULED = 'scheduled', // 已调度/待提货 // 2025-11-11 14:07:30
  PICKUP_IN_PROGRESS = 'pickup_in_progress', // 已提货 // 2025-11-11 14:07:30
  IN_TRANSIT = 'in_transit', // 在途 // 2025-11-11 14:07:30
  DELIVERED = 'delivered', // 已送达 // 2025-11-11 14:07:30
  POD_PENDING_REVIEW = 'pod_pending_review', // 已签收/待审核 // 2025-11-11 14:07:30
  COMPLETED = 'completed', // 已完结 // 2025-11-11 14:07:30
  CANCELLED = 'cancelled', // 已取消 // 2025-11-11 14:07:30
  EXCEPTION = 'exception' // 异常 // 2025-11-11 14:07:30
}

// 财务类型枚举
export enum FinancialType {
  RECEIVABLE = 'receivable',
  PAYABLE = 'payable',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

// 财务状态枚举
export enum FinancialStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum Currency {
  CNY = 'CNY',
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR'
}

// 对账单类型枚举
export enum StatementType {
  CUSTOMER = 'customer',
  DRIVER = 'driver'
}

// 对账单状态枚举
export enum StatementStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue'
}

// 通知类型枚举
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

// 实体状态枚举
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// 排序方向枚举
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// 司机状态枚举 // 2025-10-31 09:30:00 添加统一的状态枚举
export enum DriverStatus {
  AVAILABLE = 'available',  // 空闲可用
  BUSY = 'busy',           // 忙碌中
  ON_LEAVE = 'on_leave',   // 休假
  OFFLINE = 'offline',     // 离线
  INACTIVE = 'inactive'    // 停用
}

// 车辆状态枚举 // 2025-10-31 09:30:00 添加统一的状态枚举
export enum VehicleStatus {
  AVAILABLE = 'available',  // 可用
  BUSY = 'busy',           // 使用中
  MAINTENANCE = 'maintenance', // 维护中
  OFFLINE = 'offline',     // 离线
  INACTIVE = 'inactive'    // 停用
}

// 行程状态枚举 // 2025-10-31 09:30:00 添加统一的状态枚举
export enum TripStatus {
  PLANNED = 'planned',     // 已计划
  ONGOING = 'ongoing',     // 进行中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled'  // 已取消
}
