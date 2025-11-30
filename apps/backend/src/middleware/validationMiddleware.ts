// 请求验证中间件
// 创建时间: 2025-01-27 15:30:45

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

interface ValidationSchema {
  // 允许直接传入Joi.ObjectSchema或简化描述对象
  body?: Joi.ObjectSchema | Record<string, any>;
  query?: Joi.ObjectSchema | Record<string, any>;
  params?: Joi.ObjectSchema | Record<string, any>;
  headers?: Joi.ObjectSchema | Record<string, any>;
}

/**
 * 将简化描述对象转换为Joi.ObjectSchema
 * 支持的字段描述：{ type: 'string'|'number'|'boolean'|'object'|'array', required?: boolean, enum?: any[], properties?: {}, items?: any }
 * @param input 简化对象或Joi对象
 * @returns Joi.ObjectSchema
 */
const ensureObjectSchema = (input?: Joi.ObjectSchema | Record<string, any>): Joi.ObjectSchema | undefined => {
  if (!input) return undefined;
  if (Joi.isSchema(input)) {
    return input as Joi.ObjectSchema;
  }
  const desc = input as Record<string, any>;
  const convert = (node: any): Joi.Schema => {
    if (Joi.isSchema(node)) return node as Joi.Schema;
    if (node && typeof node === 'object' && 'type' in node) {
      const { type, required, enum: enumVals, properties, items } = node as { type: string; required?: boolean; enum?: any[]; properties?: Record<string, any>; items?: any };
      let schema: Joi.Schema;
      switch (type) {
        case 'string':
          schema = Joi.string().allow(null, ''); // 2025-11-29T23:00:00 允许 null 和空字符串
          if (Array.isArray(enumVals) && enumVals.length > 0) schema = (schema as Joi.StringSchema).valid(...enumVals);
          break;
        case 'number':
          schema = Joi.number();
          break;
        case 'boolean':
          schema = Joi.boolean();
          break;
        case 'array':
          schema = Joi.array();
          if (items) schema = (schema as Joi.ArraySchema).items(convert(items));
          break;
        case 'object':
          schema = Joi.object(convertProperties(properties));
          break;
        default:
          schema = Joi.any();
      }
      if (required) schema = (schema as any).required(); else schema = (schema as any).optional();
      return schema;
    }
    // 普通对象，递归为object
    if (node && typeof node === 'object') {
      return Joi.object(convertProperties(node as Record<string, any>));
    }
    return Joi.any();
  };

  const convertProperties = (props?: Record<string, any>): Record<string, Joi.Schema> => {
    const result: Record<string, Joi.Schema> = {};
    if (!props) return result;
    for (const [key, value] of Object.entries(props)) {
      result[key] = convert(value);
    }
    return result;
  };

  return Joi.object(convertProperties(desc));
};

/**
 * 请求验证中间件
 * @param schema 验证模式
 * @returns 中间件函数
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // 验证请求体
    const bodySchema = ensureObjectSchema(schema.body);
    if (bodySchema) {
      // 2025-11-29T22:52:00 修复：预处理 null 值，删除 customerId 如果它是 null 或空字符串
      const processedBody = { ...req.body };
      
      // 2025-11-29T22:55:00 修复：特殊处理 customerId，无条件删除（因为后端会自动创建默认客户）
      // 如果 customerId 是 null、空字符串或未定义，完全删除该字段，避免验证错误
      if ('customerId' in processedBody && (processedBody.customerId === null || processedBody.customerId === '' || processedBody.customerId === undefined)) {
        delete processedBody.customerId;
        logger.debug('Removed invalid customerId from request body before validation');
      }
      
      // 2025-11-29T23:01:00 修复：特殊处理 vehicleId，如果是 null 或空字符串，删除该字段
      if ('vehicleId' in processedBody && (processedBody.vehicleId === null || processedBody.vehicleId === '' || processedBody.vehicleId === undefined)) {
        delete processedBody.vehicleId;
        logger.debug('Removed null/empty vehicleId from request body before validation');
      }
      
      // 2025-11-29T23:01:00 修复：特殊处理所有可能为 null 的字符串字段，在验证前删除 null 值
      // 这包括但不限于：vehicleId, driverId（如果可选）等
      for (const key of Object.keys(processedBody)) {
        if (processedBody[key] === null && typeof processedBody[key] === 'object') {
          // 只删除明确为 null 的字段，保留 undefined
          delete processedBody[key];
        }
      }
      
      // 2025-11-29T22:52:00 修复：使用宽松的验证选项
      const result = bodySchema.validate(processedBody, { 
        abortEarly: false, 
        stripUnknown: false,
        allowUnknown: true
      });
      if (result.error) {
        // 2025-11-29T22:53:00 添加详细日志以便调试
        logger.warn('Validation failed', {
          errors: result.error.details.map(d => d.message),
          url: req.url,
          bodyKeys: Object.keys(processedBody)
        });
        errors.push(`Body: ${result.error.details.map(d => d.message).join(', ')}`);
      } else {
        // 将处理后的 body 写回 req.body，保持一致性
        req.body = processedBody;
      }
    }

    // 验证查询参数
    const querySchema = ensureObjectSchema(schema.query);
    if (querySchema) {
      const result = querySchema.validate(req.query);
      if (result.error) {
        errors.push(`Query: ${result.error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证路径参数
    const paramsSchema = ensureObjectSchema(schema.params);
    if (paramsSchema) {
      const result = paramsSchema.validate(req.params);
      if (result.error) {
        errors.push(`Params: ${result.error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证请求头
    const headersSchema = ensureObjectSchema(schema.headers);
    if (headersSchema) {
      const result = headersSchema.validate(req.headers);
      if (result.error) {
        errors.push(`Headers: ${result.error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      logger.warn('Validation failed:', { errors, url: req.url, method: req.method });
      
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    next();
  };
};

/**
 * 分页参数验证
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().default('created_at'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().optional()
});

/**
 * UUID参数验证
 */
