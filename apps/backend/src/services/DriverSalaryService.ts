// 司机工资计算服务
// 创建时间: 2025-12-29 22:40:00
// 职责: 处理所有司机工资计算逻辑，使用策略模式支持多种计算方法

import { DatabaseService } from './DatabaseService';
import { RuleEngineService } from './RuleEngineService';
import { logger } from '../utils/logger';
import { Shipment, Driver, Trip } from '@tms/shared-types';

/**
 * 工资计算策略类型
 */
export type SalaryCalculationStrategyType =
    | 'rule-engine'
    | 'trip-override'
    | 'driver-fee-override'
    | 'manual-adjustment';

/**
 * 工资计算结果
 */
export interface SalaryCalculationResult {
    shipmentId: string;
    shipmentNumber: string;
    commission: number;
    strategy: SalaryCalculationStrategyType;
    details: {
        baseAmount?: number;
        percentage?: number;
        ruleId?: string;
        ruleName?: string;
        overrideReason?: string;
        finalCost?: number;
    };
    calculatedAt: Date;
}

/**
 * 工资计算上下文
 */
export interface SalaryCalculationContext {
    shipment: Shipment;
    trip?: Trip;
    driver?: Driver;
    finalCost: number;
    distance: number;
    weight: number;
    volume: number;
    deliveryTime: number;
    customerLevel: 'standard' | 'vip' | 'premium';
}

/**
 * 工资计算策略接口
 */
export interface SalaryCalculationStrategy {
    /**
     * 策略名称
     */
    readonly name: SalaryCalculationStrategyType;

    /**
     * 检查策略是否适用
     */
    canApply(context: SalaryCalculationContext): boolean;

    /**
     * 计算佣金
     */
    calculate(context: SalaryCalculationContext): Promise<SalaryCalculationResult>;
}

/**
 * 规则引擎计算策略
 * 优先级: 1 (最高)
 */
export class RuleEngineStrategy implements SalaryCalculationStrategy {
    readonly name: SalaryCalculationStrategyType = 'rule-engine';

    constructor(
        private ruleEngineService: RuleEngineService,
        private tenantId: string
    ) { }

    canApply(context: SalaryCalculationContext): boolean {
        // 规则引擎总是可以尝试应用
        return true;
    }

    async calculate(context: SalaryCalculationContext): Promise<SalaryCalculationResult> {
        const { shipment, finalCost, distance, weight, volume, deliveryTime, customerLevel } = context;

        const facts = {
            shipmentId: shipment.id,
            driverId: shipment.driverId,
            finalCost,
            distance,
            weight,
            volume,
            deliveryTime,
            customerLevel
        };

        try {
            const ruleResult = await this.ruleEngineService.executeRules(this.tenantId, facts);

            for (const event of ruleResult.events) {
                if (event.type === 'rule-executed') {
                    const actions = event.params?.actions || [];
                    for (const action of actions) {
                        if (action.type === 'setDriverCommission') {
                            const percentage = action.params.percentage;
                            const commission = finalCost * (percentage / 100);

                            logger.info(`Rule engine calculated commission for shipment ${shipment.shipmentNumber}`, {
                                shipmentId: shipment.id,
                                ruleId: event.params?.ruleId,
                                percentage,
                                finalCost,
                                commission
                            });

                            return {
                                shipmentId: shipment.id,
                                shipmentNumber: shipment.shipmentNumber,
                                commission,
                                strategy: this.name,
                                details: {
                                    baseAmount: finalCost,
                                    percentage,
                                    ruleId: event.params?.ruleId,
                                    ruleName: event.params?.ruleName,
                                    finalCost
                                },
                                calculatedAt: new Date()
                            };
                        }
                    }
                }
            }

            // 规则引擎没有返回佣金计算
            logger.debug(`Rule engine did not calculate commission for shipment ${shipment.shipmentNumber}`, {
                shipmentId: shipment.id,
                eventsCount: ruleResult.events.length
            });

            // 返回0表示此策略不适用
            throw new Error('Rule engine did not produce commission calculation');
        } catch (error) {
            logger.debug(`Rule engine strategy failed for shipment ${shipment.shipmentNumber}:`, error);
            throw error;
        }
    }
}

/**
 * 司机费用覆盖策略
 * 优先级: 2
 */
export class DriverFeeOverrideStrategy implements SalaryCalculationStrategy {
    readonly name: SalaryCalculationStrategyType = 'driver-fee-override';

    canApply(context: SalaryCalculationContext): boolean {
        return !!(context.shipment.driverFee && context.shipment.driverFee > 0);
    }

    async calculate(context: SalaryCalculationContext): Promise<SalaryCalculationResult> {
        const { shipment } = context;

        if (!this.canApply(context)) {
            throw new Error('Driver fee override not available for this shipment');
        }

        const commission = shipment.driverFee!;

        logger.info(`Driver fee override applied for shipment ${shipment.shipmentNumber}`, {
            shipmentId: shipment.id,
            driverFee: commission
        });

        return {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            commission,
            strategy: this.name,
            details: {
                baseAmount: commission,
                overrideReason: 'Explicit driver fee set on shipment',
                finalCost: context.finalCost
            },
            calculatedAt: new Date()
        };
    }
}

