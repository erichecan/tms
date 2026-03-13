/**
 * 转运单列表页 — 2026-03-13 (transfer-order-prd v0.1)
 * 表头：单号/柜号/仓库/到仓日/合作单位/状态/托数统计；筛选 + 新建入口。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ClipboardList } from 'lucide-react';
import {
  listTransferOrders,
  type TransferOrderHeader,
  type ListFilters,
} from './services/transferOrderService';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  PARTIAL_WAYBILLED: '部分已生成运单',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const TransferOrdersList = () => {
  const navigate = useNavigate();
  const [list, setList] = useState<TransferOrderHeader[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 10;

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterContainer, setFilterContainer] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [filterPartner, setFilterPartner] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const filters: ListFilters = { page, limit };
      if (filterStatus !== 'ALL') filters.status = filterStatus;
      if (filterContainer.trim()) filters.container_no = filterContainer.trim();
      if (filterWarehouse.trim()) filters.warehouse = filterWarehouse.trim();
      if (filterPartner.trim()) filters.partner = filterPartner.trim();
      const res = await listTransferOrders(filters);
      setList(res.data || []);
      setTotal(res.total ?? 0);
    } catch (e) {
      console.error(e);
      setList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, filterStatus]);

  const onApplyFilters = () => {
    setPage(1);
    fetchList();
  };

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={24} /> 转运单
        </h2>
        <button
          onClick={() => navigate('/transfer-orders/create')}
          style={{
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--primary-grad)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          <Plus size={18} /> 新建转运单
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass"
          style={{ padding: '8px 14px', border: 'none', borderRadius: '10px', fontSize: '13px', minWidth: '140px' }}
        >
          <option value="ALL">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          value={filterContainer}
          onChange={(e) => setFilterContainer(e.target.value)}
          placeholder="柜号"
          className="glass"
          style={{ padding: '8px 14px', border: 'none', borderRadius: '10px', fontSize: '13px', width: '140px' }}
        />
        <input
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
          placeholder="仓库"
          className="glass"
          style={{ padding: '8px 14px', border: 'none', borderRadius: '10px', fontSize: '13px', width: '120px' }}
        />
        <input
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
          placeholder="合作单位"
          className="glass"
          style={{ padding: '8px 14px', border: 'none', borderRadius: '10px', fontSize: '13px', width: '120px' }}
        />
        <button
          onClick={onApplyFilters}
          className="glass"
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Search size={16} /> 查询
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>单号</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>柜号</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>仓库</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>到仓日</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>合作单位</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>状态</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>托数统计</th>
              <th style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--slate-600)' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>加载中...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>暂无转运单</td></tr>
            ) : (
              list.map((row) => (
                <tr
                  key={row.id}
                  className="table-row-hover"
                  style={{ borderBottom: '1px solid var(--glass-border)' }}
                >
                  <td style={{ padding: '12px 10px', fontWeight: 600 }}>{row.order_no || row.id}</td>
                  <td style={{ padding: '12px 10px' }}>{row.container_no || '-'}</td>
                  <td style={{ padding: '12px 10px' }}>{row.warehouse || '-'}</td>
                  <td style={{ padding: '12px 10px' }}>{row.arrival_date ? row.arrival_date.slice(0, 10) : '-'}</td>
                  <td style={{ padding: '12px 10px' }}>{row.partner || '-'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: row.status === 'DRAFT' ? '#E0E7FF' : row.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7',
                        color: row.status === 'DRAFT' ? '#4338CA' : row.status === 'COMPLETED' ? '#059669' : '#B45309',
                      }}
                    >
                      {STATUS_LABELS[row.status] || row.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {row.waybilled_pallets ?? 0}/{row.total_pallets ?? 0}
                    {(row.hold_pallets ?? 0) > 0 && <span style={{ color: 'var(--slate-400)', marginLeft: '4px' }}>(HOLD {row.hold_pallets})</span>}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <button
                      onClick={() => navigate(`/transfer-orders/${row.id}`)}
                      className="glass"
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'var(--primary-start)',
                      }}
                    >
                      查看/编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="glass"
            style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '10px', fontSize: '13px' }}
          >
            上一页
          </button>
          <span style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--slate-500)' }}>
            {page} / {Math.ceil(total / limit)}
          </span>
          <button
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage((p) => p + 1)}
            className="glass"
            style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '10px', fontSize: '13px' }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};
