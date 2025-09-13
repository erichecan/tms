// 运单控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { ShipmentService, ShipmentAssignment } from '../services/ShipmentService';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { logger } from '../utils/logger';
import { QueryParams } from '../../../packages/shared-types/src/index';

export class ShipmentController {
  private shipmentService: ShipmentService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.shipmentService = new ShipmentService(dbService, ruleEngineService);
  }

  /**
   * 获取运单列表
   * @param req 请求对象
   * @param res 响应对象
   */
  async getShipments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const params: QueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        filters: {
          status: req.query.status as string,
          customerId: req.query.customerId as string,
          driverId: req.query.driverId as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        }
      };

      const result = await this.shipmentService.getShipments(tenantId, params);
      
      res.json({
        ...result,
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to get shipments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipments' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }

  /**
   * 获取单个运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async getShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.getShipment(tenantId, shipmentId);
      
      if (!shipment) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      res.json({
        success: true,
        data: shipment,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to get shipment:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }

  /**
   * 更新运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async updateShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const updates = req.body;
      const shipment = await this.shipmentService.updateShipment(tenantId, shipmentId, updates);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment updated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to update shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update shipment' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 分配司机
   * @param req 请求对象
   * @param res 响应对象
   */
  async assignDriver(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const assignment: ShipmentAssignment = {
        shipmentId: req.params.id,
        driverId: req.body.driverId,
        assignedBy: req.user?.id || '',
        notes: req.body.notes
      };

      if (!assignment.driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.assignDriver(tenantId, assignment);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Driver assigned successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to assign driver:', error);
      
      if (error.message.includes('not available')) {
        res.status(400).json({
          success: false,
          error: { code: 'DRIVER_NOT_AVAILABLE', message: 'Driver not available' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment or driver not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('cannot be assigned')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to assign driver' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 确认运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async confirmShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.confirmShipment(tenantId, shipmentId);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment confirmed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to confirm shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('cannot be confirmed')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm shipment' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 开始取货
   * @param req 请求对象
   * @param res 响应对象
   */
  async startPickup(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.startPickup(tenantId, shipmentId, driverId);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Pickup started successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to start pickup:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be assigned')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start pickup' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 开始运输
   * @param req 请求对象
   * @param res 响应对象
   */
  async startTransit(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.startTransit(tenantId, shipmentId, driverId);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Transit started successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to start transit:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be picked up')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start transit' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 完成配送
   * @param req 请求对象
   * @param res 响应对象
   */
  async completeDelivery(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;
      const deliveryNotes = req.body.deliveryNotes;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.completeDelivery(tenantId, shipmentId, driverId, deliveryNotes);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Delivery completed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to complete delivery:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be in transit')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete delivery' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 完成运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async completeShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const finalCost = req.body.finalCost;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.completeShipment(tenantId, shipmentId, finalCost);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment completed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to complete shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('must be delivered')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete shipment' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 取消运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async cancelShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const reason = req.body.reason;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cancellation reason is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.shipmentService.cancelShipment(tenantId, shipmentId, reason);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment cancelled successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to cancel shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else if (error.message.includes('cannot be cancelled')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel shipment' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 获取运单统计
   * @param req 请求对象
   * @param res 响应对象
   */
  async getShipmentStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.shipmentService.getShipmentStats(tenantId, startDate, endDate);
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to get shipment stats:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment stats' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }

  /**
   * 获取司机运单列表
   * @param req 请求对象
   * @param res 响应对象
   */
  async getDriverShipments(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const driverId = req.params.driverId;
      const status = req.query.status as string;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipments = await this.shipmentService.getDriverShipments(tenantId, driverId, status as any);
      
      res.json({
        success: true,
        data: shipments,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to get driver shipments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver shipments' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
}
