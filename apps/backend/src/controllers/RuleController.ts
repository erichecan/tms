
import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { Rule, RuleStatus, RuleType } from '../types';
import { ruleEngineService } from '../services/RuleEngineService';


export const getRules = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;
        let sql = 'SELECT * FROM rules';
        const params: any[] = [];

        if (type) {
            sql += ' WHERE type = $1';
            params.push(type);
        }

        sql += ' ORDER BY priority DESC, created_at DESC';

        const result = await query(sql, params);
        res.json(result.rows);
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
