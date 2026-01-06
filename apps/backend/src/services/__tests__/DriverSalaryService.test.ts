// DriverSalaryService 单元测试
// 创建时间: 2025-12-29 22:45:00

import { DriverSalaryService, RuleEngineStrategy, DriverFeeOverrideStrategy, ManualAdjustmentStrategy } from '../DriverSalaryService';
import { DatabaseService } from '../DatabaseService';
import { RuleEngineService } from '../RuleEngineService';
import { Shipment, Driver } from '@tms/shared-types';

// Mock services
jest.mock('../DatabaseService');
jest.mock('../RuleEngineService');

describe('DriverSalaryService', () => {
    let driverSalaryService: DriverSalaryService;
    let mockDbService: jest.Mocked<DatabaseService>;
    let mockRuleEngineService: jest.Mocked<RuleEngineService>;
    const tenantId = 'test-tenant-id';

    // Sample shipment data
    const createMockShipment = (overrides?: Partial<Shipment>): Shipment => ({
        id: 'shipment-1',
        tenantId,
        shipmentNumber: 'SHP-001',
        customerId: 'customer-1',
        driverId: 'driver-1',
        pickupAddress: {
            street: '123 Main St',
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5V 1A1',
            country: 'Canada'
        },
        deliveryAddress: {
            street: '456 Queen St',
            city: 'Toronto',
            state: 'ON',
            postalCode: 'M5V 2B2',
            country: 'Canada'
        },
        cargoInfo: {
            description: 'Test cargo',
            weight: 100,
            volume: 50,
            dimensions: { length: 10, width: 10, height: 10 },
            value: 1000,
            specialRequirements: [],
            hazardous: false
        },
        estimatedCost: 500,
        actualCost: 500,
        additionalFees: [],
        appliedRules: [],
        status: 'completed' as any,
        timeline: {
            created: new Date(),
            completed: new Date(),
            pickupInProgress: new Date(Date.now() - 3600000),
            delivered: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    });

    const createMockDriver = (): Driver => ({
        id: 'driver-1',
        tenantId,
        name: 'Test Driver',
        phone: '123-456-7890',
        licenseNumber: 'DL123456',
        vehicleInfo: {
            type: 'van',
            licensePlate: 'ABC123',
            capacity: 1000,
            dimensions: { length: 5, width: 2, height: 2 },
            features: []
        },
        status: 'active',
        performance: {
            rating: 4.5,
            totalDeliveries: 100,
            onTimeRate: 0.95,
            customerSatisfaction: 4.8
        },
        createdAt: new Date(),
        updatedAt: new Date()
    });

    beforeEach(() => {
        mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
        mockRuleEngineService = new RuleEngineService(mockDbService) as jest.Mocked<RuleEngineService>;
        driverSalaryService = new DriverSalaryService(mockDbService, mockRuleEngineService, tenantId);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('RuleEngineStrategy', () => {
        it('should calculate commission using rule engine when rule returns setDriverCommission action', async () => {
            const shipment = createMockShipment();

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: [
                    {
                        type: 'rule-executed',
                        params: {
                            ruleId: 'rule-1',
                            ruleName: 'Standard Commission',
                            actions: [
                                {
                                    type: 'setDriverCommission',
                                    params: { percentage: 30 }
                                }
                            ]
                        }
                    }
                ]
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(150); // 500 * 0.30
            expect(result.strategy).toBe('rule-engine');
            expect(result.details.percentage).toBe(30);
            expect(result.details.ruleId).toBe('rule-1');
        });

        it('should fall back to next strategy when rule engine does not return commission', async () => {
            const shipment = createMockShipment({ driverFee: 200 });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(200);
            expect(result.strategy).toBe('driver-fee-override');
        });
    });

    describe('DriverFeeOverrideStrategy', () => {
        it('should use driverFee when available', async () => {
            const shipment = createMockShipment({ driverFee: 250 });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(250);
            expect(result.strategy).toBe('driver-fee-override');
            expect(result.details.baseAmount).toBe(250);
        });

        it('should fall back to manual adjustment when driverFee is not set', async () => {
            const shipment = createMockShipment({ driverFee: undefined });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(0);
            expect(result.strategy).toBe('manual-adjustment');
        });

        it('should fall back to manual adjustment when driverFee is 0', async () => {
            const shipment = createMockShipment({ driverFee: 0 });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(0);
            expect(result.strategy).toBe('manual-adjustment');
        });
    });

    describe('ManualAdjustmentStrategy', () => {
        it('should return 0 commission when no other strategy applies', async () => {
            const shipment = createMockShipment({ driverFee: undefined });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(0);
            expect(result.strategy).toBe('manual-adjustment');
            expect(result.details.overrideReason).toContain('manual adjustment');
        });
    });

    describe('calculateBatchCommissions', () => {
        it('should calculate commissions for multiple shipments', async () => {
            const shipments = [
                createMockShipment({ id: 'shipment-1', shipmentNumber: 'SHP-001', driverFee: 100 }),
                createMockShipment({ id: 'shipment-2', shipmentNumber: 'SHP-002', driverFee: 150 }),
                createMockShipment({ id: 'shipment-3', shipmentNumber: 'SHP-003', driverFee: 200 })
            ];

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const results = await driverSalaryService.calculateBatchCommissions(shipments);

            expect(results).toHaveLength(3);
            expect(results[0].commission).toBe(100);
            expect(results[1].commission).toBe(150);
            expect(results[2].commission).toBe(200);
            expect(results.every(r => r.strategy === 'driver-fee-override')).toBe(true);
        });

        it('should handle mixed calculation strategies', async () => {
            const shipments = [
                createMockShipment({ id: 'shipment-1', shipmentNumber: 'SHP-001', driverFee: 100 }),
                createMockShipment({ id: 'shipment-2', shipmentNumber: 'SHP-002', driverFee: undefined }),
                createMockShipment({ id: 'shipment-3', shipmentNumber: 'SHP-003', actualCost: 600 })
            ];

            mockRuleEngineService.executeRules = jest.fn()
                .mockResolvedValueOnce({ events: [] }) // First shipment: no rule
                .mockResolvedValueOnce({ events: [] }) // Second shipment: no rule
                .mockResolvedValueOnce({ // Third shipment: rule engine
                    events: [{
                        type: 'rule-executed',
                        params: {
                            actions: [{ type: 'setDriverCommission', params: { percentage: 25 } }]
                        }
                    }]
                });

            const results = await driverSalaryService.calculateBatchCommissions(shipments);

            expect(results).toHaveLength(3);
            expect(results[0].strategy).toBe('driver-fee-override');
            expect(results[1].strategy).toBe('manual-adjustment');
            expect(results[2].strategy).toBe('rule-engine');
            expect(results[2].commission).toBe(150); // 600 * 0.25
        });

        it('should handle errors gracefully and continue processing', async () => {
            const shipments = [
                createMockShipment({ id: 'shipment-1', shipmentNumber: 'SHP-001', driverFee: 100 }),
                createMockShipment({ id: 'shipment-2', shipmentNumber: 'SHP-002', driverFee: 150 })
            ];

            mockRuleEngineService.executeRules = jest.fn()
                .mockRejectedValueOnce(new Error('Rule engine error'))
                .mockResolvedValueOnce({ events: [] });

            const results = await driverSalaryService.calculateBatchCommissions(shipments);

            expect(results).toHaveLength(2);
            // First shipment should fall back to driver fee override after rule engine fails
            expect(results[0].commission).toBe(100);
            expect(results[1].commission).toBe(150);
        });
    });

    describe('getCalculationDetails', () => {
        it('should return calculation context and applicable strategies', async () => {
            const shipment = createMockShipment({ driverFee: 200 });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const details = await driverSalaryService.getCalculationDetails(shipment);

            expect(details.context.shipment).toBe(shipment);
            expect(details.context.finalCost).toBe(500);
            expect(details.applicableStrategies).toContain('rule-engine');
            expect(details.applicableStrategies).toContain('driver-fee-override');
            expect(details.selectedStrategy).toBe('driver-fee-override');
            expect(details.result?.commission).toBe(200);
        });
    });

    describe('Edge Cases', () => {
        it('should handle shipment with actualCost but no estimatedCost', async () => {
            const shipment = createMockShipment({
                actualCost: 750,
                estimatedCost: 0
            });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: [{
                    type: 'rule-executed',
                    params: {
                        actions: [{ type: 'setDriverCommission', params: { percentage: 20 } }]
                    }
                }]
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            expect(result.commission).toBe(150); // 750 * 0.20
        });

        it('should handle shipment with no timeline data', async () => {
            const shipment = createMockShipment({
                timeline: {} as any
            });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            // Should not throw error, context.deliveryTime should be 0
            expect(result).toBeDefined();
        });

        it('should handle shipment with no customer data', async () => {
            const shipment = createMockShipment({
                customer: undefined
            });

            mockRuleEngineService.executeRules = jest.fn().mockResolvedValue({
                events: []
            });

            const result = await driverSalaryService.calculateCommission(shipment);

            // Should use 'standard' as default customer level
            expect(result).toBeDefined();
        });
    });
});
