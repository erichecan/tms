// 计费规则权限控制服务
// 创建时间: 2025-09-29 03:20:00
// 作用: 根据PRD权限要求，控制规则创建、编辑、发布的权限

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface UserContext {
  userId: string;
  tenantId: string;
  role: 'SYSTEM_ADMIN' | 'TENANT_ADMIN' | 'OPERATOR' | 'FINANCE' | 'DRIVER';
  permissions?: string[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface WorkflowState {
  templateId: string;
  state: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  approverUserId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export class PricingPermissionService {
  private db: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.db = dbService;
    logger.info('PricingPermissionService 初始化完成');
  }

  /**
   * 检查用户是否有权限创建定价模板
   */
  async canCreatePricingTemplate(userContext: UserContext): Promise<PermissionCheckResult> {
    // 根据PRD，只有管理员能创建规则
    if (!['SYSTEM_ADMIN', 'TENANT_ADMIN'].includes(userContext.role)) {
      return {
        allowed: false,
        reason: '只有管理员才能创建定价规则'
      };
    }

    // 检查租户级限制
    const limitReached = await this.checkTenantTemplateLimit(userContext.tenantId);
    if (limitReached) {
      return {
        allowed: false,
        reason: '租户定价模板数量已达上限'
      };
    }

    return { allowed: true };
  }

  /**
   * 检查用户是否有权限编辑定价模板
   */
  async canEditPricingTemplate(templateId: string, userContext: UserContext): Promise<PermissionCheckResult> {
    // 只有管理员能编辑规则
    if (!['SYSTEM_ADMIN', 'TENANT_ADMIN'].includes(userContext.role)) {
      return {
        allowed: false,
        reason: '只有管理员才能编辑定价规则'
      };
    }

    // 检查模板状态
    const template = await this.getTemplateWithPermissions(templateId, userContext);
    if (!template) {
      return {
        allowed: false,
        reason: '定价模板不存在或无权限访问'
      };
    }

    // 已经发布的模板需要特殊权限才能编辑
    if (template.state === 'published' && userContext.role !== 'SYSTEM_ADMIN') {
      return {
        allowed: false,
        reason: '已发布的模板需要系统管理员权限才能编辑'
      };
    }

    return { allowed: true };
  }

  /**
   * 检查用户是否有权限发布定价模板
   */
  async canPublishPricingTemplate(templateId: string, userContext: UserContext): Promise<PermissionCheckResult> {
    // 只有管理员能发布规则
    if (!['SYSTEM_ADMIN', 'TENANT_ADMIN'].includes(userContext.role)) {
      return {
        allowed: false,
        reason: '权限不足'
      };
    }

    // 检查模板准备状态
    const template = await this.getTemplateWithPermissions(templateId, userContext);
    if (!template) {
      return {
        allowed: false,
        reason: '模板不存在或无权限访问'
      };
    }

    if (template.state !== 'draft' && template.state !== 'approved') {
      return {
        allowed: false,
        reason: `当前状态 ${template.state} 不允许发布`
      };
    }

    // 检查是否需要进行审批
    const requiresApproval = await this.checkRequiresApproval(userContext);
    if (requiresApproval && template.state !== 'approved') {
      return {
        allowed: false,
        reason: '该操作需要审批流程'
      };
    }

    return { allowed: true };
  }

  /**
   * 创建工作流状态
   */
  async createWorkflowState(templateId: string, userContext: UserContext): Promise<WorkflowState> {
    const requiresApproval = await this.checkRequiresApproval(userContext);
    
    const workflowState: WorkflowState = {
      templateId,
      state: requiresApproval ? 'pending_approval' : 'approved',
      approverUserId: requiresApproval ? await this.findApprover(userContext) : undefined
    };

    // 保存到数据库
    await this.db.query(`
      INSERT INTO template_workflow_states (template_id, state, requester_user_id, approver_user_id, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [templateId, workflowState.state, userContext.userId, workflowState.approverUserId]);

    logger.info(`创建模板工作流状态`, { 
      templateId, 
      state: workflowState.state,
      requiresApproval 
    });

    return workflowState;
  }

  /**
   * 审批模板
   */
  async approveTemplate(templateId: string, approverContext: UserContext, approved: boolean, comment?: string): Promise<void> {
    const template = await this.getTemplateWithPermissions(templateId, approverContext);
    if (!template) {
      throw new Error('模板不存在或无权限访问');
    }

    if (template.state !== 'pending_approval') {
      throw new Error('模板当前状态不允许审批');
    }

    let newState: string;
    let rejectionReason: string | undefined;

    if (approved) {
      newState = 'approved';
    } else {
      newState = 'draft';
      rejectionReason = comment || '审批被拒绝';
    }

    // 更新工作流状态
    await this.db.query(`
      UPDATE template_workflow_states 
      SET state = $1, 
          rejection_reason = $2,
          approved_at = NOW()
      WHERE template_id = $3 AND approver_user_id = $4
    `, [newState, rejectionReason, templateId, approverContext.userId]);

    // 更新模板状态
    await this.db.query(`
      UPDATE pricing_templates 
      SET state = $1, updated_at = NOW()
      WHERE id = $2
    `, [newState, templateId]);

    logger.info(`模板审批完成`, { 
      templateId, 
      approved, 
      approver: approverContext.userId,
      newState 
    });

    // 发送通知
    await this.sendApprovalNotification(templateId, approved, comment);
  }

  /**
   * 发布已审批的模板
   */
  async publishTemplate(templateId: string, publisherContext: UserContext): Promise<void> {
    const canPublish = await this.canPublishPricingTemplate(templateId, publisherContext);
    if (!canPublish.allowed) {
      throw new Error(canPublish.reason);
    }

    await this.db.query(`
      UPDATE pricing_templates 
      SET state = 'published', updated_at = NOW()
      WHERE id = $1
    `, [templateId]);

    await this.db.query(`
      UPDATE template_workflow_states 
      SET state = 'published', published_at = NOW()
      WHERE template_id = $1
    `, [templateId]);

    logger.info(`模板发布完成`, { 
      templateId, 
      publisher: publisherContext.userId 
    });

    // 发送发布通知
    await this.sendPublishNotification(templateId);
  }

  /**
   * 检查租户模板数量限制
   */
  private async checkTenantTemplateLimit(tenantId: string): Promise<boolean> {
    const result = await this.db.query(`
      SELECT COUNT(*) as count FROM pricing_templates 
      WHERE tenant_id = $1 AND state != 'archived'
    `, [tenantId]);

    const currentCount = parseInt(result.rows[0].count);
    
    // 租户级限制：基础版最多20个，高级版最多100个模板
    // TODO: 从订阅信息获取限制
    const limit = await this.getTenantTemplateLimit(tenantId);
    
    return currentCount >= limit;
  }

  /**
   * 检查是否需要审批
 * 系统管理员可以跳过审批，租户管理员需要审批
   */
  private async checkRequiresApproval(userContext: UserContext): Promise<boolean> {
    return userContext.role !== 'SYSTEM_ADMIN';
  }

  /**
   * 查找审批人
   */
  private async findApprover(userContext: UserContext): Promise<string> {
    // 查找本租户的系统管理员或高级租户管理员
    const result = await this.db.query(`
      SELECT user_id FROM tenant_users tu
      WHERE tu.tenant_id = $1 
        AND tu.role IN ('TENANT_ADMIN', 'SYSTEM_ADMIN')
        AND tu.status = 'active'
      ORDER BY tu.role = 'SYSTEM_ADMIN' DESC
      LIMIT 1
    `, [userContext.tenantId]);

    if (result.rowCount === 0) {
      throw new Error('未找到合适的审批人');
    }

    return result.rows[0].user_id;
  }

  /**
   * 获取模板信息（包含权限检查）
   */
  private async getTemplateWithPermissions(templateId: string, userContext: UserContext): Promise<any> {
    const result = await this.db.query(`
      SELECT pt.*, tws.state as workflow_state
      FROM pricing_templates pt
      LEFT JOIN template_workflow_states tws ON pt.id = tws.template_id
      WHERE pt.id = $1 
        AND (pt.tenant_id = $2 OR $3 = 'SYSTEM_ADMIN')
      ORDER BY tws.created_at DESC
      LIMIT 1
    `, [templateId, userContext.tenantId, userContext.role]);

    return result.rowCount > 0 ? result.rows[0] : null;
  }

  /**
   * 获取租户模板限制
   */
  private async getTenantTemplateLimit(tenantId: string): Promise<number> {
    // TODO: 从订阅服务获取
    return 20; // 默认限制
  }

  /**
   * 发送审批通知
   */
  private async sendApprovalNotification(templateId: string, approved: boolean, comment?: string): Promise<void> {
    // TODO: 实现消息通知
    logger.info(`发送审批通知`, { templateId, approved, comment });
  }

  /**
   * 发送发布通知
   */
  private async sendPublishNotification(templateId: string): Promise<void> {
    // TODO: 实现消息通知
    logger.info(`发送发布通知`, { templateId });
  }

  /**
   * 获取用户的待审批列表
   */
  async getPendingApprovals(userContext: UserContext): Promise<any[]> {
    const result = await this.db.query(`
      SELECT pt.*, tws.*, u.name as requester_name
      FROM template_workflow_states tws
      INNER JOIN pricing_templates pt ON tws.template_id = pt.id
      INNER JOIN users u ON tws.requester_user_id = u.id
      WHERE tws.approver_user_id = $1 
        AND tws.state = 'pending_approval'
        AND pt.state != 'archived'
      ORDER BY tws.created_at ASC
    `, [userContext.userId]);

    return result.rows;
  }

  /**
   * 获取用户创建的模板状态
   */
  async getUserTemplateStatuses(userContext: UserContext): Promise<any[]> {
    const result = await this.db.query(`
      SELECT pt.*, tws.state as workflow_state, tws.rejection_reason
      FROM pricing_templates pt
      LEFT JOIN template_workflow_states tws ON pt.id = tws.template_id
      WHERE pt.created_by = $1 
        AND pt.tenant_id = $2
      ORDER BY pt.created_at DESC
    `, [userContext.userId, userContext.tenantId]);

    return result.rows;
  }
}
