// ============================================================================
// Maps Proxy API 测试
// 创建时间: 2025-01-27 17:00:00
// 说明: 测试后端代理端点的正常功能和缓存机制
// ============================================================================

import { describe, it, expect, beforeAll } from '@jest/globals';
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';

describe('Maps Proxy API', () => {
  beforeAll(() => {
    // 2025-01-27 17:00:00 确保有 API Key
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('⚠️ GOOGLE_MAPS_API_KEY not set, skipping tests');
    }
  });

  describe('GET /api/maps/geocode', () => {
    it('应该成功解析地址', async () => {
      const response = await axios.get(`${API_BASE_URL}/maps/geocode`, {
        params: { q: 'Toronto, ON' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('formattedAddress');
      expect(response.data.data).toHaveProperty('latitude');
      expect(response.data.data).toHaveProperty('longitude');
    });

    it('应该对相同地址命中缓存', async () => {
      const address = 'Toronto, ON';
      
      // 第一次调用
      const response1 = await axios.get(`${API_BASE_URL}/maps/geocode`, {
        params: { q: address },
      });

      // 第二次调用应该命中缓存（响应时间应该更快）
      const startTime = Date.now();
      const response2 = await axios.get(`${API_BASE_URL}/maps/geocode`, {
        params: { q: address },
      });
      const duration = Date.now() - startTime;

      expect(response2.status).toBe(200);
      expect(response2.data.data).toEqual(response1.data.data);
      // 缓存命中时响应应该很快（< 100ms）
      expect(duration).toBeLessThan(100);
    });

    it('缺少地址参数时应该返回 400', async () => {
      try {
        await axios.get(`${API_BASE_URL}/maps/geocode`);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.code).toBe('MISSING_ADDRESS');
      }
    });
  });

  describe('GET /api/maps/distance', () => {
    it('应该成功计算两点间距离', async () => {
      const response = await axios.get(`${API_BASE_URL}/maps/distance`, {
        params: {
          origin: 'Toronto, ON',
          destination: 'Ottawa, ON',
          units: 'metric',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distance');
      expect(response.data.data).toHaveProperty('distanceText');
      expect(response.data.data).toHaveProperty('duration');
      expect(response.data.data).toHaveProperty('durationText');
      expect(response.data.data.distance).toBeGreaterThan(0);
    });

    it('应该对相同参数命中缓存', async () => {
      const params = {
        origin: 'Toronto, ON',
        destination: 'Ottawa, ON',
        units: 'metric' as const,
      };
      
      // 第一次调用
      const response1 = await axios.get(`${API_BASE_URL}/maps/distance`, {
        params,
      });

      // 第二次调用应该命中缓存
      const startTime = Date.now();
      const response2 = await axios.get(`${API_BASE_URL}/maps/distance`, {
        params,
      });
      const duration = Date.now() - startTime;

      expect(response2.status).toBe(200);
      expect(response2.data.data).toEqual(response1.data.data);
      expect(duration).toBeLessThan(100);
    });

    it('缺少参数时应该返回 400', async () => {
      try {
        await axios.get(`${API_BASE_URL}/maps/distance`, {
          params: { origin: 'Toronto, ON' }, // 缺少 destination
        });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.code).toBe('MISSING_PARAMETERS');
      }
    });
  });
});
