
import { Request, Response } from 'express';
import { pricingEngineService } from '../services/PricingEngineService';

export const calculatePrice = async (req: Request, res: Response): Promise<void> => {
    try {
        const calculation = await pricingEngineService.calculatePrice(req.body);
        res.json(calculation);
    } catch (error: any) {
        console.error('API Error', error);
        res.status(500).json({ error: error.message || 'Pricing Calculation Failed' });
    }
};

