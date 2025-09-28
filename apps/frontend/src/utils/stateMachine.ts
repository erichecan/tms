// 状态机工具类 - 符合PRD v3.0-PC设计
// 创建时间: 2025-01-27 15:30:00

import { ShipmentStatus, TripStatus, DriverStatus, VehicleStatus } from '../types';

/**
 * 运单状态机验证
 */
export class ShipmentStateMachine {
  // 合法的状态转换
  private static readonly VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
    [ShipmentStatus.CREATED]: [
      ShipmentStatus.ASSIGNED,
      ShipmentStatus.CANCELED,
      ShipmentStatus.EXCEPTION
    ],
    [ShipmentStatus.ASSIGNED]: [
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.CANCELED,
      ShipmentStatus.EXCEPTION
    ],
    [ShipmentStatus.PICKED_UP]: [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.EXCEPTION
    ],
    [ShipmentStatus.IN_TRANSIT]: [
      ShipmentStatus.DELIVERED,
      ShipmentStatus.EXCEPTION
    ],
    [ShipmentStatus.DELIVERED]: [
      ShipmentStatus.COMPLETED,
      ShipmentStatus.EXCEPTION
    ],
    [ShipmentStatus.COMPLETED]: [], // 终态
    [ShipmentStatus.CANCELED]: [], // 终态
    [ShipmentStatus.EXCEPTION]: [
      ShipmentStatus.ASSIGNED,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.CANCELED
    ]
  };

  /**
   * 验证状态转换是否合法
   */
  static isValidTransition(currentStatus: ShipmentStatus, targetStatus: ShipmentStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    return validTransitions.includes(targetStatus);
  }

  /**
   * 获取下一个可能的状态
   */
  static getNextPossibleStatuses(currentStatus: ShipmentStatus): ShipmentStatus[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * 获取状态流转的下一个状态
   */
  static getNextStatus(currentStatus: ShipmentStatus): ShipmentStatus | null {
    const nextStatuses = this.getNextPossibleStatuses(currentStatus);
    // 返回正常流转的下一个状态（非异常/取消）
    const normalFlow = nextStatuses.find(status => 
      status !== ShipmentStatus.CANCELED && status !== ShipmentStatus.EXCEPTION
    );
    return normalFlow || null;
  }

  /**
   * 检查是否为终态
   */
  static isTerminalStatus(status: ShipmentStatus): boolean {
    return status === ShipmentStatus.COMPLETED || 
           status === ShipmentStatus.CANCELED;
  }

  /**
   * 获取状态显示文本
   */
  static getStatusText(status: ShipmentStatus): string {
    const statusMap: Record<ShipmentStatus, string> = {
      [ShipmentStatus.CREATED]: '已创建',
      [ShipmentStatus.ASSIGNED]: '已分配',
      [ShipmentStatus.PICKED_UP]: '已取货',
      [ShipmentStatus.IN_TRANSIT]: '运输中',
      [ShipmentStatus.DELIVERED]: '已送达',
      [ShipmentStatus.COMPLETED]: '已完成',
      [ShipmentStatus.CANCELED]: '已取消',
      [ShipmentStatus.EXCEPTION]: '异常'
    };
    return statusMap[status] || '未知';
  }

  /**
   * 获取状态颜色
   */
  static getStatusColor(status: ShipmentStatus): string {
    const colorMap: Record<ShipmentStatus, string> = {
      [ShipmentStatus.CREATED]: 'blue',
      [ShipmentStatus.ASSIGNED]: 'purple',
      [ShipmentStatus.PICKED_UP]: 'geekblue',
      [ShipmentStatus.IN_TRANSIT]: 'cyan',
      [ShipmentStatus.DELIVERED]: 'green',
      [ShipmentStatus.COMPLETED]: 'success',
      [ShipmentStatus.CANCELED]: 'red',
      [ShipmentStatus.EXCEPTION]: 'red'
    };
    return colorMap[status] || 'default';
  }
}

/**
 * 行程状态机验证
 */
