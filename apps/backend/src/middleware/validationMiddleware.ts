// 请求验证中间件
// 创建时间: 2025-01-27 15:30:45

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
}

/**
 * 请求验证中间件
 * @param schema 验证模式
 * @returns 中间件函数
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // 验证请求体
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证查询参数
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证路径参数
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // 验证请求头
    if (schema.headers) {
      const { error } = schema.headers.validate(req.headers);
      if (error) {
        errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
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
 * 客户创建验证模式
 */
export const customerCreateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  level: Joi.string().valid('standard', 'vip', 'premium').default('standard'),
  contactInfo: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().pattern(/^\d{6}$/).required(),
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
      postalCode: Joi.string().pattern(/^\d{6}$/).required(),
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
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required(),
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
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).optional(),
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
