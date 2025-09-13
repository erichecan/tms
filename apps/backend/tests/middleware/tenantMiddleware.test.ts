// 租户中间件测试
// 创建时间: 2025-01-27 15:32:15

import { Request, Response, NextFunction } from 'express';
import { tenantMiddleware } from '../../src/middleware/tenantMiddleware';
import { DatabaseService } from '../../src/services/DatabaseService';
import { Tenant } from '@tms/shared-types';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('tenantMiddleware', () => {
  let mockDbService: jest.Mocked<DatabaseService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    mockRequest = {
      headers: {},
      subdomains: [],
      hostname: 'test.com',
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

  it('should extract tenant from subdomain', async () => {
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

    mockRequest.subdomains = ['demo'];
    mockRequest.hostname = 'demo.test.com';

    mockDbService.getTenantByDomain.mockResolvedValue(tenant);

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockDbService.getTenantByDomain).toHaveBeenCalledWith('demo.test.com');
    expect(mockRequest.tenant).toEqual(tenant);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should extract tenant from x-tenant-id header', async () => {
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
      'x-tenant-id': 'tenant-id'
    };

    mockDbService.getTenant.mockResolvedValue(tenant);

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockDbService.getTenant).toHaveBeenCalledWith('tenant-id');
    expect(mockRequest.tenant).toEqual(tenant);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for missing tenant information', async () => {
    mockRequest.subdomains = [];
    mockRequest.hostname = 'localhost';
    mockRequest.headers = {};

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TENANT_REQUIRED'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent tenant', async () => {
    mockRequest.subdomains = ['nonexistent'];
    mockRequest.hostname = 'nonexistent.test.com';

    mockDbService.getTenantByDomain.mockResolvedValue(null);

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TENANT_NOT_FOUND'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 for inactive tenant', async () => {
    const tenant: Tenant = {
      id: 'tenant-id',
      name: 'Test Tenant',
      domain: 'test.com',
      schemaName: 'tenant_test',
      status: 'inactive', // inactive tenant
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRequest.subdomains = ['demo'];
    mockRequest.hostname = 'demo.test.com';

    mockDbService.getTenantByDomain.mockResolvedValue(tenant);

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'TENANT_INACTIVE'
        })
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should prioritize x-tenant-id header over subdomain', async () => {
    const tenant: Tenant = {
      id: 'header-tenant-id',
      name: 'Header Tenant',
      domain: 'header.com',
      schemaName: 'tenant_header',
      status: 'active',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockRequest.subdomains = ['demo'];
    mockRequest.hostname = 'demo.test.com';
    mockRequest.headers = {
      'x-tenant-id': 'header-tenant-id'
    };

    mockDbService.getTenant.mockResolvedValue(tenant);

    await tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockDbService.getTenant).toHaveBeenCalledWith('header-tenant-id');
    expect(mockDbService.getTenantByDomain).not.toHaveBeenCalled();
    expect(mockRequest.tenant).toEqual(tenant);
    expect(mockNext).toHaveBeenCalled();
  });
});
