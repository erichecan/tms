// 速率限制中间件
// 创建时间: 2025-12-05 12:00:00
// 作用: 实现基于 IP 和邮箱的速率限制，防止滥用

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// 速率限制配置接口
interface RateLimitConfig {
  key: string; // 限制键名（用于区分不同的限制规则）
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求数
  keyGenerator?: (req: Request) => string; // 自定义键生成函数
  skipSuccessfulRequests?: boolean; // 是否跳过成功请求
  skipFailedRequests?: boolean; // 是否跳过失败请求
}

// 内存存储（生产环境建议使用 Redis）
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// 清理过期记录的定时器
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000); // 每分钟清理一次

/**
 * 速率限制中间件
 * @param config 速率限制配置
 * @returns 中间件函数
 * 2025-12-05 12:00:00
 */
export function rateLimit(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 生成限制键
    const keyGenerator = config.keyGenerator || ((req: Request) => {
      // 默认使用 IP 地址
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                 req.ip || 
                 req.socket.remoteAddress || 
                 'unknown';
      return `${config.key}:${ip}`;
    });

    const key = keyGenerator(req);

    // 获取或创建记录
    const now = Date.now();
    let record = store[key];

    if (!record || record.resetTime < now) {
      // 创建新记录
      record = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      store[key] = record;
    }

    // 增加计数
    record.count++;

    // 设置响应头
    res.setHeader('X-RateLimit-Limit', config.max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, config.max - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    // 检查是否超过限制
    if (record.count > config.max) {
      logger.warn('速率限制触发', {
        key,
        count: record.count,
        max: config.max,
        ip: req.ip,
        path: req.path,
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `请求过于频繁，请在 ${Math.ceil((record.resetTime - now) / 1000)} 秒后重试`,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || '',
      });
      return;
    }

    // 继续处理请求
    next();
  };
}

/**
 * 基于邮箱的速率限制（用于询价表单等场景）
 * @param config 速率限制配置
 * @returns 中间件函数
 * 2025-12-05 12:00:00
 */
export function rateLimitByEmail(config: Omit<RateLimitConfig, 'keyGenerator'>) {
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => {
      // 从请求体中获取邮箱
      const email = (req.body?.email as string) || '';
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                 req.ip || 
                 'unknown';
      
      // 如果邮箱存在，使用邮箱作为键；否则使用 IP
      return email ? `${config.key}:email:${email}` : `${config.key}:ip:${ip}`;
    },
  });
}

