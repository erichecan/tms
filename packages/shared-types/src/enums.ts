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

// 运单状态枚举
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
  EXCEPTION = 'exception'
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
