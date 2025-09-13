// API集成测试
// 创建时间: 2025-01-27 15:33:15

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('API Integration Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    // Mock database connection
    mockDbService.connect.mockResolvedValue();
  });

  afterAll(async () => {
    // Clean up
    mockDbService.close.mockResolvedValue();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String)
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle complete authentication flow', async () => {
      // 1. Register a new user
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };

      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.email).toBe('test@example.com');
      expect(registerResponse.body.data.accessToken).toBeDefined();

      // 2. Login with the registered user
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();

      const accessToken = loginResponse.body.data.accessToken;

      // 3. Get current user info
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('Rule Management Flow', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Mock successful authentication
      const mockUser = {
        id: 'user-id',
        email: 'admin@test.com',
        role: 'admin',
        tenantId: 'tenant-id'
      };

      const mockTenant = {
        id: 'tenant-id',
        name: 'Test Tenant',
        domain: 'test.com',
        schemaName: 'tenant_test',
        status: 'active',
        settings: {}
      };

      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jest.spyOn(jwt, 'verify').mockReturnValue({
        userId: 'user-id',
        email: 'admin@test.com',
        tenantId: 'tenant-id'
      });

      mockDbService.getUser.mockResolvedValue({
        id: 'user-id',
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

      mockDbService.getTenant.mockResolvedValue(mockTenant);

      // Generate a mock token
      accessToken = 'mock-access-token';
    });

    it('should handle complete rule management flow', async () => {
      // 1. Create a new rule
      const ruleData = {
        name: 'VIP客户折扣',
        description: 'VIP客户享受15%折扣',
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

      const createResponse = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(ruleData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.name).toBe('VIP客户折扣');

      const ruleId = createResponse.body.data.id;

      // 2. Get the created rule
      const getResponse = await request(app)
        .get(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(ruleId);

      // 3. Update the rule
      const updateData = {
        name: 'VIP客户折扣（更新）',
        priority: 150
      };

      const updateResponse = await request(app)
        .put(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('VIP客户折扣（更新）');

      // 4. Get all rules
      const listResponse = await request(app)
        .get('/api/v1/rules?type=pricing&page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.data).toHaveLength(1);

      // 5. Delete the rule
      const deleteResponse = await request(app)
        .delete(`/api/v1/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });
  });

  describe('Pricing Flow', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Mock authentication (same as above)
      accessToken = 'mock-access-token';
    });

    it('should handle pricing quote flow', async () => {
      const quoteRequest = {
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

      const quoteResponse = await request(app)
        .post('/api/v1/pricing/quote')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(quoteRequest)
        .expect(200);

      expect(quoteResponse.body.success).toBe(true);
      expect(quoteResponse.body.data.totalCost).toBeDefined();
      expect(quoteResponse.body.data.appliedRules).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/v1/non-existent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/rules')
        .set('Authorization', 'Bearer mock-token')
        .send({
          // Missing required fields
          name: 'Test Rule'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/v1/rules')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
