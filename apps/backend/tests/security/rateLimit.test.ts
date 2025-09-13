// 速率限制测试
// 创建时间: 2025-01-27 15:34:45

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('Rate Limiting Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
  });

  describe('API Rate Limiting', () => {
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

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Send 50 concurrent requests
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      console.log(`Handled 50 concurrent requests in ${duration}ms`);
    });
  });

  describe('Authentication Rate Limiting', () => {
    it('should handle multiple login attempts', async () => {
      const promises = [];
      
      // Send 20 login requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/login')
            .send({
              email: `user${i}@test.com`,
              password: 'password'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should be handled (even if they fail due to invalid credentials)
      responses.forEach(response => {
        expect([200, 401, 400]).toContain(response.status);
      });
    });

    it('should handle multiple registration attempts', async () => {
      const promises = [];
      
      // Send 20 registration requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post('/api/v1/auth/register')
            .send({
              email: `user${i}@test.com`,
              password: 'password',
              firstName: 'User',
              lastName: 'Test',
              role: 'user'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should be handled
      responses.forEach(response => {
        expect([201, 400, 409]).toContain(response.status);
      });
    });
  });

  describe('Rule Management Rate Limiting', () => {
    let accessToken: string;

    beforeAll(async () => {
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

      accessToken = 'mock-access-token';
    });

    it('should handle multiple rule creation requests', async () => {
      const promises = [];
      
      // Send 30 rule creation requests
      for (let i = 0; i < 30; i++) {
        promises.push(
          request(app)
            .post('/api/v1/rules')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              name: `Rule ${i}`,
              description: `Rule ${i} description`,
              type: 'pricing',
              priority: 100 + i,
              conditions: [{ fact: 'test', operator: 'equal', value: i }],
              actions: [{ type: 'test', params: { value: i } }],
              status: 'active'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should be handled
      responses.forEach(response => {
        expect([201, 400, 429]).toContain(response.status);
      });
    });

    it('should handle multiple rule retrieval requests', async () => {
      const promises = [];
      
      // Send 50 rule retrieval requests
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/v1/rules')
            .set('Authorization', `Bearer ${accessToken}`)
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should be handled
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Pricing Rate Limiting', () => {
    let accessToken: string;

    beforeAll(async () => {
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

      accessToken = 'mock-access-token';
    });

    it('should handle multiple pricing quote requests', async () => {
      const promises = [];
      
      // Send 40 pricing quote requests
      for (let i = 0; i < 40; i++) {
        promises.push(
          request(app)
            .post('/api/v1/pricing/quote')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              customerId: `customer-${i}`,
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
                weight: 1000 + i,
                volume: 2.5 + i * 0.1,
                type: 'general',
                description: `Test cargo ${i}`
              },
              specialRequirements: []
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should be handled
      responses.forEach(response => {
        expect([200, 400, 429]).toContain(response.status);
      });
    });
  });

  describe('Memory Usage Under Load', () => {
    it('should not have memory leaks during extended operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/health');
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase after 100 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should handle memory pressure gracefully', async () => {
      const promises = [];
      
      // Send many requests to create memory pressure
      for (let i = 0; i < 200; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should still succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under load', async () => {
      const promises = [];
      
      // Send requests that will cause errors
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/v1/non-existent-endpoint')
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should return proper error responses
      responses.forEach(response => {
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('NOT_FOUND');
      });
    });

    it('should handle validation errors under load', async () => {
      const promises = [];
      
      // Send requests with invalid data
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .post('/api/v1/rules')
            .send({
              // Invalid data
              name: 123,
              type: 'invalid'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should return proper validation errors
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Response Time Under Load', () => {
    it('should maintain reasonable response times under load', async () => {
      const startTime = Date.now();
      const promises = [];
      
      // Send 100 requests
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app)
            .get('/health')
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      const averageResponseTime = duration / 100;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Average response time should be reasonable (less than 100ms)
      expect(averageResponseTime).toBeLessThan(100);
      console.log(`Average response time under load: ${averageResponseTime.toFixed(2)}ms`);
    });
  });
});
