"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortOrder = exports.EntityStatus = exports.NotificationType = exports.StatementStatus = exports.StatementType = exports.FinancialStatus = exports.FinancialType = exports.ShipmentStatus = exports.FeeType = exports.VehicleType = exports.CustomerLevel = exports.RuleActionType = exports.RuleOperator = exports.RuleType = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MANAGER"] = "manager";
    UserRole["OPERATOR"] = "operator";
    UserRole["DRIVER"] = "driver";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
var RuleType;
(function (RuleType) {
    RuleType["PRICING"] = "pricing";
    RuleType["PAYROLL"] = "payroll";
})(RuleType || (exports.RuleType = RuleType = {}));
var RuleOperator;
(function (RuleOperator) {
    RuleOperator["EQUAL"] = "equal";
    RuleOperator["NOT_EQUAL"] = "notEqual";
    RuleOperator["GREATER_THAN"] = "greaterThan";
    RuleOperator["LESS_THAN"] = "lessThan";
    RuleOperator["GREATER_THAN_INCLUSIVE"] = "greaterThanInclusive";
    RuleOperator["LESS_THAN_INCLUSIVE"] = "lessThanInclusive";
    RuleOperator["CONTAINS"] = "contains";
    RuleOperator["DOES_NOT_CONTAIN"] = "doesNotContain";
    RuleOperator["STARTS_WITH"] = "startsWith";
    RuleOperator["ENDS_WITH"] = "endsWith";
    RuleOperator["IN"] = "in";
    RuleOperator["NOT_IN"] = "notIn";
    RuleOperator["IS_EMPTY"] = "isEmpty";
    RuleOperator["IS_NOT_EMPTY"] = "isNotEmpty";
})(RuleOperator || (exports.RuleOperator = RuleOperator = {}));
var RuleActionType;
(function (RuleActionType) {
    RuleActionType["APPLY_DISCOUNT"] = "applyDiscount";
    RuleActionType["ADD_FEE"] = "addFee";
    RuleActionType["SET_BASE_RATE"] = "setBaseRate";
    RuleActionType["SET_DRIVER_COMMISSION"] = "setDriverCommission";
    RuleActionType["SET_CUSTOMER_LEVEL"] = "setCustomerLevel";
    RuleActionType["SEND_NOTIFICATION"] = "sendNotification";
    RuleActionType["LOG_EVENT"] = "logEvent";
})(RuleActionType || (exports.RuleActionType = RuleActionType = {}));
var CustomerLevel;
(function (CustomerLevel) {
    CustomerLevel["STANDARD"] = "standard";
    CustomerLevel["VIP"] = "vip";
    CustomerLevel["PREMIUM"] = "premium";
})(CustomerLevel || (exports.CustomerLevel = CustomerLevel = {}));
var VehicleType;
(function (VehicleType) {
    VehicleType["VAN"] = "van";
    VehicleType["TRUCK"] = "truck";
    VehicleType["TRAILER"] = "trailer";
    VehicleType["REFRIGERATED"] = "refrigerated";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var FeeType;
(function (FeeType) {
    FeeType["FUEL"] = "fuel";
    FeeType["TOLL"] = "toll";
    FeeType["WAITING"] = "waiting";
    FeeType["OVERTIME"] = "overtime";
    FeeType["SPECIAL"] = "special";
    FeeType["OTHER"] = "other";
})(FeeType || (exports.FeeType = FeeType = {}));
var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["PENDING"] = "pending";
    ShipmentStatus["QUOTED"] = "quoted";
    ShipmentStatus["CONFIRMED"] = "confirmed";
    ShipmentStatus["ASSIGNED"] = "assigned";
    ShipmentStatus["PICKED_UP"] = "picked_up";
    ShipmentStatus["IN_TRANSIT"] = "in_transit";
    ShipmentStatus["DELIVERED"] = "delivered";
    ShipmentStatus["COMPLETED"] = "completed";
    ShipmentStatus["CANCELLED"] = "cancelled";
    ShipmentStatus["EXCEPTION"] = "exception";
})(ShipmentStatus || (exports.ShipmentStatus = ShipmentStatus = {}));
var FinancialType;
(function (FinancialType) {
    FinancialType["RECEIVABLE"] = "receivable";
    FinancialType["PAYABLE"] = "payable";
    FinancialType["REVENUE"] = "revenue";
    FinancialType["EXPENSE"] = "expense";
})(FinancialType || (exports.FinancialType = FinancialType = {}));
var FinancialStatus;
(function (FinancialStatus) {
    FinancialStatus["PENDING"] = "pending";
    FinancialStatus["PAID"] = "paid";
    FinancialStatus["OVERDUE"] = "overdue";
    FinancialStatus["CANCELLED"] = "cancelled";
})(FinancialStatus || (exports.FinancialStatus = FinancialStatus = {}));
var StatementType;
(function (StatementType) {
    StatementType["CUSTOMER"] = "customer";
    StatementType["DRIVER"] = "driver";
})(StatementType || (exports.StatementType = StatementType = {}));
var StatementStatus;
(function (StatementStatus) {
    StatementStatus["DRAFT"] = "draft";
    StatementStatus["SENT"] = "sent";
    StatementStatus["PAID"] = "paid";
    StatementStatus["OVERDUE"] = "overdue";
})(StatementStatus || (exports.StatementStatus = StatementStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["WARNING"] = "warning";
    NotificationType["ERROR"] = "error";
    NotificationType["SUCCESS"] = "success";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var EntityStatus;
(function (EntityStatus) {
    EntityStatus["ACTIVE"] = "active";
    EntityStatus["INACTIVE"] = "inactive";
    EntityStatus["SUSPENDED"] = "suspended";
})(EntityStatus || (exports.EntityStatus = EntityStatus = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
//# sourceMappingURL=enums.js.map