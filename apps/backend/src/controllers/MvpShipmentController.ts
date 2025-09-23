import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

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
      const shipmentNo = this.generateShipmentNo();
      const b = req.body;

      const pickupAddress = {
        addressLine1: b.shipperAddress.addressLine1,
        city: b.shipperAddress.city,
        province: b.shipperAddress.province,
        postalCode: b.shipperAddress.postalCode,
        country: b.shipperAddress.country
      };

      const deliveryAddress = {
        addressLine1: b.receiverAddress.addressLine1,
        city: b.receiverAddress.city,
        province: b.receiverAddress.province,
        postalCode: b.receiverAddress.postalCode,
        country: b.receiverAddress.country
      };

      const cargoInfo = {
        weightKg: b.weightKg,
        dimensions: b.dimensions,
        items: b.items || []
      };

      const created = await this.db.createShipment(req.tenant?.id || '00000000-0000-0000-0000-000000000001', {
        shipmentNumber: shipmentNo,
        customerId: null as any,
        driverId: null as any,
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
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }

  async listShipments(req: Request, res: Response) {
    try {
      const params: any = {
        page: parseInt((req.query.page as string) || '1'),
        limit: parseInt((req.query.limit as string) || '20'),
        status: req.query.status as string
      };
      const result = await this.db.getShipments(req.tenant?.id || '00000000-0000-0000-0000-000000000001', params);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }

  async getShipmentDetail(req: Request, res: Response) {
    try {
      const shipment = await this.db.getShipment(req.tenant?.id || '00000000-0000-0000-0000-000000000001', req.params.id);
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


