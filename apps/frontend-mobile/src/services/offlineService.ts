// 2025-11-30T12:25:00Z Created by Assistant: 离线存储服务
import { Shipment } from '../types';

const OFFLINE_STORAGE_PREFIX = 'offline_';
const SHIPMENTS_CACHE_KEY = `${OFFLINE_STORAGE_PREFIX}shipments`;
const OPERATIONS_QUEUE_KEY = `${OFFLINE_STORAGE_PREFIX}operations`;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时

interface CachedShipments {
  data: Shipment[];
  timestamp: number;
}

interface OfflineOperation {
  id: string;
  type: 'status_update' | 'pod_upload' | 'location_report';
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineService {
  /**
   * 缓存运单列表
   */
  static cacheShipments(shipments: Shipment[]): void {
    try {
      const cache: CachedShipments = {
        data: shipments,
        timestamp: Date.now(),
      };
      localStorage.setItem(SHIPMENTS_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('缓存运单列表失败:', error);
    }
  }

  /**
   * 获取缓存的运单列表
   */
  static getCachedShipments(): Shipment[] | null {
    try {
      const cached = localStorage.getItem(SHIPMENTS_CACHE_KEY);
      if (!cached) return null;

      const cache: CachedShipments = JSON.parse(cached);
      
      // 检查缓存是否过期
      if (Date.now() - cache.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(SHIPMENTS_CACHE_KEY);
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('获取缓存的运单列表失败:', error);
      return null;
    }
  }

  /**
   * 添加离线操作到队列
   */
  static addToQueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retries'>): void {
    try {
      const operations = this.getOperationsQueue();
      const newOperation: OfflineOperation = {
        ...operation,
        id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
      };
      operations.push(newOperation);
      localStorage.setItem(OPERATIONS_QUEUE_KEY, JSON.stringify(operations));
    } catch (error) {
      console.error('添加到操作队列失败:', error);
    }
  }

  /**
   * 获取操作队列
   */
  static getOperationsQueue(): OfflineOperation[] {
    try {
      const queue = localStorage.getItem(OPERATIONS_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('获取操作队列失败:', error);
      return [];
    }
  }

  /**
   * 从队列中移除操作
   */
  static removeFromQueue(operationId: string): void {
    try {
      const operations = this.getOperationsQueue();
      const filtered = operations.filter(op => op.id !== operationId);
      localStorage.setItem(OPERATIONS_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('从队列移除操作失败:', error);
    }
  }

  /**
   * 清空操作队列
   */
  static clearQueue(): void {
    try {
      localStorage.removeItem(OPERATIONS_QUEUE_KEY);
    } catch (error) {
      console.error('清空操作队列失败:', error);
    }
  }

  /**
   * 检查是否有待同步的操作
   */
  static hasPendingOperations(): boolean {
    return this.getOperationsQueue().length > 0;
  }

  /**
   * 清空所有离线缓存
   */
  static clearAllCache(): void {
    try {
      localStorage.removeItem(SHIPMENTS_CACHE_KEY);
      localStorage.removeItem(OPERATIONS_QUEUE_KEY);
    } catch (error) {
      console.error('清空缓存失败:', error);
    }
  }
}

/**
 * 监听网络状态变化，自动同步离线操作
 */
export function setupOfflineSync(): () => void {
  const handleOnline = async () => {
    console.log('网络已恢复，开始同步离线操作...');
    
    const operations = OfflineService.getOperationsQueue();
    if (operations.length === 0) {
      return;
    }

    // 这里可以实现具体的同步逻辑
    // 由于操作类型不同，需要根据实际API调用对应的接口
    // 暂时只清空队列，实际应用中需要实现完整的同步逻辑
    
    // TODO: 实现离线操作同步
    // for (const operation of operations) {
    //   try {
    //     await syncOperation(operation);
    //     OfflineService.removeFromQueue(operation.id);
    //   } catch (error) {
    //     console.error('同步操作失败:', error);
    //     operation.retries++;
    //     if (operation.retries >= 3) {
    //       OfflineService.removeFromQueue(operation.id);
    //     }
    //   }
    // }
  };

  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

