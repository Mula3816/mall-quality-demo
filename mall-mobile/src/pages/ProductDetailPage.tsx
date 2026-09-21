import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem } from '../api/cart';
import { getProduct, listProductReviews } from '../api/products';
import type { Product, Review } from '../api/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!productId) return;
    Promise.all([getProduct(productId), listProductReviews(productId)])
      .then(([productData, reviewData]) => {
        setProduct(productData);
        setReviews(reviewData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : '商品加载失败'))
      .finally(() => setLoading(false));
  }, [productId]);

  async function handleAddToCart() {
    if (!product) return;
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await addCartItem(product.id, quantity);
      setMessage('已加入购物车');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入购物车失败');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="state-panel">商品详情加载中...</div>;
  }

  if (!product) {
    return <div className="state-panel error-message" role="alert">{error || '商品不存在'}</div>;
  }

  return (
    <section className="mobile-page detail-page">
      <Link className="back-link" to="/products">返回商品</Link>
      <img className="detail-hero" src={product.image_url} alt={product.name} />
      <div className="detail-card">
        <span className="category-pill">{product.category}</span>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="price-row">
          <strong>￥{product.price.toFixed(2)}</strong>
          <span>库存 {product.stock}</span>
        </div>
        <label className="quantity-field">
          购买数量
          <input
            type="number"
            min="1"
            max={product.stock}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
          />
        </label>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message" role="alert">{error}</div>}
      </div>

      <div className="mobile-review-panel">
        <strong>商品评价</strong>
        {reviews.length === 0 ? (
          <p>暂无评价。</p>
        ) : (
          reviews.map((review) => (
            <div className="review-row" key={review.id}>
              <span>{review.rating} 星 · {formatDate(review.created_at)}</span>
              <p>{review.comment}</p>
            </div>
          ))
        )}
      </div>

      <div className="mobile-action-bar">
        <button className="secondary-button" onClick={() => navigate('/cart')}>去购物车</button>
        <button onClick={handleAddToCart} disabled={submitting}>{submitting ? '加入中...' : '加入购物车'}</button>
      </div>
    </section>
  );
}
