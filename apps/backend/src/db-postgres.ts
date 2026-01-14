import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
console.log('Connecting to DB URL:', dbUrl ? 'Found (Defined)' : 'Not Found (Using Defaults)');

const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

export const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : {
        rejectUnauthorized: false
    }
});

// Helper for single queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
