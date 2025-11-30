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

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  return (Array.isArray(requestId) ? requestId[0] : requestId) || '';
};

export class ShipmentController {
  private shipmentService: ShipmentService;
  private dbService: DatabaseService;
  private pricingIntegration: PricingFinancialIntegration;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.dbService = dbService;
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
      logger.error('Failed to get shipments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipments' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
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
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const body = req.body;
      
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
        });
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

      // 2025-11-30 02:10:00 修复：提取发货人和收货人信息，确保BOL显示完整数据
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
        // 发货人信息（用于BOL显示）
        shipperName: body.shipper?.name || body.shipperName || null,
        shipperPhone: body.shipper?.phone || body.shipperPhone || null,
        shipper: body.shipper || null,
        // 收货人信息（用于BOL显示）
        receiverName: body.receiver?.name || body.receiverName || null,
        receiverPhone: body.receiver?.phone || body.receiverPhone || null,
        receiver: body.receiver || null,
        cargoInfo: (() => {
          // 2025-11-29T22:05:00 修复：支持多行货物数据（cargoItems）
          if (body.cargoItems && Array.isArray(body.cargoItems) && body.cargoItems.length > 0) {
            // 多行货物模式：计算总重量、总体积等
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
              const volume = (length * width * height / 1000000) * quantity; // 转换为立方米
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
              dimensions: {
                length: maxLength,
                width: maxWidth,
                height: maxHeight
              },
              value: totalValue,
              quantity: totalQuantity,
              cargoItems: body.cargoItems, // 保留原始多行数据
              specialRequirements: body.specialRequirements || [],
              hazardous: body.cargoIsDangerous || hasDangerous
            };
          } else {
            // 单行货物模式（兼容旧代码）
            return {
              description: body.cargoDescription || '',
              weight: body.cargoWeight,
              volume: (body.cargoLength || 0) * (body.cargoWidth || 0) * (body.cargoHeight || 0),
              dimensions: {
                length: body.cargoLength,
                width: body.cargoWidth,
                height: body.cargoHeight
              },
              value: body.cargoValue || 0,
              quantity: body.cargoQuantity || 1,
              specialRequirements: body.specialRequirements || [],
              hazardous: body.cargoIsDangerous || false
            };
          }
        })(),
        estimatedCost: body.estimatedCost,
        additionalFees: [],
        appliedRules: [],
        status: initialStatus,
        timeline: {} as any // 2025-11-11 14:36:40 占位，实际由服务重建
      };

      if (body.driverId) {
        shipmentData.driverId = body.driverId;
      }

      console.log('Creating shipment with data:', JSON.stringify(shipmentData, null, 2));
      // 计费：在创建前同步触发计费规则引擎并落库 // 2025-10-06 00:12:30
      try {
        const { PricingEngineService } = await import('../services/PricingEngineService');
        const pricingEngine = new PricingEngineService(this.dbService);

        // 构建计费上下文（简化版） // 2025-10-06 00:12:30
        const shipmentContext: any = {
          shipmentId: undefined,
          pickupAddress: shipmentData.pickupAddress,
          deliveryAddress: shipmentData.deliveryAddress,
          cargoInfo: shipmentData.cargoInfo,
          customerId: shipmentData.customerId,
          requestedServices: body.requestedServices || [],
          scheduledAt: body.pickupTime || new Date().toISOString(),
        };

        // 默认模板回退 // 2025-10-06 00:12:30
        let calculation = null as any;
        try {
          calculation = await pricingEngine.calculatePricing(shipmentContext);
        } catch (err: any) {
          // 如果未匹配上模板，使用默认模板ID（例如由环境变量或约定ID提供） // 2025-10-06 00:12:30
          const defaultTemplateId = process.env.DEFAULT_PRICING_TEMPLATE_ID || undefined;
          calculation = await pricingEngine.calculatePricing(shipmentContext, defaultTemplateId);
        }

        if (calculation) {
          shipmentData.estimatedCost = calculation.totalRevenue ?? shipmentData.estimatedCost;
          shipmentData.appliedRules = calculation.appliedRules ?? [];
          // 可选：把分项明细写入扩展表由服务处理，这里只落核心字段 // 2025-10-06 00:12:30
        }
      } catch (pricingError) {
        logger.warn('创建运单前计费失败，继续持久化但estimatedCost可能为空', pricingError);
      }

      const shipment = await this.shipmentService.createShipment(tenantId, shipmentData, {
        initialStatus
      }); // 2025-11-11 14:36:40 传递初始状态
      
      // 🚀 核心功能：运单创建后自动触发智能调度优化引擎
      // 这里集成了完整的车辆调度优化系统：
      // 1. 🗺️ 路线规划算法 (Google Maps)
      // 2. ⚡ 最短路径计算 (Directions API)
      // 3. 🚛 车辆调度优化 (智能分配算法)
      try {
        const { ShipmentProcessingService } = await import('../services/ShipmentProcessingService');
        const processingService = new ShipmentProcessingService(this.dbService);
        
        // 异步执行智能调度，不阻塞响应
        processingService.processNewShipment(shipment.id, tenantId)
          .then(result => {
            logger.info(`智能调度完成 (${shipment.id}):`, result.message);
          })
          .catch(error => {
            logger.error(`智能调度失败 (${shipment.id}): ${error.message}`);
          });
      } catch (error) {
        logger.warn('智能调度服务加载失败，不影响运单创建');
      }
      
      res.status(201).json({
        success: true,
        data: shipment,
        message: '运单创建成功，智能调度正在优化车辆分配...',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      console.error('Failed to create shipment:', error);
      logger.error('Failed to create shipment:', error);
      res.status(500).json({
        success: false,
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to create shipment',
          details: error instanceof Error ? error.stack : error
        },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.getShipment(tenantId, shipmentId);
      
      if (!shipment) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      res.json({
        success: true,
        data: shipment,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get shipment:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to update shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update shipment' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.assignDriver(tenantId, assignment);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Driver assigned successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to assign driver:', error);
      
      if (error.message.includes('not available')) {
        res.status(400).json({
          success: false,
          error: { code: 'DRIVER_NOT_AVAILABLE', message: 'Driver not available' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment or driver not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('cannot be assigned')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to assign driver' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;
      const driverId = req.body.driverId || req.user?.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.startPickup(tenantId, shipmentId, driverId);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Pickup started successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to start pickup:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be assigned')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start pickup' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.startTransit(tenantId, shipmentId, driverId);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Transit started successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to start transit:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be picked up')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to start transit' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Driver ID is required' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.completeDelivery(tenantId, shipmentId, driverId, deliveryNotes);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Delivery completed successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to complete delivery:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('not assigned') || error.message.includes('must be in transit')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete delivery' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.completeShipment(tenantId, shipmentId, finalCost);
      const resolvedFinalCost = Number(shipment.actualCost ?? finalCost ?? shipment.estimatedCost ?? 0);

      if (resolvedFinalCost > 0) {
        try {
          await this.pricingIntegration.generateFinancialRecordsOnCompletion(shipmentId, resolvedFinalCost);
        } catch (financeError) {
          logger.error('Failed to generate financial records on completion', financeError);
        }
      } // 2025-11-11T15:36:41Z Added by Assistant: Auto-generate receivable/payable records
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment completed successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to complete shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('must be delivered')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to complete shipment' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cancellation reason is required' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipment = await this.shipmentService.cancelShipment(tenantId, shipmentId, reason);
      
      res.json({
        success: true,
        data: shipment,
        message: 'Shipment cancelled successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to cancel shipment:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('cannot be cancelled')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel shipment' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
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
          requestId: getRequestId(req)
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
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get shipment stats:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get shipment stats' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
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
          requestId: getRequestId(req)
        });
        return;
      }

      if (req.user && effectiveDriverId !== req.user.id && req.user.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Driver can only access own shipments' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const shipments = await this.shipmentService.getDriverShipments(tenantId, effectiveDriverId, status as any);
      
      res.json({
        success: true,
        data: shipments,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get driver shipments:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver shipments' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
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
          requestId: getRequestId(req)
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
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to delete shipment:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete shipment' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }
}
