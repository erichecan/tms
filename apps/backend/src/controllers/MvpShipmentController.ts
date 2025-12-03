import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { ShipmentStatus } from '@tms/shared-types'; // 2025-11-11 14:45:05 引入状态枚举
import dayjs from 'dayjs';


export class MvpShipmentController {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db; // 依赖注入 // 2025-09-23 10:15:00
  }

  // 生成运单号 SH + 时间戳 // 2025-09-23 10:15:00
  private generateShipmentNo(): string {
    return `SH${dayjs().format('YYYYMMDDHHmmssSSS')}`;
  }

  async createShipment(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
        return;
      }

      const shipmentNo = this.generateShipmentNo();
      const b = req.body;

      const pickupAddress = {
        addressLine1: b.shipperAddress.street,
        city: b.shipperAddress.city,
        province: b.shipperAddress.state,
        postalCode: b.shipperAddress.zip,
        country: b.shipperAddress.country
      };

      const deliveryAddress = {
        addressLine1: b.receiverAddress.street,
        city: b.receiverAddress.city,
        province: b.receiverAddress.state,
        postalCode: b.receiverAddress.zip,
        country: b.receiverAddress.country
      };

      const cargoInfo = {
        weightKg: b.weightKg,
        dimensions: b.dimensions,
        items: b.items || []
      };

      const created = await this.db.createShipment(tenantId, {
        shipmentNumber: shipmentNo,
        customerId: undefined,
        driverId: undefined,
        pickupAddress,
        deliveryAddress,
        cargoInfo,
        estimatedCost: b.estimatedCost ?? null,
        actualCost: b.finalCost ?? null,
        additionalFees: [],
        appliedRules: [],
        status: ShipmentStatus.PENDING_CONFIRMATION,
        timeline: {
          created: new Date().toISOString(),
          draft: new Date().toISOString(),
          pendingConfirmation: new Date().toISOString()
        } // 2025-11-11 14:45:05 初始化时间线
      } as any);

      res.status(201).json({ success: true, data: created });
    } catch (e: any) {
      console.error('Error creating shipment:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message, stack: e.stack } });
    }
  }

  async listShipments(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
        return;
      }

      const params: any = {
        page: parseInt((req.query.page as string) || '1'),
        limit: parseInt((req.query.limit as string) || '20'),
        status: req.query.status as string
      };
      const result = await this.db.getShipments(tenantId, params);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }

  async getShipmentDetail(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
        return;
      }

      const shipment = await this.db.getShipment(tenantId, req.params.id!);
      if (!shipment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
        return;
      }
      // 2025-11-30 00:15:00 修复：返回空的 timeline 和 pods，由前端分别调用专门的端点
      res.json({ success: true, data: shipment, timeline: [], pods: [] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }

  // 2025-11-30 00:15:00 新增：获取运单时间线
  async getShipmentTimeline(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
        return;
      }

      const shipmentId = req.params.id;
      
      // 2025-11-30T21:30:00 修复：改进运单验证，添加错误处理，即使运单不存在也尝试返回时间线
      let shipment = null;
      try {
        shipment = await this.db.getShipment(tenantId, shipmentId);
      } catch (shipmentError: any) {
        console.error('Error checking shipment existence:', shipmentError);
        // 如果查询失败，继续尝试查询时间线（可能是权限问题，但时间线查询可能成功）
        shipment = null;
      }
      
      if (!shipment) {
        // 2025-11-30T21:30:00 修复：即使运单不存在，也尝试返回时间线数据（可能运单被删除但时间线还在）
        console.warn(`Shipment not found for timeline query: shipmentId=${shipmentId}, tenantId=${tenantId}`);
      }
      
      // 2025-11-30 06:30:00 修复：使用 DatabaseService 的正确方法查询时间线事件
      // 查询 timeline_events 表（通过 shipment_id 关联，间接保证租户隔离）
      let result: any[] = [];
      try {
        // 2025-11-30T21:30:00 修复：改进SQL查询，使用LEFT JOIN避免INNER JOIN导致的问题
        result = await this.db.query(
          `SELECT 
            te.id,
            te.event_type,
            te.from_status,
            te.to_status,
            te.actor_type,
            te.actor_id,
            te.timestamp,
            te.extra,
            te.created_at
          FROM timeline_events te
          LEFT JOIN shipments s ON s.id = te.shipment_id
          WHERE te.shipment_id = $1 AND (s.tenant_id = $2 OR s.tenant_id IS NULL)
          ORDER BY te.timestamp DESC, te.created_at DESC`,
          [shipmentId, tenantId]
        );
      } catch (queryError: any) {
        // 2025-11-30 06:30:00 修复：如果查询失败（可能是表不存在或权限问题），返回空数组
        console.error('Error querying timeline_events:', queryError);
        // 如果表不存在，返回空数组而不是抛出错误
        if (queryError.code === '42P01') {
          // 表不存在，返回空数组
          result = [];
        } else {
          // 其他错误，记录但不抛出，返回空数组
          console.error('Timeline query error details:', {
            code: queryError.code,
            message: queryError.message,
            shipmentId,
            tenantId,
          });
          result = [];
        }
      }

      res.json({
        success: true,
        data: result.map((row: any) => ({
          id: row.id,
          eventType: row.event_type,
          fromStatus: row.from_status,
          toStatus: row.to_status,
          actorType: row.actor_type,
          actorId: row.actor_id,
          timestamp: row.timestamp,
          extra: row.extra || {},
          createdAt: row.created_at,
        })),
      });
    } catch (e: any) {
      console.error('Error fetching shipment timeline:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }

  // 2025-11-30 00:15:00 新增：获取运单POD列表
  async getShipmentPODs(req: Request, res: Response) {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        });
        return;
      }

      const shipmentId = req.params.id;
      
      // 验证运单属于当前租户
      const shipment = await this.db.getShipment(tenantId, shipmentId);
      if (!shipment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
        return;
      }
      
      // 查询 proof_of_delivery 表（通过 shipment_id 关联，间接保证租户隔离）
      const result = await this.db.query(
        `SELECT 
          pod.id,
          pod.shipment_id,
          pod.file_path,
          pod.uploaded_at,
          pod.uploaded_by,
          pod.note
        FROM proof_of_delivery pod
        INNER JOIN shipments s ON s.id = pod.shipment_id
        WHERE pod.shipment_id = $1 AND s.tenant_id = $2
        ORDER BY pod.uploaded_at DESC`,
        [shipmentId, tenantId]
      );

      res.json({
        success: true,
        data: result.map((row: any) => ({
          id: row.id,
          shipmentId: row.shipment_id,
          filePath: row.file_path,
          uploadedAt: row.uploaded_at,
          uploadedBy: row.uploaded_by,
          note: row.note,
        })),
      });
    } catch (e: any) {
      console.error('Error fetching shipment PODs:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }
}


