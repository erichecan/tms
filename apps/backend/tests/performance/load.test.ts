// 性能测试
// 创建时间: 2025-01-27 15:33:45

import request from 'supertest';
import { app } from '../../src/index';
import { DatabaseService } from '../../src/services/DatabaseService';
import { Rule, RuleType, RuleStatus } from '@tms/shared-types';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('Performance Tests', () => {
  let mockDbService: jest.Mocked<DatabaseService>;
  let accessToken: string;

  beforeAll(async () => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    
    // Mock authentication
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

  describe('Rule Creation Performance', () => {
    it('should handle multiple rule creations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 100 rules concurrently
      for (let i = 0; i < 100; i++) {
        const ruleData = {
          name: `Performance Test Rule ${i}`,
          description: `Performance test rule ${i}`,
          type: 'pricing',
          priority: 100 + i,
          conditions: [
            { fact: 'test', operator: 'equal', value: i }
          ],
          actions: [
            { type: 'test', params: { value: i } }
          ],
          status: 'active'
        };

        promises.push(
          request(app)
            .post('/api/v1/rules')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(ruleData)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Performance assertion: should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      console.log(`Created 100 rules in ${duration}ms (${duration / 100}ms per rule)`);
    });
  });

  describe('Rule Retrieval Performance', () => {
    it('should handle large rule sets efficiently', async () => {
      // Mock a large number of rules
      const mockRules: Rule[] = [];
      for (let i = 0; i < 1000; i++) {
        mockRules.push({
          id: `rule-${i}`,
          tenantId: 'tenant-id',
          name: `Rule ${i}`,
          description: `Rule ${i} description`,
          type: RuleType.Pricing,
          priority: 100 + i,
          conditions: [
            { fact: 'test', operator: 'equal', value: i }
          ],
          actions: [
            { type: 'test', params: { value: i } }
          ],
          status: RuleStatus.Active,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      mockDbService.getRules.mockResolvedValue({
        data: mockRules,
        pagination: {
          total: 1000,
          page: 1,
          limit: 1000,
          totalPages: 1
        }
      });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/rules?limit=1000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1000);

      // Performance assertion: should complete within 2 seconds
      expect(duration).toBeLessThan(2000);
      console.log(`Retrieved 1000 rules in ${duration}ms`);
    });
  });

  describe('Pricing Calculation Performance', () => {
    it('should handle multiple pricing calculations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 50 pricing requests concurrently
      for (let i = 0; i < 50; i++) {
        const quoteRequest = {
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
          specialRequirements: i % 2 === 0 ? ['tailgate'] : []
        };

        promises.push(
          request(app)
            .post('/api/v1/pricing/quote')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(quoteRequest)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Performance assertion: should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      console.log(`Processed 50 pricing requests in ${duration}ms (${duration / 50}ms per request)`);
    });
  });

  describe('Database Query Performance', () => {
    it('should handle complex queries efficiently', async () => {
      // Mock complex query results
      const mockShipments = [];
      for (let i = 0; i < 500; i++) {
        mockShipments.push({
          id: `shipment-${i}`,
          tenantId: 'tenant-id',
          shipmentNumber: `SH-2025-${i.toString().padStart(3, '0')}`,
          customerId: `customer-${i % 10}`,
          driverId: `driver-${i % 5}`,
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
          estimatedCost: 500 + i * 10,
          actualCost: null,
          additionalFees: [],
          appliedRules: [],
          status: 'completed',
          timeline: {
            created: new Date(),
            pending: new Date(),
            in_transit: new Date(),
            completed: new Date()
          },
          notes: `Test shipment ${i}`,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      mockDbService.getShipments.mockResolvedValue({
        data: mockShipments,
        pagination: {
          total: 500,
          page: 1,
          limit: 500,
          totalPages: 1
        }
      });

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/shipments?limit=500&status=completed')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(500);

      // Performance assertion: should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
      console.log(`Retrieved 500 shipments in ${duration}ms`);
    });
  });

  describe('Concurrent User Performance', () => {
    it('should handle concurrent user operations efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Simulate 20 concurrent users performing different operations
      for (let i = 0; i < 20; i++) {
        const operation = i % 4;
        
        switch (operation) {
          case 0:
            // Get rules
            promises.push(
              request(app)
                .get('/api/v1/rules?limit=10')
                .set('Authorization', `Bearer ${accessToken}`)
            );
            break;
          case 1:
            // Get shipments
            promises.push(
              request(app)
                .get('/api/v1/shipments?limit=10')
                .set('Authorization', `Bearer ${accessToken}`)
            );
            break;
          case 2:
            // Get financial records
            promises.push(
              request(app)
                .get('/api/v1/finance/records?limit=10')
                .set('Authorization', `Bearer ${accessToken}`)
            );
            break;
          case 3:
            // Get current user
            promises.push(
              request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${accessToken}`)
            );
            break;
        }
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Performance assertion: should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      console.log(`Handled 20 concurrent operations in ${duration}ms (${duration / 20}ms per operation)`);
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during extended operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/v1/rules?limit=10')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      console.log(`Memory increase after 100 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });
});