/**
 * 手动调整策略
 * 优先级: 3 (最低，默认回退)
 */
export class ManualAdjustmentStrategy implements SalaryCalculationStrategy {
    readonly name: SalaryCalculationStrategyType = 'manual-adjustment';

    canApply(context: SalaryCalculationContext): boolean {
        // 总是可以应用（作为最后的回退）
        return true;
    }

    async calculate(context: SalaryCalculationContext): Promise<SalaryCalculationResult> {
        const { shipment } = context;

        logger.warn(`No automatic salary calculation method available for shipment ${shipment.shipmentNumber}. Manual adjustment required via bonus field.`, {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            driverId: shipment.driverId
        });

        return {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            commission: 0,
            strategy: this.name,
            details: {
                baseAmount: 0,
                overrideReason: 'No automatic calculation method available. Use bonus field in payroll summary for manual adjustment.',
                finalCost: context.finalCost
            },
            calculatedAt: new Date()
        };
    }
}

/**
 * 行程费用覆盖策略
 * 优先级: 1 (最高，通过行程的一口价覆盖单个运单费用)
 */
export class TripOverrideStrategy implements SalaryCalculationStrategy {
    readonly name: SalaryCalculationStrategyType = 'trip-override';

    canApply(context: SalaryCalculationContext): boolean {
        // 只有当运单属于某个行程，且该行程设置了有效的 Trip Fee (一口价) 时适用
        // 且行程必须包含至少一个运单（用于分摊）
        return !!(context.trip &&
            context.trip.tripFee !== undefined &&
            context.trip.tripFee !== null &&
            context.trip.tripFee > 0 &&
            context.trip.shipments &&
            context.trip.shipments.length > 0);
    }

    async calculate(context: SalaryCalculationContext): Promise<SalaryCalculationResult> {
        const { shipment, trip } = context;

        if (!trip || !trip.tripFee) {
            throw new Error('Trip context invalid for TripOverrideStrategy');
        }

        // 简单均摊逻辑：行程总费用 / 运单数量
        // Simple Proration: Trip Fee / Shipment Count
        const count = trip.shipments.length;
        const commission = Number((trip.tripFee / count).toFixed(2));

        logger.info(`Trip fee override applied for shipment ${shipment.shipmentNumber}`, {
            shipmentId: shipment.id,
            tripId: trip.id,
            tripFee: trip.tripFee,
            shipmentCount: count,
            proratedCommission: commission
        });

        return {
            shipmentId: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            commission,
            strategy: this.name,
            details: {
                baseAmount: trip.tripFee,
                overrideReason: `Prorated from Trip Fee (${trip.tripFee}) over ${count} shipments. Trip: ${trip.tripNo || trip.id}`,
                finalCost: context.finalCost
            },
            calculatedAt: new Date()
        };
    }
}

/**
 * 司机工资计算服务
 */
export class DriverSalaryService {
    private strategies: SalaryCalculationStrategy[];

    constructor(
        private dbService: DatabaseService,
        private ruleEngineService: RuleEngineService,
        private tenantId: string
    ) {
        // 按优先级顺序初始化策略
        this.strategies = [
            new TripOverrideStrategy(),           // Priority 1: Trip Fee Override (Highest)
            new RuleEngineStrategy(ruleEngineService, tenantId), // Priority 2: Rule Engine
            new DriverFeeOverrideStrategy(),      // Priority 3: Explicit Shipment Driver Fee
            new ManualAdjustmentStrategy()        // Priority 4: Manual Fallback
        ];
    }

    /**
     * 构建工资计算上下文
     */
    private buildContext(shipment: Shipment, driver?: Driver, trip?: Trip): SalaryCalculationContext {
        const finalCost = shipment.actualCost || shipment.estimatedCost;
        const distance = shipment.transportDistance || 0;
        const weight = shipment.cargoInfo.weight;
        const volume = shipment.cargoInfo.volume;

        const deliveryTime = (shipment.timeline?.delivered && shipment.timeline?.pickupInProgress)
            ? (new Date(shipment.timeline.delivered).getTime() - new Date(shipment.timeline.pickupInProgress).getTime())
            : 0;

        const customerLevel = shipment.customer?.level || 'standard';

        return {
            shipment,
            trip, // Add trip to context
            driver,
            finalCost,
            distance,
            weight,
            volume,
            deliveryTime,
            customerLevel
        };
    }

