import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
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
        status: 'created' as any,
        timeline: { created: new Date().toISOString() }
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
      // TODO: 关联 timeline 与 pod 列表（后续阶段补齐） // 2025-09-23 10:15:00
      res.json({ success: true, data: shipment, timeline: [], pods: [] });
    } catch (e: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }
}


