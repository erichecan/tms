import { query } from '../db-postgres';
import { Customer } from '../types';

export const customerService = {
    getAll: async (): Promise<Customer[]> => {
        // Unify Customers: Join customers table with users (Role: R-CUSTOMER/R-CLIENT)
        const result = await query(`
            SELECT 
                COALESCE(c.id, u.id) as id,
                COALESCE(c.name, u.name) as name,
                c.company,
                COALESCE(u.email, c.email) as email,
                c.phone,
                c.address,
                c.businessType as "businessType",
                c.taxId as "taxId",
                c.creditLimit as "creditLimit",
                COALESCE(c.status, u.status, 'ACTIVE') as status,
                COALESCE(c.created_at, u.created_at) as created_at
            FROM customers c
            FULL OUTER JOIN users u ON c.id = u.id
            WHERE u.roleid IN ('R-CUSTOMER', 'R-CLIENT') OR c.id IS NOT NULL
            ORDER BY created_at DESC
        `);
        return result.rows;
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        const result = await query('SELECT * FROM customers WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (data: Omit<Customer, 'id' | 'created_at' | 'status'>): Promise<Customer> => {
        const id = `C-${Date.now()}`;
        const result = await query(
            `INSERT INTO customers (id, name, company, email, phone, address, businessType, taxId, creditLimit, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                id,
                data.name,
                data.company,
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
