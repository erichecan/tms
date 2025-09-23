import { Router } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // 2025-09-23 10:25:00

// GET /api/vehicles （简化：全量列表） // 2025-09-23 10:25:00
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

export default router;


