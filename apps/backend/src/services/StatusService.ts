// 状态机服务（MVP） // 2025-09-23 10:25:00

export type ShipmentStatus = 'created' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'canceled';

const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  created: ['assigned', 'canceled'],
  assigned: ['picked_up', 'canceled'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
  delivered: ['completed'],
  completed: [],
  canceled: []
};

export class StatusService {
  // 校验合法转换 // 2025-09-23 10:25:00
  static canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return allowedTransitions[from]?.includes(to) || false;
  }
}


