
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        await client.query('BEGIN');

        // 1. Fix Password Hash Schema
        console.log('Adding password_hash column...');
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(100)`);

        // Copy existing hashes (from my previous step) to new column
        // My previous step updated 'password' column with bcrypt hash.
        console.log('Migrating passwords to password_hash...');
        await client.query(`UPDATE users SET password_hash = password WHERE password LIKE '$2b$%'`);

        // 2. Create Permissions Structure (Missing in migrate.ts)
        console.log('Creating permissions tables...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS permissions (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                module VARCHAR(50),
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id VARCHAR(50),
                permission_id VARCHAR(50),
                PRIMARY KEY (role_id, permission_id),
                FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
                -- Note: foreign key to roles(id) if roles table exists. 
                -- migrate.ts created 'roles'. 
                -- But let's check if 'roles' table relies on mixed casing Id.
            );
        `);

        // Check if roles table has compatible ID for FK
        // migrate.ts: id VARCHAR(50) PRIMARY KEY
        // So we can add FK constraint safely.
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='fk_role_permissions_role') THEN
                    ALTER TABLE role_permissions ADD CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Auth Schema Fixes Applied Successfully');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Fix failed', e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
