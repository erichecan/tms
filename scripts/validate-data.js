#!/usr/bin/env node
/**
 * 2025-11-11T15:41:58Z Added by Assistant: Data validation suite
 * 用于在上线前快速校验数据库中的核心业务数据
 */

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');
const dotenv = require('dotenv');

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const buildConnectionString = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME || 'tms_platform';
  const user = process.env.DB_USER || 'tms_user';
  const password = process.env.DB_PASSWORD || 'tms_password';
  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
};

const QUERIES = [
  {
    name: 'Delivered shipments without POD',
    sql: `
      SELECT COUNT(*) AS total
      FROM shipments s
      WHERE s.status IN ('delivered', 'pod_pending_review', 'completed')
        AND NOT EXISTS (
          SELECT 1 FROM proof_of_delivery pod WHERE pod.shipment_id = s.id
        );
    `,
    validate: (row) => Number(row.total) === 0,
    message: (row) => `${row.total} delivered shipments missing POD`
  },
  {
    name: 'Completed shipments without receivable record',
    sql: `
      SELECT COUNT(*) AS total
      FROM shipments s
      WHERE s.status = 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM financial_records fr
          WHERE fr.type = 'receivable'
            AND (fr.reference_id = s.customer_id OR fr.reference_id = s.id)
        );
    `,
    validate: (row) => Number(row.total) === 0,
    message: (row) => `${row.total} completed shipments missing receivable`
  },
  {
    name: 'Completed shipments without payable record',
    sql: `
      SELECT COUNT(*) AS total
      FROM shipments s
      WHERE s.status = 'completed'
        AND s.driver_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM financial_records fr
          WHERE fr.type = 'payable'
            AND fr.reference_id = s.driver_id
        );
    `,
    validate: (row) => Number(row.total) === 0,
    message: (row) => `${row.total} completed shipments missing driver payable`
  },
  {
    name: 'Shipments without timeline created timestamp',
    sql: `
      SELECT COUNT(*) AS total
      FROM shipments
      WHERE (timeline IS NULL OR (timeline->>'created') IS NULL);
    `,
    validate: (row) => Number(row.total) === 0,
    message: (row) => `${row.total} shipments missing timeline.created`
  },
  {
    name: 'Drivers without current location',
    sql: `
      SELECT COUNT(*) AS total
      FROM drivers
      WHERE current_location IS NULL;
    `,
    validate: (row) => Number(row.total) === 0,
    message: (row) => `${row.total} drivers missing current_location`
  }
];

async function run() {
  const connectionString = buildConnectionString();
  const client = new Client({ connectionString });
  const results = [];
  let failures = 0;

  console.log('🔍 Running data validation suite...');
  console.log(`📦 Database: ${connectionString}`);

  try {
    await client.connect();

    for (const check of QUERIES) {
      const res = await client.query(check.sql);
      const row = res.rows[0];
      const passed = check.validate(row);
      if (!passed) {
        failures++;
      }
      results.push({
        name: check.name,
        status: passed ? 'PASS' : 'FAIL',
        details: check.message(row)
      });
    }
  } catch (error) {
    console.error('❌ Validation aborted:', error);
    process.exitCode = 1;
    return;
  } finally {
    await client.end();
  }

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.details}`);
  }

  if (failures > 0) {
    console.log(`⚠️  Validation finished with ${failures} failure(s).`);
    process.exitCode = 1;
  } else {
    console.log('🎉 All data validation checks passed.');
  }
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

