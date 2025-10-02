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
import fs from 'fs';
import path from 'path';

// 手动加载.env文件
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  }
  console.log('Environment variables loaded manually from .env file');
} else {
  console.log('.env file not found at:', envPath);
}

// 导入路由
import authRoutes from './routes/authRoutes';
import ruleRoutes from './routes/ruleRoutes';
import pricingRoutes from './routes/pricingRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import mvpShipmentRoutes from './routes/mvpShipmentRoutes'; // MVP 运单路由 // 2025-09-23 10:15:00
import mvpAssignmentRoutes from './routes/mvpAssignmentRoutes'; // MVP 分配 // 2025-09-23 10:30:00
import mvpStatusRoutes from './routes/mvpStatusRoutes'; // MVP 状态 // 2025-09-23 10:30:00
import mvpPodRoutes from './routes/mvpPodRoutes'; // MVP POD // 2025-09-23 10:30:00
import financeRoutes from './routes/financeRoutes';
import customerRoutes from './routes/customerRoutes';
import driverRoutes from './routes/driverRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import tripRoutes from './routes/tripRoutes'; // 行程管理路由 // 2025-01-27 16:45:00
import currencyRoutes from './routes/currencyRoutes'; // 车辆列表（MVP） // 2025-09-23 10:25:00
import pricingEngineRoutes from './routes/pricingEngineRoutes';
import shipmentCompletionRoutes from './routes/shipmentCompletionRoutes';

// 导入新增的服务
import { PricingEngineService } from './services/PricingEngineService';
import { PricingEngineController } from './controllers/PricingEngineController';
import { PricingFinancialIntegration } from './services/PricingFinancialIntegration';
import { PricingPermissionService } from './services/PricingPermissionService'; // 计费规则引擎 // 2025-09-29 02:35:00

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 8000;

// 初始化数据库服务
const dbService = new DatabaseService();

// 中间件配置
app.use(helmet()); // 安全头
app.use(compression()); // 响应压缩
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// 请求日志
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API路由 - 2025-01-27 16:45:00 更新路由以支持v3.0-PC
app.use('/api/auth', authRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/shipments', mvpShipmentRoutes); // MVP 最小闭环 REST // 2025-09-23 10:15:00
app.use('/api/shipments', mvpAssignmentRoutes); // MVP 分配 // 2025-09-23 10:30:00
app.use('/api/shipments', mvpStatusRoutes); // MVP 状态 // 2025-09-23 10:30:00
app.use('/api/shipments', mvpPodRoutes); // MVP POD 上传 // 2025-09-23 10:30:00
app.use('/api/finance', financeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes); // 车辆管理API // 2025-09-26 17:58:00
app.use('/api/trips', tripRoutes); // 行程管理API // 2025-01-27 16:45:00
app.use('/api/pricing', pricingEngineRoutes); // 计费规则引擎 // 2025-09-29 02:35:00
app.use('/api/shipments', shipmentCompletionRoutes); // 运单完成和财务生成 // 2025-09-29 03:35:00

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
app.use((error: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

// 🚀 启动智能调度优化定时任务
import { getDispatchOptimizationJob } from './jobs/DispatchOptimizationJob';
const optimizationJob = getDispatchOptimizationJob();
optimizationJob.start();

// 启动服务器
app.listen(PORT, () => {
  logger.info(`TMS SaaS Backend Server started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info('🚛 智能调度优化引擎已启动');
  logger.info(`📊 定时任务状态: ${optimizationJob.getStatus().running ? '运行中' : '已停止'}`);
});

export default app;
