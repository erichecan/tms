// TMS SaaS平台后端服务入口文件
// 创建时间: 2025-01-27 15:30:45

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger, requestLogger, errorLogger } from './utils/logger';
import { DatabaseService } from './services/DatabaseService';

// 加载环境变量
dotenv.config();

// 导入路由
import authRoutes from './routes/authRoutes';
import ruleRoutes from './routes/ruleRoutes';
import pricingRoutes from './routes/pricingRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import financeRoutes from './routes/financeRoutes';

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 8000;

// 初始化数据库服务
const dbService = new DatabaseService();

// 中间件配置
app.use(helmet()); // 安全头
app.use(compression()); // 响应压缩
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// 请求日志
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/rules', ruleRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/finance', financeRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found'
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string || ''
  });
});

// 错误处理中间件
app.use(errorLogger);

// 全局错误处理
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    },
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] as string || ''
  });
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await dbService.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await dbService.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`TMS SaaS Backend Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default app;
