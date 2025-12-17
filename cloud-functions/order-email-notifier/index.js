// Cloud Functions 邮件通知服务
// 创建时间: 2025-12-12 00:25:00
// 作用: 支持多语言、Logo、附件的高级邮件通知服务
// 部署: Cloud Functions 2nd gen, Node.js 18

import nodemailer from 'nodemailer';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretClient = new SecretManagerServiceClient();

/**
 * 从 Secret Manager 读取密钥
 * 2025-12-12 00:25:00
 */
async function accessSecret(name) {
  const [version] = await secretClient.accessSecretVersion({ name });
  return version.payload.data.toString('utf8');
}

/**
 * 从 Secret Manager 读取密钥（可选，失败返回 null）
 * 2025-12-12 00:25:00
 */
async function getSecretOrNull(name) {
  try {
    return await accessSecret(name);
  } catch (e) {
    return null;
  }
}

/**
 * 获取 SMTP 配置
 * 2025-12-12 00:25:00
 */
async function getConfig() {
  const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error('GCP_PROJECT or GOOGLE_CLOUD_PROJECT environment variable is required');
  }
  
  const path = (id) => `projects/${projectId}/secrets/${id}/versions/latest`;
  
  const smtpUser = await accessSecret(path('smtp_user'));
  const smtpPass = await accessSecret(path('smtp_app_password'));
  const from = await accessSecret(path('smtp_from'));
  const defaultTo = await getSecretOrNull(path('smtp_to_default')); // 可选
  const logoBase64Secret = await getSecretOrNull(path('smtp_logo_base64')); // 可选
  
  return { smtpUser, smtpPass, from, defaultTo, logoBase64Secret };
}

/**
 * 多语言字典
 * 2025-12-12 00:25:00
 */
const I18N = {
  'zh-CN': {
    subject: (o) => `新订单通知：${o.customerName || ''} — ${o.orderNo || ''}`,
    headerSubtitle: '自动通知 · 新订单创建',
    title: '新订单提醒',
    customer: '客户',
    orderNo: '订单号',
    amount: '报价金额',
    pickupDate: '预计提货',
    notes: '备注',
    openOrder: '打开订单详情',
    itemsTitle: '货品明细',
    itemName: '名称',
    itemQty: '数量',
    itemWeight: '重量',
    noItems: '无明细',
    footer: '本邮件由系统自动发送，请及时处理。如误收，请忽略。'
  },
  'en': {
    subject: (o) => `New Order Created: ${o.customerName || ''} — ${o.orderNo || ''}`,
    headerSubtitle: 'Automated Notification · New Order',
    title: 'New Order Notification',
    customer: 'Customer',
    orderNo: 'Order No.',
    amount: 'Quoted Amount',
    pickupDate: 'Pickup Date',
    notes: 'Notes',
    openOrder: 'Open Order Details',
    itemsTitle: 'Items',
    itemName: 'Item',
    itemQty: 'Qty',
    itemWeight: 'Weight',
    noItems: 'No items',
    footer: 'This is an automated email. Please take action accordingly. If received in error, please ignore.'
  }
};

/**
 * 标准化品牌配置
 * 2025-12-12 00:25:00
 */
function normalizeBrand(brand = {}) {
  // 2025-12-12 00:30:00 更新默认值为 Apony 品牌色
  return {
    name: brand.name || 'Apony 物流',
    primaryColor: brand.primaryColor || '#FF6B35', // Apony 主橙色
    headerBg: brand.headerBg || '#FF6B35', // Apony 主橙色
    headerFg: brand.headerFg || '#ffffff' // 白色文字
  };
}

/**
 * 渲染 HTML 邮件模板
 * 更新时间: 2025-12-12 00:30:00 优化模板，确保邮箱客户端兼容性
 */
