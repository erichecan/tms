// ============================================================================
// Order Distance 服务单元测试
// 创建时间: 2025-01-27 17:10:00
// 说明: 测试距离计算和单位换算功能
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { calculateOrderDistance, saveOrderDistance } from '../../apps/frontend/src/services/orderDistance';

// 2025-01-27 17:10:00 Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('Order Distance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateOrderDistance', () => {
    it('应该成功计算距离（公制）', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            distance: 450.5,
            distanceText: '451 km',
            duration: 18000,
            durationText: '5 hours',
            status: 'OK',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await calculateOrderDistance({
        warehouseAddress: 'Toronto, ON',
        customerAddress: 'Ottawa, ON',
        units: 'metric',
      });

      expect(result.distance).toBe(450.5);
      expect(result.distanceText).toBe('451 km');
      expect(result.duration).toBe(18000);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/maps/distance'),
        expect.objectContaining({
          params: {
            origin: 'Toronto, ON',
            destination: 'Ottawa, ON',
            units: 'metric',
          },
        })
      );
    });

    it('应该成功计算距离（英制）', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            distance: 279.7, // 英里
            distanceText: '280 mi',
            duration: 18000,
            durationText: '5 hours',
            status: 'OK',
          },
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await calculateOrderDistance({
        warehouseAddress: 'Toronto, ON',
        customerAddress: 'Ottawa, ON',
        units: 'imperial',
      });

      expect(result.distance).toBe(279.7);
      expect(result.distanceText).toBe('280 mi');
    });

    it('缺少地址时应该抛出错误', async () => {
      await expect(
        calculateOrderDistance({
          warehouseAddress: '',
          customerAddress: 'Ottawa, ON',
        })
      ).rejects.toThrow('Warehouse address and customer address are required');
    });

    it('API 错误时应该抛出错误', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 500,
          data: { error: 'Distance calculation failed' },
        },
      });

      await expect(
        calculateOrderDistance({
          warehouseAddress: 'Toronto, ON',
          customerAddress: 'Ottawa, ON',
        })
      ).rejects.toThrow('Distance calculation failed');
    });
  });

  describe('saveOrderDistance', () => {
    it('应该成功保存距离到订单', async () => {
      const mockResponse = {
        data: { success: true },
      };

      mockedAxios.patch.mockResolvedValue(mockResponse);

      await saveOrderDistance('order-123', {
        distance: 450.5,
        distanceText: '451 km',
        duration: 18000,
        durationText: '5 hours',
        status: 'OK',
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/api/orders/order-123'),
        expect.objectContaining({
          distance: 450.5,
          distanceText: '451 km',
          estimatedDuration: 18000,
          estimatedDurationText: '5 hours',
        })
      );
    });
  });
});
