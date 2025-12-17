// ============================================================================
// 订单距离计算服务
// 创建时间: 2025-01-27 16:45:00
// 说明: 计算仓库/门店地址到客户地址的距离，用于订单创建
// ============================================================================

import axios from 'axios';

// 2025-01-27 16:45:00 API 基础 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface DistanceResult {
  distance: number; // 距离（公里或英里）
  distanceText: string; // 格式化距离文本
  duration: number; // 时长（秒）
  durationText: string; // 格式化时长文本
  status: string;
}

export interface OrderDistanceParams {
  warehouseAddress: string; // 仓库/门店地址
  customerAddress: string; // 客户地址
  units?: 'metric' | 'imperial'; // 单位：metric=公里，imperial=英里
}

/**
 * 计算订单距离（仓库到客户地址）
 * @param params - 包含仓库地址和客户地址
 * @returns 距离信息
 */
export async function calculateOrderDistance(
  params: OrderDistanceParams
): Promise<DistanceResult> {
  const { warehouseAddress, customerAddress, units = 'metric' } = params;

  if (!warehouseAddress || !customerAddress) {
    throw new Error('Warehouse address and customer address are required');
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/maps/distance`, {
      params: {
        origin: warehouseAddress,
        destination: customerAddress,
        units,
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Distance calculation failed');
    }
  } catch (error: any) {
    console.error('❌ [Order Distance] Distance calculation error:', error);
    if (error.response) {
      throw new Error(
        error.response.data?.error || 
        `Distance calculation failed: ${error.response.statusText}`
      );
    }
    throw error;
  }
}

/**
 * 将距离写入订单草稿
 * @param orderId - 订单 ID
 * @param distance - 距离信息
 */
export async function saveOrderDistance(
  orderId: string,
  distance: DistanceResult
): Promise<void> {
  try {
    // 2025-01-27 16:45:00 调用订单 API 更新距离信息
    // 注意：这里需要根据实际的订单 API 调整
    await axios.patch(`${API_BASE_URL}/orders/${orderId}`, {
      distance: distance.distance,
      distanceText: distance.distanceText,
      estimatedDuration: distance.duration,
      estimatedDurationText: distance.durationText,
    });
  } catch (error: any) {
    console.error('❌ [Order Distance] Failed to save distance to order:', error);
    throw error;
  }
}
