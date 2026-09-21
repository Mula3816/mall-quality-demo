import { useEffect, useState } from 'react';
import { listOrders, updateAfterSaleStatus, updateOrderShipment, updateOrderStatus } from '../api/admin';
import type { AdminOrder } from '../api/types';

const statusOptions = [
  { value: 'created', label: '已创建' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'canceled', label: '已取消' },
];

const afterSaleOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'approved', label: '同意售后' },
  { value: 'rejected', label: '拒绝售后' },
  { value: 'done', label: '售后完成' },
];

const statusTransitions: Record<string, string[]> = {
  created: ['paid', 'canceled'],
  paid: ['shipped', 'canceled'],
  shipped: ['completed'],
  completed: [],
  canceled: [],
};

type ShipmentDraft = {
  logisticsCompany: string;
  trackingNumber: string;
  logisticsNote: string;
};

type AfterSaleDraft = {
  status: string;
  reply: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusLabel(value: string) {
  return statusOptions.find((item) => item.value === value)?.label || value;
}

function getAfterSaleLabel(value: string) {
  return afterSaleOptions.find((item) => item.value === value)?.label || value;
}

function getAvailableStatusOptions(status: string) {
  const values = [status, ...(statusTransitions[status] || [])];
  return statusOptions.filter((item) => values.includes(item.value));
}

function getStatusTimeline(order: AdminOrder) {
  return [
    { label: '支付', value: order.paid_at },
    { label: '发货', value: order.shipped_at },
    { label: '完成', value: order.completed_at },
    { label: '取消', value: order.canceled_at },
  ].filter((item) => item.value !== null);
}

function getDefaultShipmentDraft(order: AdminOrder): ShipmentDraft {
  return {
    logisticsCompany: order.logistics?.company || '顺丰速运',
    trackingNumber: order.logistics?.tracking_number || '',
    logisticsNote: order.logistics?.note || '商家已发货，包裹正在等待揽收',
  };
}

function matchesOrder(order: AdminOrder, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [
    order.id,
    order.user.username,
    order.user.nickname,
    getStatusLabel(order.status),
    order.total_amount,
    order.address_snapshot || '',
    order.logistics?.company || '',
    order.logistics?.tracking_number || '',
    order.logistics?.note || '',
    order.after_sale?.reason || '',
    order.after_sale?.description || '',
    order.after_sale ? getAfterSaleLabel(order.after_sale.status) : '',
    order.after_sale?.reply || '',
    ...order.items.flatMap((item) => [item.product_name, item.product_price, item.quantity]),
    ...order.reviews.flatMap((review) => [review.product_name, review.rating, review.comment]),
  ].some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}

export default function OrderManagePage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [draftStatus, setDraftStatus] = useState<Record<number, string>>({});
  const [shipmentDraft, setShipmentDraft] = useState<Record<number, ShipmentDraft>>({});
  const [afterSaleDraft, setAfterSaleDraft] = useState<Record<number, AfterSaleDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
      setDraftStatus(Object.fromEntries(data.map((order) => [order.id, order.status])));
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function saveStatus(order: AdminOrder) {
    setError('');
    setMessage('');
    setSavingId(`${order.id}-status`);
    try {
      await updateOrderStatus(order.id, draftStatus[order.id] || order.status);
      setMessage(`订单 #${order.id} 状态已更新`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单状态更新失败');
    } finally {
      setSavingId(null);
    }
  }

  async function saveShipment(order: AdminOrder) {
    const draft = shipmentDraft[order.id] || getDefaultShipmentDraft(order);
    setError('');
    setMessage('');
    setSavingId(`${order.id}-shipment`);
    try {
      await updateOrderShipment(order.id, {
        logistics_company: draft.logisticsCompany,
        tracking_number: draft.trackingNumber,
        logistics_note: draft.logisticsNote,
      });
      setMessage(`订单 #${order.id} 物流已更新`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '物流更新失败');
    } finally {
      setSavingId(null);
    }
  }

  async function saveAfterSale(order: AdminOrder) {
    if (!order.after_sale) return;
    const draft = afterSaleDraft[order.id] || { status: order.after_sale.status, reply: order.after_sale.reply || '' };
    setError('');
    setMessage('');
    setSavingId(`${order.id}-after-sale`);
    try {
      await updateAfterSaleStatus(order.after_sale.id, draft.status, draft.reply);
      setMessage(`订单 #${order.id} 售后已处理`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '售后处理失败');
    } finally {
      setSavingId(null);
    }
  }

  const filteredOrders = orders.filter((order) => matchesOrder(order, searchKeyword));

  return (
    <section className="section-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">订单管理</p>
          <h2>查看订单并推进状态</h2>
        </div>
        <span className="summary-pill">共 {orders.length} 笔订单</span>
      </div>

      <div className="search-panel admin-search-panel">
        <label>
          搜索订单
          <input
            type="search"
            placeholder="按订单号、用户、商品、状态、物流、售后或评价搜索"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
        <span>匹配 {filteredOrders.length} 笔</span>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="panel table-panel">
        {loading ? (
          <div className="state-panel">订单加载中...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">暂无订单。</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">没有找到匹配的订单。</div>
        ) : (
          <table className="data-table order-table">
            <thead>
              <tr>
                <th>订单</th>
                <th>用户</th>
                <th>商品明细</th>
                <th>金额</th>
                <th>状态</th>
                <th>物流 / 售后 / 评价</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const availableOptions = getAvailableStatusOptions(order.status);
                const selectedStatus = draftStatus[order.id] || order.status;
                const canSave = selectedStatus !== order.status;
                const timeline = getStatusTimeline(order);
                const canShip = order.status === 'paid' || order.status === 'shipped';
                const currentShipmentDraft = shipmentDraft[order.id] || getDefaultShipmentDraft(order);
                const currentAfterSaleDraft = afterSaleDraft[order.id] || {
                  status: order.after_sale?.status || 'pending',
                  reply: order.after_sale?.reply || '',
                };

                return (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.id}</strong>
                      <span>{formatDate(order.created_at)}</span>
                    </td>
                    <td>
                      <strong>{order.user.nickname}</strong>
                      <span>{order.user.username}</span>
                    </td>
                    <td>
                      <div className="order-item-list">
                        {order.items.map((item) => (
                          <span key={item.id}>{item.product_name} x {item.quantity}</span>
                        ))}
                      </div>
                    </td>
                    <td>￥{order.total_amount.toFixed(2)}</td>
                    <td>
                      <select
                        value={selectedStatus}
                        onChange={(event) => setDraftStatus((current) => ({ ...current, [order.id]: event.target.value }))}
                        disabled={availableOptions.length === 1}
                      >
                        {availableOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                      <span className="status-text">当前：{getStatusLabel(order.status)}</span>
                      {timeline.length > 0 && (
                        <div className="status-timeline">
                          {timeline.map((item) => (
                            <span key={item.label}>{item.label}：{formatDate(item.value || '')}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="admin-order-service-stack">
                        {order.logistics ? (
                          <div>
                            <strong>物流</strong>
                            <span>{order.logistics.company}：{order.logistics.tracking_number}</span>
                            <span>{order.logistics.note}</span>
                          </div>
                        ) : (
                          <span className="muted-text">暂无物流</span>
                        )}

                        {order.after_sale && (
                          <div>
                            <strong>售后：{getAfterSaleLabel(order.after_sale.status)}</strong>
                            <span>{order.after_sale.reason}</span>
                            <span>{order.after_sale.description}</span>
                            {order.after_sale.reply && <span>回复：{order.after_sale.reply}</span>}
                          </div>
                        )}

                        {order.reviews.length > 0 && (
                          <div>
                            <strong>评价</strong>
                            {order.reviews.map((review) => (
                              <span key={review.id}>{review.product_name}：{review.rating} 星，{review.comment}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-order-actions">
                        <button type="button" onClick={() => saveStatus(order)} disabled={savingId === `${order.id}-status` || !canSave}>
                          {savingId === `${order.id}-status` ? '保存中...' : '保存状态'}
                        </button>

                        {canShip && (
                          <div className="admin-inline-form">
                            <input
                              placeholder="快递公司"
                              value={currentShipmentDraft.logisticsCompany}
                              onChange={(event) => setShipmentDraft((current) => ({
                                ...current,
                                [order.id]: { ...currentShipmentDraft, logisticsCompany: event.target.value },
                              }))}
                            />
                            <input
                              placeholder="快递单号"
                              value={currentShipmentDraft.trackingNumber}
                              onChange={(event) => setShipmentDraft((current) => ({
                                ...current,
                                [order.id]: { ...currentShipmentDraft, trackingNumber: event.target.value },
                              }))}
                            />
                            <input
                              placeholder="物流备注"
                              value={currentShipmentDraft.logisticsNote}
                              onChange={(event) => setShipmentDraft((current) => ({
                                ...current,
                                [order.id]: { ...currentShipmentDraft, logisticsNote: event.target.value },
                              }))}
                            />
                            <button type="button" onClick={() => saveShipment(order)} disabled={savingId === `${order.id}-shipment`}>
                              {savingId === `${order.id}-shipment` ? '发货中...' : '保存物流'}
                            </button>
                          </div>
                        )}

                        {order.after_sale && (
                          <div className="admin-inline-form">
                            <select
                              value={currentAfterSaleDraft.status}
                              onChange={(event) => setAfterSaleDraft((current) => ({
                                ...current,
                                [order.id]: { ...currentAfterSaleDraft, status: event.target.value },
                              }))}
                            >
                              {afterSaleOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <textarea
                              placeholder="售后处理说明"
                              value={currentAfterSaleDraft.reply}
                              onChange={(event) => setAfterSaleDraft((current) => ({
                                ...current,
                                [order.id]: { ...currentAfterSaleDraft, reply: event.target.value },
                              }))}
                            />
                            <button type="button" onClick={() => saveAfterSale(order)} disabled={savingId === `${order.id}-after-sale`}>
                              {savingId === `${order.id}-after-sale` ? '处理中...' : '处理售后'}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
