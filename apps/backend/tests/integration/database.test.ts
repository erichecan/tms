// 数据库集成测试
// 创建时间: 2025-01-27 15:33:30

import { DatabaseService } from '../../src/services/DatabaseService';
import { Rule, RuleType, RuleStatus, User, Tenant, Customer, Driver, Shipment } from '@tms/shared-types';

describe('Database Integration Tests', () => {
  let dbService: DatabaseService;
  let testTenantId: string;
  let testUserId: string;

  beforeAll(async () => {
    dbService = new DatabaseService();
    await dbService.connect();

    // Create test tenant
    const tenant = await dbService.createTenant({
      name: 'Test Tenant',
      domain: 'test.com',
      schemaName: 'tenant_test',
      status: 'active',
      settings: {}
    });
    testTenantId = tenant.id;

    // Create test user
    const user = await dbService.createUser(testTenantId, {
      email: 'test@test.com',
      passwordHash: '$2a$10$hashedpassword',
      role: 'admin',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        preferences: {}
      },
      status: 'active'
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testTenantId) {
      await dbService.query('DELETE FROM users WHERE tenant_id = $1', [testTenantId]);
      await dbService.query('DELETE FROM tenants WHERE id = $1', [testTenantId]);
    }
    await dbService.close();
  });

  describe('Tenant Management', () => {
    it('should create and retrieve tenant', async () => {
      const tenantData = {
        name: 'Test Tenant 2',
        domain: 'test2.com',
        schemaName: 'tenant_test2',
        status: 'active' as const,
        settings: { theme: 'dark' }
      };

      const createdTenant = await dbService.createTenant(tenantData);
      expect(createdTenant.name).toBe(tenantData.name);
      expect(createdTenant.domain).toBe(tenantData.domain);
      expect(createdTenant.schemaName).toBe(tenantData.schemaName);

      const retrievedTenant = await dbService.getTenant(createdTenant.id);
      expect(retrievedTenant).toEqual(createdTenant);

      // Clean up
      await dbService.query('DELETE FROM tenants WHERE id = $1', [createdTenant.id]);
    });

    it('should get tenant by domain', async () => {
      const tenant = await dbService.getTenantByDomain('test.com');
      expect(tenant).toBeDefined();
      expect(tenant?.domain).toBe('test.com');
    });
  });

  describe('User Management', () => {
    it('should create and retrieve user', async () => {
      const userData = {
        email: 'testuser@test.com',
        passwordHash: '$2a$10$hashedpassword',
        role: 'user' as const,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          preferences: { language: 'en' }
        },
        status: 'active' as const
      };

      const createdUser = await dbService.createUser(testTenantId, userData);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.role).toBe(userData.role);
      expect(createdUser.tenantId).toBe(testTenantId);

      const retrievedUser = await dbService.getUser(testTenantId, createdUser.id);
      expect(retrievedUser).toEqual(createdUser);

      const userByEmail = await dbService.getUserByEmail(testTenantId, userData.email);
      expect(userByEmail).toEqual(createdUser);

      // Clean up
      await dbService.query('DELETE FROM users WHERE id = $1', [createdUser.id]);
    });
  });

  describe('Rule Management', () => {
    it('should create and retrieve rule', async () => {
      const ruleData = {
        name: 'Test Rule',
        description: 'Test rule description',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active
      };

      const createdRule = await dbService.createRule(testTenantId, ruleData);
      expect(createdRule.name).toBe(ruleData.name);
      expect(createdRule.type).toBe(ruleData.type);
      expect(createdRule.conditions).toEqual(ruleData.conditions);
      expect(createdRule.actions).toEqual(ruleData.actions);

      const retrievedRule = await dbService.getRule(testTenantId, createdRule.id);
      expect(retrievedRule).toEqual(createdRule);

      // Clean up
      await dbService.query('DELETE FROM rules WHERE id = $1', [createdRule.id]);
    });

    it('should get rules with pagination and filters', async () => {
      // Create multiple rules
      const rules = [];
      for (let i = 0; i < 5; i++) {
        const rule = await dbService.createRule(testTenantId, {
          name: `Test Rule ${i}`,
          description: `Test rule ${i} description`,
          type: i % 2 === 0 ? RuleType.Pricing : RuleType.Payroll,
          priority: 100 + i,
          conditions: [
            { fact: 'test', operator: 'equal', value: i }
          ],
          actions: [
            { type: 'test', params: { value: i } }
          ],
          status: RuleStatus.Active
        });
        rules.push(rule);
      }

      // Test pagination
      const result = await dbService.getRules(testTenantId, {
        page: 1,
        limit: 3
      });
      expect(result.data).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);

      // Test filtering by type
      const pricingRules = await dbService.getRules(testTenantId, {
        filters: { type: RuleType.Pricing }
      });
      expect(pricingRules.data.every(rule => rule.type === RuleType.Pricing)).toBe(true);

      // Clean up
      for (const rule of rules) {
        await dbService.query('DELETE FROM rules WHERE id = $1', [rule.id]);
      }
    });
  });

  describe('Customer Management', () => {
    it('should create and retrieve customer', async () => {
      const customerData = {
        name: 'Test Customer',
        level: 'vip',
        contactInfo: {
          phone: '123-456-7890',
          email: 'customer@test.com'
        },
        billingInfo: {
          address: '123 Main St',
          city: 'Shanghai'
        }
      };

      const createdCustomer = await dbService.createCustomer(testTenantId, customerData);
      expect(createdCustomer.name).toBe(customerData.name);
      expect(createdCustomer.level).toBe(customerData.level);
      expect(createdCustomer.contactInfo).toEqual(customerData.contactInfo);

      const retrievedCustomer = await dbService.getCustomer(testTenantId, createdCustomer.id);
      expect(retrievedCustomer).toEqual(createdCustomer);

      // Clean up
      await dbService.query('DELETE FROM customers WHERE id = $1', [createdCustomer.id]);
    });
  });

  describe('Driver Management', () => {
    it('should create and retrieve driver', async () => {
      const driverData = {
        name: 'Test Driver',
        phone: '123-456-7890',
        licenseNumber: 'DL123456',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020
        },
        status: 'active',
        performance: {
          rating: 4.5,
          totalTrips: 100
        }
      };

      const createdDriver = await dbService.createDriver(testTenantId, driverData);
      expect(createdDriver.name).toBe(driverData.name);
      expect(createdDriver.phone).toBe(driverData.phone);
      expect(createdDriver.vehicleInfo).toEqual(driverData.vehicleInfo);

      const retrievedDriver = await dbService.getDriver(testTenantId, createdDriver.id);
      expect(retrievedDriver).toEqual(createdDriver);

      // Clean up
      await dbService.query('DELETE FROM drivers WHERE id = $1', [createdDriver.id]);
    });
  });

  describe('Shipment Management', () => {
    let customerId: string;
    let driverId: string;

    beforeAll(async () => {
      // Create test customer and driver
      const customer = await dbService.createCustomer(testTenantId, {
        name: 'Test Customer',
        level: 'standard',
        contactInfo: { phone: '123-456-7890' }
      });
      customerId = customer.id;

      const driver = await dbService.createDriver(testTenantId, {
        name: 'Test Driver',
        phone: '123-456-7890',
        licenseNumber: 'DL123456',
        vehicleInfo: {},
        status: 'active',
        performance: {}
      });
      driverId = driver.id;
    });

    afterAll(async () => {
      // Clean up
      await dbService.query('DELETE FROM customers WHERE id = $1', [customerId]);
      await dbService.query('DELETE FROM drivers WHERE id = $1', [driverId]);
    });

    it('should create and retrieve shipment', async () => {
      const shipmentData = {
        customerId,
        driverId,
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
        estimatedCost: 500,
        notes: 'Test shipment'
      };

      const createdShipment = await dbService.createShipment(testTenantId, shipmentData);
      expect(createdShipment.customerId).toBe(customerId);
      expect(createdShipment.driverId).toBe(driverId);
      expect(createdShipment.pickupAddress).toEqual(shipmentData.pickupAddress);
      expect(createdShipment.deliveryAddress).toEqual(shipmentData.deliveryAddress);
      expect(createdShipment.cargoInfo).toEqual(shipmentData.cargoInfo);

      const retrievedShipment = await dbService.getShipment(testTenantId, createdShipment.id);
      expect(retrievedShipment).toEqual(createdShipment);

      // Clean up
      await dbService.query('DELETE FROM shipments WHERE id = $1', [createdShipment.id]);
    });
  });

  describe('Financial Records', () => {
    it('should create and retrieve financial record', async () => {
      const financialData = {
        type: 'receivable',
        referenceId: 'test-reference-id',
        amount: 1000,
        currency: 'CNY',
        status: 'pending',
        dueDate: new Date('2025-02-01'),
        description: 'Test financial record'
      };

      const createdRecord = await dbService.createFinancialRecord(testTenantId, financialData);
      expect(createdRecord.type).toBe(financialData.type);
      expect(createdRecord.amount).toBe(financialData.amount);
      expect(createdRecord.currency).toBe(financialData.currency);

      const retrievedRecord = await dbService.getFinancialRecord(testTenantId, createdRecord.id);
      expect(retrievedRecord).toEqual(createdRecord);

      // Clean up
      await dbService.query('DELETE FROM financial_records WHERE id = $1', [createdRecord.id]);
    });
  });

  describe('Statements', () => {
    it('should create and retrieve statement', async () => {
      const statementData = {
        type: 'customer',
        referenceId: 'test-customer-id',
        periodStart: new Date('2025-01-01'),
        periodEnd: new Date('2025-01-31'),
        items: [
          {
            shipmentId: 'shipment-1',
            shipmentNumber: 'SH-2025-001',
            date: new Date('2025-01-15'),
            amount: 500,
            description: 'Transportation fee'
          }
        ],
        totalAmount: 500,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: 'admin@test.com'
      };

      const createdStatement = await dbService.createStatement(testTenantId, statementData);
      expect(createdStatement.type).toBe(statementData.type);
      expect(createdStatement.totalAmount).toBe(statementData.totalAmount);
      expect(createdStatement.items).toEqual(statementData.items);

      const retrievedStatement = await dbService.getStatement(testTenantId, createdStatement.id);
      expect(retrievedStatement).toEqual(createdStatement);

      // Clean up
      await dbService.query('DELETE FROM statements WHERE id = $1', [createdStatement.id]);
    });
  });
});
