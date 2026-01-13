import { query } from '../db-postgres';
import { Customer } from '../types';

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        const result = await query('SELECT * FROM customers ORDER BY created_at DESC');
        return result.rows;
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (data: Omit<Customer, 'id' | 'created_at' | 'status'>): Promise<Customer> => {
        const id = `C-${Date.now()}`;
        const result = await query(
            `INSERT INTO customers (id, name, email, phone, address, businessType, taxId, creditLimit, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                id,
                data.name,
                data.email,
                data.phone,
                data.address,
                data.businessType,
                data.taxId,
                data.creditLimit || 0,
                'ACTIVE',
                new Date().toISOString()
            ]
        );
        return result.rows[0];
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer | null> => {
        const fields = Object.keys(data);
        const values = Object.values(data);
        if (fields.length === 0) return null;

        const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
        const result = await query(
            `UPDATE customers SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
            [...values, id]
        );
        return result.rows[0] || null;
    },

    delete: async (id: string): Promise<boolean> => {
        const result = await query('DELETE FROM customers WHERE id = $1 RETURNING id', [id]);
        return (result.rows.length > 0);
    }
};
