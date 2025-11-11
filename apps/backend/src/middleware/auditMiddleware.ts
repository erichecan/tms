import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const dbService = new DatabaseService();

type AuditOptions = {
  entityType: string;
  operation: string;
  getEntityId?: (req: Request, res: Response) => string | undefined;
  capture?: (req: Request, res: Response) => { oldValue?: string | null; newValue?: string | null; extraData?: Record<string, any> };
}; // 2025-11-11T15:16:44Z Added by Assistant: Audit middleware options

/**
 * 审计中间件
 * 2025-11-11T15:16:44Z Added by Assistant: Persist audit trail for critical routes
 */
export const auditMiddleware = (options: AuditOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', async () => {
      if (res.statusCode >= 400) {
        return;
      }

      try {
        const defaultAudit = (res.locals.auditLog || {}) as { entityId?: string; oldValue?: string | null; newValue?: string | null; extraData?: Record<string, any> };
        const entityId = options.getEntityId ? options.getEntityId(req, res) : defaultAudit.entityId;
        if (!entityId || !req.user) {
          return;
        }

        const captureResult = options.capture ? options.capture(req, res) : defaultAudit;

        await dbService.recordAuditLog({
          tenantId: req.user.tenantId,
          entityType: options.entityType,
          entityId,
          operation: options.operation,
          actorId: req.user.id,
          actorType: 'user',
          ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
          userAgent: req.headers['user-agent'] as string | undefined || null,
          field: captureResult?.oldValue || captureResult?.newValue ? options.operation : undefined,
          oldValue: captureResult?.oldValue ?? null,
          newValue: captureResult?.newValue ?? null,
          extraData: {
            durationMs: Date.now() - start,
            ...(captureResult?.extraData ?? {})
          }
        });
      } catch (error) {
        logger.error('Failed to record audit log', error);
      }
    });

    next();
  };
};

