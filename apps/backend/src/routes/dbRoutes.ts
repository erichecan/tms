import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';

// 数据库连通性与受控SQL执行路由 // 2025-10-02 02:40:30
const router = Router();
const db = new DatabaseService();

// GET /api/db/ping - 连通性检查
router.get('/ping', async (_req: Request, res: Response) => {
  try {
    const rows = await db.query('SELECT NOW() as now');
    res.json({ ok: true, now: rows[0]?.now });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
});

// POST /api/db/exec - 受控执行SQL（需要管理令牌）
// Header: x-admin-sql-token: <ADMIN_SQL_TOKEN>
router.post('/exec', async (req: Request, res: Response) => {
  const token = req.header('x-admin-sql-token');
  const adminToken = process.env.ADMIN_SQL_TOKEN;

  if (!adminToken || token !== adminToken) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const { sql, params } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ ok: false, error: 'sql is required' });
  }

  try {
    const rows = await db.query(sql, Array.isArray(params) ? params : []);
    res.json({ ok: true, rows });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || String(error) });
  }
});

export default router;


