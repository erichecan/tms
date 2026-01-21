
import { mapsApiService } from './MapsApiService';
import { ruleEngineService } from './RuleEngineService';
import { PricingCalculation, LogisticsRouteRequest } from '../types';

export class PricingEngineService {

    async calculatePrice(request: LogisticsRouteRequest): Promise<PricingCalculation> {
        try {
            // 1. Calculate Distance & Duration via Google Maps
            const routeResult = await mapsApiService.getDistance(
                request.pickupAddress,
                request.deliveryAddress
            );

            // 2. Prepare Context for Rule Engine
            const context = {
                distance: routeResult.distance,
                duration: routeResult.duration,
                businessType: request.businessType,
                billingType: request.billingType || 'DISTANCE',
                waitingTime: request.waitingTimeLimit || 0,
                cargoInfo: request.cargoInfo
            };

            // 3. Evaluate Rules
            const pricingResult = await ruleEngineService.calculatePrice(context);

            return pricingResult;
        } catch (error: any) {
            console.error('Pricing Engine Error', error);
            throw error;
        }
    }
}

export const pricingEngineService = new PricingEngineService();
