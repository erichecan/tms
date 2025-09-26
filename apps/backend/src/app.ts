import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// 初始化 Express 应用 // 2025-09-23 10:00:00
const app = express();

app.use(helmet()); // 基础安全头 // 2025-09-23 10:00:00
app.use(cors()); // 跨域支持 // 2025-09-23 10:00:00
app.use(compression()); // 压缩 // 2025-09-23 10:00:00
app.use(express.json({ limit: '2mb' })); // JSON 解析 // 2025-09-23 10:00:00
app.use(morgan('dev')); // 请求日志 // 2025-09-23 10:00:00

// 健康检查 // 2025-09-23 10:00:00
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export default app;


