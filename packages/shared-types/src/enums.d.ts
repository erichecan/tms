export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    OPERATOR = "operator",
    DRIVER = "driver",
    CUSTOMER = "customer"
}
export declare enum RuleType {
    PRICING = "pricing",
    PAYROLL = "payroll"
}
export declare enum RuleOperator {
    EQUAL = "equal",
    NOT_EQUAL = "notEqual",
    GREATER_THAN = "greaterThan",
    LESS_THAN = "lessThan",
    GREATER_THAN_INCLUSIVE = "greaterThanInclusive",
    LESS_THAN_INCLUSIVE = "lessThanInclusive",
    CONTAINS = "contains",
    DOES_NOT_CONTAIN = "doesNotContain",
    STARTS_WITH = "startsWith",
    ENDS_WITH = "endsWith",
    IN = "in",
    NOT_IN = "notIn",
    IS_EMPTY = "isEmpty",
    IS_NOT_EMPTY = "isNotEmpty"
}
export declare enum RuleActionType {
    APPLY_DISCOUNT = "applyDiscount",
    ADD_FEE = "addFee",
    SET_BASE_RATE = "setBaseRate",
    SET_DRIVER_COMMISSION = "setDriverCommission",
    SET_CUSTOMER_LEVEL = "setCustomerLevel",
    SEND_NOTIFICATION = "sendNotification",
    LOG_EVENT = "logEvent"
}
export declare enum CustomerLevel {
    STANDARD = "standard",
    VIP = "vip",
    PREMIUM = "premium"
}
export declare enum VehicleType {
    VAN = "van",
    TRUCK = "truck",
    TRAILER = "trailer",
    REFRIGERATED = "refrigerated"
}
export declare enum FeeType {
    FUEL = "fuel",
    TOLL = "toll",
    WAITING = "waiting",
    OVERTIME = "overtime",
    SPECIAL = "special",
    OTHER = "other"
}
export declare enum ShipmentStatus {
    PENDING = "pending",
    QUOTED = "quoted",
    CONFIRMED = "confirmed",
    ASSIGNED = "assigned",
    PICKED_UP = "picked_up",
    IN_TRANSIT = "in_transit",
    DELIVERED = "delivered",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    EXCEPTION = "exception"
}
export declare enum FinancialType {
    RECEIVABLE = "receivable",
    PAYABLE = "payable",
    REVENUE = "revenue",
    EXPENSE = "expense"
}
export declare enum FinancialStatus {
    PENDING = "pending",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare enum StatementType {
    CUSTOMER = "customer",
    DRIVER = "driver"
}
export declare enum StatementStatus {
    DRAFT = "draft",
    SENT = "sent",
    PAID = "paid",
    OVERDUE = "overdue"
}
export declare enum NotificationType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success"
}
export declare enum EntityStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
//# sourceMappingURL=enums.d.ts.map