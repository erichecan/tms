// 数据库服务
// 创建时间: 2025-01-27 15:30:45

import { Pool, PoolClient } from 'pg';
import { Rule, RuleExecution, Tenant, User, Customer, Driver, Shipment, FinancialRecord, QueryParams, PaginatedResponse, Statement } from '@tms/shared-types';
import { logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    console.log('DatabaseService constructor - DATABASE_URL:', process.env.DATABASE_URL); // 调试信息
    console.log('DatabaseService constructor - DB_HOST:', process.env.DB_HOST); // 调试信息
    console.log('DatabaseService constructor - DB_NAME:', process.env.DB_NAME); // 调试信息
    console.log('DatabaseService constructor - K_SERVICE:', process.env.K_SERVICE); // Cloud Run 环境检测
    
    // 连接配置兼容性处理 // 2025-09-25 23:38:00
    // 2025-10-17T15:15:00 - 添加 Cloud SQL Unix socket 支持
    const envUrl = process.env.DATABASE_URL;
    let poolConfig: any;

    // 检测是否在 Cloud Run 环境（通过 K_SERVICE 环境变量）
    const isCloudRun = process.env.K_SERVICE;
    
    if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('postgres')) {
      // 如果是 Cloud Run 环境，需要特殊处理连接字符串
      if (isCloudRun) {
        // 在 Cloud Run 中，使用 Unix socket 连接
        // 从连接字符串中提取密码：postgresql://user:password@host/db
        const match = envUrl.match(/postgresql:\/\/([^:]+):([^@]+)@/);
        if (!match) {
          logger.error('Malformed DATABASE_URL for Cloud Run environment. Expected format: postgresql://user:password@host/db');
          throw new Error('Invalid DATABASE_URL format for Cloud Run. Could not extract password.');
        }
        const password = match[2];
        const connectionName = 'aponytms:northamerica-northeast2:tms-database-toronto';
        const database = 'tms_platform';
        const user = 'tms_user';
        
        poolConfig = {
          host: `/cloudsql/${connectionName}`,
          database: database,
          user: user,
          password: password,
          // Cloud SQL 通过 Unix socket 连接不需要端口
        };
        console.log('Using Cloud SQL Unix socket connection:', { 
          host: `/cloudsql/${connectionName}`, 
          database, 
          user, 
          password: '***',
          extractedPassword: password.substring(0, 10) + '...' // 调试信息
        });
      } else {
        // 本地开发环境使用完整连接字符串
        poolConfig = { connectionString: envUrl };
        console.log('Using DATABASE_URL connection string:', envUrl);
      }
    } else {
      // 使用独立的环境变量配置
      const host = process.env.DB_HOST || 'localhost';
      const port = parseInt(process.env.DB_PORT || '5432', 10);
      const database = process.env.DB_NAME || 'tms_platform';
      const user = process.env.DB_USER || 'tms_user';
      const password = String(process.env.DB_PASSWORD || 'tms_password'); // 强制为字符串

      poolConfig = { host, port, database, user, password };
      console.log('Using individual DB config:', { host, port, database, user, password: '***' });
    }

    this.pool = new Pool({
      ...poolConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  /**
   * 获取数据库连接
   * @returns 数据库连接
   * 2025-10-01 14:50:10 调整为 public 以便服务内部复用（如计费保存事务）
   */
  public async getConnection(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * 执行查询
   * @param query SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  // 2025-10-01 14:50:10 统一返回 rows，以避免上层误用 rowCount/length
  public async query(query: string, params: any[] = []): Promise<any> {
    const client = await this.getConnection();
    try {
      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * 执行删除操作
   * @param query SQL查询语句
   * @param params 查询参数
   * @returns 删除结果
   */
  public async delete(query: string, params: any[] = []): Promise<{ rowCount: number }> {
    const client = await this.getConnection();
    try {
      const result = await client.query(query, params);
      return { rowCount: result.rowCount };
    } finally {
      client.release();
    }
  }

  /**
   * 开始事务
   * @returns 事务客户端
   */
  private async beginTransaction(): Promise<PoolClient> {
    const client = await this.getConnection();
    await client.query('BEGIN');
    return client;
  }

  /**
   * 提交事务
   * @param client 事务客户端
   */
  private async commitTransaction(client: PoolClient): Promise<void> {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * 回滚事务
   * @param client 事务客户端
   */
  private async rollbackTransaction(client: PoolClient): Promise<void> {
    await client.query('ROLLBACK');
    client.release();
  }

  // ==================== 租户管理 ====================

  /**
   * 创建租户
   * @param tenant 租户数据
   * @returns 创建的租户
   */
  async createTenant(tenant: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const query = `
      INSERT INTO tenants (name, domain, schema_name, status, settings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenant.name,
      tenant.domain,
      tenant.schemaName,
      tenant.status,
      JSON.stringify(tenant.settings)
    ]);
    
    return this.mapTenantFromDb(result[0]);
  }

  /**
   * 获取租户
   * @param tenantId 租户ID
   * @returns 租户信息
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    const query = 'SELECT * FROM tenants WHERE id = $1';
    const result = await this.query(query, [tenantId]);
    
    return result.length > 0 ? this.mapTenantFromDb(result[0]) : null;
  }

  /**
   * 根据域名获取租户
   * @param domain 域名
   * @returns 租户信息
   */
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    const query = 'SELECT * FROM tenants WHERE domain = $1';
    const result = await this.query(query, [domain]);
    
    return result.length > 0 ? this.mapTenantFromDb(result[0]) : null;
  }

  // ==================== 用户管理 ====================

  /**
   * 创建用户
   * @param tenantId 租户ID
   * @param user 用户数据
   * @returns 创建的用户
   */
  async createUser(tenantId: string, user: Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const query = `
      INSERT INTO users (tenant_id, email, password_hash, role, profile, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      user.email,
      user.passwordHash,
      user.role,
      JSON.stringify(user.profile),
      user.status
    ]);
    
    return this.mapUserFromDb(result[0]);
  }

  /**
   * 获取用户
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @returns 用户信息
   */
  async getUser(tenantId: string, userId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, userId]);
    
    return result.length > 0 ? this.mapUserFromDb(result[0]) : null;
  }

  /**
   * 根据邮箱获取用户
   * @param tenantId 租户ID
   * @param email 邮箱
   * @returns 用户信息
   */
  async getUserByEmail(tenantId: string, email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE tenant_id = $1 AND email = $2';
    const result = await this.query(query, [tenantId, email]);
    
    return result.length > 0 ? this.mapUserFromDb(result[0]) : null;
  }

  /**
   * 更新用户
   * @param tenantId 租户ID
   * @param userId 用户ID
   * @param updates 更新数据
   * @returns 更新后的用户
   */
  async updateUser(tenantId: string, userId: string, updates: Partial<Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const setClause: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'profile') {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(JSON.stringify(value));
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(value);
        }
        paramIndex++;
      }
    });
    
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE users 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;
    
    queryParams.push(tenantId, userId);
    const result = await this.query(query, queryParams);
    
    if (result.length === 0) {
      throw new Error('User not found');
    }
    
    return this.mapUserFromDb(result[0]);
  }

  // ==================== 规则管理 ====================

  /**
   * 创建规则
   * @param tenantId 租户ID
   * @param rule 规则数据
   * @returns 创建的规则
   */
  async createRule(tenantId: string, rule: Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Rule> {
    const query = `
      INSERT INTO rules (tenant_id, name, description, type, priority, conditions, actions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      rule.name,
      rule.description,
      rule.type,
      rule.priority,
      JSON.stringify(rule.conditions),
      JSON.stringify(rule.actions),
      rule.status
    ]);
    
    return this.mapRuleFromDb(result[0]);
  }

  /**
   * 获取规则
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   * @returns 规则信息
   */
  async getRule(tenantId: string, ruleId: string): Promise<Rule | null> {
    const query = 'SELECT * FROM rules WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, ruleId]);
    
    return result.length > 0 ? this.mapRuleFromDb(result[0]) : null;
  }

  /**
   * 获取活跃规则
   * @param tenantId 租户ID
   * @returns 活跃规则列表
   */
  async getActiveRules(tenantId: string): Promise<Rule[]> {
    const query = `
      SELECT * FROM rules 
      WHERE tenant_id = $1 AND status = 'active' 
      ORDER BY priority ASC, created_at ASC
    `;
    
    const result = await this.query(query, [tenantId]);
    return result.map(row => this.mapRuleFromDb(row));
  }

  /**
   * 获取规则列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页规则列表
   */
  async getRules(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Rule>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const typedFilters = filters as { type?: string; status?: string; };
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (typedFilters?.type) {
      whereClause += ` AND type = $${paramIndex}`;
      queryParams.push(typedFilters.type);
      paramIndex++;
    }
    
    if (typedFilters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(typedFilters.status);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM rules ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM rules 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapRuleFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  /**
   * 更新规则
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   * @param updates 更新数据
   * @returns 更新后的规则
   */
  async updateRule(tenantId: string, ruleId: string, updates: Partial<Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Rule> {
    const setClause: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'conditions' || key === 'actions') {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(JSON.stringify(value));
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(value);
        }
        paramIndex++;
      }
    });
    
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE rules 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;
    
    queryParams.push(tenantId, ruleId);
    const result = await this.query(query, queryParams);
    
    if (result.length === 0) {
      throw new Error('Rule not found');
    }
    
    return this.mapRuleFromDb(result[0]);
  }

  /**
   * 删除规则
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   */
  async deleteRule(tenantId: string, ruleId: string): Promise<void> {
    const query = 'DELETE FROM rules WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, ruleId]);
    
    if (result.length === 0) {
      throw new Error('Rule not found');
    }
  }

  // ==================== 规则执行日志 ====================

  /**
   * 创建规则执行记录
   * @param execution 执行记录
   * @returns 创建的记录
   */
  async createRuleExecution(execution: Omit<RuleExecution, 'id' | 'createdAt'>): Promise<RuleExecution> {
    const query = `
      INSERT INTO rule_executions (tenant_id, rule_id, context, result, execution_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      execution.tenantId,
      execution.ruleId,
      JSON.stringify(execution.context),
      JSON.stringify(execution.result),
      execution.executionTime
    ]);
    
    return this.mapRuleExecutionFromDb(result[0]);
  }

  /**
   * 获取规则执行统计
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 执行统计
   */
  async getRuleExecutionStats(tenantId: string, ruleId: string, startDate?: Date, endDate?: Date): Promise<any> {
    let whereClause = 'WHERE tenant_id = $1 AND rule_id = $2';
    const queryParams: any[] = [tenantId, ruleId];
    let paramIndex = 3;
    
    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total_executions,
        AVG(execution_time) as avg_execution_time,
        MIN(execution_time) as min_execution_time,
        MAX(execution_time) as max_execution_time,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_executions,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week_executions
      FROM rule_executions 
      ${whereClause}
    `;
    
    const result = await this.query(query, queryParams);
    return result[0];
  }

  // ==================== 数据映射方法 ====================

  private mapTenantFromDb(row: any): Tenant {
    return {
      id: row.id,
      name: row.name,
      domain: row.domain,
      schemaName: row.schema_name,
      status: row.status,
      settings: row.settings || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      profile: row.profile || {},
      status: row.status,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRuleFromDb(row: any): Rule {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      description: row.description,
      type: row.type,
      priority: row.priority,
      conditions: row.conditions || [],
      actions: row.actions || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRuleExecutionFromDb(row: any): RuleExecution {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      ruleId: row.rule_id,
      context: row.context || {},
      result: row.result || {},
      executionTime: row.execution_time,
      createdAt: row.created_at
    };
  }

  // ==================== 客户管理 ====================

  /**
   * 创建客户
   * @param tenantId 租户ID
   * @param customer 客户数据
   * @returns 创建的客户
   */
  async createCustomer(tenantId: string, customer: Omit<Customer, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const query = `
      INSERT INTO customers (
        tenant_id, name, level, phone, email, 
        contact_info, billing_info, 
        default_pickup_address, default_delivery_address
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      customer.name,
      customer.level,
      customer.phone || '',
      customer.email || '',
      JSON.stringify(customer.contactInfo),
      customer.billingInfo ? JSON.stringify(customer.billingInfo) : null,
      customer.defaultPickupAddress ? JSON.stringify(customer.defaultPickupAddress) : null,
      customer.defaultDeliveryAddress ? JSON.stringify(customer.defaultDeliveryAddress) : null
    ]);
    
    return this.mapCustomerFromDb(result[0]);
  }

  /**
   * 获取客户
   * @param tenantId 租户ID
   * @param customerId 客户ID
   * @returns 客户信息
   */
  async getCustomer(tenantId: string, customerId: string): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, customerId]);
    
    return result.length > 0 ? this.mapCustomerFromDb(result[0]) : null;
  }

  /**
   * 获取客户列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页客户列表
   */
  async getCustomers(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR contact_info->>'email' ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.level) {
      whereClause += ` AND level = $${paramIndex}`;
      queryParams.push(filters.level);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM customers 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapCustomerFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  // ==================== 司机管理 ====================

  /**
   * 创建司机
   * @param tenantId 租户ID
   * @param driver 司机数据
   * @returns 创建的司机
   */
  async createDriver(tenantId: string, driver: Omit<Driver, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Driver> {
    const query = `
      INSERT INTO drivers (tenant_id, name, phone, license_number, vehicle_info, status, performance)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      driver.name,
      driver.phone,
      driver.licenseNumber,
      JSON.stringify(driver.vehicleInfo),
      driver.status,
      JSON.stringify(driver.performance)
    ]);
    
    return this.mapDriverFromDb(result[0]);
  }

  /**
   * 更新司机信息
   * @param tenantId 租户ID
   * @param driverId 司机ID
   * @param updates 更新数据
   * @returns 更新后的司机信息
   */
  async updateDriver(tenantId: string, driverId: string, updates: Partial<Omit<Driver, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Driver | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.licenseNumber !== undefined) {
      updateFields.push(`license_number = $${paramIndex++}`);
      values.push(updates.licenseNumber);
    }
    if (updates.vehicleInfo !== undefined) {
      updateFields.push(`vehicle_info = $${paramIndex++}`);
      values.push(JSON.stringify(updates.vehicleInfo));
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.performance !== undefined) {
      updateFields.push(`performance = $${paramIndex++}`);
      values.push(JSON.stringify(updates.performance));
    }

    if (updateFields.length === 0) {
      return this.getDriver(tenantId, driverId);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(tenantId, driverId);

    const query = `
      UPDATE drivers 
      SET ${updateFields.join(', ')}
      WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
      RETURNING *
    `;

    const result = await this.query(query, values);
    
    if (result.length === 0) {
      return null;
    }

    return this.mapDriverFromDb(result[0]);
  }

  /**
   * 获取司机
   * @param tenantId 租户ID
   * @param driverId 司机ID
   * @returns 司机信息
   */
  async getDriver(tenantId: string, driverId: string): Promise<Driver | null> {
    const query = 'SELECT * FROM drivers WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, driverId]);
    
    return result.length > 0 ? this.mapDriverFromDb(result[0]) : null;
  }

  /**
   * 获取司机列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页司机列表
   */
  async getDrivers(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Driver>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM drivers ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM drivers 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapDriverFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  // ==================== 运单管理 ====================

  /**
   * 创建运单
   * @param tenantId 租户ID
   * @param shipment 运单数据
   * @returns 创建的运单
   */
  async createShipment(tenantId: string, shipment: Omit<Shipment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Shipment> {
    const query = `
      INSERT INTO shipments (
        tenant_id, shipment_number, customer_id, driver_id, 
        pickup_address, delivery_address, cargo_info, 
        estimated_cost, actual_cost, additional_fees, 
        applied_rules, status, timeline
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      shipment.shipmentNumber,
      shipment.customerId,
      shipment.driverId,
      JSON.stringify(shipment.pickupAddress),
      JSON.stringify(shipment.deliveryAddress),
      JSON.stringify(shipment.cargoInfo),
      shipment.estimatedCost,
      shipment.actualCost,
      JSON.stringify(shipment.additionalFees || []),
      JSON.stringify(shipment.appliedRules || []),
      shipment.status,
      JSON.stringify(shipment.timeline || {})
    ]);
    
    return this.mapShipmentFromDb(result[0]);
  }

  /**
   * 获取运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @returns 运单信息
   */
  async getShipment(tenantId: string, shipmentId: string): Promise<Shipment | null> {
    const query = 'SELECT * FROM shipments WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, shipmentId]);
    
    return result.length > 0 ? this.mapShipmentFromDb(result[0]) : null;
  }

  /**
   * 获取运单列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页运单列表
   */
  async getShipments(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Shipment>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (shipment_number ILIKE $${paramIndex} OR cargo_info->>'description' ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.customerId) {
      whereClause += ` AND customer_id = $${paramIndex}`;
      queryParams.push(filters.customerId);
      paramIndex++;
    }
    
    if (filters?.driverId) {
      whereClause += ` AND driver_id = $${paramIndex}`;
      queryParams.push(filters.driverId);
      paramIndex++;
    }
    
    if (filters?.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters?.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM shipments ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM shipments 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapShipmentFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  /**
   * 更新运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param updates 更新数据
   * @returns 更新后的运单
   */
  async updateShipment(tenantId: string, shipmentId: string, updates: Partial<Omit<Shipment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Shipment> {
    const setClause: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    // 字段名映射：TypeScript字段名 -> 数据库列名 // 2025-09-27 03:05:00
    const fieldMapping: Record<string, string> = {
      shipmentNumber: 'shipment_number',
      customerId: 'customer_id',
      driverId: 'driver_id',
      vehicleId: 'vehicle_id',
      pickupAddress: 'pickup_address',
      deliveryAddress: 'delivery_address',
      cargoInfo: 'cargo_info',
      estimatedCost: 'estimated_cost',
      actualCost: 'actual_cost',
      additionalFees: 'additional_fees',
      appliedRules: 'applied_rules'
    };

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbFieldName = fieldMapping[key] || key;
        
        if (['pickupAddress', 'deliveryAddress', 'cargoInfo', 'additionalFees', 'appliedRules', 'timeline'].includes(key)) {
          setClause.push(`${dbFieldName} = $${paramIndex}`);
          queryParams.push(JSON.stringify(value));
        } else {
          setClause.push(`${dbFieldName} = $${paramIndex}`);
          queryParams.push(value);
        }
        paramIndex++;
      }
    });
    
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE shipments 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;
    
    queryParams.push(tenantId, shipmentId);
    const result = await this.query(query, queryParams);
    
    if (result.length === 0) {
      throw new Error('Shipment not found');
    }
    
    return this.mapShipmentFromDb(result[0]);
  }

  // ==================== 财务记录管理 ====================

  /**
   * 创建财务记录
   * @param tenantId 租户ID
   * @param record 财务记录数据
   * @returns 创建的财务记录
   */
  async createFinancialRecord(tenantId: string, record: Omit<FinancialRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<FinancialRecord> {
    const query = `
      INSERT INTO financial_records (tenant_id, type, reference_id, amount, currency, status, due_date, paid_at, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      record.type,
      record.referenceId,
      record.amount,
      record.currency,
      record.status,
      record.dueDate,
      record.paidAt,
      record.description
    ]);
    
    return this.mapFinancialRecordFromDb(result[0]);
  }

  /**
   * 获取运单统计
   * @param tenantId 租户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 运单统计
   */
  async getShipmentStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<any> {
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(endDate);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'quoted') as quoted,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
        COUNT(*) FILTER (WHERE status = 'assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'picked_up') as picked_up,
        COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        SUM(actual_cost) as total_revenue,
        AVG(EXTRACT(EPOCH FROM (timeline->>'completed')::timestamp - (timeline->>'created')::timestamp)/3600) as avg_delivery_time_hours
      FROM shipments 
      ${whereClause}
    `;
    
    const result = await this.query(query, queryParams);
    return result[0];
  }

  // ==================== 对账单管理 ====================

  /**
   * 创建对账单
   * @param tenantId 租户ID
   * @param statement 对账单数据
   * @returns 创建的对账单
   */
  async createStatement(tenantId: string, statement: Omit<Statement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Statement> {
    const query = `
      INSERT INTO statements (
        tenant_id, type, reference_id, period_start, period_end, 
        items, total_amount, status, generated_at, generated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      statement.type,
      statement.referenceId,
      statement.period.start,
      statement.period.end,
      JSON.stringify(statement.items),
      statement.totalAmount,
      statement.status,
      statement.generatedAt,
      statement.generatedBy
    ]);
    
    return this.mapStatementFromDb(result[0]);
  }

  /**
   * 获取对账单
   * @param tenantId 租户ID
   * @param statementId 对账单ID
   * @returns 对账单信息
   */
  async getStatement(tenantId: string, statementId: string): Promise<Statement | null> {
    const query = 'SELECT * FROM statements WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, statementId]);
    
    return result.length > 0 ? this.mapStatementFromDb(result[0]) : null;
  }

  /**
   * 获取对账单列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页对账单列表
   */
  async getStatements(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Statement>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (reference_id ILIKE $${paramIndex} OR generated_by ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.type) {
      whereClause += ` AND type = $${paramIndex}`;
      queryParams.push(filters.type);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.referenceId) {
      whereClause += ` AND reference_id = $${paramIndex}`;
      queryParams.push(filters.referenceId);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM statements ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM statements 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapStatementFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  /**
   * 更新对账单
   * @param tenantId 租户ID
   * @param statementId 对账单ID
   * @param updates 更新数据
   * @returns 更新后的对账单
   */
  async updateStatement(tenantId: string, statementId: string, updates: Partial<Omit<Statement, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<Statement> {
    const setClause: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'items') {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(JSON.stringify(value));
        } else if (key === 'period') {
          const periodValue = value as any;
          setClause.push(`period_start = $${paramIndex}`, `period_end = $${paramIndex + 1}`);
          queryParams.push(periodValue.start, periodValue.end);
          paramIndex++;
        } else {
          setClause.push(`${key} = $${paramIndex}`);
          queryParams.push(value);
        }
        paramIndex++;
      }
    });
    
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE statements 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;
    
    queryParams.push(tenantId, statementId);
    const result = await this.query(query, queryParams);
    
    if (result.length === 0) {
      throw new Error('Statement not found');
    }
    
    return this.mapStatementFromDb(result[0]);
  }

  // ==================== 财务记录管理扩展 ====================

  /**
   * 获取财务记录列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页财务记录列表
   */
  async getFinancialRecords(tenantId: string, params: QueryParams): Promise<PaginatedResponse<FinancialRecord>> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE tenant_id = $1';
    const queryParams: any[] = [tenantId];
    let paramIndex = 2;
    
    if (search) {
      whereClause += ` AND (description ILIKE $${paramIndex} OR reference_id ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.type) {
      whereClause += ` AND type = $${paramIndex}`;
      queryParams.push(filters.type);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.referenceId) {
      whereClause += ` AND reference_id = $${paramIndex}`;
      queryParams.push(filters.referenceId);
      paramIndex++;
    }
    
    if (filters?.startDate) {
      whereClause += ` AND created_at >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }
    
    if (filters?.endDate) {
      whereClause += ` AND created_at <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM financial_records ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM financial_records 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapFinancialRecordFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  /**
   * 更新财务记录
   * @param tenantId 租户ID
   * @param recordId 记录ID
   * @param updates 更新数据
   * @returns 更新后的财务记录
   */
  async updateFinancialRecord(tenantId: string, recordId: string, updates: Partial<Omit<FinancialRecord, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<FinancialRecord> {
    const setClause: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause.push(`${key} = $${paramIndex}`);
        queryParams.push(value);
        paramIndex++;
      }
    });
    
    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    
    const query = `
      UPDATE financial_records 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;
    
    queryParams.push(tenantId, recordId);
    const result = await this.query(query, queryParams);
    
    if (result.length === 0) {
      throw new Error('Financial record not found');
    }
    
    return this.mapFinancialRecordFromDb(result[0]);
  }

  // ==================== 行程管理 ====================

  /**
   * 创建行程
   * @param tenantId 租户ID
   * @param trip 行程数据
   * @returns 创建的行程
   */
  async createTrip(tenantId: string, trip: any): Promise<any> {
    const query = `
      INSERT INTO trips (
        tenant_id, trip_no, status, driver_id, vehicle_id,
        legs, shipments, start_time_planned, end_time_planned, route_path
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const result = await this.query(query, [
      tenantId,
      trip.tripNo,
      trip.status || 'planning',
      trip.driverId,
      trip.vehicleId,
      JSON.stringify(trip.legs || []),
      JSON.stringify(trip.shipments || []),
      trip.startTimePlanned,
      trip.endTimePlanned,
      trip.routePath ? JSON.stringify(trip.routePath) : null
    ]);
    
    return this.mapTripFromDb(result[0]);
  }

  /**
   * 获取行程
   * @param tenantId 租户ID
   * @param tripId 行程ID
   * @returns 行程信息
   */
  async getTrip(tenantId: string, tripId: string): Promise<any | null> {
    const query = 'SELECT * FROM trips WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, tripId]);
    
    return result.length > 0 ? this.mapTripFromDb(result[0]) : null;
  }

  /**
   * 获取行程列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页行程列表
   */
  async getTrips(tenantId: string, params: any): Promise<any> {
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc', search, filters } = params;
    const offset = (page - 1) * limit;
    
    // trips 表没有 tenant_id 字段，所以不使用租户过滤 // 2025-10-17T21:25:00
    let whereClause = '';
    const queryParams: any[] = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` WHERE (status ILIKE $${paramIndex})`;
      queryParams.push(`%${search || ''}%`);
      paramIndex++;
    }
    
    if (filters?.status) {
      whereClause += whereClause ? ` AND status = $${paramIndex}` : ` WHERE status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }
    
    if (filters?.driverId) {
      whereClause += whereClause ? ` AND driver_id = $${paramIndex}` : ` WHERE driver_id = $${paramIndex}`;
      queryParams.push(filters.driverId);
      paramIndex++;
    }
    
    if (filters?.vehicleId) {
      whereClause += whereClause ? ` AND vehicle_id = $${paramIndex}` : ` WHERE vehicle_id = $${paramIndex}`;
      queryParams.push(filters.vehicleId);
      paramIndex++;
    }
    
    // 获取总数
    const countQuery = `SELECT COUNT(*) FROM trips ${whereClause}`;
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult[0].count);
    
    // 获取数据
    const dataQuery = `
      SELECT * FROM trips 
      ${whereClause}
      ORDER BY ${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    queryParams.push(limit, offset);
    const dataResult = await this.query(dataQuery, queryParams);
    
    return {
      success: true,
      data: dataResult.map(row => this.mapTripFromDb(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString(),
      requestId: ''
    };
  }

  /**
   * 更新行程
   * @param tenantId 租户ID
   * @param tripId 行程ID
   * @param updates 更新数据
   * @returns 更新的行程
   */
  async updateTrip(tenantId: string, tripId: string, updates: any): Promise<any | null> {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (['legs', 'shipments', 'routePath'].includes(key)) {
          setClause.push(`${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${paramIndex}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          setClause.push(`${dbKey} = $${paramIndex}`);
          values.push(updates[key]);
        }
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return null;
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(tenantId, tripId);

    const query = `
      UPDATE trips 
      SET ${setClause.join(', ')}
      WHERE tenant_id = $${paramIndex} AND id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.length > 0 ? this.mapTripFromDb(result[0]) : null;
  }

  /**
   * 删除行程
   * @param tenantId 租户ID
   * @param tripId 行程ID
   * @returns 是否删除成功
   */
  async deleteTrip(tenantId: string, tripId: string): Promise<boolean> {
    const query = 'DELETE FROM trips WHERE tenant_id = $1 AND id = $2';
    const result = await this.query(query, [tenantId, tripId]);
    return result.length > 0;
  }

  /**
   * 将运单挂载到行程
   * @param tenantId 租户ID
   * @param tripId 行程ID
   * @param shipmentIds 运单ID列表
   * @returns 更新后的行程
   */
  async mountShipmentsToTrip(tenantId: string, tripId: string, shipmentIds: string[]): Promise<any> {
    const client = await this.getConnection();
    try {
      await client.query('BEGIN');

      // 获取当前行程
      const tripQuery = 'SELECT * FROM trips WHERE tenant_id = $1 AND id = $2';
      const tripResult = await client.query(tripQuery, [tenantId, tripId]);
      
      if (tripResult.rows.length === 0) {
        throw new Error('Trip not found');
      }

      const currentTrip = tripResult.rows[0];
      const currentShipments = currentTrip.shipments || [];
      
      // 合并运单ID
      const updatedShipments = [...new Set([...currentShipments, ...shipmentIds])];

      // 更新行程
      const updateQuery = `
        UPDATE trips 
        SET shipments = $3, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1 AND id = $2
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [
        tenantId,
        tripId,
        JSON.stringify(updatedShipments)
      ]);

      await client.query('COMMIT');
      return this.mapTripFromDb(updateResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 更新行程状态
   * @param tenantId 租户ID
   * @param tripId 行程ID
   * @param status 新状态
   * @returns 更新的行程
   */
  async updateTripStatus(tenantId: string, tripId: string, status: string): Promise<any | null> {
    const query = `
      UPDATE trips 
      SET status = $3, updated_at = CURRENT_TIMESTAMP
      WHERE tenant_id = $1 AND id = $2
      RETURNING *
    `;
    
    const result = await this.query(query, [tenantId, tripId, status]);
    return result.length > 0 ? this.mapTripFromDb(result[0]) : null;
  }

  // ==================== 数据映射方法 ====================

  private mapCustomerFromDb(row: any): Customer {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      level: row.level,
      phone: row.phone || '',
      email: row.email || '',
      contactInfo: row.contact_info || {},
      billingInfo: row.billing_info,
      defaultPickupAddress: row.default_pickup_address,
      defaultDeliveryAddress: row.default_delivery_address,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapDriverFromDb(row: any): Driver {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      phone: row.phone,
      licenseNumber: row.license_number,
      vehicleInfo: row.vehicle_info || {},
      status: row.status,
      performance: row.performance || {
        rating: 0,
        totalDeliveries: 0,
        onTimeRate: 0,
        customerSatisfaction: 0
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapTripFromDb(row: any): any {
    return {
      id: row.id,
      // trips 表没有 tenant_id 字段 // 2025-10-17T21:25:00
      // tenantId: row.tenant_id,
      // trips 表没有 trip_no 字段，使用 id 作为 tripNo
      tripNo: row.id,
      status: row.status,
      driverId: row.driver_id,
      vehicleId: row.vehicle_id,
      // trips 表没有这些字段，使用默认值
      legs: [],
      shipments: [],
      startTimePlanned: row.start_time,
      endTimePlanned: row.end_time,
      startTimeActual: row.start_time,
      endTimeActual: row.end_time,
      routePath: row.route || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapShipmentFromDb(row: any): Shipment {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      shipmentNumber: row.shipment_number,
      customerId: row.customer_id,
      driverId: row.driver_id,
      // 2025-10-29 10:25:30 返回车辆ID
      vehicleId: row.vehicle_id,
      pickupAddress: row.pickup_address || {},
      deliveryAddress: row.delivery_address || {},
      cargoInfo: row.cargo_info || {},
      estimatedCost: row.estimated_cost,
      actualCost: row.actual_cost,
      additionalFees: row.additional_fees || [],
      appliedRules: row.applied_rules || [],
      status: row.status,
      timeline: row.timeline || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapFinancialRecordFromDb(row: any): FinancialRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      referenceId: row.reference_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      dueDate: row.due_date,
      paidAt: row.paid_at,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapStatementFromDb(row: any): Statement {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      type: row.type,
      referenceId: row.reference_id,
      period: {
        start: row.period_start,
        end: row.period_end
      },
      items: row.items || [],
      totalAmount: row.total_amount,
      status: row.status,
      generatedAt: row.generated_at,
      generatedBy: row.generated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // ==================== 车辆管理 ====================

  /**
   * 获取车辆列表
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 车辆列表
   */
  async getVehicles(limit: number = 50, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT 
        id,
        plate_number as "plateNumber",
        type as "vehicleType", 
        capacity_kg as "capacity",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vehicles 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.query(query, [limit, offset]);
    return result;
  }

  /**
   * 根据ID获取车辆
   * @param id 车辆ID
   * @returns 车辆信息
   */
  async getVehicleById(id: string): Promise<any | null> {
    const query = 'SELECT * FROM vehicles WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 创建车辆
   * @param vehicle 车辆数据
   * @returns 创建的车辆
   */
  async createVehicle(vehicle: {
    plateNumber: string;
    vehicleType: string;
    capacity: number;
    status: string;
  }): Promise<any> {
    const query = `
      INSERT INTO vehicles (plate_number, type, capacity_kg, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING 
        id,
        plate_number as "plateNumber",
        type as "vehicleType",
        capacity_kg as "capacity", 
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.query(query, [
      vehicle.plateNumber,
      vehicle.vehicleType,
      vehicle.capacity,
      vehicle.status
    ]);
    
    return result[0];
  }

  /**
   * 更新车辆
   * @param id 车辆ID
   * @param vehicle 车辆数据
   * @returns 更新后的车辆
   */
  async updateVehicle(id: string, vehicle: {
    plateNumber: string;
    vehicleType: string;
    capacity: number;
    status: string;
  }): Promise<any> {
    const query = `
      UPDATE vehicles 
      SET 
        plate_number = $1,
        type = $2,
        capacity_kg = $3,
        status = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING 
        id,
        plate_number as "plateNumber",
        type as "vehicleType",
        capacity_kg as "capacity", 
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;
    
    const result = await this.query(query, [
      vehicle.plateNumber,
      vehicle.vehicleType,
      vehicle.capacity,
      vehicle.status,
      id
    ]);
    
    if (result.length === 0) {
      throw new Error('Vehicle not found');
    }
    
    return result[0];
  }

  /**
   * 删除车辆
   * @param id 车辆ID
   */
  async deleteVehicle(id: string): Promise<void> {
    const query = 'DELETE FROM vehicles WHERE id = $1';
    await this.query(query, [id]);
  }

  /**
   * 删除司机
   * @param tenantId 租户ID
   * @param driverId 司机ID
   */
  async deleteDriver(tenantId: string, driverId: string): Promise<boolean> {
    const query = 'DELETE FROM drivers WHERE id = $1 AND tenant_id = $2';
    const result = await this.delete(query, [driverId, tenantId]);
    return result.rowCount > 0;
  }

  /**
   * 更新客户
   * @param tenantId 租户ID
   * @param customerId 客户ID
   * @param updates 更新数据
   * @returns 更新后的客户
   */
  async updateCustomer(tenantId: string, customerId: string, updates: any): Promise<any | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        if (key === 'contactInfo' || key === 'billingInfo') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return await this.getCustomer(tenantId, customerId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(customerId, tenantId);

    const query = `
      UPDATE customers 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 删除客户
   * @param tenantId 租户ID
   * @param customerId 客户ID
   */
  async deleteCustomer(tenantId: string, customerId: string): Promise<boolean> {
    const query = 'DELETE FROM customers WHERE id = $1 AND tenant_id = $2';
    const result = await this.delete(query, [customerId, tenantId]);
    return result.rowCount > 0;
  }

  // ==================== 货币管理 ====================

  /**
   * 获取货币列表
   * @param tenantId 租户ID
   * @returns 货币列表
   */
  async getCurrencies(tenantId: string): Promise<any[]> {
    const query = `
      SELECT * FROM currencies 
      WHERE tenant_id = $1 
      ORDER BY is_default DESC, created_at ASC
    `;
    const result = await this.query(query, [tenantId]);
    return result;
  }

  /**
   * 根据ID获取货币
   * @param tenantId 租户ID
   * @param id 货币ID
   * @returns 货币信息
   */
  async getCurrencyById(tenantId: string, id: string): Promise<any | null> {
    const query = 'SELECT * FROM currencies WHERE id = $1 AND tenant_id = $2';
    const result = await this.query(query, [id, tenantId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 创建货币
   * @param tenantId 租户ID
   * @param currency 货币数据
   * @returns 创建的货币
   */
  async createCurrency(tenantId: string, currency: {
    code: string;
    name: string;
    symbol: string;
    exchangeRate: number;
    isDefault: boolean;
    isActive: boolean;
  }): Promise<any> {
    const query = `
      INSERT INTO currencies (id, tenant_id, code, name, symbol, exchange_rate, is_default, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const id = `currency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.query(query, [
      id,
      tenantId,
      currency.code,
      currency.name,
      currency.symbol,
      currency.exchangeRate,
      currency.isDefault,
      currency.isActive
    ]);
    
    return result[0];
  }

  /**
   * 更新货币
   * @param tenantId 租户ID
   * @param id 货币ID
   * @param updates 更新数据
   * @returns 更新后的货币
   */
  async updateCurrency(tenantId: string, id: string, updates: any): Promise<any | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return await this.getCurrencyById(tenantId, id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, tenantId);

    const query = `
      UPDATE currencies 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 删除货币
   * @param tenantId 租户ID
   * @param id 货币ID
   */
  async deleteCurrency(tenantId: string, id: string): Promise<void> {
    const query = 'DELETE FROM currencies WHERE id = $1 AND tenant_id = $2';
    await this.query(query, [id, tenantId]);
  }

  /**
   * 更新默认货币
   * @param tenantId 租户ID
   * @param excludeId 排除的货币ID（设为null时取消所有默认货币）
   */
  async updateDefaultCurrency(tenantId: string, excludeId: string | null): Promise<void> {
    let query = 'UPDATE currencies SET is_default = false WHERE tenant_id = $1';
    const values = [tenantId];

    if (excludeId) {
      query += ' AND id != $2';
      values.push(excludeId);
    }

    await this.query(query, values);
  }

  // ==================== 连接管理 ====================

  /**
   * 关闭数据库连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
