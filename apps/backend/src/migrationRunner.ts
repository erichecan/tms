import * as fs from 'fs';
import * as path from 'path';
import { pool } from './db-postgres';

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get already-applied migrations
    const { rows } = await client.query('SELECT filename FROM _migrations');
    const applied = new Set(rows.map((r: { filename: string }) => r.filename));

    // Read migration files in sorted order
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  [skip] ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      console.log(`  [run]  ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  [done] ${file}`);
      } catch (e) {
        await client.query('ROLLBACK');
        throw new Error(`Migration failed: ${file}\n${e}`);
      }
    }

    console.log('All migrations complete.');
  } finally {
    client.release();
  }
}

// Run directly when invoked as a script
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}
