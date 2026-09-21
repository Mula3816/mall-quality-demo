import { expect, test, type APIRequestContext } from '@playwright/test';

import { apiBaseURL } from '../support/api-base-url';
const testImageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';


test.describe('商城 UI 自动化', () => {
  test.beforeEach(async ({ request }) => {
    const loginResponse = await request.post(`${apiBaseURL}/api/auth/login`, {
      data: { username: 'buyer', password: '123456' },
    });
    const token = (await loginResponse.json()).access_token as string;
    const headers = { Authorization: `Bearer ${token}` };
    await clearCart(request, headers);
    await ensureAddress(request, headers);
  });

  test('用户可以登录并完成下单', async ({ page, request }) => {
    const adminHeaders = await loginHeaders(request, 'admin');
    const product = await createProduct(request, adminHeaders, `PC UI 流程商品-${Date.now()}`);

    await page.goto('/login');

    await page.getByLabel('用户名').fill('buyer');
    await page.getByLabel('密码').fill('123456');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: '选择要购买的商品' })).toBeVisible();
    await expect(page.getByLabel('搜索商品')).toBeVisible();

    await page.goto(`/products/${product.id}`);
    await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
    await expect(page.getByRole('button', { name: '加入购物车' })).toBeVisible();

    await page.getByRole('button', { name: '加入购物车' }).click();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    await page.getByRole('button', { name: '去购物车' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('heading', { name: '确认商品和数量' })).toBeVisible();

    await page.getByRole('button', { name: '提交订单' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: '查看已提交的订单' })).toBeVisible();
    await expect(page.getByLabel('搜索订单')).toBeVisible();
    const orderCard = page.locator('.order-card').first();
    await expect(orderCard).toBeVisible();
    await orderCard.getByRole('button', { name: '模拟支付' }).click();
    await expect(page.getByText(/支付成功/)).toBeVisible();
    await expect(orderCard.getByText('已支付', { exact: true })).toBeVisible();

    await request.delete(`${apiBaseURL}/api/admin/products/${product.id}`, { headers: adminHeaders });
  });
});

async function loginHeaders(request: APIRequestContext, username = 'buyer') {
  const loginResponse = await request.post(`${apiBaseURL}/api/auth/login`, {
    data: { username, password: '123456' },
  });
  await expect(loginResponse).toBeOK();
  const token = (await loginResponse.json()).access_token as string;
  return { Authorization: `Bearer ${token}` };
}

async function createProduct(request: APIRequestContext, headers: Record<string, string>, name: string) {
  const response = await request.post(`${apiBaseURL}/api/admin/products`, {
    headers,
    data: {
      name,
      description: '用于 PC UI 自动化测试的数据',
      price: 77.7,
      stock: 8,
      category: 'PC UI 测试分类',
      image_url: testImageUrl,
    },
  });
  await expect(response).toBeOK();
  return response.json();
}

async function clearCart(request: APIRequestContext, headers: Record<string, string>) {
  const cartResponse = await request.get(`${apiBaseURL}/api/cart`, { headers });
  if (!cartResponse.ok()) {
    return;
  }

  const cart = await cartResponse.json();
  for (const item of cart.items || []) {
    await request.delete(`${apiBaseURL}/api/cart/items/${item.id}`, { headers });
  }
}

async function ensureAddress(request: APIRequestContext, headers: Record<string, string>) {
  const response = await request.post(`${apiBaseURL}/api/addresses`, {
    headers,
    data: {
      receiver_name: `PC UI 地址-${Date.now()}`,
      phone: '13800000000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: 'PC UI 自动化测试路 1 号',
      is_default: true,
    },
  });
  await expect(response).toBeOK();
  const address = await response.json();
  return address.id as number;
}
