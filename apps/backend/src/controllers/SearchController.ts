import { Request, Response } from 'express';
import { query } from '../db-postgres';

export const globalSearch = async (req: Request, res: Response) => {
    try {
        const search = (req.query.q as string || '').toLowerCase();
        if (!search || search.length < 2) {
            return res.json([]);
        }

        const params = [`%${search}%`];

        // Parallel queries
        const waybillsPromise = query(`
            SELECT id, waybill_no as title, status as subtitle, 'waybill' as type 
            FROM waybills 
            WHERE LOWER(waybill_no) LIKE $1 OR LOWER(customer_id) LIKE $1
            LIMIT 5
        `, params);

        const customersPromise = query(`
            SELECT id, name as title, email as subtitle, 'customer' as type 
            FROM customers 
            WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1
            LIMIT 3
        `, params);

        const driversPromise = query(`
            SELECT id, name as title, status as subtitle, 'driver' as type 
            FROM drivers 
            WHERE LOWER(name) LIKE $1
            LIMIT 3
        `, params);

        const [waybills, customers, drivers] = await Promise.all([
            waybillsPromise,
            customersPromise,
            driversPromise
        ]);

        const results = [
            ...waybills.rows.map(r => ({ ...r, link: `/waybills` })), // Ideally direct link /waybills/${r.id} but frontend routing might vary
            ...customers.rows.map(r => ({ ...r, link: `/customers` })),
            ...drivers.rows.map(r => ({ ...r, link: `/fleet` }))
        ];

        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Search failed' });
    }
};
