// ============================================================================
// Telemetry 路由
// 创建时间: 2025-01-27 15:00:00
// 说明: 接收前端上报的 Google Maps API 调用统计
// ============================================================================

import express from 'express';
import { telemetryService } from '../services/telemetryService';

const router = express.Router();

// 2025-01-27 15:00:00 Google Maps 调用上报
router.post('/googlemaps', async (req, res) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({
        error: 'Events must be an array',
        code: 'INVALID_REQUEST',
      });
    }

    // 2025-01-27 15:00:00 批量写入 telemetry
    await telemetryService.ingest('googlemaps', events);

    res.json({
      success: true,
      received: events.length,
    });
  } catch (error: any) {
    console.error('❌ [Telemetry] Failed to ingest Google Maps events:', error);
    res.status(500).json({
      error: 'Failed to process telemetry data',
      code: 'INTERNAL_ERROR',
    });
  }
});

// 2025-01-27 15:00:00 获取 Google Maps 调用统计
router.get('/googlemaps/stats', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const stats = await telemetryService.getStats('googlemaps', {
      startTime: startTime ? new Date(startTime as string) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: endTime ? new Date(endTime as string) : new Date(),
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ [Telemetry] Failed to get stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve stats',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
