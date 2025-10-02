import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// 导入路由 - 2025-01-27 16:45:00 添加行程管理路由
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import driverRoutes from './routes/driverRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import shipmentRoutes from './routes/shipmentRoutes';
import tripRoutes from './routes/tripRoutes';
import financeRoutes from './routes/financeRoutes';
import ruleRoutes from './routes/ruleRoutes';
import dbRoutes from './routes/dbRoutes'; // DB连通性路由 // 2025-10-02 02:41:10

// 初始化 Express 应用 // 2025-09-23 10:00:00
const app = express();

app.use(helmet()); // 基础安全头 // 2025-09-23 10:00:00
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
})); // 跨域支持 // 2025-10-01 21:45:00
app.use(compression()); // 压缩 // 2025-09-23 10:00:00
app.use(express.json({ limit: '2mb' })); // JSON 解析 // 2025-09-23 10:00:00
app.use(morgan('dev')); // 请求日志 // 2025-09-23 10:00:00

// 健康检查 // 2025-09-23 10:00:00
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// 注册路由 - 2025-01-27 16:45:00 注册所有API路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/db', dbRoutes); // 注册DB路由 // 2025-10-02 02:41:10

export default app;


