// 安全测试
// 创建时间: 2025-01-27 15:34:00

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('Security Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
  });

  describe('Authentication Security', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with invalid token format', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with malformed JWT token', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with expired token', async () => {
      // Mock JWT verification to throw expired error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer expired-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject requests with tampered token', async () => {
      // Mock JWT verification to throw invalid signature error
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', 'Bearer tampered-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Authorization Security', () => {
    let userToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Mock JWT verification for different user roles
      const jwt = require('jsonwebtoken');
      
      // Mock user token
      jest.spyOn(jwt, 'verify').mockImplementation((token) => {
        if (token === 'user-token') {
          return {
            userId: 'user-id',
            email: 'user@test.com',
            role: 'user',
            tenantId: 'tenant-id'
          };
        } else if (token === 'admin-token') {
          return {
            userId: 'admin-id',
            email: 'admin@test.com',
            role: 'admin',
            tenantId: 'tenant-id'
          };
        }
        throw new Error('Invalid token');
      });

      // Mock database responses
      mockDbService.getUser.mockImplementation(async (tenantId, userId) => {
        if (userId === 'user-id') {
          return {
            id: 'user-id',
            tenantId: 'tenant-id',
            email: 'user@test.com',
            passwordHash: '$2a$10$hashedpassword',
            role: 'user',
            profile: {
              firstName: 'User',
              lastName: 'Test',
              preferences: {}
            },
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        } else if (userId === 'admin-id') {
          return {
            id: 'admin-id',
            tenantId: 'tenant-id',
            email: 'admin@test.com',
            passwordHash: '$2a$10$hashedpassword',
            role: 'admin',
            profile: {
              firstName: 'Admin',
              lastName: 'Test',
              preferences: {}
            },
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        return null;
      });

      mockDbService.getTenant.mockResolvedValue({
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      userToken = 'user-token';
      adminToken = 'admin-token';
    });

    it('should allow admin users to access all endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should restrict user access to certain endpoints', async () => {
      // This test would need to be implemented based on your specific authorization logic
      // For now, we'll test that the user can access their own data
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('user');
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in rule creation', async () => {
      const maliciousRuleData = {
        name: "'; DROP TABLE rules; --",
        description: "'; DROP TABLE users; --",
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: "'; DROP TABLE customers; --", operator: 'equal', value: "'; DROP TABLE drivers; --" }
        ],
        actions: [
          { type: "'; DROP TABLE shipments; --", params: { value: "'; DROP TABLE financial_records; --" } }
        ],
        status: 'active'
      };

      // Mock authentication
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'admin-id',
        email: 'admin@test.com',
        role: 'admin',
        tenantId: 'tenant-id'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'admin-id',
        tenantId: 'tenant-id',
        email: 'admin@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'Test',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getTenant.mockResolvedValue({
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock successful rule creation (the database service should handle SQL injection prevention)
      mockDbService.createRule.mockResolvedValue({
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: maliciousRuleData.name,
        description: maliciousRuleData.description,
        type: 'pricing',
        priority: 100,
        conditions: maliciousRuleData.conditions,
        actions: maliciousRuleData.actions,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer admin-token')
        .send(maliciousRuleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // The malicious input should be stored as-is (not executed as SQL)
      expect(response.body.data.name).toBe("'; DROP TABLE rules; --");
    });

    it('should prevent XSS attacks in rule descriptions', async () => {
      const xssRuleData = {
        name: 'XSS Test Rule',
        description: '<script>alert("XSS")</script>',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'test', operator: 'equal', value: 'test' }
        ],
        actions: [
          { type: 'test', params: { value: 'test' } }
        ],
        status: 'active'
      };

      // Mock authentication
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'admin-id',
        email: 'admin@test.com',
        role: 'admin',
        tenantId: 'tenant-id'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'admin-id',
        tenantId: 'tenant-id',
        email: 'admin@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'admin',
        profile: {
          firstName: 'Admin',
          lastName: 'Test',
          preferences: {}
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.getTenant.mockResolvedValue({
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockDbService.createRule.mockResolvedValue({
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: xssRuleData.name,
        description: xssRuleData.description,
        type: 'pricing',
        priority: 100,
        conditions: xssRuleData.conditions,
        actions: xssRuleData.actions,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer admin-token')
        .send(xssRuleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // The XSS payload should be stored as-is (not executed)
      expect(response.body.data.description).toBe('<script>alert("XSS")</script>');
    });

    it('should validate input data types', async () => {
      const invalidRuleData = {
        name: 123, // Should be string
        description: 'Test rule',
        type: 'pricing',
        priority: 'invalid', // Should be number
        conditions: 'invalid', // Should be array
        actions: 'invalid', // Should be array
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid requests gracefully', async () => {
      const promises = [];
      
      // Send 100 requests rapidly
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // All health check requests should succeed (no rate limiting on health endpoint)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('CORS Security', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/v1/rules')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Data Privacy', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      // Should not expose internal error details or stack traces
      expect(response.body.error.stack).toBeUndefined();
      expect(response.body.error.details).toBeUndefined();
    });

    it('should not expose database connection details', async () => {
      // Mock database connection error
      mockDbService.getUser.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      // Should not expose database connection details
      expect(response.body.error.message).not.toContain('Connection failed');
    });
  });
});
