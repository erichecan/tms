
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        console.log('Seeding specific Apony Group users...');

        const password = 'apony27669';
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Ensure Roles exist (especially Finance)
        // Note: 'roles' table schema depends on migrate.ts. Assuming id, name.
        // migrate.ts might have created 'roles' table. 
        // Let's try to insert safely.

        const roles = [
            { id: 'R-ADMIN', name: 'Administrator' },
            { id: 'R-DISPATCHER', name: 'Dispatcher' },
            { id: 'R-DRIVER', name: 'Driver' }, // Already exists usually
            { id: 'R-FINANCE', name: 'Finance Manager' }
        ];

        for (const r of roles) {
            await client.query(`
                INSERT INTO roles (id, name, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO NOTHING
            `, [r.id, r.name, r.name]); // Using separate param or just pass name again as $3
        }

        // 2. Assign Finance Permissions
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ('R-FINANCE', 'P-FINANCE-VIEW')
            ON CONFLICT DO NOTHING
        `);

        // 3. Create Users
        const users = [
            { name: 'Mason', email: 'mason@aponygroup.com', role: 'R-DISPATCHER' },
            { name: 'Agnes', email: 'agnes@aponygroup.com', role: 'R-DISPATCHER' },
            { name: 'George', email: 'george@aponygroup.com', role: 'R-FINANCE' },
            { name: 'Mark', email: 'mark@aponygroup.com', role: 'R-ADMIN' },
            { name: 'Eriche', email: 'eriche@aponygroup.com', role: 'R-ADMIN' }
        ];

        for (const u of users) {
            // Generate a simple ID or uuid? 
            // Existing IDs are U-01, U-DEMO-01. Let's use U-<Initial>-<Timestamp> or just U-<Name>
            const id = `U-${u.name.toUpperCase()}`;

            await client.query(`
                INSERT INTO users (id, name, email, password_hash, roleId, status, username)
                VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $3)
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = EXCLUDED.password_hash, roleId = EXCLUDED.roleId
            `, [id, u.name, u.email, hashedPassword, u.role]);

            console.log(`Created/Updated user: ${u.email} (${u.role})`);
        }

        console.log('Apony Users Created Successfully');

    } catch (e) {
        console.error('Error creating users:', e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