function renderHtmlTemplate(order, lang = 'zh-CN', brand = {}, logoCid) {
  const t = I18N[lang] || I18N['zh-CN'];
  const B = normalizeBrand(brand);

  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items.map(it => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(it.name || '-')}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${it.qty ?? 0}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(String(it.weight || '-'))}</td>
      </tr>
    `).join('');

  const logoImg = logoCid ? `
      <img src="cid:${logoCid}" alt="${escapeHtml(B.name)}" style="height:24px; vertical-align:middle; margin-right:12px;" />
    ` : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Noto Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Heiti SC', 'Source Han Sans', sans-serif; color:#1f2937;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;">
        <tr>
          <td style="padding:20px; background:${B.headerBg}; color:${B.headerFg};">
            <div>
              ${logoImg}
              <span style="font-size:18px; font-weight:600; vertical-align:middle;">${escapeHtml(B.name)}</span>
            </div>
            <div style="font-size:14px; opacity:.85; margin-top:6px;">${t.headerSubtitle}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h2 style="margin:0 0 8px 0; font-size:20px;">${t.title}</h2>
            <p style="margin:4px 0;">${t.customer}：<b>${escapeHtml(order.customerName || '-')}</b></p>
            <p style="margin:4px 0;">${t.orderNo}：<b>${escapeHtml(order.orderNo || '-')}</b></p>
            <p style="margin:4px 0;">${t.amount}：<b>${order.amount ?? '-'} ${escapeHtml(order.currency || '')}</b></p>
            <p style="margin:4px 0;">${t.pickupDate}：<b>${escapeHtml(order.pickupDate || '-')}</b></p>
            ${order.notes ? `<p style="margin:4px 0;">${t.notes}：${escapeHtml(order.notes)}</p>` : ''}
            ${order.link ? `
              <p style="margin:16px 0;">
                <a href="${escapeHtml(order.link)}" target="_blank" style="background:${B.primaryColor};color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">
                  ${t.openOrder}
                </a>
              </p>` : ''}
            <h3 style="margin:16px 0 8px 0; font-size:16px;">${t.itemsTitle}</h3>
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; font-size:14px;">
              <thead>
                <tr>
                  <th style="text-align:left; padding:8px; border-bottom:2px solid #111827;">${t.itemName}</th>
                  <th style="text-align:right; padding:8px; border-bottom:2px solid #111827;">${t.itemQty}</th>
                  <th style="text-align:right; padding:8px; border-bottom:2px solid #111827;">${t.itemWeight}</th>
                </tr>
              </thead>
              <tbody>
                ${itemRows || `<tr><td colspan="3" style="padding:8px;">${t.noItems}</td></tr>`}
              </tbody>
            </table>
            <p style="margin-top:16px; font-size:12px; color:#6b7280;">${t.footer}</p>
          </td>
        </tr>
      </table>
    </div>`;
}

/**
 * HTML 转义函数
 * 2025-12-12 00:25:00
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 构建附件列表
 * 2025-12-12 00:25:00
 */
function buildAttachments(order, logoBase64, logoCid = 'company-logo') {
  const attachments = [];

  // CSV 明细附件 - 2025-12-12 00:30:00 优化 CSV 格式
  if (order.items && order.items.length) {
    const header = 'name,qty,weight\n';
    const rows = order.items.map(i => {
      const name = (i.name || '').replace(/"/g, '""');
      return `${name || ''},${i.qty ?? 0},${i.weight || ''}`;
    }).join('\n');
    const csv = header + rows;
    attachments.push({
      filename: `order-${order.orderNo || 'unknown'}-items.csv`,
      content: csv,
      contentType: 'text/csv'
    });
  }

  // 外部传入的 PDF/其他附件
  if (order.attachments && Array.isArray(order.attachments)) {
    for (const a of order.attachments) {
      if (a.base64) {
        attachments.push({
          filename: a.filename || 'attachment.pdf',
          content: Buffer.from(a.base64, 'base64'),
          contentType: a.contentType || 'application/pdf'
        });
      }
    }
  }

  // 公司 Logo（CID 内嵌）
  if (logoBase64) {
    attachments.push({
      filename: 'logo.png',
      content: Buffer.from(logoBase64, 'base64'),
      cid: logoCid,
      contentType: 'image/png'
    });
  }

  return attachments;
}

/**
 * Cloud Functions 入口函数
 * 2025-12-12 00:25:00
 */
export const orderEmailNotifier = async (req, res) => {
  // 设置 CORS 头
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const payload = req.body || {};
    const { order = {}, lang = 'zh-CN', brand, logoCid = 'company-logo', logoBase64 } = payload;

    // 验证必填字段
    if (!order.orderNo || !order.customerName) {
      res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: order.orderNo and order.customerName' 
      });
      return;
    }

    const { smtpUser, smtpPass, from, defaultTo, logoBase64Secret } = await getConfig();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: { user: smtpUser, pass: smtpPass }
    });

    const logoSource = logoBase64 || logoBase64Secret || null;
    const html = renderHtmlTemplate(order, lang, brand, logoSource ? logoCid : null);
    const t = I18N[lang] || I18N['zh-CN'];
    const subject = t.subject(order);
    const to = order.to || defaultTo;

    if (!to) {
      res.status(400).json({ 
        ok: false, 
        error: 'No recipient specified. Provide order.to or configure smtp_to_default secret.' 
      });
      return;
    }

    const attachments = buildAttachments(order, logoSource, logoCid);

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments
    });

    console.log('Email sent successfully', {
      messageId: info.messageId,
      to,
      subject,
      accepted: info.accepted
    });

    res.json({ 
      ok: true, 
      messageId: info.messageId, 
      accepted: info.accepted, 
      to,
      subject
    });
  } catch (e) {
    console.error('orderEmailNotifier error:', e);
    res.status(500).json({ 
      ok: false, 
      error: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
  }
};
