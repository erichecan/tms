// 定价控制器测试
// 创建时间: 2025-01-27 15:31:00

import { Request, Response } from 'express';
import { PricingController } from '../../src/controllers/PricingController';
import { PricingService } from '../../src/services/PricingService';
import { QuoteRequest, QuoteResponse } from '@tms/shared-types';

// Mock定价服务
jest.mock('../../src/services/PricingService');

describe('PricingController', () => {
  let pricingController: PricingController;
  let mockPricingService: jest.Mocked<PricingService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockPricingService = new PricingService() as jest.Mocked<PricingService>;
    pricingController = new PricingController(mockPricingService);

    mockRequest = {
      body: {},
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

  describe('getQuote', () => {
    it('should return a valid quote for valid request', async () => {
      const quoteRequest: QuoteRequest = {
        customerId: 'customer-id',
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
        specialRequirements: ['tailgate']
      };

      const expectedQuote: QuoteResponse = {
        quoteId: 'quote-id',
        customerId: 'customer-id',
        baseCost: 500,
        additionalFees: [
          {
            type: 'tailgate',
            amount: 50,
            description: 'Tailgate service fee'
          }
        ],
        totalCost: 550,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        appliedRules: [
          {
            ruleId: 'rule-id',
            ruleName: 'Standard Pricing',
            discount: 0,
            surcharge: 0
          }
        ]
      };

      mockRequest.body = quoteRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockPricingService.getQuote.mockResolvedValue(expectedQuote);

      await pricingController.getQuote(mockRequest as Request, mockResponse as Response);

      expect(mockPricingService.getQuote).toHaveBeenCalledWith('tenant-id', quoteRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expectedQuote
        })
      );
    });

    it('should return error for invalid quote request', async () => {
      mockRequest.body = {
        // Missing required fields
        customerId: 'customer-id'
      };

      await pricingController.getQuote(mockRequest as Request, mockResponse as Response);

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

    it('should handle pricing service errors', async () => {
      const quoteRequest: QuoteRequest = {
        customerId: 'customer-id',
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
        specialRequirements: []
      };

      mockRequest.body = quoteRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockPricingService.getQuote.mockRejectedValue(new Error('Pricing service error'));

      await pricingController.getQuote(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR'
          })
        })
      );
    });
  });
});
