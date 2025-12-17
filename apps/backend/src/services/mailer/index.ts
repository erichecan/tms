// 邮件服务模块
// 创建时间: 2025-12-05 12:00:00
// 更新时间: 2025-12-11 23:59:00 修复 logger 导入路径
// 更新时间: 2025-12-12 00:20:00 添加 GCP Secret Manager 支持
// 作用: 封装邮件发送功能，支持 SMTP 和 SendGrid，支持从 GCP Secret Manager 读取配置

import nodemailer from 'nodemailer';
import { logger } from '../../utils/logger';

// 2025-12-12 00:20:00 添加 Secret Manager 支持（可选，仅在 GCP 环境中使用）
let SecretManagerServiceClient: any = null;
try {
  const secretManager = require('@google-cloud/secret-manager');
  SecretManagerServiceClient = secretManager.SecretManagerServiceClient;
} catch (e) {
  // Secret Manager 未安装或不在 GCP 环境，使用环境变量
}

// 邮件配置接口
interface MailConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// 邮件发送选项
export interface MailOptions {
  to: string | string[]; // 收件人，可以是单个邮箱或邮箱数组
  subject: string; // 主题
  html?: string; // HTML 内容
  text?: string; // 纯文本内容
  cc?: string | string[]; // 抄送
  bcc?: string | string[]; // 密送
}

// 邮件发送结果
export interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MailerService {
  private transporter: nodemailer.Transporter | null = null;
  private config: MailConfig | null = null;
  private secretClient: any = null;
  private configCache: { smtpUser?: string; smtpPass?: string; smtpFrom?: string; cachedAt?: number } = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    // 2025-12-12 00:20:00 初始化 Secret Manager 客户端（如果可用）
    if (SecretManagerServiceClient) {
      try {
        this.secretClient = new SecretManagerServiceClient();
        logger.info('Secret Manager 客户端初始化成功');
      } catch (error: any) {
        logger.warn('Secret Manager 客户端初始化失败，将使用环境变量', error.message);
      }
    }
    this.initialize();
  }

  /**
   * 从 Secret Manager 读取密钥
   * 2025-12-12 00:20:00 添加
   */
  private async accessSecret(secretName: string): Promise<string | null> {
    if (!this.secretClient) {
      return null;
    }

    try {
      const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
      if (!projectId) {
        return null;
      }

      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await this.secretClient.accessSecretVersion({ name });
      return version.payload.data.toString('utf8');
    } catch (error: any) {
      logger.warn(`从 Secret Manager 读取 ${secretName} 失败，将使用环境变量`, error.message);
      return null;
    }
  }

  /**
   * 获取 SMTP 配置（优先从 Secret Manager，回退到环境变量）
   * 2025-12-12 00:20:00 添加
   */
  private async getSmtpConfig(): Promise<{ user: string; pass: string; from: string } | null> {
    const now = Date.now();
    
    // 检查缓存
    if (this.configCache.smtpUser && this.configCache.cachedAt && (now - this.configCache.cachedAt) < this.CACHE_TTL) {
      return {
        user: this.configCache.smtpUser,
        pass: this.configCache.smtpPass!,
        from: this.configCache.smtpFrom!,
      };
    }

    let smtpUser: string | null = null;
    let smtpPass: string | null = null;
    let smtpFrom: string | null = null;

    // 优先从 Secret Manager 读取
    if (this.secretClient) {
      smtpUser = await this.accessSecret('smtp_user') || null;
      smtpPass = await this.accessSecret('smtp_app_password') || null;
      smtpFrom = await this.accessSecret('smtp_from') || null;
    }

    // 回退到环境变量
    smtpUser = smtpUser || process.env.SMTP_USER || null;
    smtpPass = smtpPass || process.env.SMTP_PASS || null;
    smtpFrom = smtpFrom || process.env.SMTP_FROM || 'noreply@tms-platform.com';

    if (!smtpUser || !smtpPass) {
      return null;
    }

    // 更新缓存
    this.configCache = {
      smtpUser,
      smtpPass,
      smtpFrom,
      cachedAt: now,
    };

    return { user: smtpUser, pass: smtpPass, from: smtpFrom };
  }

  /**
   * 初始化邮件服务
   * 更新时间: 2025-12-12 00:20:00 支持从 Secret Manager 读取配置
   */
  private async initialize(): Promise<void> {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    // 2025-12-12 00:20:00 从 Secret Manager 或环境变量获取配置
    const smtpConfig = await this.getSmtpConfig();
    
    if (!smtpConfig) {
      logger.warn('邮件服务未配置，SMTP_USER 或 SMTP_PASS 缺失（检查环境变量或 Secret Manager）');
      return;
    }

    this.config = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // 465 端口使用 SSL
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      from: smtpConfig.from,
    };

    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      logger.info('邮件服务初始化成功', {
        host: this.config.host,
        port: this.config.port,
        from: this.config.from,
        configSource: this.secretClient ? 'Secret Manager' : 'Environment Variables',
      });
    } catch (error: any) {
      logger.error('邮件服务初始化失败', error);
      this.transporter = null;
    }
  }

  /**
   * 重新初始化邮件服务（用于配置更新后）
   * 2025-12-12 00:20:00 添加
   */
  async reinitialize(): Promise<void> {
    this.configCache = {}; // 清除缓存
    await this.initialize();
  }

  /**
   * 发送邮件
   * @param options 邮件选项
   * @returns 发送结果
   * 2025-12-05 12:00:00
   */
  async send(options: MailOptions): Promise<MailResult> {
    // 2025-12-12 00:20:00 如果 transporter 未初始化，尝试重新初始化
    if (!this.transporter || !this.config) {
      await this.reinitialize();
      
      if (!this.transporter || !this.config) {
        const error = '邮件服务未初始化，请检查 SMTP 配置（环境变量或 Secret Manager）';
        logger.error(error);
        return {
          success: false,
          error,
        };
      }
    }

    try {
      // 确保 to 是数组格式
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      
      // 验证收件人
      if (toArray.length === 0) {
        throw new Error('收件人不能为空');
      }

      const mailOptions = {
        from: this.config.from,
        to: toArray.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text || (options.html ? this.htmlToText(options.html) : undefined),
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('邮件发送成功', {
        messageId: info.messageId,
        to: toArray,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error('邮件发送失败', {
        error: error.message,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: false,
        error: error.message || '未知错误',
      };
    }
  }

  /**
   * 验证邮件服务配置
   * @returns 是否配置正确
   * 2025-12-05 12:00:00
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('邮件服务验证成功');
      return true;
    } catch (error: any) {
      logger.error('邮件服务验证失败', error);
      return false;
    }
  }

  /**
   * 简单的 HTML 转文本（用于纯文本回退）
   * @param html HTML 内容
   * @returns 纯文本内容
   * 2025-12-05 12:00:00
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // 移除 HTML 标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}

// 导出单例实例
export const mailer = new MailerService();

