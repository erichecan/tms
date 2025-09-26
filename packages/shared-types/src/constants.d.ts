export declare const API_VERSION = "v1";
export declare const API_BASE_URL = "/api/v1";
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export declare const MIN_PAGE_SIZE = 1;
export declare const RULE_PRIORITY_RANGES: {
    BASE_FEE: {
        min: number;
        max: number;
    };
    ADDITIONAL_FEE: {
        min: number;
        max: number;
    };
    DISCOUNT: {
        min: number;
        max: number;
    };
    COMMISSION: {
        min: number;
        max: number;
    };
};
export declare const RULE_CONFLICT_THRESHOLD = 0.8;
export declare const SHIPMENT_NUMBER_PREFIX = "TMS";
export declare const MAX_SHIPMENT_WEIGHT = 50000;
export declare const MAX_SHIPMENT_VOLUME = 100;
export declare const DEFAULT_CURRENCY = "CNY";
export declare const PAYMENT_TERMS: {
    NET_15: number;
    NET_30: number;
    NET_60: number;
};
export declare const DRIVER_COMMISSION_RATES: {
    MIN: number;
    MAX: number;
    DEFAULT: number;
};
export declare const MAX_FILE_SIZE: number;
export declare const ALLOWED_FILE_TYPES: string[];
export declare const CACHE_TTL: {
    SHORT: number;
    MEDIUM: number;
    LONG: number;
    VERY_LONG: number;
};
export declare const RATE_LIMIT: {
    WINDOW_MS: number;
    MAX_REQUESTS: number;
    SKIP_SUCCESSFUL_REQUESTS: boolean;
};
export declare const LOG_LEVELS: {
    ERROR: string;
    WARN: string;
    INFO: string;
    DEBUG: string;
};
export declare const REGEX_PATTERNS: {
    EMAIL: RegExp;
    PHONE: RegExp;
    POSTAL_CODE: RegExp;
    LICENSE_PLATE: RegExp;
};
export declare const ERROR_CODES: {
    INTERNAL_ERROR: string;
    VALIDATION_ERROR: string;
    NOT_FOUND: string;
    UNAUTHORIZED: string;
    FORBIDDEN: string;
    RULE_CONFLICT: string;
    INSUFFICIENT_BALANCE: string;
    SHIPMENT_NOT_AVAILABLE: string;
    DRIVER_NOT_AVAILABLE: string;
    INVALID_CREDENTIALS: string;
    TOKEN_EXPIRED: string;
    ACCOUNT_LOCKED: string;
};
export declare const SUCCESS_MESSAGES: {
    RULE_CREATED: string;
    RULE_UPDATED: string;
    RULE_DELETED: string;
    SHIPMENT_CREATED: string;
    SHIPMENT_UPDATED: string;
    PAYMENT_PROCESSED: string;
    STATEMENT_GENERATED: string;
};
export declare const DEFAULT_CONFIG: {
    TENANT: {
        TIMEZONE: string;
        CURRENCY: string;
        LANGUAGE: string;
    };
    USER: {
        AVATAR: string;
        PREFERENCES: {
            theme: string;
            notifications: boolean;
            language: string;
        };
    };
    SHIPMENT: {
        DEFAULT_STATUS: string;
        AUTO_ASSIGN: boolean;
        TRACKING_ENABLED: boolean;
    };
};
//# sourceMappingURL=constants.d.ts.map