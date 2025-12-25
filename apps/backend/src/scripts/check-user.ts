
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

async function check() {
    const client = await pool.connect();
    try {
        console.log('--- Checking Tenants ---');
        const tenants = await client.query('SELECT * FROM tenants');
        console.log('Tenants found:', tenants.rows.length);
        tenants.rows.forEach(t => console.log(`- ${t.name} (${t.domain}) ID: ${t.id}`));

        let tenantId = '00000000-0000-0000-0000-000000000001'; // Default
        const targetDomain = 'aponygroup.com';

        let tenant = tenants.rows.find(t => t.domain === targetDomain);
        if (!tenant) {
            console.log(`Tenant for ${targetDomain} not found. Using default or creating.`);
            // Check if default exists
            tenant = tenants.rows.find(t => t.id === tenantId);
            if (!tenant && tenants.rows.length > 0) {
                tenant = tenants.rows[0];
                tenantId = tenant.id;
                console.log(`Using first available tenant: ${tenant.name}`);
            } else if (!tenant) {
                console.log('Creating default tenant...');
                await client.query(`
                    INSERT INTO tenants (id, name, domain, status, created_at, updated_at)
                    VALUES ($1, 'Apony Logistics', $2, 'active', NOW(), NOW())
                 `, [tenantId, targetDomain]);
                tenantId = tenantId; // Confirmed
                console.log('Created tenant.');
            } else {
                tenantId = tenant.id;
            }
        } else {
            tenantId = tenant.id;
            console.log(`Found tenant: ${tenant.name} (${tenantId})`);
        }

        console.log('--- Checking User ---');
        const email = 'eriche@aponygroup.com';
        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            console.log('User not found. Creating...');
            const password = 'apony27669';
            const hash = await bcrypt.hash(password, 10);

            await client.query(`
                INSERT INTO users (
                    id, tenant_id, email, password_hash, role, status, profile, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, 'admin', 'active', '{}', NOW(), NOW()
                )
            `, [tenantId, email, hash]);
            console.log('User created with password: ' + password);
        } else {
            console.log('User found. Updating password just in case...');
            const user = userRes.rows[0];
            const password = 'apony27669';
            const hash = await bcrypt.hash(password, 10);

            await client.query(`
                UPDATE users SET password_hash = $1, tenant_id = $2, status = 'active' WHERE id = $3
            `, [hash, tenantId, user.id]);
            console.log('User password updated to: ' + password);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

check();
