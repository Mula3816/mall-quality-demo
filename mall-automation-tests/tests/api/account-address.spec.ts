import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { apiBaseURL } from '../support/api-base-url';

test.describe('账号和收货地址接口自动化', () => {
  test('新用户可以注册、维护地址并带地址下单', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const username = `user_${Date.now()}`;

    const registerResponse = await api.post('/api/auth/register', {
      data: { username, password: '123456', nickname: '自动化新用户' },
    });
    await expect(registerResponse).toBeOK();
    const token = (await registerResponse.json()).access_token as string;
    const headers = { Authorization: `Bearer ${token}` };

    const addressResponse = await api.post('/api/addresses', {
      headers,
      data: buildAddress('张三', true),
    });
    await expect(addressResponse).toBeOK();
    const address = await addressResponse.json();
    expect(address).toMatchObject({ receiver_name: '张三', is_default: true });

    const updateAddressResponse = await api.put(`/api/addresses/${address.id}`, {
      headers,
      data: buildAddress('李四', true),
    });
    await expect(updateAddressResponse).toBeOK();
    expect(await updateAddressResponse.json()).toMatchObject({ receiver_name: '李四', is_default: true });

    const productsResponse = await api.get('/api/products');
    await expect(productsResponse).toBeOK();
    const products = await productsResponse.json();
    const product = products.find((item: { stock: number }) => item.stock > 0) || products[0];

    const addCartResponse = await api.post('/api/cart/items', {
      headers,
      data: { product_id: product.id, quantity: 1 },
    });
    await expect(addCartResponse).toBeOK();

    const orderResponse = await api.post('/api/orders', {
      headers,
      data: { address_id: address.id },
    });
    await expect(orderResponse).toBeOK();
    const order = await orderResponse.json();
    expect(order.address_id).toBe(address.id);
    expect(order.address_snapshot).toContain('李四');

    await api.dispose();
  });

  test('地址只能由所属用户删除', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const ownerHeaders = await registerUser(api, `owner_${Date.now()}`);
    const otherHeaders = await registerUser(api, `other_${Date.now()}`);

    const addressResponse = await api.post('/api/addresses', {
      headers: ownerHeaders,
      data: buildAddress('王五', true),
    });
    await expect(addressResponse).toBeOK();
    const address = await addressResponse.json();

    const forbiddenDeleteResponse = await api.delete(`/api/addresses/${address.id}`, { headers: otherHeaders });
    expect(forbiddenDeleteResponse.status()).toBe(404);

    const ownerDeleteResponse = await api.delete(`/api/addresses/${address.id}`, { headers: ownerHeaders });
    await expect(ownerDeleteResponse).toBeOK();
    expect(await ownerDeleteResponse.json()).toEqual({ message: 'deleted' });

    await api.dispose();
  });
});

function buildAddress(receiverName: string, isDefault: boolean) {
  return {
    receiver_name: receiverName,
    phone: '13800000000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '自动化测试路 1 号',
    is_default: isDefault,
  };
}

async function registerUser(api: APIRequestContext, username: string) {
  const response = await api.post('/api/auth/register', {
    data: { username, password: '123456', nickname: username },
  });
  await expect(response).toBeOK();
  const token = (await response.json()).access_token as string;
  return { Authorization: `Bearer ${token}` };
}
