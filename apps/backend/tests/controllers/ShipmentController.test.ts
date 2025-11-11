// 运单控制器测试
// 创建时间: 2025-01-27 15:31:15

import { Request, Response } from 'express';
import { ShipmentController } from '../../src/controllers/ShipmentController';
import { ShipmentService } from '../../src/services/ShipmentService';
import { Shipment, CreateShipmentRequest, UpdateShipmentRequest, ShipmentStatus } from '@tms/shared-types'; // 2025-11-11 14:42:30 更新导入

// Mock运单服务
jest.mock('../../src/services/ShipmentService');

describe('ShipmentController', () => {
  let shipmentController: ShipmentController;
  let mockShipmentService: jest.Mocked<ShipmentService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockShipmentService = new ShipmentService() as jest.Mocked<ShipmentService>;
    shipmentController = new ShipmentController(mockShipmentService);

    mockRequest = {
      body: {},
      params: {},
      headers: { 'x-request-id': 'test-request-id' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should create a shipment successfully', async () => {
      const createRequest: CreateShipmentRequest = {
        customerId: 'customer-id',
        driverId: 'driver-id',
        pickupAddress: {
          street: '123 Main St',
          city: 'Shanghai',
          state: 'Shanghai',
          zipCode: '200000',
          country: 'China'
        },
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Beijing',
          state: 'Beijing',
          zipCode: '100000',
          country: 'China'
        },
        cargoInfo: {
          weight: 1000,
          volume: 2.5,
          type: 'general',
          description: 'Test cargo'
        },
        estimatedCost: 500,
        notes: 'Test shipment'
      };

      const createdShipment: Shipment = {
        id: 'shipment-id',
        tenantId: 'tenant-id',
        shipmentNumber: 'SH-2025-001',
        customerId: 'customer-id',
        driverId: 'driver-id',
        pickupAddress: createRequest.pickupAddress,
        deliveryAddress: createRequest.deliveryAddress,
        cargoInfo: createRequest.cargoInfo,
        estimatedCost: 500,
        actualCost: null,
        additionalFees: [],
        appliedRules: [],
        status: 'pending_confirmation',
        timeline: {
          created: new Date(),
          draft: new Date(),
          pendingConfirmation: new Date()
        },
        notes: 'Test shipment',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = createRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockShipmentService.createShipment.mockResolvedValue(createdShipment);

      await shipmentController.createShipment(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentService.createShipment).toHaveBeenCalledWith('tenant-id', createRequest, { initialStatus: ShipmentStatus.PENDING_CONFIRMATION });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: createdShipment
        })
      );
    });

    it('should return error for invalid shipment data', async () => {
      mockRequest.body = {
        // Missing required fields
        customerId: 'customer-id'
      };

      await shipmentController.createShipment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR'
          })
        })
      );
    });
  });

  describe('getShipment', () => {
    it('should return a shipment by ID', async () => {
      const shipment: Shipment = {
        id: 'shipment-id',
        tenantId: 'tenant-id',
        shipmentNumber: 'SH-2025-001',
        customerId: 'customer-id',
        driverId: 'driver-id',
        pickupAddress: {
          street: '123 Main St',
          city: 'Shanghai',
          state: 'Shanghai',
          zipCode: '200000',
          country: 'China'
        },
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Beijing',
          state: 'Beijing',
          zipCode: '100000',
          country: 'China'
        },
        cargoInfo: {
          weight: 1000,
          volume: 2.5,
          type: 'general',
          description: 'Test cargo'
        },
        estimatedCost: 500,
        actualCost: null,
        additionalFees: [],
        appliedRules: [],
        status: 'pending_confirmation',
        timeline: {
          created: new Date(),
          draft: new Date(),
          pendingConfirmation: new Date()
        },
        notes: 'Test shipment',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'shipment-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockShipmentService.getShipment.mockResolvedValue(shipment);

      await shipmentController.getShipment(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentService.getShipment).toHaveBeenCalledWith('tenant-id', 'shipment-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: shipment
        })
      );
    });

    it('should return 404 for non-existent shipment', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockShipmentService.getShipment.mockResolvedValue(null);

      await shipmentController.getShipment(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'SHIPMENT_NOT_FOUND'
          })
        })
      );
    });
  });

  describe('updateShipment', () => {
    it('should update a shipment successfully', async () => {
      const updateRequest: UpdateShipmentRequest = {
        status: 'in_transit',
        actualCost: 550,
        notes: 'Updated notes'
      };

      const updatedShipment: Shipment = {
        id: 'shipment-id',
        tenantId: 'tenant-id',
        shipmentNumber: 'SH-2025-001',
        customerId: 'customer-id',
        driverId: 'driver-id',
        pickupAddress: {
          street: '123 Main St',
          city: 'Shanghai',
          state: 'Shanghai',
          zipCode: '200000',
          country: 'China'
        },
        deliveryAddress: {
          street: '456 Oak Ave',
          city: 'Beijing',
          state: 'Beijing',
          zipCode: '100000',
          country: 'China'
        },
        cargoInfo: {
          weight: 1000,
          volume: 2.5,
          type: 'general',
          description: 'Test cargo'
        },
        estimatedCost: 500,
        actualCost: 550,
        additionalFees: [],
        appliedRules: [],
        status: 'in_transit',
        timeline: {
          created: new Date(),
          pending: new Date(),
          in_transit: new Date()
        },
        notes: 'Updated notes',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'shipment-id' };
      mockRequest.body = updateRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockShipmentService.updateShipment.mockResolvedValue(updatedShipment);

      await shipmentController.updateShipment(mockRequest as Request, mockResponse as Response);

      expect(mockShipmentService.updateShipment).toHaveBeenCalledWith('tenant-id', 'shipment-id', updateRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedShipment
        })
      );
    });
  });
});
