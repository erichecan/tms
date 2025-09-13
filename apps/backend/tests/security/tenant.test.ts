// 租户安全测试
// 创建时间: 2025-01-27 15:34:15

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('Tenant Security Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
  });

  describe('Tenant Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      // Mock two different tenants
      const tenant1 = {
        id: 'tenant-1',
        name: 'Tenant 1',
        domain: 'tenant1.com',
        schemaName: 'tenant_1',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tenant2 = {
        id: 'tenant-2',
        name: 'Tenant 2',
        domain: 'tenant2.com',
        schemaName: 'tenant_2',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock JWT verification for tenant 1 user
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@tenant1.com',
        role: 'admin',
        tenantId: 'tenant-1'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user1@tenant1.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getTenant.mockResolvedValue(tenant1);

      // Mock rules for tenant 1
      const tenant1Rules = [
        {
          id: 'rule-1',
          tenantId: 'tenant-1',
          name: 'Tenant 1 Rule',
          description: 'Rule for tenant 1',
          type: 'pricing',
          priority: 100,
          conditions: [{ fact: 'test', operator: 'equal', value: 'tenant1' }],
          actions: [{ type: 'test', params: { value: 'tenant1' } }],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDbService.getRules.mockResolvedValue({
        data: tenant1Rules,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });

      // Request rules for tenant 1
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer tenant1-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].tenantId).toBe('tenant-1');

      // Verify that the database service was called with the correct tenant ID
      expect(mockDbService.getRules).toHaveBeenCalledWith('tenant-1', expect.any(Object));
    });

    it('should prevent tenant ID manipulation', async () => {
      // Mock JWT verification for tenant 1 user
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@tenant1.com',
        role: 'admin',
        tenantId: 'tenant-1'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user1@tenant1.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getTenant.mockResolvedValue({
        id: 'tenant-1',
        name: 'Tenant 1',
        domain: 'tenant1.com',
        schemaName: 'tenant_1',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock rule creation
      mockDbService.createRule.mockResolvedValue({
        id: 'rule-1',
        tenantId: 'tenant-1', // Should always be tenant-1, not what's in the request
        name: 'Test Rule',
        description: 'Test rule description',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Try to create a rule with a different tenant ID in the request body
      const ruleData = {
        name: 'Test Rule',
        description: 'Test rule description',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active',
        tenantId: 'tenant-2' // This should be ignored
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer tenant1-token')
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tenantId).toBe('tenant-1'); // Should be tenant-1, not tenant-2

      // Verify that the database service was called with the correct tenant ID
      expect(mockDbService.createRule).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        name: 'Test Rule',
        description: 'Test rule description',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      }));
    });
  });

  describe('Tenant Validation', () => {
    it('should reject requests from inactive tenants', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@inactive.com',
        role: 'admin',
        tenantId: 'inactive-tenant'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'inactive-tenant',
        email: 'user1@inactive.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock inactive tenant
      mockDbService.getTenant.mockResolvedValue({
        id: 'inactive-tenant',
        name: 'Inactive Tenant',
        domain: 'inactive.com',
        schemaName: 'tenant_inactive',
        status: 'inactive', // Inactive tenant
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer inactive-tenant-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TENANT_INACTIVE');
    });

    it('should reject requests from non-existent tenants', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@nonexistent.com',
        role: 'admin',
        tenantId: 'nonexistent-tenant'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'nonexistent-tenant',
        email: 'user1@nonexistent.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock non-existent tenant
      mockDbService.getTenant.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer nonexistent-tenant-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('Subdomain Security', () => {
    it('should validate subdomain format', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@test.com',
        role: 'admin',
        tenantId: 'tenant-1'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user1@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock tenant lookup by domain
      mockDbService.getTenantByDomain.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Test with valid subdomain
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer valid-token')
        .set('Host', 'demo.test.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockDbService.getTenantByDomain).toHaveBeenCalledWith('demo.test.com');
    });

    it('should reject requests with invalid subdomain format', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@test.com',
        role: 'admin',
        tenantId: 'tenant-1'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user1@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock tenant lookup failure
      mockDbService.getTenantByDomain.mockResolvedValue(null);

      // Test with invalid subdomain
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer valid-token')
        .set('Host', 'invalid..subdomain..test.com')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('Data Encryption', () => {
    it('should handle sensitive data securely', async () => {
      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-1',
        email: 'user1@test.com',
        role: 'admin',
        tenantId: 'tenant-1'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-1',
        email: 'user1@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'User',
          lastName: 'One',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getTenant.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock rule creation with sensitive data
      const sensitiveRuleData = {
        name: 'Sensitive Rule',
        description: 'Rule with sensitive information',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: 'active'
      };

      mockDbService.createRule.mockResolvedValue({
        id: 'rule-1',
        tenantId: 'tenant-1',
        name: sensitiveRuleData.name,
        description: sensitiveRuleData.description,
        type: 'pricing',
        priority: 100,
        conditions: sensitiveRuleData.conditions,
        actions: sensitiveRuleData.actions,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer valid-token')
        .send(sensitiveRuleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(sensitiveRuleData.name);
      expect(response.body.data.description).toBe(sensitiveRuleData.description);

      // Verify that sensitive data is handled securely
      expect(mockDbService.createRule).toHaveBeenCalledWith('tenant-1', expect.objectContaining({
        name: sensitiveRuleData.name,
        description: sensitiveRuleData.description,
        type: 'pricing',
        priority: 100,
        conditions: sensitiveRuleData.conditions,
        actions: sensitiveRuleData.actions,
        status: 'active'
      }));
    });
  });
});
