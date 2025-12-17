// 询价请求服务
// 创建时间: 2025-12-05 12:00:00
// 作用: 处理客户询价请求的业务逻辑

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

// 服务类型枚举
export type ServiceType = 'FTL' | 'LTL' | 'AIR' | 'SEA' | 'EXPRESS' | 'COLD';

// 询价状态枚举
export type QuoteRequestStatus = 'open' | 'pending' | 'contacted' | 'closed';

// 创建询价请求输入
// 更新时间: 2025-12-12 00:15:00 添加 pallets 字段
export interface CreateQuoteRequestInput {
  tenantId?: string; // 租户ID（可选）
  customerId?: string; // 客户ID（可选，如果客户已登录）
  company?: string; // 公司名（可选）
  contactName: string; // 联系人姓名（必填）
  email: string; // 邮箱（必填）
  phone?: string; // 电话（可选）
  origin: string; // 起始地（必填）
  destination: string; // 目的地（必填）
  shipDate: string; // 预计发货日期（必填，ISO 格式）
  weightKg: number; // 重量（kg，必填）
  volume?: number; // 体积（可选）
  pieces?: number; // 件数（可选）
  pallets?: number; // 托盘数量（可选）- 2025-12-12 00:15:00 添加
  services: ServiceType[]; // 服务类型（必填，数组）
  note?: string; // 备注（可选，最多500字）
}

// 更新询价请求输入
export interface UpdateQuoteRequestInput {
  status?: QuoteRequestStatus; // 状态
  assigneeId?: string; // 分配负责人ID
  note?: string; // 备注
}

// 查询询价请求参数
export interface ListQuoteRequestsParams {
  tenantId?: string; // 租户ID
  status?: QuoteRequestStatus | QuoteRequestStatus[]; // 状态筛选
  startDate?: string; // 开始日期
  endDate?: string; // 结束日期
  serviceType?: ServiceType; // 服务类型筛选
  keyword?: string; // 关键词搜索（编号、联系人、邮箱）
  page?: number; // 页码
  limit?: number; // 每页数量
}

// 询价请求实体
// 更新时间: 2025-12-12 00:15:00 添加 pallets 字段
export interface QuoteRequest {
  id: string;
  code: string;
  tenantId?: string;
  customerId?: string;
  company?: string;
  contactName: string;
  email: string;
  phone?: string;
  origin: string;
  destination: string;
  shipDate: string;
  weightKg: number;
  volume?: number;
  pieces?: number;
  pallets?: number; // 托盘数量（可选）- 2025-12-12 00:15:00 添加
  services: ServiceType[];
  note?: string;
  status: QuoteRequestStatus;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}

// 跟进记录输入
export interface CreateFollowupInput {
  note: string; // 跟进备注（必填）
  nextActionAt?: string; // 下次跟进时间（可选，ISO 格式）
}

// 跟进记录实体
export interface Followup {
  id: string;
  quoteRequestId: string;
  assigneeId?: string;
  note: string;
  nextActionAt?: string;
  createdAt: string;
}