export class TripStateMachine {
  private static readonly VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
    [TripStatus.PLANNING]: [
      TripStatus.ONGOING,
      TripStatus.CANCELED
    ],
    [TripStatus.ONGOING]: [
      TripStatus.COMPLETED,
      TripStatus.CANCELED
    ],
    [TripStatus.COMPLETED]: [], // 终态
    [TripStatus.CANCELED]: [] // 终态
  };

  static isValidTransition(currentStatus: TripStatus, targetStatus: TripStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    return validTransitions.includes(targetStatus);
  }

  static getNextPossibleStatuses(currentStatus: TripStatus): TripStatus[] {
    return this.VALID_TRANSITIONS[currentStatus] || [];
  }

  static getNextStatus(currentStatus: TripStatus): TripStatus | null {
    const nextStatuses = this.getNextPossibleStatuses(currentStatus);
    const normalFlow = nextStatuses.find(status => status !== TripStatus.CANCELED);
    return normalFlow || null;
  }

  static isTerminalStatus(status: TripStatus): boolean {
    return status === TripStatus.COMPLETED || status === TripStatus.CANCELED;
  }

  static getStatusText(status: TripStatus): string {
    const statusMap: Record<TripStatus, string> = {
      [TripStatus.PLANNING]: '规划中',
      [TripStatus.ONGOING]: '执行中',
      [TripStatus.COMPLETED]: '已完成',
      [TripStatus.CANCELED]: '已取消'
    };
    return statusMap[status] || '未知';
  }

  static getStatusColor(status: TripStatus): string {
    const colorMap: Record<TripStatus, string> = {
      [TripStatus.PLANNING]: 'blue',
      [TripStatus.ONGOING]: 'green',
      [TripStatus.COMPLETED]: 'success',
      [TripStatus.CANCELED]: 'red'
    };
    return colorMap[status] || 'default';
  }
}

/**
 * 司机状态机验证
 */
export class DriverStateMachine {
  private static readonly VALID_TRANSITIONS: Record<DriverStatus, DriverStatus[]> = {
    [DriverStatus.AVAILABLE]: [
      DriverStatus.BUSY,
      DriverStatus.OFFLINE
    ],
    [DriverStatus.BUSY]: [
      DriverStatus.AVAILABLE,
      DriverStatus.OFFLINE
    ],
    [DriverStatus.OFFLINE]: [
      DriverStatus.AVAILABLE
    ]
  };

  static isValidTransition(currentStatus: DriverStatus, targetStatus: DriverStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    return validTransitions.includes(targetStatus);
  }

  static getStatusText(status: DriverStatus): string {
    const statusMap: Record<DriverStatus, string> = {
      [DriverStatus.AVAILABLE]: '空闲',
      [DriverStatus.BUSY]: '忙碌',
      [DriverStatus.OFFLINE]: '离线'
    };
    return statusMap[status] || '未知';
  }

  static getStatusColor(status: DriverStatus): string {
    const colorMap: Record<DriverStatus, string> = {
      [DriverStatus.AVAILABLE]: 'green',
      [DriverStatus.BUSY]: 'red',
      [DriverStatus.OFFLINE]: 'gray'
    };
    return colorMap[status] || 'default';
  }
}

/**
 * 车辆状态机验证
 */
export class VehicleStateMachine {
  private static readonly VALID_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
    [VehicleStatus.AVAILABLE]: [
      VehicleStatus.BUSY,
      VehicleStatus.MAINTENANCE,
      VehicleStatus.OFFLINE
    ],
    [VehicleStatus.BUSY]: [
      VehicleStatus.AVAILABLE,
      VehicleStatus.MAINTENANCE,
      VehicleStatus.OFFLINE
    ],
    [VehicleStatus.MAINTENANCE]: [
      VehicleStatus.AVAILABLE,
      VehicleStatus.OFFLINE
    ],
    [VehicleStatus.OFFLINE]: [
      VehicleStatus.AVAILABLE,
      VehicleStatus.MAINTENANCE
    ]
  };

  static isValidTransition(currentStatus: VehicleStatus, targetStatus: VehicleStatus): boolean {
    const validTransitions = this.VALID_TRANSITIONS[currentStatus];
    return validTransitions.includes(targetStatus);
  }

  static getStatusText(status: VehicleStatus): string {
    const statusMap: Record<VehicleStatus, string> = {
      [VehicleStatus.AVAILABLE]: '可用',
      [VehicleStatus.BUSY]: '忙碌',
      [VehicleStatus.MAINTENANCE]: '维护中',
      [VehicleStatus.OFFLINE]: '离线'
    };
    return statusMap[status] || '未知';
  }

  static getStatusColor(status: VehicleStatus): string {
    const colorMap: Record<VehicleStatus, string> = {
      [VehicleStatus.AVAILABLE]: 'green',
      [VehicleStatus.BUSY]: 'red',
      [VehicleStatus.MAINTENANCE]: 'orange',
      [VehicleStatus.OFFLINE]: 'gray'
    };
    return colorMap[status] || 'default';
  }
}

/**
 * 状态机验证工具
 */
