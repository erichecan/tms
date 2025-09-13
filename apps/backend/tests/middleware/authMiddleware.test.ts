// 认证中间件测试
// 创建时间: 2025-01-27 15:32:00

import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../src/middleware/authMiddleware';
import { DatabaseService } from '../../src/services/DatabaseService';
import { User, Tenant } from '@tms/shared-types';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('authMiddleware', () => {
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockRequest = {
      headers: {},
      user: undefined,
      tenant: undefined
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

  it('should authenticate user with valid token', async () => {
    const user: User = {
      id: 'user-id',
      tenantId: 'tenant-id',
      email: 'test@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'admin',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        preferences: {}
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const tenant: Tenant = {
      id: 'tenant-id',
      name: 'Test Tenant',
      domain: 'test.com',
      schemaName: 'tenant_test',
      status: 'active',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-jwt-token'
    };

    // Mock JWT verification
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockReturnValue({
      userId: 'user-id',
      email: 'test@test.com',
      tenantId: 'tenant-id'
    });

    mockDbService.getUser.mockResolvedValue(user);
    mockDbService.getTenant.mockResolvedValue(tenant);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockRequest.user).toEqual({
      id: 'user-id',
      email: 'test@test.com',
      role: 'admin',
      tenantId: 'tenant-id'
    });
    expect(mockRequest.tenant).toEqual(tenant);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 for missing authorization header', async () => {
    mockRequest.headers = {};

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid token format', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token'
    };

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for invalid JWT token', async () => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token'
    };

    // Mock JWT verification to throw error
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for inactive user', async () => {
    const user: User = {
      id: 'user-id',
      tenantId: 'tenant-id',
      email: 'test@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'admin',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        preferences: {}
      },
      status: 'inactive', // inactive user
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRequest.headers = {
      authorization: 'Bearer valid-jwt-token'
    };

    // Mock JWT verification
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockReturnValue({
      userId: 'user-id',
      email: 'test@test.com',
      tenantId: 'tenant-id'
    });

    mockDbService.getUser.mockResolvedValue(user);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'ACCOUNT_INACTIVE'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 for non-existent user', async () => {
    mockRequest.headers = {
      authorization: 'Bearer valid-jwt-token'
    };

    // Mock JWT verification
    const jwt = require('jsonwebtoken');
    jest.spyOn(jwt, 'verify').mockReturnValue({
      userId: 'non-existent-user-id',
      email: 'test@test.com',
      tenantId: 'tenant-id'
    });

    mockDbService.getUser.mockResolvedValue(null);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'USER_NOT_FOUND'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
