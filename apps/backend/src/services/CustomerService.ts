import { query } from '../db-postgres';
import { Customer } from '../types';

export const customerService = {
    getAll: async (params: { page?: number, limit?: number, search?: string } = {}): Promise<any> => {
        const page = params.page || 1;
        const limit = params.limit || 10;
        const offset = (page - 1) * limit;
        const search = (params.search || '').toLowerCase();

        let queryParams: any[] = [];
        let whereClauses = ["(u.roleid IN ('R-CUSTOMER', 'R-CLIENT') OR c.id IS NOT NULL)"];

        if (search) {
            queryParams.push(`%${search}%`);
            whereClauses.push(`(LOWER(COALESCE(c.name, u.name)) LIKE $${queryParams.length} OR LOWER(COALESCE(u.email, c.email)) LIKE $${queryParams.length} OR LOWER(c.company) LIKE $${queryParams.length})`);
        }

        const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

        // Count query
        const countRes = await query(`
            SELECT COUNT(*) 
            FROM customers c
            FULL OUTER JOIN users u ON c.id = u.id
            ${whereStr}
        `, queryParams);

        const total = parseInt(countRes.rows[0].count);

        // Data query
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
            ${whereStr}
            ORDER BY created_at DESC
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `, [...queryParams, limit, offset]);

        return {
            data: result.rows,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
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
