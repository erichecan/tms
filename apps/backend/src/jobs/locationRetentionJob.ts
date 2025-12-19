// 位置轨迹保留清理任务
// 创建时间: 2025-12-19 11:46:00
// 描述: 定期清理 location_tracking 表中超过 7 天的数据（运营端轨迹保留 7 天）

import * as cron from 'node-cron';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export class LocationRetentionJob {
  private dbService: DatabaseService;
  private task: cron.ScheduledTask | null = null;

  constructor() {
    this.dbService = new DatabaseService();
  }

  /**
   * 启动定时清理任务
   * 每天凌晨 03:10 执行一次（避开常见 02:00 批处理高峰） // 2025-12-19 11:46:00
   */
  start(): void {
    this.task = cron.schedule('10 3 * * *', async () => {
      try {
        await this.cleanup();
      } catch (error: any) {
        logger.error('位置轨迹清理任务执行失败:', error);
      }
    });

    logger.info('位置轨迹保留清理任务已启动（每天凌晨 03:10 执行，保留 7 天）');
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('位置轨迹保留清理任务已停止');
    }
  }

  private async cleanup(): Promise<void> {
    // 检查表是否存在，避免部分环境未迁移时报错 // 2025-12-19 11:46:00
    const tableCheck = await this.dbService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'location_tracking'
      ) AS exists;
    `);

    if (!tableCheck?.[0]?.exists) {
      logger.warn('location_tracking 表不存在，跳过位置轨迹清理');
      return;
    }

    const deleted = await this.dbService.query(`
      WITH deleted AS (
        DELETE FROM location_tracking
        WHERE timestamp < NOW() - INTERVAL '7 days'
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count FROM deleted;
    `);

    const count = deleted?.[0]?.count ?? 0;
    logger.info(`位置轨迹清理完成：删除 ${count} 条超过 7 天的轨迹记录`);
  }
}


