import { FormEvent, useEffect, useState } from 'react';
import { createAddress, deleteAddress, listAddresses, updateAddress } from '../api/addresses';
import type { Address, AddressInput } from '../api/types';

const emptyForm: AddressInput = {
  receiver_name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false,
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadAddresses() {
    setAddresses(await listAddresses());
  }

  useEffect(() => {
    loadAddresses().catch((err) => setError(err instanceof Error ? err.message : '地址加载失败'));
  }, []);

  function updateField(field: keyof AddressInput, value: string | boolean) {
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
    try {
      if (editingId) {
        await updateAddress(editingId, form);
        setMessage('地址已更新');
      } else {
        await createAddress(form);
        setMessage('地址已新增');
      }
      resetForm();
      await loadAddresses();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存地址失败');
    }
  }

  async function handleDelete(addressId: number) {
    setError('');
    setMessage('');
    await deleteAddress(addressId);
    setMessage('地址已删除');
    await loadAddresses();
  }

  return (
    <section className="section-stack">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">收货地址</p>
          <h1>管理下单收货信息</h1>
        </div>
      </div>
      <form className="state-panel form-stack" onSubmit={handleSubmit}>
        <label>收货人<input value={form.receiver_name} onChange={(event) => updateField('receiver_name', event.target.value)} /></label>
        <label>手机号<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
        <label>省份<input value={form.province} onChange={(event) => updateField('province', event.target.value)} /></label>
        <label>城市<input value={form.city} onChange={(event) => updateField('city', event.target.value)} /></label>
        <label>区县<input value={form.district} onChange={(event) => updateField('district', event.target.value)} /></label>
        <label>详细地址<input value={form.detail} onChange={(event) => updateField('detail', event.target.value)} /></label>
        <label className="checkbox-row"><input type="checkbox" checked={form.is_default} onChange={(event) => updateField('is_default', event.target.checked)} />设为默认地址</label>
        {error && <div className="error-message" role="alert">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        <div className="action-row">
          <button type="submit">{editingId ? '保存地址' : '新增地址'}</button>
          {editingId && <button type="button" className="secondary-button" onClick={resetForm}>取消编辑</button>}
        </div>
      </form>
      <div className="order-list">
        {addresses.map((address) => (
          <article className="order-card" key={address.id}>
            <div className="order-header"><h2>{address.receiver_name}</h2>{address.is_default && <span className="status-badge">默认</span>}</div>
            <p>{address.phone}</p>
            <p>{address.province}{address.city}{address.district}{address.detail}</p>
            <div className="action-row">
              <button className="secondary-button" onClick={() => { setEditingId(address.id); setForm({ receiver_name: address.receiver_name, phone: address.phone, province: address.province, city: address.city, district: address.district, detail: address.detail, is_default: address.is_default }); }}>编辑</button>
              <button className="danger-button" onClick={() => handleDelete(address.id)}>删除</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
