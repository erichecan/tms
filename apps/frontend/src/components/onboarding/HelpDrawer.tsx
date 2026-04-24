import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { normalizeRole } from './GuidedTour';

// ── Help content ─────────────────────────────────────────────────
interface HelpItem {
  q: string;
  a: string;
}

interface RoleHelp {
  label: string;
  emoji: string;
  intro: string;
  tips: HelpItem[];
}

const ROLE_HELP: Record<string, RoleHelp> = {
  ADMIN: {
    label: '管理员',
    emoji: '👑',
    intro: '你可以访问系统所有模块。以下是常见操作的快速答案。',
    tips: [
      { q: '如何创建新用户？', a: '前往 Settings → Users，点击「+ Add User」，填写姓名、邮箱和角色，保存后用户即可用默认密码登录。' },
      { q: '如何分配角色权限？', a: '前往 Settings → Roles，点击角色名称进入编辑，勾选或取消对应权限模块后保存。权限立即生效，无需重启。' },
      { q: '如何重置用户密码？', a: '前往 Settings → Users，找到对应用户，点击「Reset Password」，输入新密码并确认即可。' },
      { q: '运单数据不显示怎么办？', a: '检查网络连接后刷新页面。如仍有问题，检查左上角是否显示「连接失败」提示，联系技术支持。' },
      { q: '如何查看历史财务数据？', a: '前往 Finance → Overview / Receivables / Payables，所有财务记录按时间倒序排列，可通过日期筛选。' },
      { q: '如何导出运单数据？', a: '在 Waybills 列表中，点击运单操作菜单（⋯）→ Download PDF 或 Download BOL 下载单份文件。批量导出功能规划中。' },
    ],
  },
  DISPATCHER: {
    label: '调度员',
    emoji: '📋',
    intro: '调度员是系统的核心用户。以下是最常用操作的快速参考。',
    tips: [
      { q: '如何快速报价给来电客户？', a: '前往「报价管理」→「快速报价」标签，选择客户、目的仓、车型、板数，点击「立即报价」。结果包含客户报价、费用明细和毛利率。' },
      { q: '如何创建转运单？', a: '点击左侧「转运单」→「+ New」，填写柜号、目的仓、到货日期、入仓方式，添加明细行（托数、PO号），点击「保存草稿」。' },
      { q: '如何从转运单批量生成运单？', a: '在转运单详情页勾选需要生成运单的明细行，点击底部「生成运单」按钮。系统自动定价、选车型并创建运单。' },
      { q: '指派时下拉没有司机/车辆选项？', a: '只有 IDLE（空闲）状态的资源才会显示。当前 BUSY 的司机/车辆正在执行任务，等他们完成签收后才会变回 IDLE。' },
      { q: '指派时出现冲突警告怎么办？', a: '系统检测到时间重叠或绕路超过 15km 会弹出警告。请改选其他司机，或调整行程时间安排。' },
      { q: '如何联系在途司机？', a: '在 Tracking 页面点击目标行程，在右侧详情面板底部的消息框输入消息后发送，司机在司机端可以接收。' },
      { q: '运单状态流转是什么顺序？', a: 'NEW（新建）→ ASSIGNED（已指派）→ IN_TRANSIT（运输中）→ DELIVERED（已送达）。每个状态变更都会自动触发对应的财务记录。' },
    ],
  },
  DRIVER: {
    label: '司机',
    emoji: '🚛',
    intro: '这是专为司机设计的界面，只显示你的运单。操作简单，只需 4 步。',
    tips: [
      { q: '为什么看不到我的运单？', a: '运单必须先由调度员完成指派才会出现在你的列表。如果刚刚被指派，尝试下拉刷新页面。' },
      { q: '出发前必须做什么？', a: '一定要点击「Start Mission」并确认！否则系统无法记录你的出发时间，会影响工资计算。' },
      { q: '如何上传送货照片？', a: '在运单详情页点击「Upload Photo」，手机会打开相机，拍摄货物照片后点击确认上传。' },
      { q: '遇到问题怎么报告？', a: '点击「Report Exception」，在下拉框选择问题类型（车辆故障、无人签收等），填写描述后提交。调度员会实时收到通知。' },
      { q: '如何完成配送签收？', a: '点击「Delivered & Sign」，让收货方在签名板上签字，点击「Save」保存，运单状态自动变为 DELIVERED。' },
      { q: '为什么看不到价格信息？', a: '运费和成本信息属于商业机密，司机界面不显示任何价格数据，这是系统设计规则。' },
    ],
  },
  FINANCE: {
    label: '财务',
    emoji: '💰',
    intro: '财务数据由系统自动生成，无需手动录入。以下是常见问题解答。',
    tips: [
      { q: '应收账款什么时候自动生成？', a: '当司机完成「Delivered & Sign」（运单变为 DELIVERED 状态）时，系统自动按客户报价生成一条应收记录。' },
      { q: '应付账款什么时候自动生成？', a: '调度员完成「Assign」（运单变为 ASSIGNED 状态）时，系统按三级工资规则（时薪 → 基准工资表 → 规则引擎）自动生成应付记录。' },
      { q: 'Finance Overview 数据不正确？', a: 'Overview 数据实时聚合应收和应付数据，如有出入，检查对应运单是否完成了正确的状态流转（DELIVERED / ASSIGNED）。' },
      { q: '如何核对单条应收记录？', a: '在 Receivables 列表找到对应记录，点击查看详情，可以看到关联的运单号、客户、金额和生成时间。' },
      { q: '司机工资的三级计算规则是什么？', a: '① 优先按时薪×工时计算 → ② 若没有时薪配置，查基准工资表（按车型/路线）→ ③ 若还没有，使用规则引擎的全局默认值。' },
    ],
  },
  FLEET: {
    label: '车队经理',
    emoji: '🔧',
    intro: '车队管理包含司机、车辆、费用、排班四个模块，以下是常见问题。',
    tips: [
      { q: '如何添加新司机？', a: '在 Fleet → Drivers 标签，点击「+ Add Driver」，填写姓名、电话、工资信息（时薪或按次）后保存。新司机默认为 IDLE 状态。' },
      { q: 'BUSY 状态的司机何时变回 IDLE？', a: '当司机完成配送（运单状态变为 DELIVERED）时，系统自动将司机和车辆状态重置为 IDLE。无法手动强制切换。' },
      { q: '如何修改车辆的最大板数？', a: '在 Fleet → Vehicles，点击车辆行进入编辑，修改「Max Pallets」字段后保存。此数据影响报价时的车型自动选择（≤13板=26ft，>13板=53ft）。' },
      { q: '如何查看历史排班记录？', a: '在 Fleet → Schedule 标签，使用日历左右切换查看不同周的排班情况，历史数据均有记录。' },
      { q: '如何记录车辆维修费用？', a: '在 Fleet → Expenses 标签，点击「+ Add Expense」，选择车辆，填写费用类型、金额和日期。' },
    ],
  },
};