    /**
     * 计算单个运单的司机佣金
     * @param shipment 运单信息
     * @param driver 司机信息（可选）
     * @param trip 行程信息（可选，用于覆盖策略）
     * @returns 工资计算结果
     */
    async calculateCommission(shipment: Shipment, driver?: Driver, trip?: Trip): Promise<SalaryCalculationResult> {
        logger.debug(`Calculating commission for shipment ${shipment.shipmentNumber}`, {
            shipmentId: shipment.id,
            driverId: shipment.driverId,
            driverFee: shipment.driverFee,
            actualCost: shipment.actualCost,
            estimatedCost: shipment.estimatedCost
        });

        const context = this.buildContext(shipment, driver, trip);

        // 按优先级尝试每个策略
        for (const strategy of this.strategies) {
            if (strategy.canApply(context)) {
                try {
                    const result = await strategy.calculate(context);

                    logger.info(`Commission calculated using ${strategy.name} strategy`, {
                        shipmentId: shipment.id,
                        shipmentNumber: shipment.shipmentNumber,
                        strategy: strategy.name,
                        commission: result.commission
                    });

                    return result;
                } catch (error) {
                    // 如果策略失败，尝试下一个
                    logger.debug(`Strategy ${strategy.name} failed, trying next strategy`, {
                        shipmentId: shipment.id,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    continue;
                }
            }
        }

        // 如果所有策略都失败（理论上不应该发生，因为 ManualAdjustmentStrategy 总是可用）
        throw new Error(`Failed to calculate commission for shipment ${shipment.shipmentNumber}`);
    }

    /**
     * 批量计算运单的司机佣金
     * @param shipments 运单列表
     * @param driver 司机信息（可选）
     * @returns 工资计算结果列表
     */
    async calculateBatchCommissions(
        shipments: Shipment[],
        driver?: Driver
    ): Promise<SalaryCalculationResult[]> {
        logger.info(`Calculating batch commissions for ${shipments.length} shipments`, {
            driverId: driver?.id,
            shipmentCount: shipments.length
        });

        const results: SalaryCalculationResult[] = [];

        // 1. 收集所有相关的 tripId
        const tripIds = new Set(shipments.map(s => s.tripId).filter(Boolean) as string[]);
        const tripMap = new Map<string, Trip>();

        // 2. 批量获取行程信息 (如果存在)
        if (tripIds.size > 0) {
            try {
                // 直接查询数据库获取 trip 信息
                // Note: Manually mapping camelCase response if needed, assuming standard snake_case column names
                const query = `
                    SELECT id, trip_no as "tripNo", trip_fee as "tripFee", shipments 
                    FROM trips 
                    WHERE id = ANY($1) AND tenant_id = $2
                `;
                const queryResult = await this.dbService.query(query, [[...tripIds], this.tenantId]);

                queryResult.forEach((row: any) => {
                    // 构建最小化的 Trip 对象用于计算
                    const trip = {
                        id: row.id,
                        tripNo: row.tripNo,
                        tripFee: row.tripFee ? parseFloat(row.tripFee) : undefined,
                        shipments: row.shipments || [] // Assuming uuid[] array
                    } as Trip;
                    tripMap.set(trip.id!, trip);
                });

                logger.debug(`Fetched ${tripMap.size} trips for batch salary calculation`);
            } catch (error) {
                logger.error('Failed to fetch trips for salary calculation', error);
                // Continue without trip info (will fallback to other strategies)
            }
        }

        for (const shipment of shipments) {
            try {
                // 3. 获取该运单对应的 Trip (如果有)
                const trip = shipment.tripId ? tripMap.get(shipment.tripId) : undefined;

                const result = await this.calculateCommission(shipment, driver, trip);
                results.push(result);
            } catch (error) {
                logger.error(`Failed to calculate commission for shipment ${shipment.shipmentNumber}`, {
                    shipmentId: shipment.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });

                // 添加一个失败的结果，使用手动调整策略
                results.push({
                    shipmentId: shipment.id,
                    shipmentNumber: shipment.shipmentNumber,
                    commission: 0,
                    strategy: 'manual-adjustment',
                    details: {
                        baseAmount: 0,
                        overrideReason: `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        finalCost: shipment.actualCost || shipment.estimatedCost
                    },
                    calculatedAt: new Date()
                });
            }
        }

        const totalCommission = results.reduce((sum, r) => sum + r.commission, 0);

        logger.info(`Batch commission calculation completed`, {
            shipmentCount: shipments.length,
            totalCommission,
            strategiesUsed: [...new Set(results.map(r => r.strategy))]
        });

        return results;
    }

    /**
     * 获取运单的计算详情（用于调试和审计）
     * @param shipment 运单信息
     * @returns 计算详情
     */
    async getCalculationDetails(shipment: Shipment): Promise<{
        context: SalaryCalculationContext;
        applicableStrategies: SalaryCalculationStrategyType[];
        selectedStrategy?: SalaryCalculationStrategyType;
        result?: SalaryCalculationResult;
    }> {
        const context = this.buildContext(shipment);
        const applicableStrategies = this.strategies
            .filter(s => s.canApply(context))
            .map(s => s.name);

        try {
            const result = await this.calculateCommission(shipment);
            return {
                context,
                applicableStrategies,
                selectedStrategy: result.strategy,
                result
            };
        } catch (error) {
            return {
                context,
                applicableStrategies,
                selectedStrategy: undefined,
                result: undefined
            };
        }
    }
}