export class QuoteRequestsService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    logger.info('QuoteRequestsService 初始化完成');
  }

  /**
   * 生成询价编号：QR-YYYYMMDD-XXXX
   * @returns 询价编号
   * 2025-12-05 12:00:00
   */
  async generateCode(): Promise<string> {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 查询当天已有的询价数量
    const query = `
      SELECT COUNT(*) as count
      FROM quote_requests
      WHERE code LIKE $1
    `;
    const prefix = `QR-${ymd}-`;
    const result = await this.dbService.query(query, [`${prefix}%`]);
    const count = parseInt(result.rows[0]?.count || '0', 10);
    
    // 生成序号（4位数字，从0001开始）
    const seq = (count + 1).toString().padStart(4, '0');
    
    return `${prefix}${seq}`;
  }

  /**
   * 创建询价请求
   * @param input 询价请求输入
   * @returns 创建的询价请求
   * 2025-12-05 12:00:00
   */
  async create(input: CreateQuoteRequestInput): Promise<QuoteRequest> {
    // 生成编号
    const code = await this.generateCode();

    // 验证备注长度
    if (input.note && input.note.length > 500) {
      throw new Error('备注不能超过500字');
    }

    // 验证服务类型
    if (!input.services || input.services.length === 0) {
      throw new Error('至少选择一个服务类型');
    }

    // 插入数据库 - 2025-12-12 00:15:00 添加 pallets 字段
    const query = `
      INSERT INTO quote_requests (
        code, tenant_id, customer_id, company, contact_name, email, phone,
        origin, destination, ship_date, weight_kg, volume, pieces, pallets,
        services, note, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING *
    `;

    const values = [
      code,
      input.tenantId || null,
      input.customerId || null,
      input.company || null,
      input.contactName,
      input.email,
      input.phone || null,
      input.origin,
      input.destination,
      input.shipDate,
      input.weightKg,
      input.volume || null,
      input.pieces || null,
      input.pallets || null, // 2025-12-12 00:15:00 添加托盘数量
      JSON.stringify(input.services),
      input.note || null,
      'open', // 默认状态为 open
    ];

    const result = await this.dbService.query(query, values);
    const row = result.rows[0];

    return this.mapRowToQuoteRequest(row);
  }

  /**
   * 获取询价请求详情
   * @param id 询价请求ID
   * @returns 询价请求详情
   * 2025-12-05 12:00:00
   */
  async getById(id: string): Promise<QuoteRequest | null> {
    const query = `
      SELECT *
      FROM quote_requests
      WHERE id = $1
    `;

    const result = await this.dbService.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToQuoteRequest(result.rows[0]);
  }

  /**
   * 获取询价请求列表
   * @param params 查询参数
   * @returns 询价请求列表和总数
   * 2025-12-05 12:00:00
   */
  async list(params: ListQuoteRequestsParams = {}): Promise<{
    data: QuoteRequest[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // 构建 WHERE 条件
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.tenantId) {
      conditions.push(`tenant_id = $${paramIndex++}`);
      values.push(params.tenantId);
    }

    if (params.status) {
      if (Array.isArray(params.status)) {
        conditions.push(`status = ANY($${paramIndex++})`);
        values.push(params.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        values.push(params.status);
      }
    }

    if (params.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      values.push(params.startDate);
    }

    if (params.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      values.push(params.endDate);
    }

    if (params.serviceType) {
      conditions.push(`services @> $${paramIndex++}`);
      values.push(JSON.stringify([params.serviceType]));
    }

    if (params.keyword) {
      conditions.push(`(
        code ILIKE $${paramIndex} OR
        contact_name ILIKE $${paramIndex} OR
        email ILIKE $${paramIndex}
      )`);
      values.push(`%${params.keyword}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM quote_requests ${whereClause}`;
    const countResult = await this.dbService.query(countQuery, values);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // 查询列表
    const listQuery = `
      SELECT *
      FROM quote_requests
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    values.push(limit, offset);
    const listResult = await this.dbService.query(listQuery, values);

    const data = listResult.rows.map(row => this.mapRowToQuoteRequest(row));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 更新询价请求
   * @param id 询价请求ID
   * @param input 更新输入
   * @returns 更新后的询价请求
   * 2025-12-05 12:00:00
   */
  async update(id: string, input: UpdateQuoteRequestInput): Promise<QuoteRequest> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }

    if (input.assigneeId !== undefined) {
      updates.push(`assignee_id = $${paramIndex++}`);
      values.push(input.assigneeId || null);
    }

    if (input.note !== undefined) {
      updates.push(`note = $${paramIndex++}`);
      values.push(input.note || null);
    }

    if (updates.length === 0) {
      // 如果没有更新项，直接返回原记录
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error('询价请求不存在');
      }
      return existing;
    }

    values.push(id);
    const query = `
      UPDATE quote_requests
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.dbService.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('询价请求不存在');
    }

    return this.mapRowToQuoteRequest(result.rows[0]);
  }

  /**
   * 添加跟进记录
   * @param quoteRequestId 询价请求ID
   * @param input 跟进记录输入
   * @param assigneeId 跟进人ID
   * @returns 创建的跟进记录
   * 2025-12-05 12:00:00
   */
  async addFollowup(
    quoteRequestId: string,
    input: CreateFollowupInput,
    assigneeId: string
  ): Promise<Followup> {
    // 验证询价请求是否存在
    const quoteRequest = await this.getById(quoteRequestId);
    if (!quoteRequest) {
      throw new Error('询价请求不存在');
    }

    const query = `
      INSERT INTO quote_request_followups (
        quote_request_id, assignee_id, note, next_action_at
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      quoteRequestId,
      assigneeId,
      input.note,
      input.nextActionAt || null,
    ];

    const result = await this.dbService.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      quoteRequestId: row.quote_request_id,
      assigneeId: row.assignee_id,
      note: row.note,
      nextActionAt: row.next_action_at ? new Date(row.next_action_at).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  /**
   * 获取询价请求的跟进记录列表
   * @param quoteRequestId 询价请求ID
   * @returns 跟进记录列表
   * 2025-12-05 12:00:00
   */
  async getFollowups(quoteRequestId: string): Promise<Followup[]> {
    const query = `
      SELECT *
      FROM quote_request_followups
      WHERE quote_request_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.dbService.query(query, [quoteRequestId]);

    return result.rows.map(row => ({
      id: row.id,
      quoteRequestId: row.quote_request_id,
      assigneeId: row.assignee_id,
      note: row.note,
      nextActionAt: row.next_action_at ? new Date(row.next_action_at).toISOString() : undefined,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /**
   * 将数据库行映射为 QuoteRequest 对象
   * @param row 数据库行
   * @returns QuoteRequest 对象
   * 2025-12-05 12:00:00
   */
  private mapRowToQuoteRequest(row: any): QuoteRequest {
    return {
      id: row.id,
      code: row.code,
      tenantId: row.tenant_id,
      customerId: row.customer_id,
      company: row.company,
      contactName: row.contact_name,
      email: row.email,
      phone: row.phone,
      origin: row.origin,
      destination: row.destination,
      shipDate: row.ship_date ? new Date(row.ship_date).toISOString().split('T')[0] : '',
      weightKg: parseFloat(row.weight_kg),
      volume: row.volume ? parseFloat(row.volume) : undefined,
      pieces: row.pieces ? parseInt(row.pieces, 10) : undefined,
      pallets: row.pallets ? parseInt(row.pallets, 10) : undefined, // 2025-12-12 00:15:00 添加托盘数量映射
      services: typeof row.services === 'string' ? JSON.parse(row.services) : row.services,
      note: row.note,
      status: row.status,
      assigneeId: row.assignee_id,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  }
}

