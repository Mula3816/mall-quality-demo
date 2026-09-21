import { useEffect, useState } from 'react';
import { getSummary } from '../api/admin';
import type { AdminSummary } from '../api/types';

const emptySummary: AdminSummary = {
  total_products: 0,
  total_users: 0,
  total_orders: 0,
  revenue: 0,
  pending_orders: 0,
  low_stock_products: 0,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<AdminSummary>(emptySummary);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : '概览加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const metrics = [
    { label: '商品总数', value: String(summary.total_products), className: '', keywords: '商品 总数 product' },
    { label: '用户总数', value: String(summary.total_users), className: '', keywords: '用户 买家 商家 管理人员 user' },
    { label: '订单总数', value: String(summary.total_orders), className: '', keywords: '订单 总数 order' },
    { label: '累计收入', value: `￥${summary.revenue.toFixed(2)}`, className: 'accent', keywords: '收入 金额 营收 revenue' },
    { label: '待处理订单', value: String(summary.pending_orders), className: '', keywords: '待处理 订单 created pending' },
    { label: '低库存商品', value: String(summary.low_stock_products), className: 'warn', keywords: '低库存 库存 商品 stock' },
  ];
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredMetrics = metrics.filter((metric) => {
    if (!normalizedKeyword) return true;
    return [metric.label, metric.value, metric.keywords].some((value) => value.toLowerCase().includes(normalizedKeyword));
  });

  if (loading) {
    return <div className="state-panel">后台概览加载中...</div>;
  }

  if (error) {
    return <div className="state-panel error-message" role="alert">{error}</div>;
  }

  return (
    <section className="section-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">系统概览</p>
          <h2>管理后台实时数据</h2>
        </div>
        <span className="summary-pill">已连接商城业务库</span>
      </div>

      <div className="search-panel admin-search-panel">
        <label>
          搜索概览指标
          <input
            type="search"
            placeholder="按订单、商品、用户、收入或库存搜索"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
        <span>匹配 {filteredMetrics.length} 项</span>
      </div>

      {filteredMetrics.length === 0 ? (
        <div className="empty-state">没有找到匹配的概览指标。</div>
      ) : (
        <div className="metric-grid">
          {filteredMetrics.map((metric) => (
            <article className={`metric-card ${metric.className}`.trim()} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>
      )}

      <div className="panel">
        <h3>后台说明</h3>
        <p className="muted-text">这里是独立的管理后台前端，当前负责商品、订单、用户、物流、售后和评价的运营管理。</p>
      </div>
    </section>
  );
}
