import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { apiBaseURL } from '../support/api-base-url';

test.describe('商城接口自动化', () => {
  test('健康检查接口可用', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    const response = await api.get('/api/health');

    await expect(response).toBeOK();
    expect(await response.json()).toEqual({ status: 'ok', service: 'mall-backend' });
    await api.dispose();
  });

  test('错误密码登录失败', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    const response = await api.post('/api/auth/login', {
      data: { username: 'buyer', password: 'wrong-password' },
    });

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ detail: '用户名或密码错误' });
    await api.dispose();
  });

  test('登录后可完成商品加购、下单、查询订单', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    const loginResponse = await api.post('/api/auth/login', {
      data: { username: 'buyer', password: '123456' },
    });
    await expect(loginResponse).toBeOK();
    const token = (await loginResponse.json()).access_token as string;
    const headers = { Authorization: `Bearer ${token}` };

    await clearCart(api, headers);
    const addressId = await ensureAddress(api, headers);


    const productsResponse = await api.get('/api/products');
    await expect(productsResponse).toBeOK();
    const products = await productsResponse.json();
    expect(products.length).toBeGreaterThan(0);
    const product = products.find((item: { stock: number }) => item.stock > 0) || products[0];

    const addCartResponse = await api.post('/api/cart/items', {
      headers,
      data: { product_id: product.id, quantity: 1 },
    });
    await expect(addCartResponse).toBeOK();
    expect(await addCartResponse.json()).toMatchObject({ product_id: product.id, quantity: 1 });

    const cartResponse = await api.get('/api/cart', { headers });
    await expect(cartResponse).toBeOK();
    const cart = await cartResponse.json();
    expect(cart.items).toHaveLength(1);
    expect(cart.total_amount).toBe(product.price);

    const orderResponse = await api.post('/api/orders', {
      headers,
      data: { address_id: addressId },
    });

    await expect(orderResponse).toBeOK();
    const order = await orderResponse.json();
    expect(order.status).toBe('created');
    expect(order.paid_at).toBeNull();
    expect(order.total_amount).toBe(product.price);
    expect(order.items[0]).toMatchObject({ product_id: product.id, quantity: 1 });
    expect(order.address_id).toBe(addressId);

    const payResponse = await api.post(`/api/orders/${order.id}/pay`, { headers });
    await expect(payResponse).toBeOK();
    const paidOrder = await payResponse.json();
    expect(paidOrder.status).toBe('paid');
    expect(paidOrder.paid_at).toEqual(expect.any(String));

    const repeatPayResponse = await api.post(`/api/orders/${order.id}/pay`, { headers });
    expect(repeatPayResponse.status()).toBe(400);
    expect(await repeatPayResponse.json()).toMatchObject({ detail: '当前订单不能支付' });

    const clearedCartResponse = await api.get('/api/cart', { headers });
    await expect(clearedCartResponse).toBeOK();
    expect(await clearedCartResponse.json()).toEqual({ items: [], total_amount: 0 });

    const ordersResponse = await api.get('/api/orders', { headers });
    await expect(ordersResponse).toBeOK();
    const orders = await ordersResponse.json();
    expect(orders[0].id).toBe(order.id);
    expect(orders[0].status).toBe('paid');

    await api.dispose();
  });
});

async function clearCart(api: APIRequestContext, headers: Record<string, string>) {
  const cartResponse = await api.get('/api/cart', { headers });
  if (!cartResponse.ok()) {
    return;
  }

  const cart = await cartResponse.json();
  for (const item of cart.items || []) {
    await api.delete(`/api/cart/items/${item.id}`, { headers });
  }
}

async function ensureAddress(api: APIRequestContext, headers: Record<string, string>) {
  const response = await api.post('/api/addresses', {
    headers,
    data: buildAddress(`自动化地址-${Date.now()}`),
  });
  await expect(response).toBeOK();
  const address = await response.json();
  return address.id as number;
}

function buildAddress(receiverName: string) {
  return {
    receiver_name: receiverName,
    phone: '13800000000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '自动化测试路 1 号',
    is_default: true,
  };
}

