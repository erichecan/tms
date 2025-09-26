// 常量定义
// 创建时间: 2025-01-27 15:30:45

// API相关常量
export const API_VERSION = 'v1';
export const API_BASE_URL = `/api/${API_VERSION}`;

// 分页相关常量
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// 规则引擎相关常量
export const RULE_PRIORITY_RANGES = {
  BASE_FEE: { min: 1, max: 100 },
  ADDITIONAL_FEE: { min: 101, max: 200 },
  DISCOUNT: { min: 201, max: 300 },
  COMMISSION: { min: 301, max: 400 }
};

export const RULE_CONFLICT_THRESHOLD = 0.8; // 80%相似度阈值

// 运单相关常量
export const SHIPMENT_NUMBER_PREFIX = 'TMS';
export const MAX_SHIPMENT_WEIGHT = 50000; // 50吨
export const MAX_SHIPMENT_VOLUME = 100; // 100立方米

// 财务相关常量
export const DEFAULT_CURRENCY = 'CNY';
export const SUPPORTED_CURRENCIES = ['CNY', 'USD', 'CAD', 'EUR'] as const;
export const CURRENCY_SYMBOLS = {
  CNY: '¥',
  USD: '$',
  CAD: 'C$',
  EUR: '€'
} as const;
export const CURRENCY_NAMES = {
  CNY: '人民币',
  USD: '美元',
  CAD: '加元',
  EUR: '欧元'
} as const;
export const PAYMENT_TERMS = {
  NET_15: 15,
  NET_30: 30,
  NET_60: 60
};

// 司机相关常量
export const DRIVER_COMMISSION_RATES = {
  MIN: 0.1, // 10%
  MAX: 0.5, // 50%
  DEFAULT: 0.3 // 30%
};

// 文件上传相关常量
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// 缓存相关常量
export const CACHE_TTL = {
  SHORT: 300, // 5分钟
  MEDIUM: 1800, // 30分钟
  LONG: 3600, // 1小时
  VERY_LONG: 86400 // 24小时
};

// 限流相关常量
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15分钟
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false
};

// 日志相关常量
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

// 正则表达式常量
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  POSTAL_CODE: /^\d{6}$/,
  LICENSE_PLATE: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/
};

// 错误代码常量
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 业务错误
  RULE_CONFLICT: 'RULE_CONFLICT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  SHIPMENT_NOT_AVAILABLE: 'SHIPMENT_NOT_AVAILABLE',
  DRIVER_NOT_AVAILABLE: 'DRIVER_NOT_AVAILABLE',
  
  // 认证错误
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED'
};

// 成功消息常量
export const SUCCESS_MESSAGES = {
  RULE_CREATED: '规则创建成功',
  RULE_UPDATED: '规则更新成功',
  RULE_DELETED: '规则删除成功',
  SHIPMENT_CREATED: '运单创建成功',
  SHIPMENT_UPDATED: '运单更新成功',
  PAYMENT_PROCESSED: '支付处理成功',
  STATEMENT_GENERATED: '对账单生成成功'
};

// 默认配置常量
export const DEFAULT_CONFIG = {
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
