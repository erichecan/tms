
import { Engine } from 'json-rules-engine';
import { PricingCalculation, PricingDetail } from '../types';

export class RuleEngineService {
    private engine: Engine;
    private zoneConfig: any; // In-memory config for now

    constructor() {
        this.engine = new Engine();

        // Default Config (Should be from DB)
        this.zoneConfig = {
            center: { lat: 43.7254, lng: -79.4521 }, // 3401 Dufferin St
            baseRadiusKm: 25,
            baseRate: 180,
            overRadiusRatePerKm: 5,
            waitingFeePerHour: 20
        };

        this.initializeRules();
    }

    private initializeRules() {
        // Rule: Zone Pricing
        // If distance <= baseRadius, price = baseRate
        // If distance > baseRadius, price = baseRate + (distance - baseRadius) * overRate

        // This logic is complex for standard json-rules-engine "conditions", 
        // usually we compute derived facts (isInsideZone, liabilityDistance) first before feeding to engine,
        // OR we use the engine to simply selecting the "Pricing Strategy" and do math in action.
        // For this task, we will implementation the math logic directly in the service for clarity 
        // and use the engine for "Policy Selection" (e.g. is this a Waste Collection? or Standard?).

        // Actually, let's implement the specific Zone Logic helper here first.
    }

    async calculatePrice(context: any): Promise<PricingCalculation> {
        const { distance, businessType } = context;
        const currency = 'CAD';
        const breakdown: PricingDetail[] = [];
        let total = 0;

        // 1. Base Logic (Zone Based)
        // Check if Custom Business Logic overrides this
        if (businessType === 'WASTE_COLLECTION') {
            // Waste Logic
            total = 150; // Example fixed
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
            // Standard Zone Logic
            const { baseRadiusKm, baseRate, overRadiusRatePerKm } = this.zoneConfig;

            // Base Fee
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

            // Distance Fee
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

        // 2. Waiting Time (if any)
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
                sequence: 3
            });
        }

        return {
            totalRevenue: parseFloat(total.toFixed(2)),
            breakdown,
            currency,
            distance,
            duration: context.duration || 0,
            appliedRules: ['ZONE_PRICING_V1']
        };
    }
}

export const ruleEngineService = new RuleEngineService();
