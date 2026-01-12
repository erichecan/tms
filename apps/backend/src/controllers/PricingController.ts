
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

// --- Template Management ---

import { db } from '../db';
import { PricingTemplate } from '../types';

export const getTemplates = (req: Request, res: Response) => {
    res.json(db.pricingTemplates);
};

export const createTemplate = (req: Request, res: Response) => {
    const newTemplate: PricingTemplate = {
        id: `PT-${Date.now()}`,
        ...req.body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    db.pricingTemplates.push(newTemplate);
    res.status(201).json(newTemplate);
};

export const updateTemplate = (req: Request, res: Response) => {
    const idx = db.pricingTemplates.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Template not found' });

    db.pricingTemplates[idx] = {
        ...db.pricingTemplates[idx],
        ...req.body,
        updated_at: new Date().toISOString()
    };
    res.json(db.pricingTemplates[idx]);
};

export const deleteTemplate = (req: Request, res: Response) => {
    const idx = db.pricingTemplates.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).send();
    db.pricingTemplates.splice(idx, 1);
    res.status(204).send();
};
