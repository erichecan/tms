// 验证中间件测试
// 创建时间: 2025-01-27 15:32:30

import { Request, Response, NextFunction } from 'express';
import { validationMiddleware } from '../../src/middleware/validationMiddleware';
import Joi from 'joi';

describe('validationMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: { 'x-request-id': 'test-request-id' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('body validation', () => {
    it('should pass validation for valid body data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).max(100)
      });

      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      };

      const middleware = validationMiddleware(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid body data', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        age: Joi.number().min(18).max(100)
      });

      mockRequest.body = {
        name: 'John Doe',
        email: 'invalid-email', // invalid email
        age: 15 // below minimum age
      };

      const middleware = validationMiddleware(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.any(Array)
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required()
      });

      mockRequest.body = {
        name: 'John Doe'
        // email is missing
      };

      const middleware = validationMiddleware(schema, 'body');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'email',
                message: expect.stringContaining('required')
              })
            ])
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('query validation', () => {
    it('should pass validation for valid query parameters', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10),
        search: Joi.string().optional()
      });

      mockRequest.query = {
        page: '2',
        limit: '20',
        search: 'test'
      };

      const middleware = validationMiddleware(schema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid query parameters', () => {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(10)
      });

      mockRequest.query = {
        page: '0', // invalid: below minimum
        limit: '200' // invalid: above maximum
      };

      const middleware = validationMiddleware(schema, 'query');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.any(Array)
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('params validation', () => {
    it('should pass validation for valid route parameters', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required()
      });

      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const middleware = validationMiddleware(schema, 'params');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid route parameters', () => {
      const schema = Joi.object({
        id: Joi.string().uuid().required()
      });

      mockRequest.params = {
        id: 'invalid-uuid'
      };

      const middleware = validationMiddleware(schema, 'params');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.arrayContaining([
              expect.objectContaining({
                field: 'id',
                message: expect.stringContaining('uuid')
              })
            ])
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('default validation (body)', () => {
    it('should default to body validation when no source specified', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });

      mockRequest.body = {
        name: 'John Doe'
      };

      const middleware = validationMiddleware(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
