import { Engine } from 'json-rules-engine';
import { PricingCalculation, PricingDetail, Rule, RuleStatus } from '../types';
import { query } from '../db-postgres';

export class RuleEngineService {
    private engine: Engine;
    private zoneConfig: any;

    constructor() {
        this.engine = new Engine();
        this.zoneConfig = {
            center: { lat: 43.7254, lng: -79.4521 },
            baseRadiusKm: 25,
            baseRate: 180,
            overRadiusRatePerKm: 5,
            waitingFeePerHour: 20
        };
        this.loadRulesFromDb();
    }

    private async loadRulesFromDb() {
        try {
            const result = await query('SELECT * FROM rules WHERE status = $1', [RuleStatus.ACTIVE]);
            const rules: Rule[] = result.rows;

            // Clear current engine rules if necessary (re-initialization)
            this.engine = new Engine();

            rules.forEach(rule => {
                this.engine.addRule({
                    conditions: {
                        all: rule.conditions.map(c => ({
                            fact: c.fact,
                            operator: c.operator,
                            value: c.value
                        }))
                    },
                    event: {
                        type: 'ruleMatched',
                        params: {
                            ruleId: rule.id,
                            name: rule.name,
                            type: rule.type, // Added type to params
                            priority: rule.priority,
                            actions: rule.actions
                        }
                    },
                    priority: rule.priority
                });
            });
            console.log(`Loaded ${rules.length} active business rules into engine.`);
        } catch (error) {
            console.error('Failed to load rules from DB:', error);
        }
    }

    async calculatePrice(context: any): Promise<PricingCalculation> {
        // Reload rules from DB to ensure we have the latest (for development/dynamic changes)
        await this.loadRulesFromDb();

        const { distance, businessType } = context;
        const currency = 'CAD';
        const breakdown: PricingDetail[] = [];
        let total = 0;
        let appliedRules: string[] = [];

        // 1. Run json-rules-engine for dynamic logic
        const { events } = await this.engine.run(context);

        // Filter for PRICING rules only
        const pricingEvents = events.filter(e => e.type === 'ruleMatched' && e.params?.type === 'pricing');

        // Handle triggered actions
        pricingEvents.forEach(event => {
            appliedRules.push(event.params.name);
            const actions = event.params.actions;
            actions.forEach((action: any) => {
                if (action.type === 'addFee') {
                    const amount = parseFloat(action.params.amount || 0);
                    total += amount;
                    breakdown.push({
                        componentCode: `RULE_${event.params.ruleId}`,
                        componentName: event.params.name,
                        amount: amount,
                        currency,
                        formula: `Action: addFee(${amount})`,
                        inputValues: {},
                        sequence: breakdown.length + 1
                    });
                } else if (action.type === 'calculateBaseFee') {
                    const rate = parseFloat(action.params.ratePerKm || 0);
                    const baseFee = parseFloat(action.params.baseFee || 0);
                    const subtractDistance = parseFloat(action.params.subtractDistance || 0);

                    const effectiveDistance = Math.max(0, distance - subtractDistance);
                    const amount = baseFee + (effectiveDistance * rate);

                    total += amount;
                    breakdown.push({
                        componentCode: `RULE_${event.params.ruleId}_BASE`,
                        componentName: `${event.params.name}`,
                        amount: amount,
                        currency,
                        formula: effectiveDistance > 0
                            ? `Action: ${baseFee} + (${distance.toFixed(1)} - ${subtractDistance}) * ${rate}`
                            : `Action: Fixed ${baseFee} (within ${subtractDistance}km)`,
                        inputValues: { distance, rate, baseFee, subtractDistance },
                        sequence: breakdown.length + 1
                    });
                } else if (action.type === 'applyDiscount') {
                    const percentage = parseFloat(action.params.percentage || 0);
                    const discount = total * (percentage / 100);
                    total -= discount;
                    breakdown.push({
                        componentCode: `RULE_${event.params.ruleId}_DISC`,
                        componentName: `${event.params.name} (Discount)`,
                        amount: -discount,
                        currency,
                        formula: `Action: applyDiscount(${percentage}%)`,
                        inputValues: { totalBefore: total + discount, percentage },
                        sequence: breakdown.length + 1
                    });
                }
            });
        });

        // 2. Base Logic (Fallback if no rules override)
        if (breakdown.length === 0) {
            if (businessType === 'WASTE_COLLECTION') {
                total = 150;
                breakdown.push({
                    componentCode: 'WASTE_FIXED',
                    componentName: 'Waste Collection Base',
                    amount: 150,
                    currency,
                    formula: 'Fixed 150',
                    inputValues: {},
                    sequence: 1
                });
            } else {
                const { baseRadiusKm, baseRate, overRadiusRatePerKm } = this.zoneConfig;
                total += baseRate;
                breakdown.push({
                    componentCode: 'BASE_RATE',
                    componentName: 'Base Rate (Zone)',
                    amount: baseRate,
                    currency,
                    formula: `Fixed ${baseRate}`,
                    inputValues: { baseRadiusKm },
                    sequence: 1
                });

                if (distance > baseRadiusKm) {
                    const extraDist = distance - baseRadiusKm;
                    const distFee = extraDist * overRadiusRatePerKm;
                    total += distFee;
                    breakdown.push({
                        componentCode: 'DISTANCE_SURCHARGE',
                        componentName: 'Distance Surcharge',
                        amount: distFee,
                        currency,
                        formula: `(${distance.toFixed(2)} - ${baseRadiusKm}) * ${overRadiusRatePerKm}`,
                        inputValues: { distance, extraDist, rate: overRadiusRatePerKm },
                        sequence: 2
                    });
                }
            }
        }

        // 3. Waiting Time
        if (context.waitingTime) {
            const waitingFee = (context.waitingTime / 60) * this.zoneConfig.waitingFeePerHour;
            total += waitingFee;
            breakdown.push({
                componentCode: 'WAITING_FEE',
                componentName: 'Waiting Time Fee',
                amount: waitingFee,
                currency,
                formula: `${context.waitingTime}min * ${this.zoneConfig.waitingFeePerHour}/h`,
                inputValues: { time: context.waitingTime },
                sequence: breakdown.length + 1
            });
        }

        return {
            totalRevenue: parseFloat(total.toFixed(2)),
            breakdown,
            currency,
            distance,
            duration: context.duration || 0,
            appliedRules: appliedRules.length > 0 ? appliedRules : ['ZONE_PRICING_V1']
        };
    }

