// 认证控制器测试
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { DatabaseService } from '../../src/services/DatabaseService';
import { User, Tenant } from '@tms/shared-types';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    authController = new AuthController(mockDbService);

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

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
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

      mockRequest.body = {
        email: 'test@test.com',
        password: 'password'
      };

      mockDbService.getTenantByDomain.mockResolvedValue(tenant);
      mockDbService.getUserByEmail.mockResolvedValue(user);
      mockDbService.updateUser.mockResolvedValue(user);

      // Mock bcrypt.compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@test.com',
              role: 'admin'
            }),
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          })
        })
      );
    });

    it('should return error for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@test.com',
        password: 'wrongpassword'
      };

      mockDbService.getTenantByDomain.mockResolvedValue({
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getUserByEmail.mockResolvedValue({
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
      });

      // Mock bcrypt.compare to return false
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_CREDENTIALS'
          })
        })
      );
    });

    it('should return error for missing email or password', async () => {
      mockRequest.body = {
        email: 'test@test.com'
        // password missing
      };

      await authController.login(mockRequest as Request, mockResponse as Response);

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

    it('should return error for inactive user', async () => {
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

      mockRequest.body = {
        email: 'test@test.com',
        password: 'password'
      };

      mockDbService.getTenantByDomain.mockResolvedValue(tenant);
      mockDbService.getUserByEmail.mockResolvedValue(user);

      // Mock bcrypt.compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'ACCOUNT_INACTIVE'
          })
        })
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user information', async () => {
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

      mockRequest.user = {
        id: 'user-id',
        email: 'test@test.com',
        role: 'admin',
        tenantId: 'tenant-id'
      };

      mockRequest.tenant = {
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {}
      };

      mockDbService.getUser.mockResolvedValue(user);

      await authController.getCurrentUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              email: 'test@test.com',
              role: 'admin'
            })
          })
        })
      );
    });
  });
});
