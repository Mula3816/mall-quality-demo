import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { apiBaseURL } from '../support/api-base-url';

const testImageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

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

  test('取消订单后商品库存恢复', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    // admin 创建固定库存的商品
    const adminLogin = await api.post('/api/auth/login', {
      data: { username: 'admin', password: '123456' },
    });
    await expect(adminLogin).toBeOK();
    const adminToken = (await adminLogin.json()).access_token as string;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    const createResponse = await api.post('/api/admin/products', {
      headers: adminHeaders,
      data: {
        name: `库存返还商品-${Date.now()}`,
        description: '取消订单库存返还测试数据',
        price: 66.6,
        stock: 5,
        category: '库存测试',
        image_url: testImageUrl,
      },
    });
    await expect(createResponse).toBeOK();
    const product = await createResponse.json();
    expect(product.stock).toBe(5);

    // buyer 加购 2 件并下单
    const buyerLogin = await api.post('/api/auth/login', {
      data: { username: 'buyer', password: '123456' },
    });
    await expect(buyerLogin).toBeOK();
    const buyerToken = (await buyerLogin.json()).access_token as string;
    const buyerHeaders = { Authorization: `Bearer ${buyerToken}` };

    await clearCart(api, buyerHeaders);
    const addressId = await ensureAddress(api, buyerHeaders);

    const addCartResponse = await api.post('/api/cart/items', {
      headers: buyerHeaders,
      data: { product_id: product.id, quantity: 2 },
    });
    await expect(addCartResponse).toBeOK();

    const orderResponse = await api.post('/api/orders', {
      headers: buyerHeaders,
      data: { address_id: addressId },
    });
    await expect(orderResponse).toBeOK();
    const order = await orderResponse.json();

    // 下单扣减库存：5 - 2 = 3
    const stockAfterOrder = await getProductStock(api, product.id);
    expect(stockAfterOrder).toBe(3);

    // 取消订单
    const cancelResponse = await api.post(`/api/orders/${order.id}/cancel`, {
      headers: buyerHeaders,
    });
    await expect(cancelResponse).toBeOK();
    expect((await cancelResponse.json()).status).toBe('canceled');

    // 取消后库存应恢复为 5
    const stockAfterCancel = await getProductStock(api, product.id);
    expect(stockAfterCancel).toBe(5);

    // 清理测试数据
    await api.delete(`/api/admin/products/${product.id}`, { headers: adminHeaders });
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

async function getProductStock(api: APIRequestContext, productId: number) {
  const response = await api.get(`/api/products/${productId}`);
  await expect(response).toBeOK();
  const product = await response.json();
  return product.stock as number;
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

