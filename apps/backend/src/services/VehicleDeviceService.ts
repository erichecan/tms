// 车辆设备管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface VehicleDevice {
  id: string;
  vehicleId: string;
  tenantId: string;
  deviceType: 'gps' | 'obd' | 'temp_sensor' | 'tire_pressure' | 'camera' | 'other';
  deviceSerial: string;
  deviceModel?: string;
  manufacturer?: string;
  installDate?: Date | string;
  lastMaintenanceDate?: Date | string;
  status: 'active' | 'inactive' | 'maintenance' | 'replaced';
  batteryLevel?: number;
  lastSignalTime?: Date | string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateVehicleDeviceInput {
  vehicleId: string;
  deviceType: 'gps' | 'obd' | 'temp_sensor' | 'tire_pressure' | 'camera' | 'other';
  deviceSerial: string;
  deviceModel?: string;
  manufacturer?: string;
  installDate?: Date | string;
  lastMaintenanceDate?: Date | string;
  status?: 'active' | 'inactive' | 'maintenance' | 'replaced';
  batteryLevel?: number;
  lastSignalTime?: Date | string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateVehicleDeviceInput {
  deviceType?: 'gps' | 'obd' | 'temp_sensor' | 'tire_pressure' | 'camera' | 'other';
  deviceSerial?: string;
  deviceModel?: string;
  manufacturer?: string;
  installDate?: Date | string;
  lastMaintenanceDate?: Date | string;
  status?: 'active' | 'inactive' | 'maintenance' | 'replaced';
  batteryLevel?: number;
  lastSignalTime?: Date | string;
  notes?: string;
  updatedBy?: string;
}

export class VehicleDeviceService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建设备绑定
   */
  async createDevice(
    tenantId: string,
    input: CreateVehicleDeviceInput
  ): Promise<VehicleDevice> {
    try {
      // 检查设备序列号是否已存在
      const existing = await this.dbService.query(
        'SELECT id FROM vehicle_devices WHERE tenant_id = $1 AND device_serial = $2',
        [tenantId, input.deviceSerial]
      );

      if (existing.length > 0) {
        throw new Error(`设备序列号 "${input.deviceSerial}" 已存在`);
      }

      const query = `
        INSERT INTO vehicle_devices (
          vehicle_id, tenant_id, device_type, device_serial, device_model,
          manufacturer, install_date, last_maintenance_date, status,
          battery_level, last_signal_time, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.deviceType,
        input.deviceSerial,
        input.deviceModel || null,
        input.manufacturer || null,
        input.installDate || null,
        input.lastMaintenanceDate || null,
        input.status || 'active',
        input.batteryLevel || null,
        input.lastSignalTime || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapDeviceFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create vehicle device:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有设备
   */
  async getDevicesByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<VehicleDevice[]> {
    try {
      const query = `
        SELECT * FROM vehicle_devices
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY device_type, created_at DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapDeviceFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get vehicle devices:', error);
      throw error;
    }
  }

  /**
   * 根据设备类型获取设备
   */
  async getDevicesByType(
    tenantId: string,
    deviceType: 'gps' | 'obd' | 'temp_sensor' | 'tire_pressure' | 'camera' | 'other'
  ): Promise<VehicleDevice[]> {
    try {
      const query = `
        SELECT vd.*, v.plate_number, v.type as vehicle_type
        FROM vehicle_devices vd
        JOIN vehicles v ON vd.vehicle_id = v.id
        WHERE vd.tenant_id = $1 AND vd.device_type = $2
        ORDER BY vd.status, vd.created_at DESC
      `;

      const result = await this.dbService.query(query, [tenantId, deviceType]);
      return result.map(row => this.mapDeviceFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get devices by type:', error);
      throw error;
    }
  }

  /**
   * 更新设备信息
   */
  async updateDevice(
    tenantId: string,
    deviceId: string,
    input: UpdateVehicleDeviceInput
  ): Promise<VehicleDevice> {
    try {
      // 如果更新设备序列号，检查是否冲突
      if (input.deviceSerial !== undefined) {
        const existing = await this.dbService.query(
          'SELECT id FROM vehicle_devices WHERE tenant_id = $1 AND device_serial = $2 AND id != $3',
          [tenantId, input.deviceSerial, deviceId]
        );

        if (existing.length > 0) {
          throw new Error(`设备序列号 "${input.deviceSerial}" 已被其他设备使用`);
        }
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.deviceType !== undefined) {
        updateFields.push(`device_type = $${paramIndex++}`);
        values.push(input.deviceType);
      }
      if (input.deviceSerial !== undefined) {
        updateFields.push(`device_serial = $${paramIndex++}`);
        values.push(input.deviceSerial);
      }
      if (input.deviceModel !== undefined) {
        updateFields.push(`device_model = $${paramIndex++}`);
        values.push(input.deviceModel || null);
      }
      if (input.manufacturer !== undefined) {
        updateFields.push(`manufacturer = $${paramIndex++}`);
        values.push(input.manufacturer || null);
      }
      if (input.installDate !== undefined) {
        updateFields.push(`install_date = $${paramIndex++}`);
        values.push(input.installDate || null);
      }
      if (input.lastMaintenanceDate !== undefined) {
        updateFields.push(`last_maintenance_date = $${paramIndex++}`);
        values.push(input.lastMaintenanceDate || null);
      }
      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.batteryLevel !== undefined) {
        updateFields.push(`battery_level = $${paramIndex++}`);
        values.push(input.batteryLevel || null);
      }
      if (input.lastSignalTime !== undefined) {
        updateFields.push(`last_signal_time = $${paramIndex++}`);
        values.push(input.lastSignalTime || null);
      }
      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes || null);
      }
      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy || null);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(tenantId, deviceId);

      const query = `
        UPDATE vehicle_devices
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Device not found');
      }

      return this.mapDeviceFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update vehicle device:', error);
      throw error;
    }
  }

  /**
   * 删除设备
   */
  async deleteDevice(
    tenantId: string,
    deviceId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM vehicle_devices
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, deviceId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete vehicle device:', error);
      throw error;
    }
  }

  /**
   * 更新设备信号时间
   */
  async updateLastSignalTime(
    tenantId: string,
    deviceId: string,
    signalTime?: Date | string
  ): Promise<VehicleDevice> {
    try {
      const query = `
        UPDATE vehicle_devices
        SET last_signal_time = $1, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $2 AND id = $3
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        signalTime || new Date(),
        tenantId,
        deviceId
      ]);

      if (result.length === 0) {
        throw new Error('Device not found');
      }

      return this.mapDeviceFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update device signal time:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapDeviceFromDb(row: any): VehicleDevice {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      deviceType: row.device_type,
      deviceSerial: row.device_serial,
      deviceModel: row.device_model,
      manufacturer: row.manufacturer,
      installDate: row.install_date,
      lastMaintenanceDate: row.last_maintenance_date,
      status: row.status,
      batteryLevel: row.battery_level,
      lastSignalTime: row.last_signal_time,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

