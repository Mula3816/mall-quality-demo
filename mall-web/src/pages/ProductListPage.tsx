import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '../api/products';
import type { Product } from '../api/types';

function matchesProduct(product: Product, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) return true;
  return [
    product.id,
    product.name,
    product.description,
    product.category,
    product.price,
    product.stock,
  ].some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : '商品加载失败'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((product) => matchesProduct(product, searchKeyword));

  if (loading) {
    return <div className="state-panel">商品加载中...</div>;
  }

  if (error) {
    return <div className="state-panel error-message">{error}</div>;
  }

  return (
    <section>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">商品列表</p>
          <h1>选择要购买的商品</h1>
        </div>
        <span className="summary-pill">共 {products.length} 件商品</span>
      </div>

      <div className="search-panel">
        <label>
          搜索商品
          <input
            type="search"
            placeholder="按商品名、分类、描述、价格或库存搜索"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </label>
        <span>匹配 {filteredProducts.length} 件</span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">没有找到匹配的商品。</div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <img src={product.image_url} alt={product.name} />
              <div className="product-card-body">
                <span className="category-tag">{product.category}</span>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <div className="product-meta">
                  <strong>￥{product.price.toFixed(2)}</strong>
                  <span>库存 {product.stock}</span>
                </div>
                <Link className="primary-link" to={`/products/${product.id}`}>查看详情</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
