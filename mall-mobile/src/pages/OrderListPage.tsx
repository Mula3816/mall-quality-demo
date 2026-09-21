import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cancelOrder, createAfterSale, createReview, listOrders, payOrder } from '../api/orders';
import type { Order } from '../api/types';

const statusLabels: Record<string, string> = {
  created: '已创建',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  canceled: '已取消',
};

const afterSaleLabels: Record<string, string> = {
  pending: '待处理',
  approved: '已同意',
  rejected: '已拒绝',
  done: '已完成',
};

type AfterSaleDraft = {
  reason: string;
  description: string;
};

type ReviewDraft = {
  productId: number;
  rating: number;
  comment: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getStatusTimeText(order: Order) {
  const statusTimes: Record<string, string | null> = {
    paid: order.paid_at,
    shipped: order.shipped_at,
    completed: order.completed_at,
    canceled: order.canceled_at,
  };
  const value = statusTimes[order.status];
  return value ? `${statusLabels[order.status] || order.status}时间：${formatDate(value)}` : '';
}

function getUnreviewedItems(order: Order) {
  const reviewedProductIds = new Set(order.reviews.map((review) => review.product_id));
  return order.items.filter((item) => !reviewedProductIds.has(item.product_id));
}

function matchesOrder(order: Order, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [
    order.id,
    statusLabels[order.status] || order.status,
    order.total_amount,
    order.address_snapshot || '',
    order.logistics?.company || '',
    order.logistics?.tracking_number || '',
    order.logistics?.note || '',
    order.after_sale?.reason || '',
    order.after_sale?.description || '',
    order.after_sale ? afterSaleLabels[order.after_sale.status] || order.after_sale.status : '',
    ...order.items.flatMap((item) => [item.product_name, item.product_price, item.quantity]),
    ...order.reviews.flatMap((review) => [review.product_name, review.rating, review.comment]),
  ].some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [afterSaleDraft, setAfterSaleDraft] = useState<Record<number, AfterSaleDraft>>({});
  const [reviewDraft, setReviewDraft] = useState<Record<number, ReviewDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [operatingId, setOperatingId] = useState<string | null>(null);

  async function loadOrders() {
    const data = await listOrders();
    setOrders(data);
  }

  useEffect(() => {
    loadOrders()
      .catch((err) => setError(err instanceof Error ? err.message : '订单加载失败'))
      .finally(() => setLoading(false));
  }, []);

  async function handlePay(order: Order) {
    setError('');
    setMessage('');
    setOperatingId(`${order.id}-pay`);
    try {
      await payOrder(order.id);
      setMessage(`订单 #${order.id} 支付成功`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单支付失败');
    } finally {
      setOperatingId(null);
    }
  }

  async function handleCancel(order: Order) {
    setError('');
    setMessage('');
    setOperatingId(`${order.id}-cancel`);
    try {
      await cancelOrder(order.id);
      setMessage(`订单 #${order.id} 已取消`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '订单取消失败');
    } finally {
      setOperatingId(null);
    }
  }

  async function handleAfterSale(order: Order) {
    const draft = afterSaleDraft[order.id] || { reason: '', description: '' };
    setError('');
    setMessage('');
    setOperatingId(`${order.id}-after-sale`);
    try {
      await createAfterSale(order.id, draft.reason, draft.description);
      setMessage(`订单 #${order.id} 售后申请已提交`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '售后申请提交失败');
    } finally {
      setOperatingId(null);
    }
  }

  async function handleReview(order: Order) {
    const reviewableItems = getUnreviewedItems(order);
    const draft = reviewDraft[order.id] || { productId: reviewableItems[0]?.product_id, rating: 5, comment: '' };
    setError('');
    setMessage('');
    setOperatingId(`${order.id}-review`);
    try {
      await createReview(order.id, Number(draft.productId), Number(draft.rating), draft.comment);
      setMessage(`订单 #${order.id} 评价已提交`);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : '评价提交失败');
    } finally {
      setOperatingId(null);
    }
  }

  const filteredOrders = orders.filter((order) => matchesOrder(order, searchKeyword));

  if (loading) {
    return <div className="state-panel">订单加载中...</div>;
  }

  return (
    <section className="mobile-page order-page">
      <header className="mobile-header">
        <div>
          <p>订单</p>
          <h1>我的订单</h1>
        </div>
        <Link className="text-link" to="/products">继续购物</Link>
      </header>

      <div className="mobile-search-panel">
        <label>
          搜索订单
          <input
            type="search"
            placeholder="订单号、商品、状态、物流、售后"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
        <span>匹配 {filteredOrders.length} 笔</span>
      </div>

      {error && <div className="error-message" role="alert">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">
          暂无订单，请先选择商品并提交订单。
          <Link className="primary-link" to="/products">去选购</Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">没有找到匹配的订单。</div>
      ) : (
        <div className="mobile-order-list">
          {filteredOrders.map((order) => {
            const statusTime = getStatusTimeText(order);
            const canPay = order.status === 'created';
            const canCancel = order.status === 'created' || order.status === 'paid';
            const canApplyAfterSale = ['paid', 'shipped', 'completed'].includes(order.status) && !order.after_sale;
            const reviewableItems = order.status === 'completed' ? getUnreviewedItems(order) : [];
            const currentAfterSaleDraft = afterSaleDraft[order.id] || { reason: '', description: '' };
            const currentReviewDraft = reviewDraft[order.id] || {
              productId: reviewableItems[0]?.product_id || order.items[0]?.product_id || 0,
              rating: 5,
              comment: '',
            };

            return (
              <article className="mobile-order-card" key={order.id}>
                <div className="order-topline">
                  <strong>订单 #{order.id}</strong>
                  <span>{statusLabels[order.status] || order.status}</span>
                </div>
                <p className="order-time">{formatDate(order.created_at)}</p>
                {statusTime && <p className="order-time">{statusTime}</p>}
                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={item.id}>
                      <span>{item.product_name} x {item.quantity}</span>
                      <strong>￥{item.subtotal.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
                <div className="order-total">
                  <span>实付</span>
                  <strong>￥{order.total_amount.toFixed(2)}</strong>
                </div>
                {order.logistics && (
                  <div className="mobile-extra-panel">
                    <strong>物流信息</strong>
                    <span>{order.logistics.company}：{order.logistics.tracking_number}</span>
                    <span>{order.logistics.note}</span>
                  </div>
                )}
                {order.after_sale && (
                  <div className="mobile-extra-panel">
                    <strong>售后：{afterSaleLabels[order.after_sale.status] || order.after_sale.status}</strong>
                    <span>{order.after_sale.reason}</span>
                    <span>{order.after_sale.description}</span>
                    {order.after_sale.reply && <span>商家回复：{order.after_sale.reply}</span>}
                  </div>
                )}
                {order.reviews.length > 0 && (
                  <div className="mobile-extra-panel">
                    <strong>我的评价</strong>
                    {order.reviews.map((review) => (
                      <span key={review.id}>{review.product_name}：{review.rating} 星，{review.comment}</span>
                    ))}
                  </div>
                )}
                {(canPay || canCancel) && (
                  <div className="mobile-order-actions">
                    {canPay && (
                      <button type="button" onClick={() => handlePay(order)} disabled={operatingId !== null}>
                        {operatingId === `${order.id}-pay` ? '支付中...' : '模拟支付'}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        className="mobile-danger-button"
                        type="button"
                        onClick={() => handleCancel(order)}
                        disabled={operatingId !== null}
                      >
                        {operatingId === `${order.id}-cancel` ? '取消中...' : '取消订单'}
                      </button>
                    )}
                  </div>
                )}
                {canApplyAfterSale && (
                  <div className="mobile-order-form">
                    <strong>申请售后</strong>
                    <input
                      placeholder="售后原因"
                      value={currentAfterSaleDraft.reason}
                      onChange={(event) => setAfterSaleDraft((current) => ({
                        ...current,
                        [order.id]: { ...currentAfterSaleDraft, reason: event.target.value },
                      }))}
                    />
                    <textarea
                      placeholder="售后说明"
                      value={currentAfterSaleDraft.description}
                      onChange={(event) => setAfterSaleDraft((current) => ({
                        ...current,
                        [order.id]: { ...currentAfterSaleDraft, description: event.target.value },
                      }))}
                    />
                    <button type="button" onClick={() => handleAfterSale(order)} disabled={operatingId !== null}>
                      {operatingId === `${order.id}-after-sale` ? '提交中...' : '提交售后'}
                    </button>
                  </div>
                )}
                {reviewableItems.length > 0 && (
                  <div className="mobile-order-form">
                    <strong>评价商品</strong>
                    <select
                      value={currentReviewDraft.productId}
                      onChange={(event) => setReviewDraft((current) => ({
                        ...current,
                        [order.id]: { ...currentReviewDraft, productId: Number(event.target.value) },
                      }))}
                    >
                      {reviewableItems.map((item) => (
                        <option key={item.id} value={item.product_id}>{item.product_name}</option>
                      ))}
                    </select>
                    <select
                      value={currentReviewDraft.rating}
                      onChange={(event) => setReviewDraft((current) => ({
                        ...current,
                        [order.id]: { ...currentReviewDraft, rating: Number(event.target.value) },
                      }))}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} 星</option>)}
                    </select>
                    <textarea
                      placeholder="写下评价"
                      value={currentReviewDraft.comment}
                      onChange={(event) => setReviewDraft((current) => ({
                        ...current,
                        [order.id]: { ...currentReviewDraft, comment: event.target.value },
                      }))}
                    />
                    <button type="button" onClick={() => handleReview(order)} disabled={operatingId !== null}>
                      {operatingId === `${order.id}-review` ? '提交中...' : '提交评价'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
