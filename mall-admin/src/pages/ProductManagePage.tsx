import { FormEvent, useEffect, useState } from 'react';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/admin';
import type { Product, ProductInput } from '../api/types';

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image_url: string;
};

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  image_url: '',
};

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    stock: String(product.stock),
    category: product.category,
    image_url: product.image_url,
  };
}

function toProductInput(form: ProductFormState): ProductInput {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    stock: Number(form.stock),
    category: form.category.trim(),
    image_url: form.image_url.trim(),
  };
}

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

export default function ProductManagePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadProducts() {
    setLoading(true);
    try {
      setProducts(await listProducts());
    } catch (err) {
      setError(err instanceof Error ? err.message : '商品加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateField(field: keyof ProductFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    const payload = toProductInput(form);
    if (!payload.name || !payload.description || !payload.category || !payload.image_url) {
      setError('请完整填写商品信息');
      return;
    }
    if (Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
      setError('价格和库存必须是数字');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage('商品已更新');
      } else {
        await createProduct(payload);
        setMessage('商品已新增');
      }
      resetForm();
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存商品失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`确认删除商品「${product.name}」？`)) {
      return;
    }
    setError('');
    setMessage('');
    try {
      await deleteProduct(product.id);
      setMessage('商品已删除');
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除商品失败');
    }
  }

  const filteredProducts = products.filter((product) => matchesProduct(product, searchKeyword));

  return (
    <section className="section-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">商品管理</p>
          <h2>维护商城商品和库存</h2>
        </div>
        <span className="summary-pill">共 {products.length} 件商品</span>
      </div>

      <div className="search-panel admin-search-panel">
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

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-header">
          <h3>{editingId ? '编辑商品' : '新增商品'}</h3>
          {editingId && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}
        </div>
        <div className="form-grid">
          <label>
            商品名称
            <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            分类
            <input value={form.category} onChange={(event) => updateField('category', event.target.value)} />
          </label>
          <label>
            价格
            <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} />
          </label>
          <label>
            库存
            <input type="number" min="0" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} />
          </label>
          <label className="wide-field">
            图片地址
            <input value={form.image_url} onChange={(event) => updateField('image_url', event.target.value)} />
          </label>
          <label className="wide-field">
            商品描述
            <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </label>
        </div>
        {error && <div className="error-message" role="alert">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        <button type="submit" disabled={saving}>{saving ? '保存中...' : editingId ? '保存修改' : '新增商品'}</button>
      </form>

      <div className="panel table-panel">
        {loading ? (
          <div className="state-panel">商品加载中...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">没有找到匹配的商品。</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>商品</th>
                <th>分类</th>
                <th>价格</th>
                <th>库存</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      <img src={product.image_url} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.description}</span>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>￥{product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="secondary-button" onClick={() => {
                        setEditingId(product.id);
                        setForm(toFormState(product));
                      }}>编辑</button>
                      <button type="button" className="danger-button" onClick={() => handleDelete(product)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
