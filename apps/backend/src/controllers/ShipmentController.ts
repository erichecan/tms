// 运单控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { ShipmentService, ShipmentAssignment } from '../services/ShipmentService';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { PricingEngineService } from '../services/PricingEngineService';
import { PricingFinancialIntegration } from '../services/PricingFinancialIntegration'; // 2025-11-11T15:36:41Z Added by Assistant: Financial integration
import { logger } from '../utils/logger';
import { Shipment, QueryParams, ShipmentStatus } from '@tms/shared-types'; // 2025-11-11 14:35:45 引入状态枚举

import { v4 as uuidv4 } from 'uuid';

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  const id = (Array.isArray(requestId) ? requestId[0] : requestId) || uuidv4();
  // 设置到请求对象上，方便后续透传
  (req as any).requestId = id;
  return id;
};

export class ShipmentController {
  private shipmentService: ShipmentService;
  private dbService: DatabaseService;
  private pricingIntegration: PricingFinancialIntegration;
  private ruleEngineService: RuleEngineService; // 2025-12-10T19:00:00Z Added by Assistant: 规则引擎服务

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.dbService = dbService;
    this.ruleEngineService = ruleEngineService; // 2025-12-10T19:00:00Z Added by Assistant: 保存规则引擎服务引用
    this.shipmentService = new ShipmentService(dbService, ruleEngineService);
    const pricingEngineService = new PricingEngineService(dbService);
    this.pricingIntegration = new PricingFinancialIntegration(dbService, pricingEngineService); // 2025-11-11T15:36:41Z Added by Assistant: Instantiate financial integration
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
          requestId: getRequestId(req)
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
          shipmentNumber: req.query.shipmentNumber as string,
          customerPhone: req.query.customerPhone as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        }
      };

      const result = await this.shipmentService.getShipments(tenantId, params);

      res.json({
        ...result,
        requestId: getRequestId(req)
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to get shipments:`, error);
      // 2025-11-30T13:00:00Z Fixed by Assistant: 返回详细错误信息以便调试
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(`[${requestId}] Error details:`, { errorMessage, errorStack });
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get shipments',
          details: errorMessage
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  /**
   * 创建运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async createShipment(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const requestId = getRequestId(req);

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const body = req.body;

      const shipment = await this.dbService.executeTransaction(async (client) => {
        // 如果没有提供customerId，创建一个默认客户 // 2025-09-26 04:00:00
        let customerId = body.customerId;
        if (!customerId) {
          const defaultCustomer = await this.dbService.createCustomer(tenantId, {
            name: body.customerName || 'Default Customer',
            level: 'standard',
            contactInfo: {
              email: body.customerEmail || 'default@example.com',
              phone: body.customerPhone || '0000000000',
              address: {
                street: 'Default Street',
                city: 'Default City',
                state: 'Default State',
                postalCode: '000000',
                country: 'Default Country'
              }
            }
          }, client);
          customerId = defaultCustomer.id;
        }

        const requestedInitialStatus = body.initialStatus as ShipmentStatus | undefined; // 2025-11-11 14:36:40
        const isDraft = body.saveAsDraft === true; // 2025-11-11 14:36:40
        const allowedInitialStatuses: ShipmentStatus[] = [
          ShipmentStatus.DRAFT,
          ShipmentStatus.PENDING_CONFIRMATION,
          ShipmentStatus.CONFIRMED
        ]; // 2025-11-11 14:36:40
        const initialStatus = requestedInitialStatus && allowedInitialStatuses.includes(requestedInitialStatus)
          ? requestedInitialStatus
          : (isDraft ? ShipmentStatus.DRAFT : ShipmentStatus.PENDING_CONFIRMATION); // 2025-11-11 14:36:40

        // 2025-12-10T19:00:00Z Added by Assistant: 处理计费模式和时间段字段
        const pricingMode = body.pricingMode as 'distance-based' | 'time-based' | undefined;
        const useTimeWindow = body.useTimeWindow === true;

        // 处理时间点/时间段
        let pickupAt: Date | undefined;
        let deliveryAt: Date | undefined;
        let pickupWindow: { start: string; end: string } | undefined;
        let deliveryWindow: { start: string; end: string } | undefined;

        if (useTimeWindow) {
          // 使用时间段
          if (body.pickupStart && body.pickupEnd) {
            pickupWindow = {
              start: new Date(body.pickupStart).toISOString(),
              end: new Date(body.pickupEnd).toISOString(),
            };
            if (new Date(body.pickupStart) > new Date(body.pickupEnd)) {
              throw new Error('取货开始时间必须早于结束时间');
            }
          }
          if (body.deliveryStart && body.deliveryEnd) {
            deliveryWindow = {
              start: new Date(body.deliveryStart).toISOString(),
              end: new Date(body.deliveryEnd).toISOString(),
            };
            if (new Date(body.deliveryStart) > new Date(body.deliveryEnd)) {
              throw new Error('送货开始时间必须早于结束时间');
            }
          }
        } else {
          // 使用时间点
          if (body.pickupAt) pickupAt = new Date(body.pickupAt);
          if (body.deliveryAt) deliveryAt = new Date(body.deliveryAt);
        }

        const shipmentData: any = {
          shipmentNumber: body.shipmentNumber || `TMS${Date.now()}`,
          customerId: customerId,
          pickupAddress: {
            street: body.shipper.address.addressLine1,
            city: body.shipper.address.city,
            state: body.shipper.address.province,
            postalCode: body.shipper.address.postalCode,
            country: body.shipper.address.country,
          },
          deliveryAddress: {
            street: body.receiver.address.addressLine1,
            city: body.receiver.address.city,
            state: body.receiver.address.province,
            postalCode: body.receiver.address.postalCode,
            country: body.receiver.address.country,
          },
          shipperName: body.shipper?.name || body.shipperName || null,
          shipperPhone: body.shipper?.phone || body.shipperPhone || null,
          shipper: body.shipper || null,
          receiverName: body.receiver?.name || body.receiverName || null,
          receiverPhone: body.receiver?.phone || body.receiverPhone || null,
          receiver: body.receiver || null,
          pricingMode: pricingMode || 'distance-based',
          pickupAt,
          deliveryAt,
          pickupWindow,
          deliveryWindow,
          cargoInfo: (() => {
            if (body.cargoItems && Array.isArray(body.cargoItems) && body.cargoItems.length > 0) {
              let totalWeight = 0;
              let totalVolume = 0;
              let totalValue = 0;
              let totalQuantity = 0;
              let maxLength = 0;
              let maxWidth = 0;
              let maxHeight = 0;
              let hasDangerous = false;

              body.cargoItems.forEach((item: any) => {
                const quantity = item.quantity || 1;
                const weight = (item.weight || 0) * quantity;
                const length = item.length || 0;
                const width = item.width || 0;
                const height = item.height || 0;
                const volume = (length * width * height / 1000000) * quantity;
                const value = (item.value || 0) * quantity;

                totalWeight += weight;
                totalVolume += volume;
                totalValue += value;
                totalQuantity += quantity;
                maxLength = Math.max(maxLength, length);
                maxWidth = Math.max(maxWidth, width);
                maxHeight = Math.max(maxHeight, height);
                if (item.dangerous) hasDangerous = true;
              });

              return {
                description: body.cargoDescription || '',
                weight: totalWeight,
                volume: totalVolume,
                dimensions: { length: maxLength, width: maxWidth, height: maxHeight },
                value: totalValue,
                quantity: totalQuantity,
                cargoItems: body.cargoItems,
                specialRequirements: body.specialRequirements || [],
                hazardous: body.cargoIsDangerous || hasDangerous
              };
            } else {
              return {
                description: body.cargoDescription || '',
                weight: body.cargoWeight,
                volume: (body.cargoLength || 0) * (body.cargoWidth || 0) * (body.cargoHeight || 0),
                dimensions: { length: body.cargoLength, width: body.cargoWidth, height: body.cargoHeight },
                value: body.cargoValue || 0,
                quantity: body.cargoQuantity || 1,
                specialRequirements: body.specialRequirements || [],
                hazardous: body.cargoIsDangerous || false
              };
            }
          })(),
          estimatedCost: body.estimatedCost,
          status: initialStatus,
          timeline: {} as any
        };


        if (body.driverId) shipmentData.driverId = body.driverId;
        if (body.driverFee) shipmentData.driverFee = body.driverFee;
        if (body.tripId) shipmentData.tripId = body.tripId;

        // 计费分析
        try {
          let pricingResult = null;
          if (pricingMode === 'distance-based') {
            const distanceKm = body.distanceKm || 0;
            if (distanceKm > 0) {
              pricingResult = await this.ruleEngineService.evaluateDistance(tenantId, {
                distanceKm,
                vehicleType: body.vehicleType || 'van',
                regionCode: body.regionCode || 'CA',
                timeWindow: pickupWindow,
                priority: body.priority || 'standard',
              });
            }
          } else if (pricingMode === 'time-based') {
            const serviceMinutes = body.serviceMinutes || 60;
            pricingResult = await this.ruleEngineService.evaluateTime(tenantId, {
              serviceMinutes,
              vehicleType: body.vehicleType || 'van',
              regionCode: body.regionCode || 'CA',
              timeWindow: pickupWindow,
              priority: body.priority || 'standard',
            });
          }

          if (pricingResult && pricingResult.amount > 0) {
            shipmentData.estimatedCost = pricingResult.amount;
            shipmentData.appliedRules = pricingResult.ruleId ? [pricingResult.ruleId] : [];
          }
        } catch (pricingError) {
          logger.warn(`[${requestId}] Pricing calculation failed`, pricingError);
        }

        return await this.shipmentService.createShipment(tenantId, shipmentData, {
          initialStatus,
          client
        });
      });

      // 异步智能调度
      try {
        const { ShipmentProcessingService } = await import('../services/ShipmentProcessingService');
        const processingService = new ShipmentProcessingService(this.dbService);
        processingService.processNewShipment(shipment.id, tenantId)
          .catch(err => logger.error(`[${requestId}] Auto-dispatch failed for ${shipment.id}`, err));
      } catch (err) {
        logger.warn(`[${requestId}] Failed to load ShipmentProcessingService`);
      }

      res.status(201).json({
        success: true,
        data: shipment,
        message: '运单创建成功',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to create shipment:`, error);
      res.status(error instanceof Error && error.message.includes('时间') ? 400 : 500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create shipment'
        },
        timestamp: new Date().toISOString(),
        requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 2025-11-30T21:05:00 如果是司机角色，优先使用司机查询（不依赖租户ID）
      let shipment: Shipment | null = null;

      if (req.user?.role === 'driver' && req.user?.id) {
        // 先尝试通过司机ID直接查询
        shipment = await this.dbService.getShipmentByDriver(shipmentId, req.user.id);

        if (shipment) {
          logger.info(`[${requestId}] Shipment found via driver-specific query: shipmentId=${shipmentId}, driverId=${req.user.id}`);
        } else if (tenantId) {
          // 如果直接查询失败，尝试通过司机运单列表查询
          try {
            const driverShipments = await this.shipmentService.getDriverShipments(tenantId, req.user.id);
            shipment = driverShipments.find(s => s.id === shipmentId) || null;
            if (shipment) {
              logger.info(`[${requestId}] Shipment found via driver shipments list: shipmentId=${shipmentId}, driverId=${req.user.id}`);
            }
          } catch (err) {
            logger.error(`[${requestId}] Failed to get driver shipments as fallback:`, err);
          }
        }
      }

      // 如果还没有找到，使用正常的租户查询
      if (!shipment) {
        shipment = await this.shipmentService.getShipment(tenantId, shipmentId);
        if (shipment) {
          logger.info(`[${requestId}] Shipment found via tenant query: shipmentId=${shipmentId}, tenantId=${tenantId}`);
        }
      }

      if (!shipment) {
        logger.warn(`[${requestId}] Shipment not found: shipmentId=${shipmentId}, tenantId=${tenantId}, userId=${req.user?.id}, role=${req.user?.role}`);
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 2025-11-30T20:20:00 添加司机权限检查：司机只能查看分配给自己的运单
      if (req.user?.role === 'driver' && shipment.driverId !== req.user.id) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Driver can only access own shipments' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      res.json({
        success: true,
        data: shipment,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to get shipment:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment' },
        timestamp: new Date().toISOString(),
        requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
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
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to update shipment:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update shipment' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const assignment: ShipmentAssignment = {
        shipmentId: shipmentId,
        driverId: req.body.driverId,
        vehicleId: req.body.vehicleId, // 2025-10-29 10:25:30 支持车辆指派
        assignedBy: req.user?.id || '',
        notes: req.body.notes
      };

      if (!assignment.driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.assignDriver(tenantId, assignment);

      res.json({
        success: true,
        data: shipment,
        message: 'Driver assigned successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to assign driver:`, error);

      if (error.message.includes('not available')) {
        res.status(400).json({
          success: false,
          error: { code: 'DRIVER_NOT_AVAILABLE', message: 'Driver not available' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment or driver not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('cannot be assigned')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to assign driver' },
          timestamp: new Date().toISOString(),
          requestId
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.confirmShipment(tenantId, shipmentId);

      res.json({
        success: true,
        data: shipment,
        message: 'Shipment confirmed successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to confirm shipment:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('cannot be confirmed')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm shipment' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.startPickup(tenantId, shipmentId, driverId);

      res.json({
        success: true,
        data: shipment,
        message: 'Pickup started successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to start pickup:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be assigned') || error.message.includes('must be scheduled') || error.message.includes('must be confirmed')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to start pickup' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.startTransit(tenantId, shipmentId, driverId);

      res.json({
        success: true,
        data: shipment,
        message: 'Transit started successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to start transit:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be picked up')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start transit' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;
      const deliveryNotes = req.body.deliveryNotes;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.completeDelivery(tenantId, shipmentId, driverId, deliveryNotes);

      res.json({
        success: true,
        data: shipment,
        message: 'Delivery completed successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to complete delivery:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be in transit')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete delivery' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const finalCost = req.body.finalCost;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.completeShipment(tenantId, shipmentId, finalCost);
      const resolvedFinalCost = Number(shipment.actualCost ?? finalCost ?? shipment.estimatedCost ?? 0);

      if (resolvedFinalCost > 0) {
        try {
          await this.pricingIntegration.generateFinancialRecordsOnCompletion(shipmentId, resolvedFinalCost, tenantId);
        } catch (financeError) {
          logger.error(`[${requestId}] Failed to generate financial records on completion`, financeError);
        }
      } // 2025-11-11T15:36:41Z Added by Assistant: Auto-generate receivable/payable records

      res.json({
        success: true,
        data: shipment,
        message: 'Shipment completed successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to complete shipment:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('must be delivered')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete shipment' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const reason = req.body.reason;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cancellation reason is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipment = await this.shipmentService.cancelShipment(tenantId, shipmentId, reason);

      res.json({
        success: true,
        data: shipment,
        message: 'Shipment cancelled successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to cancel shipment:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('cannot be cancelled')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel shipment' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId
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
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to get shipment stats:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment stats' },
        timestamp: new Date().toISOString(),
        requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const requestedDriverId = req.params.driverId;
      const effectiveDriverId = (!requestedDriverId || requestedDriverId === 'me')
        ? req.user?.id
        : requestedDriverId; // 2025-11-11T15:31:42Z Added by Assistant: Support /driver/me shorthand
      const status = req.query.status as string;

      if (!tenantId || !effectiveDriverId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Driver ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (req.user && effectiveDriverId !== req.user.id && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Driver can only access own shipments' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const shipments = await this.shipmentService.getDriverShipments(tenantId, effectiveDriverId, status as any);

      res.json({
        success: true,
        data: shipments,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to get driver shipments:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver shipments' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  /**
   * 删除运单
   * @param req 请求对象
   * @param res 响应对象
   */
  async deleteShipment(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 检查运单是否存在且属于当前租户
      const shipment = await this.dbService.query(
        'SELECT id FROM shipments WHERE id = $1 AND tenant_id = $2',
        [shipmentId, tenantId]
      );

      if (!shipment || shipment.length === 0) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 删除运单相关的定价详情记录
      await this.dbService.query(
        'DELETE FROM shipment_pricing_details WHERE shipment_id = $1',
        [shipmentId]
      );

      // 删除运单
      await this.dbService.query(
        'DELETE FROM shipments WHERE id = $1 AND tenant_id = $2',
        [shipmentId, tenantId]
      );

      res.json({
        success: true,
        message: 'Shipment deleted successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to delete shipment:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete shipment' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }
}
