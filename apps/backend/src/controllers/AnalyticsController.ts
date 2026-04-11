import { Request, Response } from 'express';
import { query } from '../db-postgres';

export const AnalyticsController = {
  // 1. Profit Analytics
  // Aggregates waybills to provide insights on revenue, cost, and margin
  getProfitAnalytics: async (req: Request, res: Response) => {
    try {
      // General KPIs
      const kpiRes = await query(`
        SELECT 
          COUNT(*) as total_waybills,
          SUM(price_estimated) as total_revenue,
          SUM(driver_cost) as total_cost,
          SUM(price_estimated - COALESCE(driver_cost, 0)) as total_margin
        FROM waybills
        WHERE status IN ('DELIVERED', 'COMPLETED')
      `);

      // Profit by destination
      const destRes = await query(`
        SELECT 
          destination as name,
          COUNT(*) as count,
          SUM(price_estimated) as revenue,
          SUM(driver_cost) as cost,
          SUM(price_estimated - COALESCE(driver_cost, 0)) as margin
        FROM waybills
        WHERE status IN ('DELIVERED', 'COMPLETED')
        GROUP BY destination
        ORDER BY margin DESC
        LIMIT 10
      `);

      // Profit by customer
      const custRes = await query(`
        SELECT 
          c.name as customer_name,
          COUNT(w.*) as count,
          SUM(w.price_estimated) as revenue,
          SUM(w.driver_cost) as cost,
          SUM(w.price_estimated - COALESCE(w.driver_cost, 0)) as margin
        FROM waybills w
        LEFT JOIN customers c ON w.customer_id = c.id
        WHERE w.status IN ('DELIVERED', 'COMPLETED')
        GROUP BY c.name
        ORDER BY margin DESC
        LIMIT 10
      `);

      res.json({
        kpis: kpiRes.rows[0] || { total_waybills: 0, total_revenue: 0, total_cost: 0, total_margin: 0 },
        byDestination: destRes.rows,
        byCustomer: custRes.rows
      });
    } catch (error) {
      console.error('Failed to get profit analytics:', error);
      res.status(500).json({ error: 'Failed to retrieve analytics' });
    }
  },

  // 2. Market Benchmarks
  getMarketBenchmarks: async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      let sql = 'SELECT * FROM market_benchmarks';
      const params: any[] = [];
      
      if (search) {
        sql += ' WHERE destination_code ILIKE $1';
        params.push(`%${search}%`);
      }
      
      sql += ' ORDER BY collected_at DESC';
      const benchmarkRes = await query(sql, params);
      
      res.json({ data: benchmarkRes.rows });
    } catch (error) {
      console.error('Failed to get market benchmarks:', error);
      res.status(500).json({ error: 'Failed to retrieve market benchmarks' });
    }
  },

  upsertMarketBenchmark: async (req: Request, res: Response) => {
    try {
      const {
        id,
        destination_code,
        vehicle_type,
        pallet_tier,
        min_price,
        max_price,
        avg_price,
        source
      } = req.body;

      const benchmarkId = id || `BM-${Date.now()}`;

      const result = await query(
        `INSERT INTO market_benchmarks (
          id, destination_code, vehicle_type, pallet_tier,
          min_price, max_price, avg_price, source, collected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        ON CONFLICT (id) DO UPDATE SET
          destination_code = EXCLUDED.destination_code,
          vehicle_type = EXCLUDED.vehicle_type,
          pallet_tier = EXCLUDED.pallet_tier,
          min_price = EXCLUDED.min_price,
          max_price = EXCLUDED.max_price,
          avg_price = EXCLUDED.avg_price,
          source = EXCLUDED.source,
          collected_at = NOW()
        RETURNING *`,
        [benchmarkId, destination_code, vehicle_type, pallet_tier, min_price, max_price, avg_price, source]
      );

      res.json({ data: result.rows[0], message: 'Market benchmark saved successfully' });
    } catch (error) {
      console.error('Failed to upsert market benchmark:', error);
      res.status(500).json({ error: 'Failed to save market benchmark' });
    }
  },
  
  deleteMarketBenchmark: async (req: Request, res: Response) => {
    try {
      await query('DELETE FROM market_benchmarks WHERE id = $1', [req.params.id]);
      res.json({ message: 'Benchmark deleted successfully' });
    } catch (error) {
      console.error('Failed to delete benchmark:', error);
      res.status(500).json({ error: 'Failed to delete benchmark' });
    }
  }
};
