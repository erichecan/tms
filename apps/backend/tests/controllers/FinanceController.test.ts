// 财务控制器测试
// 创建时间: 2025-01-27 15:31:30

import { Request, Response } from 'express';
import { FinanceController } from '../../src/controllers/FinanceController';
import { FinanceService } from '../../src/services/FinanceService';
import { FinancialRecord, Statement, GenerateStatementRequest } from '@tms/shared-types';

// Mock财务服务
jest.mock('../../src/services/FinanceService');

describe('FinanceController', () => {
  let financeController: FinanceController;
  let mockFinanceService: jest.Mocked<FinanceService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockFinanceService = new FinanceService() as jest.Mocked<FinanceService>;
    financeController = new FinanceController(mockFinanceService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
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

  describe('getFinancialRecords', () => {
    it('should return financial records with pagination', async () => {
      const mockRecords: FinancialRecord[] = [
        {
          id: 'record-1',
          tenantId: 'tenant-id',
          type: 'receivable',
          referenceId: 'shipment-1',
          amount: 500,
          currency: 'CNY',
          status: 'pending',
          dueDate: new Date('2025-02-01'),
          paidAt: null,
          description: 'Shipment payment',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'record-2',
          tenantId: 'tenant-id',
          type: 'payable',
          referenceId: 'driver-1',
          amount: 150,
          currency: 'CNY',
          status: 'paid',
          dueDate: new Date('2025-01-15'),
          paidAt: new Date('2025-01-14'),
          description: 'Driver commission',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockRequest.query = {
        type: 'receivable',
        status: 'pending',
        page: '1',
        limit: '10'
      };
      mockRequest.tenant = { id: 'tenant-id' };

      mockFinanceService.getFinancialRecords.mockResolvedValue({
        data: mockRecords,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });

      await financeController.getFinancialRecords(mockRequest as Request, mockResponse as Response);

      expect(mockFinanceService.getFinancialRecords).toHaveBeenCalledWith('tenant-id', {
        type: 'receivable',
        status: 'pending',
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            data: mockRecords,
            pagination: expect.objectContaining({
              total: 2,
              page: 1,
              limit: 10,
              totalPages: 1
            })
          })
        })
      );
    });
  });

  describe('generateCustomerStatement', () => {
    it('should generate customer statement successfully', async () => {
      const generateRequest: GenerateStatementRequest = {
        type: 'customer',
        referenceId: 'customer-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        shipmentIds: ['shipment-1', 'shipment-2']
      };

      const generatedStatement: Statement = {
        id: 'statement-id',
        tenantId: 'tenant-id',
        type: 'customer',
        referenceId: 'customer-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        items: [
          {
            shipmentId: 'shipment-1',
            shipmentNumber: 'SH-2025-001',
            date: new Date('2025-01-15'),
            amount: 500,
            description: 'Transportation fee'
          },
          {
            shipmentId: 'shipment-2',
            shipmentNumber: 'SH-2025-002',
            date: new Date('2025-01-20'),
            amount: 750,
            description: 'Transportation fee'
          }
        ],
        totalAmount: 1250,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = generateRequest;
      mockRequest.tenant = { id: 'tenant-id' };
      mockRequest.user = { id: 'user-id', email: 'admin@test.com' };

      mockFinanceService.generateCustomerStatement.mockResolvedValue(generatedStatement);

      await financeController.generateCustomerStatement(mockRequest as Request, mockResponse as Response);

      expect(mockFinanceService.generateCustomerStatement).toHaveBeenCalledWith(
        'tenant-id',
        generateRequest,
        'admin@test.com'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: generatedStatement
        })
      );
    });

    it('should return error for invalid statement request', async () => {
      mockRequest.body = {
        // Missing required fields
        type: 'customer'
      };

      await financeController.generateCustomerStatement(mockRequest as Request, mockResponse as Response);

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

  describe('generateDriverStatement', () => {
    it('should generate driver statement successfully', async () => {
      const generateRequest: GenerateStatementRequest = {
        type: 'driver',
        referenceId: 'driver-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        shipmentIds: ['shipment-1', 'shipment-2']
      };

      const generatedStatement: Statement = {
        id: 'statement-id',
        tenantId: 'tenant-id',
        type: 'driver',
        referenceId: 'driver-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        items: [
          {
            shipmentId: 'shipment-1',
            shipmentNumber: 'SH-2025-001',
            date: new Date('2025-01-15'),
            amount: 150,
            description: 'Commission (30%)'
          },
          {
            shipmentId: 'shipment-2',
            shipmentNumber: 'SH-2025-002',
            date: new Date('2025-01-20'),
            amount: 225,
            description: 'Commission (30%)'
          }
        ],
        totalAmount: 375,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = generateRequest;
      mockRequest.tenant = { id: 'tenant-id' };
      mockRequest.user = { id: 'user-id', email: 'admin@test.com' };

      mockFinanceService.generateDriverStatement.mockResolvedValue(generatedStatement);

      await financeController.generateDriverStatement(mockRequest as Request, mockResponse as Response);

      expect(mockFinanceService.generateDriverStatement).toHaveBeenCalledWith(
        'tenant-id',
        generateRequest,
        'admin@test.com'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: generatedStatement
        })
      );
    });
  });

  describe('getStatement', () => {
    it('should return a statement by ID', async () => {
      const statement: Statement = {
        id: 'statement-id',
        tenantId: 'tenant-id',
        type: 'customer',
        referenceId: 'customer-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        items: [
          {
            shipmentId: 'shipment-1',
            shipmentNumber: 'SH-2025-001',
            date: new Date('2025-01-15'),
            amount: 500,
            description: 'Transportation fee'
          }
        ],
        totalAmount: 500,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'statement-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockFinanceService.getStatement.mockResolvedValue(statement);

      await financeController.getStatement(mockRequest as Request, mockResponse as Response);

      expect(mockFinanceService.getStatement).toHaveBeenCalledWith('tenant-id', 'statement-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: statement
        })
      );
    });

    it('should return 404 for non-existent statement', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockFinanceService.getStatement.mockResolvedValue(null);

      await financeController.getStatement(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'STATEMENT_NOT_FOUND'
          })
        })
      );
    });
  });
});
