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

// 2025-11-29T20:43:00 修复环境变量加载：确保在所有导入之前加载
// 手动加载.env文件 - 2025-10-03 19:52:00 修复环境变量加载顺序
// 优先从项目根目录查找 .env 文件
const getProjectRoot = (): string => {
  // 从当前文件位置向上查找，直到找到包含 apps/backend 目录的根目录
  // 或者找到根目录的 package.json 或 .env 文件
  let currentDir = __dirname;
  while (currentDir !== '/') {
    // 检查是否是项目根目录（包含 apps/backend 和 .env 文件）
    if (fs.existsSync(path.join(currentDir, '.env')) && fs.existsSync(path.join(currentDir, 'apps'))) {
      return currentDir;
    }
    // 检查是否是项目根目录（包含 package.json 和 apps 目录）
    if (fs.existsSync(path.join(currentDir, 'package.json')) && fs.existsSync(path.join(currentDir, 'apps'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // 如果找不到，尝试从当前工作目录向上查找
  let cwd = process.cwd();
  while (cwd !== '/') {
    if (fs.existsSync(path.join(cwd, '.env'))) {
      return cwd;
    }
    cwd = path.dirname(cwd);
  }
  return process.cwd(); // 如果都找不到，使用当前工作目录
};

const projectRoot = getProjectRoot();
const envPath = path.resolve(projectRoot, '.env');

// 2025-11-30T19:55:00Z Fixed by Assistant: 使用 dotenv 从项目根目录加载环境变量
dotenv.config({ path: envPath, override: true });

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  let loadedCount = 0;
  for (const line of envLines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // 强制设置环境变量，覆盖之前的值
        process.env[key.trim()] = value;
        loadedCount++;
      }
    }
  }
  console.log(`[2025-11-29T20:40:00] Environment variables loaded from: ${envPath}`);
  console.log(`[2025-11-29T20:40:00] Loaded ${loadedCount} environment variables`);
  console.log(`[2025-11-29T20:40:00] DATABASE_URL loaded: ${process.env.DATABASE_URL ? 'YES (length: ' + process.env.DATABASE_URL.length + ')' : 'NO'}`);
  console.log(`[2025-11-29T20:40:00] PORT: ${process.env.PORT || 'default (8000)'}`);
} else {
  console.warn(`[2025-11-29T20:40:00] .env file not found at: ${envPath}`);
  console.warn(`[2025-11-29T20:40:00] Current working directory: ${process.cwd()}`);
  console.warn(`[2025-11-29T20:40:00] Project root: ${projectRoot}`);
  console.warn(`[2025-11-29T20:40:00] __dirname: ${__dirname}`);
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
import driverCertificateRoutes from './routes/driverCertificateRoutes'; // 司机证照管理 // 2025-11-29T11:25:04Z
import driverViolationRoutes from './routes/driverViolationRoutes'; // 司机违章管理 // 2025-11-29T11:25:04Z
import driverScheduleRoutes from './routes/driverScheduleRoutes'; // 司机排班管理 // 2025-11-29T11:25:04Z
import scheduleCustomFieldRoutes from './routes/scheduleCustomFieldRoutes'; // 排班自定义字段定义 // 2025-11-29T11:25:04Z
import driverGroupRoutes from './routes/driverGroupRoutes'; // 司机班组管理 // 2025-11-29T11:25:04Z
import driverMedicalRoutes from './routes/driverMedicalRoutes'; // 司机体检管理 // 2025-11-29T11:25:04Z
import driverTrainingRoutes from './routes/driverTrainingRoutes'; // 司机培训管理 // 2025-11-29T11:25:04Z
import vehicleRoutes from './routes/vehicleRoutes';
import vehicleCertificateRoutes from './routes/vehicleCertificateRoutes'; // 车辆证照管理 // 2025-11-29T11:25:04Z
import vehicleInsuranceRoutes from './routes/vehicleInsuranceRoutes'; // 车辆保险管理 // 2025-11-29T11:25:04Z
import vehicleInspectionRoutes from './routes/vehicleInspectionRoutes'; // 车辆年检管理 // 2025-11-29T11:25:04Z
import vehicleDeviceRoutes from './routes/vehicleDeviceRoutes'; // 车辆设备管理 // 2025-11-29T11:25:04Z
import maintenanceRoutes from './routes/maintenanceRoutes'; // 维护记录管理 // 2025-11-29T11:25:04Z
import routeRoutes from './routes/routeRoutes'; // 线路管理 // 2025-11-29T11:25:04Z
import stationRoutes from './routes/stationRoutes'; // 站点与仓库管理 // 2025-11-29T11:25:04Z
import costRoutes from './routes/costRoutes'; // 成本核算管理 // 2025-11-29T11:25:04Z
import tripRoutes from './routes/tripRoutes'; // 行程管理路由 // 2025-01-27 16:45:00
import carrierRoutes from './routes/carrierRoutes'; // 承运商管理 // 2025-11-29T11:25:04Z
import carrierCertificateRoutes from './routes/carrierCertificateRoutes'; // 承运商证照管理 // 2025-11-29T11:25:04Z
import currencyRoutes from './routes/currencyRoutes'; // 车辆列表（MVP） // 2025-09-23 10:25:00
import pricingEngineRoutes from './routes/pricingEngineRoutes';
import shipmentCompletionRoutes from './routes/shipmentCompletionRoutes';
import mapsRoutes from './routes/maps'; // Google Maps API路由 // 2025-10-03 10:00:00
import locationRoutes from './routes/locationRoutes'; // 位置跟踪路由 // 2025-11-29T21:05:00
import { metricsMiddleware, metricsHandler } from './middleware/metricsMiddleware'; // 2025-11-11T15:28:33Z Added by Assistant: Metrics middleware

// 导入新增的服务
import { PricingEngineService } from './services/PricingEngineService';
import { PricingEngineController } from './controllers/PricingEngineController';
import { PricingFinancialIntegration } from './services/PricingFinancialIntegration';
import { PricingPermissionService } from './services/PricingPermissionService'; // 计费规则引擎 // 2025-09-29 02:35:00

// 2025-11-30T19:50:00Z Fixed by Assistant: 环境变量已在上面的代码块中加载

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 8000;

// 初始化数据库服务
const dbService = new DatabaseService();

// 测试数据库连接
(async () => {
  try {
    await dbService.query('SELECT 1 as test');
    logger.info('✅ 数据库连接成功');
  } catch (error: any) {
    logger.error('❌ 数据库连接失败:', error.message);
    logger.error('请检查数据库配置：');
    logger.error('  - DATABASE_URL 或 DB_HOST/DB_NAME/DB_USER/DB_PASSWORD');
    logger.error('  - 确保数据库服务正在运行');
    logger.error('  - 确保数据库已创建并运行了必要的迁移');
    // 不阻止服务器启动，但会在首次查询时失败
  }
})();

// 中间件配置
// 2025-10-17T15:00:00 - 修复 CORS 配置，使用环境变量
// 2025-11-30T14:00:00Z Fixed by Assistant: 修复 CORS 配置，确保移动端可以访问
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

console.log('CORS Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  allowedOrigins
});

// 2025-11-30T14:00:00Z Fixed by Assistant: 将 CORS 放在 helmet 之前，确保 CORS 头不被覆盖
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如移动应用或 Postman）
    if (!origin) {
      console.log('CORS: Allowing request without origin');
      return callback(null, true);
    }
    // 检查 origin 是否在允许列表中（不区分大小写）
    const normalizedOrigin = origin.trim().toLowerCase();
    const normalizedAllowed = allowedOrigins.map(o => o.trim().toLowerCase());
    
    if (normalizedAllowed.includes(normalizedOrigin) || allowedOrigins.includes(origin)) {
      console.log('CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.warn('CORS: Blocked origin:', origin);
      console.warn('CORS: Allowed origins:', allowedOrigins);
      // 允许所有本地开发环境的请求
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('CORS: Allowing localhost origin:', origin);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(helmet({
  // 2025-11-30T14:00:00Z Fixed by Assistant: 配置 helmet 允许 CORS
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // 安全头
app.use(compression()); // 响应压缩

// 请求日志
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);
app.use(metricsMiddleware); // 2025-11-11T15:28:33Z Added by Assistant: Collect HTTP metrics

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

// Prometheus 指标暴露
app.get('/metrics', metricsHandler); // 2025-11-11T15:28:33Z Added by Assistant: /metrics endpoint

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
app.use('/api/drivers', driverCertificateRoutes); // 司机证照管理 // 2025-11-29T11:25:04Z
app.use('/api/drivers', driverViolationRoutes); // 司机违章管理 // 2025-11-29T11:25:04Z
app.use('/api/drivers', driverScheduleRoutes); // 司机排班管理 // 2025-11-29T11:25:04Z
app.use('/api/schedules/custom-fields', scheduleCustomFieldRoutes); // 排班自定义字段定义 // 2025-11-29T11:25:04Z
app.use('/api/drivers', driverGroupRoutes); // 司机班组管理 // 2025-11-29T11:25:04Z
app.use('/api/drivers', driverMedicalRoutes); // 司机体检管理 // 2025-11-29T11:25:04Z
app.use('/api/drivers', driverTrainingRoutes); // 司机培训管理 // 2025-11-29T11:25:04Z
app.use('/api/vehicles', vehicleRoutes); // 车辆管理API // 2025-09-26 17:58:00
app.use('/api/vehicles', vehicleCertificateRoutes); // 车辆证照管理 // 2025-11-29T11:25:04Z
app.use('/api/vehicles', vehicleInsuranceRoutes); // 车辆保险管理 // 2025-11-29T11:25:04Z
app.use('/api/vehicles', vehicleInspectionRoutes); // 车辆年检管理 // 2025-11-29T11:25:04Z
app.use('/api/vehicles', vehicleDeviceRoutes); // 车辆设备管理 // 2025-11-29T11:25:04Z
app.use('/api/maintenance', maintenanceRoutes); // 维护记录管理 // 2025-11-29T11:25:04Z
app.use('/api/routes', routeRoutes); // 线路管理 // 2025-11-29T11:25:04Z
app.use('/api/stations', stationRoutes); // 站点与仓库管理 // 2025-11-29T11:25:04Z
app.use('/api/costs', costRoutes); // 成本核算管理 // 2025-11-29T11:25:04Z
app.use('/api/trips', tripRoutes); // 行程管理API // 2025-01-27 16:45:00
app.use('/api/carriers', carrierRoutes); // 承运商管理 // 2025-11-29T11:25:04Z
app.use('/api/carriers', carrierCertificateRoutes); // 承运商证照管理 // 2025-11-29T11:25:04Z
app.use('/api/pricing', pricingEngineRoutes); // 计费规则引擎 // 2025-09-29 02:35:00
app.use('/api/shipments', shipmentCompletionRoutes); // 运单完成和财务生成 // 2025-09-29 03:35:00
app.use('/api/maps', mapsRoutes); // 注册Maps API路由 // 2025-10-03 10:00:00
app.use('/api/location', locationRoutes); // 注册位置跟踪路由 // 2025-11-29T21:05:00

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

// 🚀 启动到期提醒定时任务 // 2025-11-29T11:25:04Z
import { ExpiryReminderJob } from './jobs/expiryReminderJob';
const expiryReminderJob = new ExpiryReminderJob();
expiryReminderJob.start();

// 启动服务器（测试环境下跳过监听） // 2025-11-11T15:57:10Z Added by Assistant: Avoid listen during Jest runs
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`TMS SaaS Backend Server started on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info('🚛 智能调度优化引擎已启动');
    logger.info(`📊 定时任务状态: ${optimizationJob.getStatus().running ? '运行中' : '已停止'}`);
  });
}

export default app;
export { app }; // 2025-11-11 15:38:45 提供测试所需的命名导出
