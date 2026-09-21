import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteCartItem, getCart, updateCartItem } from '../api/cart';
import { createOrder } from '../api/orders';
import { listAddresses } from '../api/addresses';
import type { Address, Cart } from '../api/types';


export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({ items: [], total_amount: 0 });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadCart() {
    setLoading(true);
    try {
      const [nextCart, nextAddresses] = await Promise.all([getCart(), listAddresses()]);
      setCart(nextCart);
      setAddresses(nextAddresses);
      setSelectedAddressId((current) => current || nextAddresses.find((address) => address.is_default)?.id || nextAddresses[0]?.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : '购物车加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function changeQuantity(itemId: number, quantity: number) {
    setError('');
    try {
      await updateCartItem(itemId, quantity);
      await loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改数量失败');
    }
  }

  async function removeItem(itemId: number) {
    setError('');
    try {
      await deleteCartItem(itemId);
      await loadCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  }

  async function submitOrder() {
    if (!selectedAddressId) {
      setError('请先新增并选择收货地址');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createOrder(selectedAddressId);
      navigate('/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : '下单失败');
    } finally {
      setSubmitting(false);
    }
  }


  if (loading) {
    return <div className="state-panel">购物车加载中...</div>;
  }

  return (
    <section className="mobile-page cart-page">
      <header className="mobile-header">
        <div>
          <p>购物车</p>
          <h1>确认商品</h1>
        </div>
        <Link className="text-link" to="/products">继续逛</Link>
      </header>

      {error && <div className="error-message" role="alert">{error}</div>}

      {cart.items.length === 0 ? (
        <div className="empty-state">
          购物车为空，请先选择商品。
          <Link className="primary-link" to="/products">去选购</Link>
        </div>
      ) : (
        <div className="mobile-cart-list">
          {cart.items.map((item) => (
            <article className="mobile-cart-item" key={item.id}>
              <img src={item.product.image_url} alt={item.product.name} />
              <div className="cart-info">
                <h2>{item.product.name}</h2>
                <p>￥{item.product.price.toFixed(2)}</p>
                <label>
                  数量
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(event) => changeQuantity(item.id, Number(event.target.value))}
                  />
                </label>
              </div>
              <div className="cart-actions">
                <strong>￥{item.subtotal.toFixed(2)}</strong>
                <button className="text-danger" onClick={() => removeItem(item.id)}>删除</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {cart.items.length > 0 && (
        <div className="mobile-address-select">
          <span>收货地址</span>
          {addresses.length > 0 ? (
            <select value={selectedAddressId || ''} onChange={(event) => setSelectedAddressId(Number(event.target.value))}>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>{address.receiver_name} {address.city}{address.district}{address.detail}</option>
              ))}
            </select>
          ) : (
            <Link className="primary-link" to="/addresses">新增收货地址</Link>
          )}
        </div>
      )}

      {cart.items.length > 0 && (
        <div className="checkout-bar">
          <div>
            <span>合计</span>
            <strong>￥{cart.total_amount.toFixed(2)}</strong>
          </div>
          <button onClick={submitOrder} disabled={submitting || addresses.length === 0 || !selectedAddressId}>{submitting ? '提交中...' : '提交订单'}</button>

        </div>
      )}

    </section>
  );
}