    async calculateDriverPay(context: any): Promise<{
        basePay: number;
        bonus: number;
        totalPay: number;
        currency: string;
        breakdown: PricingDetail[];
        conflictWarning: boolean;
        appliedRuleName?: string;
    }> {
        // Ensure rules are loaded
        if (!this.engine) await this.loadRulesFromDb(); // Or just await this.loadRulesFromDb() if we want fresh data every time

        const { distance } = context;
        const currency = context.currency || 'CAD'; // Default to CAD, but allow override
        const breakdown: PricingDetail[] = [];
        let basePay = 0;
        let bonus = 0;

        // 1. Run engine
        const { events } = await this.engine.run(context);

        // 2. Filter for PAYROLL rules
        const payrollEvents = events
            .filter(e => e.type === 'ruleMatched' && e.params?.type === 'payroll')
            .sort((a, b) => (b.params?.priority || 0) - (a.params?.priority || 0)); // Sort by priority DESC

        if (payrollEvents.length === 0) {
            // Default Fallback if no rules found
            return {
                basePay: 0,
                bonus: 0,
                totalPay: 0,
                currency,
                breakdown: [],
                conflictWarning: false
            };
        }

        // 3. Conflict Resolution: Pick Highest Priority
        const selectedRuleEvent = payrollEvents[0];
        const conflictWarning = payrollEvents.length > 1; // Mark conflict if multiple rules matched

        // 4. Calculate Pay based on Selected Rule
        const actions = selectedRuleEvent.params?.actions || [];
        actions.forEach((action: any) => {
            if (action.type === 'calculateBasePay') {
                const rate = parseFloat(action.params.ratePerKm || 0);
                const fixedPay = parseFloat(action.params.fixedPay || 0);

                const amount = fixedPay + (distance * rate);
                basePay += amount;

                breakdown.push({
                    componentCode: `PAY_RULE_${selectedRuleEvent.params.ruleId}`,
                    componentName: `${selectedRuleEvent.params.name}`,
                    amount: amount,
                    currency,
                    formula: `Action: ${fixedPay} + ${distance.toFixed(1)}km * ${rate}`,
                    inputValues: { distance, rate, fixedPay },
                    sequence: 1,
                    ruleId: selectedRuleEvent.params.ruleId
                });
            } else if (action.type === 'addPercentage') {
                // Example: % of Revenue (requires totalRevenue in context)
                if (context.totalRevenue) {
                    const percentage = parseFloat(action.params.percentage || 0);
                    const amount = context.totalRevenue * (percentage / 100);
                    basePay += amount;
                    breakdown.push({
                        componentCode: `PAY_RULE_${selectedRuleEvent.params.ruleId}_PCT`,
                        componentName: `${selectedRuleEvent.params.name} (% of Rev)`,
                        amount: amount,
                        currency,
                        formula: `${percentage}% of ${context.totalRevenue}`,
                        inputValues: { totalRevenue: context.totalRevenue, percentage },
                        sequence: breakdown.length + 1,
                        ruleId: selectedRuleEvent.params.ruleId
                    });
                }
            }
        });

        return {
            basePay: parseFloat(basePay.toFixed(2)),
            bonus: 0, // Bonus is manual, initially 0
            totalPay: parseFloat((basePay + bonus).toFixed(2)),
            currency,
            breakdown,
            conflictWarning,
            appliedRuleName: selectedRuleEvent.params.name
        };
    }
}

export const ruleEngineService = new RuleEngineService();
