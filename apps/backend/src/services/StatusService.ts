import { ShipmentStatus } from '@tms/shared-types'; // 2025-11-11 14:38:05 引入统一类型

const allowedTransitions: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.DRAFT]: [ShipmentStatus.PENDING_CONFIRMATION, ShipmentStatus.CANCELLED], // 2025-11-11 14:38:05 状态流转
  [ShipmentStatus.PENDING_CONFIRMATION]: [ShipmentStatus.CONFIRMED, ShipmentStatus.CANCELLED], // 2025-11-11 14:38:05
  [ShipmentStatus.CONFIRMED]: [ShipmentStatus.SCHEDULED, ShipmentStatus.CANCELLED], // 2025-11-11 14:38:05
  [ShipmentStatus.SCHEDULED]: [ShipmentStatus.PICKUP_IN_PROGRESS, ShipmentStatus.CANCELLED, ShipmentStatus.EXCEPTION], // 2025-11-11 14:38:05
  [ShipmentStatus.PICKUP_IN_PROGRESS]: [ShipmentStatus.IN_TRANSIT, ShipmentStatus.EXCEPTION], // 2025-11-11 14:38:05
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.DELIVERED, ShipmentStatus.EXCEPTION], // 2025-11-11 14:38:05
  [ShipmentStatus.DELIVERED]: [ShipmentStatus.POD_PENDING_REVIEW, ShipmentStatus.COMPLETED, ShipmentStatus.EXCEPTION], // 2025-11-11 14:38:05
  [ShipmentStatus.POD_PENDING_REVIEW]: [ShipmentStatus.COMPLETED, ShipmentStatus.EXCEPTION], // 2025-11-11 14:38:05
  [ShipmentStatus.COMPLETED]: [], // 2025-11-11 14:38:05
  [ShipmentStatus.CANCELLED]: [], // 2025-11-11 14:38:05
  [ShipmentStatus.EXCEPTION]: [ShipmentStatus.SCHEDULED, ShipmentStatus.CANCELLED] // 2025-11-11 14:38:05
};

export class StatusService {
  // 校验合法转换 // 2025-09-23 10:25:00
  static canTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
    return allowedTransitions[from]?.includes(to) || false;
  }
}