export class StateMachineValidator {
  /**
   * 验证运单状态转换
   */
  static validateShipmentTransition(
    currentStatus: ShipmentStatus, 
    targetStatus: ShipmentStatus,
    hasPOD: boolean = false,
    hasFinalCost: boolean = false
  ): { isValid: boolean; error?: string } {
    // 基础状态转换验证
    if (!ShipmentStateMachine.isValidTransition(currentStatus, targetStatus)) {
      return {
        isValid: false,
        error: `无法从 ${ShipmentStateMachine.getStatusText(currentStatus)} 转换到 ${ShipmentStateMachine.getStatusText(targetStatus)}`
      };
    }

    // 特殊业务规则验证
    if (targetStatus === ShipmentStatus.COMPLETED) {
      if (!hasPOD) {
        return {
          isValid: false,
          error: '完成运单前必须上传至少1张POD图片'
        };
      }
      if (!hasFinalCost) {
        return {
          isValid: false,
          error: '完成运单前必须填写最终费用'
        };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证行程状态转换
   */
  static validateTripTransition(
    currentStatus: TripStatus,
    targetStatus: TripStatus,
    allShipmentsCompleted: boolean = false
  ): { isValid: boolean; error?: string } {
    if (!TripStateMachine.isValidTransition(currentStatus, targetStatus)) {
      return {
        isValid: false,
        error: `无法从 ${TripStateMachine.getStatusText(currentStatus)} 转换到 ${TripStateMachine.getStatusText(targetStatus)}`
      };
    }

    if (targetStatus === TripStatus.COMPLETED && !allShipmentsCompleted) {
      return {
        isValid: false,
        error: '完成行程前所有挂载的运单必须已完成'
      };
    }

    return { isValid: true };
  }

  /**
   * 验证司机状态转换
   */
  static validateDriverTransition(
    currentStatus: DriverStatus,
    targetStatus: DriverStatus
  ): { isValid: boolean; error?: string } {
    if (!DriverStateMachine.isValidTransition(currentStatus, targetStatus)) {
      return {
        isValid: false,
        error: `无法从 ${DriverStateMachine.getStatusText(currentStatus)} 转换到 ${DriverStateMachine.getStatusText(targetStatus)}`
      };
    }

    return { isValid: true };
  }

  /**
   * 验证车辆状态转换
   */
  static validateVehicleTransition(
    currentStatus: VehicleStatus,
    targetStatus: VehicleStatus
  ): { isValid: boolean; error?: string } {
    if (!VehicleStateMachine.isValidTransition(currentStatus, targetStatus)) {
      return {
        isValid: false,
        error: `无法从 ${VehicleStateMachine.getStatusText(currentStatus)} 转换到 ${VehicleStateMachine.getStatusText(targetStatus)}`
      };
    }

    return { isValid: true };
  }
}

/**
 * 状态机工具函数
 */
export const StateMachineUtils = {
  /**
   * 获取运单状态流转进度
   */
  getShipmentProgress(status: ShipmentStatus): number {
    const statusOrder = [
      ShipmentStatus.CREATED,
      ShipmentStatus.ASSIGNED,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.COMPLETED
    ];
    
    const currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) return 0;
    
    return Math.round((currentIndex / (statusOrder.length - 1)) * 100);
  },

  /**
   * 获取运单状态流转步骤
   */
  getShipmentSteps(status: ShipmentStatus): Array<{ title: string; status: 'wait' | 'process' | 'finish' | 'error' }> {
    const steps = [
      { title: '已创建', status: 'wait' as const },
      { title: '已分配', status: 'wait' as const },
      { title: '已取货', status: 'wait' as const },
      { title: '运输中', status: 'wait' as const },
      { title: '已送达', status: 'wait' as const },
      { title: '已完成', status: 'wait' as const }
    ];

    const statusOrder = [
      ShipmentStatus.CREATED,
      ShipmentStatus.ASSIGNED,
      ShipmentStatus.PICKED_UP,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
      ShipmentStatus.COMPLETED
    ];

    const currentIndex = statusOrder.indexOf(status);
    
    if (currentIndex === -1) {
      // 异常状态
      if (status === ShipmentStatus.CANCELED) {
        return steps.map(step => ({ ...step, status: 'error' as const }));
      }
      if (status === ShipmentStatus.EXCEPTION) {
        return steps.map((step, index) => ({
          ...step,
          status: index <= currentIndex ? 'error' as const : 'wait' as const
        }));
      }
      return steps;
    }

    return steps.map((step, index) => {
      if (index < currentIndex) {
        return { ...step, status: 'finish' as const };
      } else if (index === currentIndex) {
        return { ...step, status: 'process' as const };
      } else {
        return { ...step, status: 'wait' as const };
      }
    });
  }
};
