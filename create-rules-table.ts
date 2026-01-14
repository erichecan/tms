import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.join(process.cwd(), 'apps/backend/.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config(); // fallback
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const createTableQuery = `
DROP TABLE IF EXISTS rules;
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

const seedDataQuery = `
INSERT INTO rules (name, description, type, priority, status, conditions, actions)
SELECT 'Base Pricing Rule', 'Standard per-km pricing', 'pricing', 10, 'active',
'[{"fact": "businessType", "operator": "notEqual", "value": "WASTE_COLLECTION"}]',
'[{"type": "calculateBaseFee", "params": {"baseFee": 100, "ratePerKm": 1.5, "subtractDistance": 0}}]'
WHERE NOT EXISTS (SELECT 1 FROM rules WHERE name = 'Base Pricing Rule');
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');

        await client.query(createTableQuery);
        console.log('Rules table created (if not exists).');

        await client.query(seedDataQuery);
        console.log('Seeded initial rule.');

        // Check if table exists and has data
        const res = await client.query('SELECT count(*) FROM rules');
        console.log(`Rules count: ${res.rows[0].count}`);

    } catch (err) {
        console.error('Error creating rules table:', err);
    } finally {
        await client.end();
    }
}

run();