// ── Component ────────────────────────────────────────────────────
interface HelpDrawerProps {
  roleId: string | undefined;
  open: boolean;
  onClose: () => void;
  startTour?: () => void;
}

export default function HelpDrawer({ roleId, open, onClose, startTour }: HelpDrawerProps) {
  const navigate = useNavigate();
  const role = normalizeRole(roleId);
  const content = ROLE_HELP[role] ?? ROLE_HELP.DISPATCHER;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.15)',
            zIndex: 1100,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        height: '100vh', width: 320,
        background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
        zIndex: 1101,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>{content.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {content.label}帮助
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                快速参考 & 操作指引
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#64748b',
            }}
          >✕</button>
        </div>

        {/* Intro */}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            {content.intro}
          </p>
        </div>

        {/* FAQ list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            常见问题
          </div>

          {content.tips.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '10px 16px',
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', lineHeight: 1.4 }}>
                  {item.q}
                </span>
                <span style={{
                  fontSize: 11, color: '#94a3b8', flexShrink: 0,
                  transform: expandedIdx === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>▼</span>
              </button>
              {expandedIdx === i && (
                <div style={{
                  padding: '0 16px 12px',
                  fontSize: 12, color: '#475569', lineHeight: 1.7,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', flexDirection: 'column', gap: 8,
          flexShrink: 0,
        }}>
          {startTour && (
            <button
              onClick={() => { startTour(); onClose(); }}
              style={{
                width: '100%', padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(0,128,255,0.2)',
                background: 'rgba(0,128,255,0.04)',
                fontSize: 13, fontWeight: 600,
                color: '#0080FF',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >▶ 重新播放引导</button>
          )}
          <button
            onClick={() => { navigate('/help'); onClose(); }}
            style={{
              width: '100%', padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 13, fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >📚 查看完整帮助文档</button>
          <button
            onClick={() => { navigate('/flow'); onClose(); }}
            style={{
              width: '100%', padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 13, fontWeight: 600,
              color: '#475569',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >🔄 查看业务流程图</button>
        </div>
      </div>
    </>
  );
}
