// 调度优化定时任务
// 创建时间: 2025-10-02 19:20:00
// 作用: 定时执行批量运单优化，确保所有待分配运单都得到处理

import cron from 'node-cron';
import { DatabaseService } from '../services/DatabaseService';
import { ShipmentProcessingService } from '../services/ShipmentProcessingService';
import { logger } from '../utils/logger';

class DispatchOptimizationJob {
  private dbService: DatabaseService;
  private processingService: ShipmentProcessingService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.dbService = new DatabaseService();
    this.processingService = new ShipmentProcessingService(this.dbService);
  }

  /**
   * 启动定时任务
   * 每10分钟执行一次批量运单优化
   */
  public start(): void {
    // 0 */10 * * * * - 每10分钟执行一次
    this.cronJob = cron.schedule('0 */10 * * * *', async () => {
      await this.runBatchOptimization();
    }, {
      scheduled: false, // 手动启动
      timezone: 'Asia/Shanghai'
    });

    this.cronJob.start();
    logger.info('🕐 调度优化定时任务已启动 (每10分钟执行一次)');
  }

  /**
   * 停止定时任务
   */
  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('🛑 调度优化定时任务已停止');
    }
  }

  /**
   * 执行批量优化
   */
  private async runBatchOptimization(): Promise<void> {
    try {
      logger.info('🔄 开始执行定时批量运单优化...');

      // 获取所有租户
      const tenants = await this.dbService.query('SELECT id FROM tenants WHERE status = \'active\'');
      
      let totalProcessed = 0;
      let totalOptimized = 0;

      for (const tenant of tenants) {
        const tenantId = tenant.id;
        
        try {
          // 记录优化前的状态
          const beforeStats = await this.getOptimizationStats(tenantId);
          
          // 执行批量处理
          await this.processingService.processPendingShipments(tenantId);
          
          // 记录优化后的状态
          const afterStats = await this.getOptimizationStats(tenantId);
          
          const processed = afterStats.pending - beforeStats.pending;
          totalProcessed += Math.abs(processed);
          totalOptimized += afterStats.assigned;

          logger.info(`租户 ${tenantId} 优化完成:`, {
            处理运单: Math.abs(processed),
            已分配: afterStats.assigned,
            待处理: afterStats.pending,
          });

        } catch (error) {
          logger.error(`租户 ${tenantId} 批量优化失败: ${error.message}`);
        }
      }

      logger.info(`📊 批量优化完成: 处理了 ${totalProcessed} 个运单，优化了 ${totalOptimized} 个分配`);

      // 更新系统指标
      await this.updateOptimizationMetrics(totalProcessed, totalOptimized);

    } catch (error) {
      logger.error(`批量优化任务失败: ${error.message}`);
    }
  }

  /**
   * 获取优化统计
   */
  private async getOptimizationStats(tenantId: string): Promise<{
    pending: number;
    assigned: number;
    completed: number;
  }> {
    const result = await this.dbService.query(`
      SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM shipments 
      WHERE tenant_id = $1
    `, [tenantId]);

    return result[0] || { pending: 0, assigned: 0, completed: 0 };
  }

  /**
   * 更新优化指标
   */
  private async updateOptimizationMetrics(processed: number, optimized: number): Promise<void> {
    try {
      await this.dbService.query(`
        INSERT INTO optimization_metrics (
          date,
          processed_shipments,
          optimized_assignments,
          success_rate,
          created_at
        ) VALUES (
          CURRENT_DATE,
          $1,
          $2,
          $3,
          NOW()
        )
        ON CONFLICT (date) DO UPDATE SET
          processed_shipments + EXCLUDED.processed_shipments,
          optimized_assignments = optimization_metrics.optimized_assignments + EXCLUDED.optimized_assignments,
          success_rate = CASE 
            WHEN optimization_metrics.processed_shipments + EXCLUDED.processed_shipments > 0 
            THEN (optimization_metrics.optimized_assignments + EXCLUDED.optimized_assignments)::FLOAT / (optimization_metrics.processed_shipments + EXCLUDED.processed_shipments)::FLOAT
            ELSE 0 
          END,
          updated_at = NOW()
      `, [
        processed,
        optimized,
        processed > 0 ? (optimized / processed) : 0,
      ]);
    } catch (error) {
      // 如果表格不存在，忽略错误
      logger.debug('优化指标表不存在，跳过指标更新');
    }
  }

  /**
   * 手动触发批量优化（用于测试）
   */
  public async runManualOptimization(): Promise<void> {
    logger.info('🔧 手动触发批量优化...');
    await this.runBatchOptimization();
  }

  /**
   * 获取任务状态
   */
  public getStatus(): { running: boolean; nextRun?: Date } {
    return {
      running: this.cronJob?.getStatus() === 'scheduled',
      nextRun: this.cronJob ? (this.cronJob as any).nextDate() : undefined,
    };
  }
}

// 单例模式
let instance: DispatchOptimizationJob | null = null;

export const getDispatchOptimizationJob = (): DispatchOptimizationJob => {
  if (!instance) {
    instance = new DispatchOptimizationJob();
  }
  return instance;
};

export default DispatchOptimizationJob;
