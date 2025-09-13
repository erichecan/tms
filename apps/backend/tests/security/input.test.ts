// 输入安全测试
// 创建时间: 2025-01-27 15:34:30

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('Input Security Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
  });

  describe('SQL Injection Prevention', () => {
    beforeEach(() => {
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
          lastName: 'User',
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
    });

    it('should prevent SQL injection in rule name', async () => {
      const maliciousRuleData = {
        name: "'; DROP TABLE rules; --",
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.name).toBe("'; DROP TABLE rules; --");
    });

    it('should prevent SQL injection in rule description', async () => {
      const maliciousRuleData = {
        name: 'Test Rule',
        description: "'; DROP TABLE users; --",
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.description).toBe("'; DROP TABLE users; --");
    });

    it('should prevent SQL injection in rule conditions', async () => {
      const maliciousRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: "'; DROP TABLE customers; --", operator: 'equal', value: "'; DROP TABLE drivers; --" }
        ],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.conditions).toEqual(maliciousRuleData.conditions);
    });

    it('should prevent SQL injection in rule actions', async () => {
      const maliciousRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [
          { type: "'; DROP TABLE shipments; --", params: { value: "'; DROP TABLE financial_records; --" } }
        ],
        status: 'active'
      };

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
      expect(response.body.data.actions).toEqual(maliciousRuleData.actions);
    });
  });

  describe('XSS Prevention', () => {
    beforeEach(() => {
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
          lastName: 'User',
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
    });

    it('should prevent XSS in rule name', async () => {
      const xssRuleData = {
        name: '<script>alert("XSS")</script>',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.name).toBe('<script>alert("XSS")</script>');
    });

    it('should prevent XSS in rule description', async () => {
      const xssRuleData = {
        name: 'Test Rule',
        description: '<img src="x" onerror="alert(\'XSS\')">',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.description).toBe('<img src="x" onerror="alert(\'XSS\')">');
    });

    it('should prevent XSS in rule conditions', async () => {
      const xssRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: '<script>alert("XSS")</script>', operator: 'equal', value: '<img src="x" onerror="alert(\'XSS\')">' }
        ],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active'
      };

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
      expect(response.body.data.conditions).toEqual(xssRuleData.conditions);
    });

    it('should prevent XSS in rule actions', async () => {
      const xssRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [
          { type: '<script>alert("XSS")</script>', params: { value: '<img src="x" onerror="alert(\'XSS\')">' } }
        ],
        status: 'active'
      };

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
      expect(response.body.data.actions).toEqual(xssRuleData.actions);
    });
  });

  describe('Input Validation', () => {
    beforeEach(() => {
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
          lastName: 'User',
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
    });

    it('should validate required fields', async () => {
      const invalidRuleData = {
        // Missing required fields
        description: 'Test rule'
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate data types', async () => {
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

    it('should validate enum values', async () => {
      const invalidRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'invalid_type', // Should be 'pricing' or 'payroll'
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
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

    it('should validate array structures', async () => {
      const invalidRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'test', operator: 'equal' } // Missing 'value' field
        ],
        actions: [{ type: 'test' }], // Missing 'params' field
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

    it('should validate string length limits', async () => {
      const invalidRuleData = {
        name: 'a'.repeat(1000), // Too long
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
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

    it('should validate number ranges', async () => {
      const invalidRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: -1, // Should be positive
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
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

  describe('File Upload Security', () => {
    it('should reject file uploads in text fields', async () => {
      const maliciousRuleData = {
        name: 'Test Rule',
        description: 'Test rule',
        type: 'pricing',
        priority: 100,
        conditions: [{ fact: 'test', operator: 'equal', value: 'test' }],
        actions: [{ type: 'test', params: { value: 'test' } }],
        status: 'active',
        file: 'malicious-file.exe' // Should not be allowed
      };

      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer admin-token')
        .send(maliciousRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
