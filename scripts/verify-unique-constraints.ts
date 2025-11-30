// 验证数据库唯一性约束脚本
// 创建时间：2025-11-30T13:00:00Z
// 用途：检查数据库中的唯一性约束是否正确添加

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tms_user:tms_password@localhost:5432/tms_platform',
});

interface ConstraintInfo {
  tableName: string;
  constraintName: string;
  columns: string[];
  isPartial: boolean;
  condition?: string;
}

async function checkConstraint(
  tableName: string,
  constraintName: string,
  expectedColumns: string[]
): Promise<ConstraintInfo | null> {
  // 首先检查是否是唯一约束（pg_constraint）
  let query = `
    SELECT 
      con.conname as constraint_name,
      array_agg(a.attname ORDER BY conkey.ord) as columns,
      pg_get_constraintdef(con.oid) as definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY conkey(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = conkey.attnum
    WHERE rel.relname = $1
      AND con.conname = $2
      AND con.contype = 'u'
      AND nsp.nspname = 'public'
    GROUP BY con.conname, con.oid
  `;

  let result = await pool.query(query, [tableName, constraintName]);
  
  // 如果没找到约束，检查是否是唯一索引（部分唯一约束使用索引）
  if (result.rows.length === 0) {
    query = `
      SELECT 
        i.indexname as constraint_name,
        array_agg(a.attname ORDER BY array_position(idx.indkey::int[], a.attnum)) as columns,
        pg_get_indexdef(idx.indexrelid) as definition
      FROM pg_indexes i
      JOIN pg_class rel ON rel.relname = i.tablename
      JOIN pg_namespace nsp ON nsp.nspname = i.schemaname
      JOIN pg_class idx_class ON idx_class.relname = i.indexname
      JOIN pg_index idx ON idx.indexrelid = idx_class.oid
      CROSS JOIN LATERAL unnest(idx.indkey) WITH ORDINALITY idxkey(attnum, ord)
      JOIN pg_attribute a ON a.attrelid = rel.oid AND a.attnum = idxkey.attnum
      WHERE i.tablename = $1
        AND i.indexname = $2
        AND i.schemaname = 'public'
        AND idx.indisunique = true
      GROUP BY i.indexname, idx.indexrelid
    `;
    result = await pool.query(query, [tableName, constraintName]);
  }
  
  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  // 处理 columns - 可能是数组或字符串格式 {col1,col2}
  let columns: string[] = [];
  if (Array.isArray(row.columns)) {
    columns = row.columns;
  } else if (typeof row.columns === 'string') {
    // 处理 PostgreSQL 数组字符串格式 {col1,col2}
    columns = row.columns
      .replace(/^{|}$/g, '')
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean);
  } else if (row.columns) {
    columns = [String(row.columns)];
  }
  
  const definition = row.definition || '';
  
  // 检查是否是部分唯一约束（有 WHERE 条件）
  const isPartial = definition.toUpperCase().includes('WHERE');
  const condition = isPartial ? definition.match(/WHERE\s+(.+?)(?:\s*\))?$/i)?.[1] : undefined;

  return {
    tableName,
    constraintName,
    columns,
    isPartial,
    condition,
  };
}

async function verifyAllConstraints(): Promise<void> {
  console.log('🔍 开始验证数据库唯一性约束...\n');

  const expectedConstraints = [
    {
      table: 'customers',
      constraint: 'customers_tenant_id_name_key',
      columns: ['tenant_id', 'name'],
      description: '客户名称在同一租户内唯一',
    },
    {
      table: 'customers',
      constraint: 'customers_tenant_id_email_key',
      columns: ['tenant_id', 'email'],
      description: '客户邮箱在同一租户内唯一（如果 email 存在）',
      isPartial: true,
    },
    {
      table: 'drivers',
      constraint: 'drivers_tenant_id_phone_key',
      columns: ['tenant_id', 'phone'],
      description: '司机电话在同一租户内唯一（如果 phone 存在）',
      isPartial: true,
    },
    {
      table: 'drivers',
      constraint: 'drivers_tenant_id_license_number_key',
      columns: ['tenant_id', 'license_number'],
      description: '司机驾照号在同一租户内唯一（如果 license_number 存在）',
      isPartial: true,
    },
    {
      table: 'vehicles',
      constraint: 'vehicles_tenant_id_plate_number_key',
      columns: ['tenant_id', 'plate_number'],
      description: '车牌号在同一租户内唯一',
    },
    {
      table: 'shipments',
      constraint: 'shipments_tenant_id_shipment_number_key',
      columns: ['tenant_id', 'shipment_number'],
      description: '运单号在同一租户内唯一',
    },
    {
      table: 'financial_records',
      constraint: 'financial_records_tenant_id_reference_id_type_key',
      columns: ['tenant_id', 'reference_id', 'type'],
      description: '财务记录在同一租户内，同一 reference_id 和 type 组合唯一',
    },
  ];

  let allPassed = true;
  const missingConstraints: string[] = [];

  for (const expected of expectedConstraints) {
    const constraint = await checkConstraint(expected.table, expected.constraint, expected.columns);
    
    if (!constraint) {
      console.log(`❌ 缺失约束: ${expected.table}.${expected.constraint}`);
      console.log(`   描述: ${expected.description}`);
      console.log(`   期望列: ${expected.columns.join(', ')}\n`);
      allPassed = false;
      missingConstraints.push(`${expected.table}.${expected.constraint}`);
    } else {
      const constraintColsArray = Array.isArray(constraint.columns) ? constraint.columns : [constraint.columns].filter(Boolean);
      const expectedColsArray = Array.isArray(expected.columns) ? expected.columns : [expected.columns];
      const columnsMatch = JSON.stringify([...constraintColsArray].sort()) === JSON.stringify([...expectedColsArray].sort());
      const isPartialMatch = expected.isPartial ? constraint.isPartial : !constraint.isPartial;
      
      if (!columnsMatch || !isPartialMatch) {
        console.log(`⚠️  约束不匹配: ${expected.table}.${expected.constraint}`);
        console.log(`   期望列: ${expectedColsArray.join(', ')}, 实际列: ${constraintColsArray.join(', ')}`);
        console.log(`   期望部分约束: ${expected.isPartial}, 实际: ${constraint.isPartial}\n`);
        allPassed = false;
      } else {
        console.log(`✅ 约束存在: ${expected.table}.${expected.constraint}`);
        console.log(`   描述: ${expected.description}`);
        if (constraint.isPartial && constraint.condition) {
          console.log(`   条件: ${constraint.condition}`);
        }
        console.log('');
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ 所有唯一性约束验证通过！');
  } else {
    console.log('❌ 发现缺失或不匹配的约束！');
    console.log('\n缺失的约束:');
    missingConstraints.forEach(c => console.log(`  - ${c}`));
    console.log('\n请执行迁移脚本: migrations/add_unique_constraints.sql');
  }
  console.log('='.repeat(60));

  await pool.end();
  
  if (!allPassed) {
    process.exit(1);
  }
}

// 执行验证
verifyAllConstraints().catch(error => {
  console.error('验证过程中发生错误:', error);
  process.exit(1);
});