export const uuidParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

/**
 * 规则创建验证模式
 */
export const ruleCreateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('pricing', 'payroll').required(),
  priority: Joi.number().integer().min(1).max(1000).required(),
  conditions: Joi.array().items(
    Joi.object({
      fact: Joi.string().required(),
      operator: Joi.string().valid(
        'equal', 'notEqual', 'greaterThan', 'lessThan',
        'greaterThanInclusive', 'lessThanInclusive',
        'contains', 'doesNotContain', 'startsWith', 'endsWith',
        'in', 'notIn', 'isEmpty', 'isNotEmpty'
      ).required(),
      value: Joi.any().required()
    })
  ).min(1).required(),
  actions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(
        'applyDiscount', 'addFee', 'setBaseRate', 'setDriverCommission',
        'setCustomerLevel', 'sendNotification', 'logEvent'
      ).required(),
      params: Joi.object().required()
    })
  ).min(1).required(),
  status: Joi.string().valid('active', 'inactive').default('active')
});

/**
 * 规则更新验证模式
 */
export const ruleUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  type: Joi.string().valid('pricing', 'payroll').optional(),
  priority: Joi.number().integer().min(1).max(1000).optional(),
  conditions: Joi.array().items(
    Joi.object({
      fact: Joi.string().required(),
      operator: Joi.string().valid(
        'equal', 'notEqual', 'greaterThan', 'lessThan',
        'greaterThanInclusive', 'lessThanInclusive',
        'contains', 'doesNotContain', 'startsWith', 'endsWith',
        'in', 'notIn', 'isEmpty', 'isNotEmpty'
      ).required(),
      value: Joi.any().required()
    })
  ).min(1).optional(),
  actions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid(
        'applyDiscount', 'addFee', 'setBaseRate', 'setDriverCommission',
        'setCustomerLevel', 'sendNotification', 'logEvent'
      ).required(),
      params: Joi.object().required()
    })
  ).min(1).optional(),
  status: Joi.string().valid('active', 'inactive').optional()
});

/**
 * 规则测试验证模式
 */
export const ruleTestSchema = Joi.object({
  facts: Joi.object().required()
});

/**
 * 用户创建验证模式
 */
export const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid('admin', 'manager', 'operator', 'driver', 'customer').required(),
  profile: Joi.object({
    firstName: Joi.string().min(1).max(100).required(),
    lastName: Joi.string().min(1).max(100).required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    avatar: Joi.string().uri().optional()
  }).required()
});

/**
 * 用户登录验证模式
 */
export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

/**
 * 运单创建验证模式
 */
export const shipmentCreateSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  pickupAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().pattern(/^\d{6}$/).required(),
    country: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional(),
    instructions: Joi.string().max(500).optional()
  }).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postalCode: Joi.string().pattern(/^\d{6}$/).required(),
    country: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    }).optional(),
    instructions: Joi.string().max(500).optional()
  }).required(),
  cargoInfo: Joi.object({
    description: Joi.string().required(),
    weight: Joi.number().min(0).max(50000).required(),
    volume: Joi.number().min(0).max(100).required(),
    dimensions: Joi.object({
      length: Joi.number().min(0).required(),
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required()
    }).required(),
    value: Joi.number().min(0).required(),
    specialRequirements: Joi.array().items(Joi.string()).optional(),
    hazardous: Joi.boolean().default(false)
  }).required()
});

