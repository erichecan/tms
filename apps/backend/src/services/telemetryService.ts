// ============================================================================
// Telemetry 服务
// 创建时间: 2025-01-27 15:05:00
// 说明: 处理前端上报的遥测数据，支持批量写入和聚合统计
// ============================================================================

interface TelemetryEvent {
  type: string;
  paramsDigest: string;
  timestamp: number;
  page: string;
  userId?: string;
  traceId: string;
}

interface TelemetryStats {
  total: number;
  byType: Record<string, number>;
  byPage: Record<string, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// 2025-01-27 15:05:00 内存存储（生产环境应使用数据库）
const telemetryStore = new Map<string, TelemetryEvent[]>();

class TelemetryService {
  // 2025-01-27 15:05:00 批量写入事件
  async ingest(source: string, events: TelemetryEvent[]): Promise<void> {
    if (!telemetryStore.has(source)) {
      telemetryStore.set(source, []);
    }

    const store = telemetryStore.get(source)!;
    store.push(...events);

    // 2025-01-27 15:05:00 限制存储大小（保留最近 10000 条）
    if (store.length > 10000) {
      store.splice(0, store.length - 10000);
    }

    console.log(`✅ [Telemetry] Ingested ${events.length} events from ${source}`);
  }

  // 2025-01-27 15:05:00 获取统计信息
  async getStats(
    source: string,
    options: { startTime: Date; endTime: Date }
  ): Promise<TelemetryStats> {
    const store = telemetryStore.get(source) || [];
    
    // 2025-01-27 15:05:00 过滤时间范围
    const filtered = store.filter(
      (event) =>
        event.timestamp >= options.startTime.getTime() &&
        event.timestamp <= options.endTime.getTime()
    );

    // 2025-01-27 15:05:00 按类型统计
    const byType: Record<string, number> = {};
    const byPage: Record<string, number> = {};

    filtered.forEach((event) => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      byPage[event.page] = (byPage[event.page] || 0) + 1;
    });

    return {
      total: filtered.length,
      byType,
      byPage,
      timeRange: {
        start: options.startTime,
        end: options.endTime,
      },
    };
  }

  // 2025-01-27 15:05:00 清除旧数据（保留最近 N 小时）
  async cleanup(hoursToKeep: number = 24): Promise<void> {
    const cutoffTime = Date.now() - hoursToKeep * 60 * 60 * 1000;

    for (const [source, events] of telemetryStore.entries()) {
      const filtered = events.filter((event) => event.timestamp >= cutoffTime);
      telemetryStore.set(source, filtered);
      console.log(`🧹 [Telemetry] Cleaned up ${source}: ${events.length - filtered.length} events removed`);
    }
  }
}

export const telemetryService = new TelemetryService();

// 2025-01-27 15:05:00 定期清理旧数据（每小时）
setInterval(() => {
  telemetryService.cleanup(24).catch((err) => {
    console.error('❌ [Telemetry] Cleanup failed:', err);
  });
}, 60 * 60 * 1000);
