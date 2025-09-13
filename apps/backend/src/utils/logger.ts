// 日志工具
// 创建时间: 2025-01-27 15:30:45

import winston from 'winston';
import path from 'path';

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// 创建logger实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'tms-backend' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // 所有日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 在开发环境中添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// 创建请求日志中间件
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      tenantId: req.tenant?.id
    };
    
    if (res.statusCode >= 400) {
      logger.error('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// 创建错误日志中间件
export const errorLogger = (error: Error, req: any, res: any, next: any) => {
  logger.error('Unhandled Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    tenantId: req.tenant?.id
  });
  
  next(error);
};

export default logger;
