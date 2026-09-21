import { expect, request, test, type APIRequestContext } from '@playwright/test';

import { apiBaseURL } from '../../support/api-base-url';
const testImageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string;
};

test.describe('管理后台接口自动化', () => {
  test('未登录不能访问后台概览接口', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });

    const response = await api.get('/api/admin/summary');

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ detail: '未登录' });
    await api.dispose();
  });

  test('管理员可以查看概览、商品、订单和用户数据', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const headers = await loginAsAdmin(api);

    const summaryResponse = await api.get('/api/admin/summary', { headers });
    await expect(summaryResponse).toBeOK();
    const summary = await summaryResponse.json();
    expect(summary.total_products).toBeGreaterThanOrEqual(0);
    expect(summary.total_users).toBeGreaterThanOrEqual(1);
    expect(summary.revenue).toBeGreaterThanOrEqual(0);

    const productsResponse = await api.get('/api/admin/products', { headers });
    await expect(productsResponse).toBeOK();
    expect(Array.isArray(await productsResponse.json())).toBe(true);

    const ordersResponse = await api.get('/api/admin/orders', { headers });
    await expect(ordersResponse).toBeOK();
    expect(Array.isArray(await ordersResponse.json())).toBe(true);

    const usersResponse = await api.get('/api/admin/users', { headers });
    await expect(usersResponse).toBeOK();
    const users = await usersResponse.json();
    expect(users).toEqual(expect.arrayContaining([expect.objectContaining({ username: 'admin', role: 'company_admin' })]));

    await api.dispose();
  });

  test('买家不能访问后台，商家可以访问后台但不能查看用户管理', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const buyerHeaders = await loginAsRole(api, 'buyer');
    const merchantHeaders = await loginAsRole(api, 'merchant');

    const buyerSummaryResponse = await api.get('/api/admin/summary', { headers: buyerHeaders });
    expect(buyerSummaryResponse.status()).toBe(403);
    expect(await buyerSummaryResponse.json()).toMatchObject({ detail: '无后台访问权限' });

    const merchantSummaryResponse = await api.get('/api/admin/summary', { headers: merchantHeaders });
    await expect(merchantSummaryResponse).toBeOK();

    const merchantProductsResponse = await api.get('/api/admin/products', { headers: merchantHeaders });
    await expect(merchantProductsResponse).toBeOK();

    const merchantOrdersResponse = await api.get('/api/admin/orders', { headers: merchantHeaders });
    await expect(merchantOrdersResponse).toBeOK();

    const merchantUsersResponse = await api.get('/api/admin/users', { headers: merchantHeaders });
    expect(merchantUsersResponse.status()).toBe(403);
    expect(await merchantUsersResponse.json()).toMatchObject({ detail: '仅公司管理人员可操作' });

    await api.dispose();
  });

  test('管理员可以新增、编辑和删除商品', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const headers = await loginAsAdmin(api);
    const productName = `后台接口测试商品-${Date.now()}`;
    const payload = buildProductPayload(productName);

    const createResponse = await api.post('/api/admin/products', { headers, data: payload });
    await expect(createResponse).toBeOK();
    const createdProduct = await createResponse.json();
    expect(createdProduct).toMatchObject({ name: productName, stock: payload.stock });

    const updatePayload = { ...payload, name: `${productName}-已更新`, price: 129.9, stock: 6 };
    const updateResponse = await api.put(`/api/admin/products/${createdProduct.id}`, {
      headers,
      data: updatePayload,
    });
    await expect(updateResponse).toBeOK();
    const updatedProduct = await updateResponse.json();
    expect(updatedProduct).toMatchObject({ name: updatePayload.name, price: 129.9, stock: 6 });

    const deleteResponse = await api.delete(`/api/admin/products/${createdProduct.id}`, { headers });
    await expect(deleteResponse).toBeOK();
    expect(await deleteResponse.json()).toEqual({ message: 'deleted' });

    await api.dispose();
  });

  test('管理员按合法流程推进订单状态', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const adminHeaders = await loginAsAdmin(api);
    const buyerHeaders = await loginAsRole(api, 'buyer');
    const productName = `后台订单测试商品-${Date.now()}`;
    const product = await createProduct(api, adminHeaders, buildProductPayload(productName));

    await clearCart(api, buyerHeaders);
    const addressId = await createAddress(api, buyerHeaders, '买家地址');

    const cartResponse = await api.post('/api/cart/items', {
      headers: buyerHeaders,
      data: { product_id: product.id, quantity: 1 },
    });
    await expect(cartResponse).toBeOK();

    const orderResponse = await api.post('/api/orders', {
      headers: buyerHeaders,
      data: { address_id: addressId },
    });

    await expect(orderResponse).toBeOK();
    const order = await orderResponse.json();
    expect(order.status).toBe('created');
    expect(order.address_id).toBe(addressId);

    const invalidShipResponse = await api.patch(`/api/admin/orders/${order.id}/status`, {
      headers: adminHeaders,
      data: { status: 'shipped' },
    });
    expect(invalidShipResponse.status()).toBe(400);
    expect(await invalidShipResponse.json()).toMatchObject({ detail: '订单状态流转不合法' });

    const payResponse = await api.post(`/api/orders/${order.id}/pay`, { headers: buyerHeaders });
    await expect(payResponse).toBeOK();
    const paidOrder = await payResponse.json();
    expect(paidOrder.status).toBe('paid');
    expect(paidOrder.paid_at).toEqual(expect.any(String));

    const shipResponse = await api.patch(`/api/admin/orders/${order.id}/status`, {
      headers: adminHeaders,
      data: { status: 'shipped' },
    });
    await expect(shipResponse).toBeOK();
    const shippedOrder = await shipResponse.json();
    expect(shippedOrder.status).toBe('shipped');
    expect(shippedOrder.shipped_at).toEqual(expect.any(String));
    expect(shippedOrder.user).toMatchObject({ username: 'buyer', role: 'customer' });

    const completeResponse = await api.patch(`/api/admin/orders/${order.id}/status`, {
      headers: adminHeaders,
      data: { status: 'completed' },
    });
    await expect(completeResponse).toBeOK();
    const completedOrder = await completeResponse.json();
    expect(completedOrder.status).toBe('completed');
    expect(completedOrder.completed_at).toEqual(expect.any(String));

    await api.delete(`/api/admin/products/${product.id}`, { headers: adminHeaders });
    await api.dispose();
  });

  test('后台发货后买家可以查看物流、申请售后并评价商品', async () => {
    const api = await request.newContext({ baseURL: apiBaseURL });
    const adminHeaders = await loginAsAdmin(api);
    const buyerHeaders = await loginAsRole(api, 'buyer');
    const productName = `物流售后评价商品-${Date.now()}`;
    const product = await createProduct(api, adminHeaders, buildProductPayload(productName));

    await clearCart(api, buyerHeaders);
    const addressId = await createAddress(api, buyerHeaders, '物流售后地址');

    const addCartResponse = await api.post('/api/cart/items', {
      headers: buyerHeaders,
      data: { product_id: product.id, quantity: 1 },
    });
    await expect(addCartResponse).toBeOK();

    const orderResponse = await api.post('/api/orders', {
      headers: buyerHeaders,
      data: { address_id: addressId },
    });
    await expect(orderResponse).toBeOK();
    const order = await orderResponse.json();

    const payResponse = await api.post(`/api/orders/${order.id}/pay`, { headers: buyerHeaders });
    await expect(payResponse).toBeOK();

    const shipmentResponse = await api.post(`/api/admin/orders/${order.id}/shipment`, {
      headers: adminHeaders,
      data: {
        logistics_company: '顺丰速运',
        tracking_number: `SF${Date.now()}`,
        logistics_note: '包裹已从杭州仓发出',
      },
    });
    await expect(shipmentResponse).toBeOK();
    const shippedOrder = await shipmentResponse.json();
    expect(shippedOrder.status).toBe('shipped');
    expect(shippedOrder.logistics).toMatchObject({ company: '顺丰速运', note: '包裹已从杭州仓发出' });

    const buyerOrderResponse = await api.get(`/api/orders/${order.id}`, { headers: buyerHeaders });
    await expect(buyerOrderResponse).toBeOK();
    const buyerOrder = await buyerOrderResponse.json();
    expect(buyerOrder.logistics).toMatchObject({ company: '顺丰速运' });

    const afterSaleResponse = await api.post(`/api/orders/${order.id}/after-sale`, {
      headers: buyerHeaders,
      data: { reason: '商品问题', description: '收到后需要申请售后处理' },
    });
    await expect(afterSaleResponse).toBeOK();
    const afterSale = await afterSaleResponse.json();
    expect(afterSale.status).toBe('pending');

    const afterSaleStatusResponse = await api.patch(`/api/admin/after-sales/${afterSale.id}/status`, {
      headers: adminHeaders,
      data: { status: 'approved', reply: '同意售后，请保持电话畅通' },
    });
    await expect(afterSaleStatusResponse).toBeOK();
    expect(await afterSaleStatusResponse.json()).toMatchObject({ status: 'approved', reply: '同意售后，请保持电话畅通' });

    const completeResponse = await api.patch(`/api/admin/orders/${order.id}/status`, {
      headers: adminHeaders,
      data: { status: 'completed' },
    });
    await expect(completeResponse).toBeOK();

    const reviewResponse = await api.post(`/api/orders/${order.id}/reviews`, {
      headers: buyerHeaders,
      data: { product_id: product.id, rating: 5, comment: '物流很快，售后响应及时' },
    });
    await expect(reviewResponse).toBeOK();
    expect(await reviewResponse.json()).toMatchObject({ product_id: product.id, rating: 5, comment: '物流很快，售后响应及时' });

    const productReviewsResponse = await api.get(`/api/products/${product.id}/reviews`);
    await expect(productReviewsResponse).toBeOK();
    expect(await productReviewsResponse.json()).toEqual(
      expect.arrayContaining([expect.objectContaining({ product_id: product.id, rating: 5 })]),
    );

    await api.delete(`/api/admin/products/${product.id}`, { headers: adminHeaders });
    await api.dispose();
  });
});

async function loginAsRole(api: APIRequestContext, username: string) {
  const loginResponse = await api.post('/api/auth/login', {
    data: { username, password: '123456' },
  });
  await expect(loginResponse).toBeOK();
  const token = (await loginResponse.json()).access_token as string;
  return { Authorization: `Bearer ${token}` };
}

async function loginAsAdmin(api: APIRequestContext) {
  return loginAsRole(api, 'admin');
}


function buildProductPayload(name: string): ProductPayload {
  return {
    name,
    description: '用于管理后台自动化测试的数据',
    price: 99.9,
    stock: 10,
    category: '后台测试分类',
    image_url: testImageUrl,
  };
}

async function createProduct(api: APIRequestContext, headers: Record<string, string>, payload: ProductPayload) {
  const response = await api.post('/api/admin/products', { headers, data: payload });
  await expect(response).toBeOK();
  return response.json();
}

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

async function createAddress(api: APIRequestContext, headers: Record<string, string>, receiverName: string) {
  const response = await api.post('/api/addresses', {
    headers,
    data: {
      receiver_name: receiverName,
      phone: '13800000000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '后台自动化测试路 1 号',
      is_default: true,
    },
  });
  await expect(response).toBeOK();
  const address = await response.json();
  return address.id as number;
}

