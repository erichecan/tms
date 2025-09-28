// 状态机服务（MVP） // 2025-09-23 10:25:00

export type ShipmentStatus = 'pending' | 'quoted' | 'confirmed' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled' | 'exception';

const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['quoted', 'confirmed', 'assigned', 'cancelled'],
  quoted: ['confirmed', 'assigned', 'cancelled'],
  confirmed: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'exception'],
  in_transit: ['delivered', 'exception'],
  delivered: ['completed', 'exception'],
  completed: [],
  cancelled: [],
  exception: ['assigned', 'cancelled'] // 异常状态可以重新分配或取消
};

export class StatusService {
  // 校验合法转换 // 2025-09-23 10:25:00
  static canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return allowedTransitions[from]?.includes(to) || false;
  }
}


