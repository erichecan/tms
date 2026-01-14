
import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { FinancialRecord, Statement } from '../types';

export class FinanceController {

    // Dashboard Metrics
    static async getDashboardMetrics(req: Request, res: Response) {
        try {
            // 1. Total Revenue (Receivables Paid)
            const revenueRes = await query(`SELECT SUM(amount) as total FROM financial_records WHERE type = 'receivable' AND status = 'PAID'`);
            const totalRevenue = parseFloat(revenueRes.rows[0].total || '0');

            // 2. Total Expenses (Payables Paid)
            const expenseRes = await query(`SELECT SUM(amount) as total FROM financial_records WHERE type = 'payable' AND status = 'PAID'`);
            const totalExpenses = parseFloat(expenseRes.rows[0].total || '0');

            // 3. Profit
            const profit = totalRevenue - totalExpenses;

            // 4. Overdue Receivables
            const overdueRes = await query(`SELECT SUM(amount) as total FROM financial_records WHERE type = 'receivable' AND status = 'OVERDUE'`);
            const overdueReceivables = parseFloat(overdueRes.rows[0].total || '0');

            // 5. Pending Payables
            const pendingPayablesRes = await query(`SELECT SUM(amount) as total FROM financial_records WHERE type = 'payable' AND status = 'PENDING'`);
            const pendingPayables = parseFloat(pendingPayablesRes.rows[0].total || '0');

            res.json({
                totalRevenue,
                totalExpenses,
                profit,
                overdueReceivables,
                pendingPayables
            });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to fetch finance metrics' });
        }
    }

    // List Financial Records
    static async getAttributes(req: Request, res: Response) {
        // Stub for getting attribute options if needed
        res.json({});
    }

    static async getFinancialRecords(req: Request, res: Response) {
        const { type, status, referenceId } = req.query;
        let sql = `SELECT * FROM financial_records WHERE 1=1`;
        const params: any[] = [];
        let paramIdx = 1;

        if (type) {
            sql += ` AND type = $${paramIdx++}`;
            params.push(type);
        }
        if (status) {
            sql += ` AND status = $${paramIdx++}`;
            params.push(status);
        }
        if (referenceId) {
            sql += ` AND reference_id = $${paramIdx++}`;
            params.push(referenceId);
        }

        sql += ` ORDER BY created_at DESC`;

        try {
            const result = await query(sql, params);
            res.json(result.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to fetch records' });
        }
    }

    // List Statements
    static async getStatements(req: Request, res: Response) {
        const { type, status } = req.query;
        let sql = `SELECT * FROM statements WHERE 1=1`;
        const params: any[] = [];
        let paramIdx = 1;

        if (type) {
            sql += ` AND type = $${paramIdx++}`;
            params.push(type);
        }
        if (status) {
            sql += ` AND status = $${paramIdx++}`;
            params.push(status);
        }

        sql += ` ORDER BY created_at DESC`;

        try {
            const result = await query(sql, params);
            res.json(result.rows);
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to fetch statements' });
        }
    }

    // Generate Statement (Draft)
    static async generateStatement(req: Request, res: Response) {
        const { type, referenceId, periodStart, periodEnd } = req.body;
        // generatedBy should come from auth middleware, mocking for now
        const generatedBy = (req as any).user?.id || 'SYSTEM';

        try {
            // 1. Find all pending records for this reference within the period
            // Note: In a real app, you might query shipments and create records if they don't exist, 
            // but let's assume records exist and are status = 'PENDING'
            // Or simpler: Find 'PENDING' financial_records for this ref.

            let recordType = type === 'customer' ? 'receivable' : 'payable';

            const pendingRecordsRes = await query(
                `SELECT * FROM financial_records 
             WHERE reference_id = $1 
             AND type = $2 
             AND status = 'PENDING' 
             AND created_at >= $3 
             AND created_at <= $4`,
                [referenceId, recordType, periodStart, periodEnd]
            );

            if (pendingRecordsRes.rows.length === 0) {
                return res.status(400).json({ error: 'No pending records found for this period' });
            }

            const items = pendingRecordsRes.rows as FinancialRecord[];
            const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
            const statementId = `ST-${Date.now()}`;

            // 2. Create Statement
            await query(
                `INSERT INTO statements (id, tenant_id, type, reference_id, period_start, period_end, total_amount, status, generated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [statementId, 'DEFAULT_TENANT', type, referenceId, periodStart, periodEnd, totalAmount, 'DRAFT', generatedBy]
            );

            // 3. Link records to statement (but keep status PENDING until Sent? Or mark as LOCKED? 
            // Let's keep them PENDING but link statement_id)
            for (const item of items) {
                await query(`UPDATE financial_records SET statement_id = $1 WHERE id = $2`, [statementId, item.id]);
            }

            res.json({ id: statementId, totalAmount, itemsCount: items.length });

        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to generate statement' });
        }
    }

    // Update Statement Status
    static async updateStatementStatus(req: Request, res: Response) {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'SENT'

        try {
            await query(`UPDATE statements SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);

            // If status is PAID, update all linked records
            if (status === 'PAID') {
                await query(`UPDATE financial_records SET status = 'PAID', paid_at = NOW() WHERE statement_id = $1`, [id]);
            }

            res.json({ success: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: 'Failed to update statement' });
        }
    }
}
