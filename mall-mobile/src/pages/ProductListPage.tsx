import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clearToken } from '../api/client';
import { listProducts } from '../api/products';
import type { Product } from '../api/types';

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : '商品加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    const value = keyword.trim();
    if (!value) {
      return products;
    }
    return products.filter((product) => product.name.includes(value) || product.category.includes(value));
  }, [keyword, products]);

  function logout() {
    clearToken();
    window.location.href = '/login';
  }

  if (loading) {
    return <div className="state-panel">商品加载中...</div>;
  }

  if (error) {
    return <div className="state-panel error-message" role="alert">{error}</div>;
  }

  return (
    <section className="mobile-page product-page">
      <header className="mobile-header">
        <div>
          <p>移动商城</p>
          <h1>精选商品</h1>
        </div>
        <button className="text-button" onClick={logout}>退出</button>
      </header>

      <div className="search-box">
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索商品或分类" />
      </div>

      <div className="mobile-product-list">
        {filteredProducts.map((product) => (
          <Link className="mobile-product-card" key={product.id} to={`/products/${product.id}`}>
            <img src={product.image_url} alt={product.name} />
            <div>
              <span>{product.category}</span>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
              <div className="card-meta">
                <strong>￥{product.price.toFixed(2)}</strong>
                <em>库存 {product.stock}</em>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
