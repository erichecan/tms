
import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { Rule, RuleStatus, RuleType } from '../types';
import { ruleEngineService } from '../services/RuleEngineService';



export const getRules = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string || '').toLowerCase();
        const type = req.query.type as string;

        let sql = 'FROM rules';
        let params: any[] = [];
        let whereClauses: string[] = [];

        if (type && type !== 'ALL') {
            params.push(type);
            whereClauses.push(`type = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`);
        }

        const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count
        const countRes = await query(`SELECT COUNT(*) ${sql} ${whereStr}`, params);
        const total = parseInt(countRes.rows[0].count);

        // Data
        const result = await query(`
            SELECT * ${sql} 
            ${whereStr} 
            ORDER BY priority DESC, created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        res.json({
            data: result.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch rules' });
    }
};

export const getRule = async (req: Request, res: Response) => {
    try {
        const result = await query('SELECT * FROM rules WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch rule' });
    }
};

export const createRule = async (req: Request, res: Response) => {
    const { name, description, type, priority, conditions, actions, status } = req.body;
    const id = `RULE-${Date.now()}`;

    try {
        const result = await query(
            `INSERT INTO rules (id, name, description, type, priority, conditions, actions, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                id,
                name,
                description || '',
                type || RuleType.PRICING,
                priority || 0,
                JSON.stringify(conditions || []),
                JSON.stringify(actions || []),
                status || RuleStatus.ACTIVE
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create rule' });
    }
};

export const updateRule = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, type, priority, conditions, actions, status } = req.body;

    try {
        const result = await query(
            `UPDATE rules SET 
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                type = COALESCE($3, type),
                priority = COALESCE($4, priority),
                conditions = COALESCE($5, conditions),
                actions = COALESCE($6, actions),
                status = COALESCE($7, status)
             WHERE id = $8 RETURNING *`,
            [
                name,
                description,
                type,
                priority,
                conditions ? JSON.stringify(conditions) : null,
                actions ? JSON.stringify(actions) : null,
                status,
                id
            ]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
        res.json(result.rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to update rule' });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    try {
        const result = await query('DELETE FROM rules WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
        res.json({ message: 'Rule deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete rule' });
    }
};

export const previewDriverPay = async (req: Request, res: Response) => {
    try {
        const { distance, businessType, cargoInfo, currency } = req.body;
        const context = {
            distance: parseFloat(distance || 0),
            businessType: businessType || 'STANDARD',
            cargoInfo,
            currency
        };
        const result = await ruleEngineService.calculateDriverPay(context);
        res.json(result);
    } catch (e) {
        console.error('Failed to preview driver pay', e);
        res.status(500).json({ error: 'Failed to calculate pay preview' });
    }
};