/**
 * 运单创建验证模式（前端表单格式）
 */
export const shipmentCreateFormSchema = Joi.object({
  shipmentNumber: Joi.string().optional(),
  customerId: Joi.any().optional(), // 2025-11-29T22:52:00 完全可选，后端会处理默认客户创建
  salesChannel: Joi.string().valid('DIRECT', 'API', 'IMPORT', 'WEBHOOK').optional(), // 2025-10-08 14:45:00
  sellerNotes: Joi.string().allow('', null).optional(), // 2025-10-08 14:45:00
  customerName: Joi.string().required(),
  customerPhone: Joi.string().required(),
  customerEmail: Joi.string().email().allow('', null).optional(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent', 'vip1', 'vip2', 'vip3', 'vip4', 'vip5').default('normal'), // 2025-10-08 14:45:00 添加VIP等级
  shipper: Joi.object({
    name: Joi.string().required(),
    company: Joi.string().optional(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional(),
    address: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().allow('', null).optional(), // 2025-11-29T22:56:00 允许空字符串和 null
      city: Joi.string().required(),
      province: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
      isResidential: Joi.boolean().optional()
    }).required()
  }).required(),
  receiver: Joi.object({
    name: Joi.string().required(),
    company: Joi.string().optional(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional(),
    address: Joi.object({
      addressLine1: Joi.string().required(),
      addressLine2: Joi.string().allow('', null).optional(), // 2025-11-29T22:56:00 允许空字符串和 null
      city: Joi.string().required(),
      province: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
      isResidential: Joi.boolean().optional()
    }).required()
  }).required(),
  pickupDate: Joi.string().optional(),
  deliveryDate: Joi.string().optional(),
  addressType: Joi.string().valid('residential', 'commercial').default('residential'),
  distance: Joi.number().min(0).optional(),
  cargoLength: Joi.number().min(0).optional(), // 2025-11-29T22:10:00 改为可选，支持多行货物模式
  cargoWidth: Joi.number().min(0).optional(),
  cargoHeight: Joi.number().min(0).optional(),
  cargoWeight: Joi.number().min(0).optional(), // 改为可选，支持多行货物模式
  cargoQuantity: Joi.number().min(1).optional(), // 改为可选，支持多行货物模式
  // 2025-11-29T22:10:00 新增：支持多行货物数据（cargoItems）
  cargoItems: Joi.array().items(
    Joi.object({
      length: Joi.number().min(0).required(),
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required(),
      weight: Joi.number().min(0).required(),
      quantity: Joi.number().min(1).required(),
      pallets: Joi.number().min(0).optional(),
      value: Joi.number().min(0).optional(),
      description: Joi.string().optional(),
      fragile: Joi.boolean().optional(),
      dangerous: Joi.boolean().optional()
    })
  ).optional(),
  cargoPalletCount: Joi.number().min(0).optional(),
  cargoValue: Joi.number().min(0).optional(),
  cargoDescription: Joi.string().optional(),
  cargoIsFragile: Joi.boolean().default(false),
  cargoIsDangerous: Joi.boolean().default(false),
  // 安全合规字段 - 2025-10-08 14:45:00
  cargoType: Joi.string().valid('GENERAL', 'SENSITIVE', 'DANGEROUS', 'PERISHABLE', 'FRAGILE', 'LIQUID').optional(),
  dangerousGoodsCode: Joi.string().allow('', null).optional(),
  requiresColdChain: Joi.boolean().default(false),
  needSignature: Joi.boolean().default(false),
  deliveryNote: Joi.string().allow('', null).optional(),
  // 服务与保险
  insurance: Joi.boolean().default(false),
  insuranceValue: Joi.number().min(0).optional(),
  requiresTailgate: Joi.boolean().default(false),
  requiresAppointment: Joi.boolean().default(false),
  waitingTime: Joi.number().min(0).optional(),
  deliveryInstructions: Joi.string().allow('', null).optional(),
  specialRequirements: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('draft', 'pending_confirmation', 'confirmed', 'scheduled', 'pickup_in_progress', 'in_transit', 'delivered', 'pod_pending_review', 'completed', 'cancelled', 'exception').optional(), // 2025-11-11 14:43:20
  estimatedCost: Joi.number().min(0).optional()
}).custom((value, helpers) => {
  // 2025-11-29T22:15:00 自定义验证：确保要么有 cargoItems，要么有单个货物字段
  const hasCargoItems = value.cargoItems && Array.isArray(value.cargoItems) && value.cargoItems.length > 0;
  const hasSingleCargo = value.cargoLength && value.cargoWidth && value.cargoHeight && value.cargoWeight;
  
  if (!hasCargoItems && !hasSingleCargo) {
    return helpers.error('any.custom', {
      message: '必须提供 cargoItems 数组或单个货物字段（cargoLength, cargoWidth, cargoHeight, cargoWeight）'
    });
  }
  
  return value;
});

/**
 * 客户创建验证模式
 */
// 2025-11-30T10:10:00Z Updated by Assistant: 支持加拿大地址格式（电话号码和邮政编码）
export const customerCreateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  level: Joi.string().valid('standard', 'vip', 'premium').default('standard'),
  contactInfo: Joi.object({
    email: Joi.string().email().required(),
    // 支持加拿大电话号码格式：(416) 123-4567, 416-123-4567, 4161234567, +1-416-123-4567
    phone: Joi.string().pattern(/^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(), // 加拿大省份：ON, BC, QC, AB 等
      // 支持加拿大邮政编码格式：A1A 1A1 或 A1A1A1
      postalCode: Joi.string().pattern(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/).required(),
      country: Joi.string().required()
    }).required(),
    contactPerson: Joi.string().max(100).optional()
  }).required(),
  billingInfo: Joi.object({
    companyName: Joi.string().max(255).required(),
    taxId: Joi.string().max(50).required(),
    billingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      // 支持加拿大邮政编码格式：A1A 1A1 或 A1A1A1
      postalCode: Joi.string().pattern(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/).required(),
      country: Joi.string().required()
    }).required(),
    paymentTerms: Joi.string().max(100).optional()
  }).optional()
});

