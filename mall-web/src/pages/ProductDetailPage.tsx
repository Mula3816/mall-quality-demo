import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem } from '../api/cart';
import { getProduct, listProductReviews } from '../api/products';
import type { Product, Review } from '../api/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
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
    try {
      await addCartItem(product.id, quantity);
      setMessage('已加入购物车');
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入购物车失败');
    }
  }

  if (loading) {
    return <div className="state-panel">商品详情加载中...</div>;
  }

  if (!product) {
    return <div className="state-panel error-message">{error || '商品不存在'}</div>;
  }

  return (
    <section className="detail-layout">
      <img className="detail-image" src={product.image_url} alt={product.name} />
      <div className="detail-panel">
        <Link to="/products" className="secondary-link">返回商品列表</Link>
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        <p className="detail-description">{product.description}</p>
        <div className="detail-price">￥{product.price.toFixed(2)}</div>
        <p className="stock-text">当前库存：{product.stock}</p>
        <label className="quantity-control">
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
        <div className="action-row">
          <button onClick={handleAddToCart}>加入购物车</button>
          <button className="secondary-button" onClick={() => navigate('/cart')}>去购物车</button>
        </div>

        <div className="review-list-panel">
          <strong>商品评价</strong>
          {reviews.length === 0 ? (
            <p className="muted-text">暂无评价。</p>
          ) : (
            reviews.map((review) => (
              <div className="review-row" key={review.id}>
                <span>{review.rating} 星 · {formatDate(review.created_at)}</span>
                <p>{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
