// 询价请求路由
// 创建时间: 2025-12-05 12:00:00
// 作用: 处理询价请求相关的 API 端点

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { DatabaseService } from '../services/DatabaseService';
import { QuoteRequestsService, CreateQuoteRequestInput, UpdateQuoteRequestInput, CreateFollowupInput } from '../services/QuoteRequestsService';
import { optionalAuthMiddleware, authMiddleware, roleMiddleware } from '../middleware/authMiddleware';
import { rateLimitByEmail } from '../middleware/rateLimitMiddleware';
import { logger } from '../utils/logger';
import { mailer } from '../services/mailer';

const router = Router();
const dbService = new DatabaseService();
const quoteRequestsService = new QuoteRequestsService(dbService);

/**
 * 通过 Cloud Functions 发送邮件
 * 2025-12-12 00:25:00 添加
 */
async function sendEmailViaCloudFunction(quoteRequest: any, functionUrl: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const dispatchEmails = process.env.DISPATCH_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) || [];
  
  if (dispatchEmails.length === 0) {
    throw new Error('未配置调度邮箱（DISPATCH_EMAILS）');
  }

  const servicesText = quoteRequest.services.join('、');
  
  // 构建订单数据 - 2025-12-12 00:25:00 支持托盘数量
  const items: Array<{ name: string; qty: number; weight: string }> = [];
  
  // 添加货物明细
  if (quoteRequest.pieces) {
    items.push({
      name: '货物',
      qty: quoteRequest.pieces,
      weight: `${quoteRequest.weightKg}kg`
    });
  } else {
    items.push({
      name: '货物',
      qty: 1,
      weight: `${quoteRequest.weightKg}kg`
    });
  }
  
  // 2025-12-12 00:25:00 添加托盘数量到明细
  if (quoteRequest.pallets) {
    items.push({
      name: '托盘',
      qty: quoteRequest.pallets,
      weight: '-'
    });
  }
  
  const orderData = {
    lang: 'zh-CN',
    brand: {
      name: process.env.COMPANY_NAME || 'Apony 物流',
      primaryColor: process.env.BRAND_PRIMARY_COLOR || '#FF6B35', // 2025-12-12 00:30:00 Apony 主橙色
      headerBg: process.env.BRAND_HEADER_BG || '#FF6B35', // 2025-12-12 00:30:00 使用主橙色作为头部背景
      headerFg: process.env.BRAND_HEADER_FG || '#ffffff' // 白色文字
    },
    order: {
      orderNo: quoteRequest.code,
      customerName: quoteRequest.contactName,
      amount: 0, // 询价阶段可能没有价格
      currency: 'CNY',
      pickupDate: quoteRequest.shipDate,
      link: `${frontendUrl}/admin/quote-requests/${quoteRequest.id}`,
      to: dispatchEmails[0], // 使用第一个邮箱，或从 Secret Manager 读取
      items: items,
      notes: quoteRequest.note || undefined
    }
  };

  // 如果有多个收件人，使用第一个作为主收件人，其他作为 CC
  if (dispatchEmails.length > 1) {
    // Cloud Functions 支持在 order.to 中设置多个邮箱（逗号分隔）
    orderData.order.to = dispatchEmails.join(',');
  }

  try {
    const response = await axios.post(functionUrl, orderData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000 // 30秒超时
    });

    if (response.data.ok) {
      logger.info('Cloud Functions 邮件发送成功', {
        quoteRequestId: quoteRequest.id,
        code: quoteRequest.code,
        messageId: response.data.messageId,
        to: dispatchEmails,
      });

      // 记录审计日志
      await dbService.recordAuditLog({
        tenantId: quoteRequest.tenantId || '00000000-0000-0000-0000-000000000000',
        entityType: 'quote_request',
        entityId: quoteRequest.id,
        operation: 'notify_dispatch',
        actorId: null,
        actorType: 'system',
        extraData: {
          method: 'cloud_function',
          to: dispatchEmails,
          messageId: response.data.messageId,
        },
      });
    } else {
      throw new Error(response.data.error || '邮件发送失败');
    }
  } catch (error: any) {
    logger.error('Cloud Functions 邮件发送失败', {
      error: error.message,
      quoteRequestId: quoteRequest.id,
      code: quoteRequest.code,
    });
    throw error;
  }
}

