"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = exports.SUCCESS_MESSAGES = exports.ERROR_CODES = exports.REGEX_PATTERNS = exports.LOG_LEVELS = exports.RATE_LIMIT = exports.CACHE_TTL = exports.ALLOWED_FILE_TYPES = exports.MAX_FILE_SIZE = exports.DRIVER_COMMISSION_RATES = exports.PAYMENT_TERMS = exports.DEFAULT_CURRENCY = exports.MAX_SHIPMENT_VOLUME = exports.MAX_SHIPMENT_WEIGHT = exports.SHIPMENT_NUMBER_PREFIX = exports.RULE_CONFLICT_THRESHOLD = exports.RULE_PRIORITY_RANGES = exports.MIN_PAGE_SIZE = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.API_BASE_URL = exports.API_VERSION = void 0;
exports.API_VERSION = 'v1';
exports.API_BASE_URL = `/api/${exports.API_VERSION}`;
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
exports.MIN_PAGE_SIZE = 1;
exports.RULE_PRIORITY_RANGES = {
    BASE_FEE: { min: 1, max: 100 },
    ADDITIONAL_FEE: { min: 101, max: 200 },
    DISCOUNT: { min: 201, max: 300 },
    COMMISSION: { min: 301, max: 400 }
};
exports.RULE_CONFLICT_THRESHOLD = 0.8;
exports.SHIPMENT_NUMBER_PREFIX = 'TMS';
exports.MAX_SHIPMENT_WEIGHT = 50000;
exports.MAX_SHIPMENT_VOLUME = 100;
exports.DEFAULT_CURRENCY = 'CNY';
exports.PAYMENT_TERMS = {
    NET_15: 15,
    NET_30: 30,
    NET_60: 60
};
exports.DRIVER_COMMISSION_RATES = {
    MIN: 0.1,
    MAX: 0.5,
    DEFAULT: 0.3
};
exports.MAX_FILE_SIZE = 10 * 1024 * 1024;
exports.ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
exports.CACHE_TTL = {
    SHORT: 300,
    MEDIUM: 1800,
    LONG: 3600,
    VERY_LONG: 86400
};
exports.RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false
};
exports.LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};
exports.REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^1[3-9]\d{9}$/,
    POSTAL_CODE: /^\d{6}$/,
    LICENSE_PLATE: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/
};
exports.ERROR_CODES = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RULE_CONFLICT: 'RULE_CONFLICT',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    SHIPMENT_NOT_AVAILABLE: 'SHIPMENT_NOT_AVAILABLE',
    DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED'
};
exports.SUCCESS_MESSAGES = {
    RULE_CREATED: '规则创建成功',
    RULE_UPDATED: '规则更新成功',
    RULE_DELETED: '规则删除成功',
    SHIPMENT_CREATED: '运单创建成功',
    SHIPMENT_UPDATED: '运单更新成功',
    PAYMENT_PROCESSED: '支付处理成功',
    STATEMENT_GENERATED: '对账单生成成功'
};
exports.DEFAULT_CONFIG = {
    TENANT: {
        TIMEZONE: 'Asia/Shanghai',
        CURRENCY: 'CNY',
        LANGUAGE: 'zh-CN'
    },
    USER: {
        AVATAR: '/default-avatar.png',
        PREFERENCES: {
            theme: 'light',
            notifications: true,
            language: 'zh-CN'
        }
    },
    SHIPMENT: {
        DEFAULT_STATUS: 'pending',
        AUTO_ASSIGN: false,
        TRACKING_ENABLED: true
    }
};
//# sourceMappingURL=constants.js.map