/**
 * 客户更新验证模式
 */
export const customerUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  level: Joi.string().valid('standard', 'vip', 'premium').optional(),
  contactInfo: Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().pattern(/^\d{6}$/).optional(),
      country: Joi.string().optional()
    }).optional(),
    contactPerson: Joi.string().max(100).optional()
  }).optional(),
  billingInfo: Joi.object({
    companyName: Joi.string().max(255).optional(),
    taxId: Joi.string().max(50).optional(),
    billingAddress: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().optional(),
      postalCode: Joi.string().pattern(/^\d{6}$/).optional(),
      country: Joi.string().optional()
    }).optional(),
    paymentTerms: Joi.string().max(100).optional()
  }).optional()
});

/**
 * 司机创建验证模式
 */
export const driverCreateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  // 2025-11-30 06:15:00 修复：加拿大手机号格式验证（10位数字，第一位和第四位不能是0或1）
  phone: Joi.string().pattern(/^[2-9]\d{2}[2-9]\d{2}\d{4}$/).required().messages({
    'string.pattern.base': '手机号必须是有效的加拿大手机号格式（10位数字，格式：XXX-XXX-XXXX）'
  }),
  licenseNumber: Joi.string().max(50).required(),
  vehicleInfo: Joi.object({
    type: Joi.string().valid('van', 'truck', 'trailer', 'refrigerated').required(),
    licensePlate: Joi.string().max(20).required(),
    capacity: Joi.number().min(0).required(),
    dimensions: Joi.object({
      length: Joi.number().min(0).required(),
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required()
    }).required(),
    features: Joi.array().items(Joi.string()).optional()
  }).required()
});

/**
 * 司机更新验证模式
 */
export const driverUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  // 2025-11-30 06:15:00 修复：加拿大手机号格式验证
  phone: Joi.string().pattern(/^[2-9]\d{2}[2-9]\d{2}\d{4}$/).optional().messages({
    'string.pattern.base': '手机号必须是有效的加拿大手机号格式（10位数字，格式：XXX-XXX-XXXX）'
  }),
  licenseNumber: Joi.string().max(50).optional(),
  vehicleInfo: Joi.object({
    type: Joi.string().valid('van', 'truck', 'trailer', 'refrigerated').optional(),
    licensePlate: Joi.string().max(20).optional(),
    capacity: Joi.number().min(0).optional(),
    dimensions: Joi.object({
      length: Joi.number().min(0).optional(),
      width: Joi.number().min(0).optional(),
      height: Joi.number().min(0).optional()
    }).optional(),
    features: Joi.array().items(Joi.string()).optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});