/**
 * @route POST /api/v1/quote-requests
 * @desc 创建询价请求（公开接口，支持可选认证）
 * @access Public (可选认证)
 */
router.post(
  '/',
  optionalAuthMiddleware, // 可选认证：如果用户已登录，关联客户ID
  rateLimitByEmail({
    key: 'quote-request',
    windowMs: 5 * 60 * 1000, // 5分钟
    max: 3, // 最多3次
  }),
  async (req: Request, res: Response) => {
    try {
      const body = req.body;

      // 验证必填字段
      if (!body.contactName || !body.email || !body.origin || !body.destination || !body.shipDate || !body.weightKg) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必填字段：contactName, email, origin, destination, shipDate, weightKg',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '邮箱格式不正确',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 验证服务类型
      if (!body.services || !Array.isArray(body.services) || body.services.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '至少选择一个服务类型',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 验证同意条款
      if (!body.consent) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '必须同意被联系',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 验证备注长度
      if (body.note && body.note.length > 500) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '备注不能超过500字',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 构建输入对象
      const input: CreateQuoteRequestInput = {
        tenantId: req.user?.tenantId, // 如果用户已登录，使用租户ID
        customerId: req.user?.id, // 如果用户已登录，关联客户ID
        company: body.company,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        origin: body.origin,
        destination: body.destination,
        shipDate: body.shipDate,
        weightKg: parseFloat(body.weightKg),
        volume: body.volume ? parseFloat(body.volume) : undefined,
        pieces: body.pieces ? parseInt(body.pieces, 10) : undefined,
        services: body.services,
        note: body.note,
      };

      // 创建询价请求
      const quoteRequest = await quoteRequestsService.create(input);

      // 记录审计日志
      try {
        await dbService.recordAuditLog({
          tenantId: req.user?.tenantId || '00000000-0000-0000-0000-000000000000', // 匿名用户使用默认租户
          entityType: 'quote_request',
          entityId: quoteRequest.id,
          operation: 'create',
          actorId: req.user?.id,
          actorType: req.user ? 'user' : 'anonymous',
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
          userAgent: req.headers['user-agent'] as string | undefined || null,
          extraData: {
            code: quoteRequest.code,
            email: quoteRequest.email,
          },
        });
      } catch (auditError: any) {
        logger.error('记录审计日志失败', auditError);
        // 不阻止请求继续
      }

      // 异步发送邮件通知（不阻塞响应）
      sendQuoteRequestEmail(quoteRequest).catch((error: any) => {
        logger.error('发送询价通知邮件失败', error);
        // 记录邮件发送失败的审计日志
        dbService.recordAuditLog({
          tenantId: req.user?.tenantId || '00000000-0000-0000-0000-000000000000',
          entityType: 'quote_request',
          entityId: quoteRequest.id,
          operation: 'notify_dispatch_failed',
          actorId: null,
          actorType: 'system',
          extraData: {
            error: error.message,
          },
        }).catch((auditError: any) => {
          logger.error('记录邮件失败审计日志失败', auditError);
        });
      });

      // 返回成功响应
      res.status(201).json({
        success: true,
        data: {
          id: quoteRequest.id,
          code: quoteRequest.code,
          status: quoteRequest.status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('创建询价请求失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || '创建询价请求失败',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/quote-requests
 * @desc 获取询价请求列表（管理员/调度员）
 * @access Private (dispatcher/admin)
 */
router.get(
  '/admin/quote-requests',
  authMiddleware,
  roleMiddleware(['dispatcher', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const params = {
        tenantId: req.user?.tenantId,
        status: req.query.status as any,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        serviceType: req.query.serviceType as any,
        keyword: req.query.keyword as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      };

      const result = await quoteRequestsService.list(params);

      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('获取询价请求列表失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || '获取询价请求列表失败',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route GET /api/v1/admin/quote-requests/:id
 * @desc 获取询价请求详情（管理员/调度员）
 * @access Private (dispatcher/admin)
 */
router.get(
  '/admin/quote-requests/:id',
  authMiddleware,
  roleMiddleware(['dispatcher', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const quoteRequest = await quoteRequestsService.getById(req.params.id);

      if (!quoteRequest) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '询价请求不存在',
          },
          timestamp: new Date().toISOString(),
        });
      }

      // 获取跟进记录
      const followups = await quoteRequestsService.getFollowups(req.params.id);

      res.json({
        success: true,
        data: {
          ...quoteRequest,
          followups,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('获取询价请求详情失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || '获取询价请求详情失败',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route PATCH /api/v1/admin/quote-requests/:id
 * @desc 更新询价请求（管理员/调度员）
 * @access Private (dispatcher/admin)
 */
router.patch(
  '/admin/quote-requests/:id',
  authMiddleware,
  roleMiddleware(['dispatcher', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const input: UpdateQuoteRequestInput = {
        status: req.body.status,
        assigneeId: req.body.assigneeId,
        note: req.body.note,
      };

      const quoteRequest = await quoteRequestsService.update(req.params.id, input);

      // 记录审计日志
      try {
        await dbService.recordAuditLog({
          tenantId: req.user!.tenantId,
          entityType: 'quote_request',
          entityId: quoteRequest.id,
          operation: 'update',
          actorId: req.user!.id,
          actorType: 'user',
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
          userAgent: req.headers['user-agent'] as string | undefined || null,
          extraData: {
            changes: input,
          },
        });
      } catch (auditError: any) {
        logger.error('记录审计日志失败', auditError);
      }

      res.json({
        success: true,
        data: quoteRequest,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('更新询价请求失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || '更新询价请求失败',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * @route POST /api/v1/admin/quote-requests/:id/followups
 * @desc 添加跟进记录（管理员/调度员）
 * @access Private (dispatcher/admin)
 */
router.post(
  '/admin/quote-requests/:id/followups',
  authMiddleware,
  roleMiddleware(['dispatcher', 'admin']),
  async (req: Request, res: Response) => {
    try {
      if (!req.body.note) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '跟进备注不能为空',
          },
          timestamp: new Date().toISOString(),
        });
      }

      const input: CreateFollowupInput = {
        note: req.body.note,
        nextActionAt: req.body.nextActionAt,
      };

      const followup = await quoteRequestsService.addFollowup(
        req.params.id,
        input,
        req.user!.id
      );

      // 记录审计日志
      try {
        await dbService.recordAuditLog({
          tenantId: req.user!.tenantId,
          entityType: 'quote_request',
          entityId: req.params.id,
          operation: 'followup_add',
          actorId: req.user!.id,
          actorType: 'user',
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
          userAgent: req.headers['user-agent'] as string | undefined || null,
          extraData: {
            followupId: followup.id,
            note: followup.note,
          },
        });
      } catch (auditError: any) {
        logger.error('记录审计日志失败', auditError);
      }

      res.status(201).json({
        success: true,
        data: followup,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error('添加跟进记录失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || '添加跟进记录失败',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * 发送询价通知邮件（异步）
 * 更新时间: 2025-12-12 00:25:00 支持 Cloud Functions 和直接 SMTP 两种方式
 * @param quoteRequest 询价请求
 * 2025-12-05 12:00:00
 */
async function sendQuoteRequestEmail(quoteRequest: any): Promise<void> {
  // 2025-12-12 00:25:00 优先使用 Cloud Functions（如果配置了）
  const cloudFunctionUrl = process.env.EMAIL_NOTIFIER_FUNCTION_URL;
  
  if (cloudFunctionUrl) {
    try {
      await sendEmailViaCloudFunction(quoteRequest, cloudFunctionUrl);
      return;
    } catch (error: any) {
      logger.warn('Cloud Functions 邮件发送失败，回退到直接 SMTP', error.message);
      // 继续执行直接 SMTP 方式
    }
  }

  // 回退到直接 SMTP 方式
  const dispatchEmails = process.env.DISPATCH_EMAILS?.split(',').map(email => email.trim()).filter(Boolean) || [];
  
  if (dispatchEmails.length === 0) {
    logger.warn('未配置调度邮箱（DISPATCH_EMAILS），跳过邮件通知');
    return;
  }

  const servicesText = quoteRequest.services.join('、');
  const subject = `新询价：${quoteRequest.origin} → ${quoteRequest.destination}（服务：${servicesText}）`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1890ff; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f5f5f5; padding: 20px; margin-top: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; }
        .value { margin-top: 5px; }
        .button { display: inline-block; background-color: #1890ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>新询价通知</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">询价编号：</div>
            <div class="value">${quoteRequest.code}</div>
          </div>
          <div class="field">
            <div class="label">联系人：</div>
            <div class="value">${quoteRequest.contactName}${quoteRequest.company ? ` (${quoteRequest.company})` : ''}</div>
          </div>
          <div class="field">
            <div class="label">联系方式：</div>
            <div class="value">${quoteRequest.email}${quoteRequest.phone ? ` | ${quoteRequest.phone}` : ''}</div>
          </div>
          <div class="field">
            <div class="label">路线：</div>
            <div class="value">${quoteRequest.origin} → ${quoteRequest.destination}</div>
          </div>
          <div class="field">
            <div class="label">预计发货日期：</div>
            <div class="value">${quoteRequest.shipDate}</div>
          </div>
          <div class="field">
            <div class="label">重量：</div>
            <div class="value">${quoteRequest.weightKg} kg</div>
          </div>
          ${quoteRequest.volume ? `
          <div class="field">
            <div class="label">体积：</div>
            <div class="value">${quoteRequest.volume}</div>
          </div>
          ` : ''}
          ${quoteRequest.pieces ? `
          <div class="field">
            <div class="label">件数：</div>
            <div class="value">${quoteRequest.pieces}</div>
          </div>
          ` : ''}
          ${quoteRequest.pallets ? `
          <div class="field">
            <div class="label">托盘数量：</div>
            <div class="value">${quoteRequest.pallets} 托</div>
          </div>
          ` : ''}
          <div class="field">
            <div class="label">服务类型：</div>
            <div class="value">${servicesText}</div>
          </div>
          ${quoteRequest.note ? `
          <div class="field">
            <div class="label">备注：</div>
            <div class="value">${quoteRequest.note}</div>
          </div>
          ` : ''}
          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/quote-requests/${quoteRequest.id}" class="button">
              查看详情并跟进
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
新询价通知

询价编号：${quoteRequest.code}
联系人：${quoteRequest.contactName}${quoteRequest.company ? ` (${quoteRequest.company})` : ''}
联系方式：${quoteRequest.email}${quoteRequest.phone ? ` | ${quoteRequest.phone}` : ''}
路线：${quoteRequest.origin} → ${quoteRequest.destination}
预计发货日期：${quoteRequest.shipDate}
重量：${quoteRequest.weightKg} kg
${quoteRequest.volume ? `体积：${quoteRequest.volume} m³\n` : ''}
${quoteRequest.pieces ? `件数：${quoteRequest.pieces} 件\n` : ''}
${quoteRequest.pallets ? `托盘数量：${quoteRequest.pallets} 托\n` : ''}
服务类型：${servicesText}
${quoteRequest.note ? `备注：${quoteRequest.note}\n` : ''}

查看详情：${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/quote-requests/${quoteRequest.id}
  `;

  const result = await mailer.send({
    to: dispatchEmails,
    subject,
    html,
    text,
  });

  if (result.success) {
    logger.info('询价通知邮件发送成功', {
      quoteRequestId: quoteRequest.id,
      code: quoteRequest.code,
      to: dispatchEmails,
    });

    // 记录邮件发送成功的审计日志
    await dbService.recordAuditLog({
      tenantId: quoteRequest.tenantId || '00000000-0000-0000-0000-000000000000',
      entityType: 'quote_request',
      entityId: quoteRequest.id,
      operation: 'notify_dispatch',
      actorId: null,
      actorType: 'system',
      extraData: {
        to: dispatchEmails,
        messageId: result.messageId,
      },
    });
  } else {
    throw new Error(result.error || '邮件发送失败');
  }
}

export default router;

