import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiBaseURL } from '../support/api-base-url';
const testImageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';


test.describe('移动端 H5 自动化', () => {
  test.beforeEach(async ({ request }) => {
    const headers = await loginHeaders(request);
    await clearCart(request, headers);
    await ensureAddress(request, headers);
  });

  test('用户可以在移动端登录并浏览商品', async ({ page }) => {
    await loginByMobileUI(page);

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: '精选商品' })).toBeVisible();
    const firstProduct = page.locator('.mobile-product-card').first();
    await expect(firstProduct).toBeVisible();
    const firstProductText = await firstProduct.textContent();
    const keyword = firstProductText?.trim().slice(0, 2) || '';

    await page.getByPlaceholder('搜索商品或分类').fill(keyword);
    await expect(page.locator('.mobile-product-card').first()).toBeVisible();

  });

  test('用户可以在移动端查看详情、加购并提交订单', async ({ page, request }) => {
    const adminHeaders = await loginHeaders(request, 'admin');
    const product = await createProduct(request, adminHeaders, `移动端流程商品-${Date.now()}`);

    await loginByMobileUI(page);

    await page.goto(`/products/${product.id}`);
    await expect(page.getByRole('button', { name: '加入购物车' })).toBeVisible();
    await page.getByLabel('购买数量').fill('1');
    await page.getByRole('button', { name: '加入购物车' }).click();
    await expect(page.getByText('已加入购物车')).toBeVisible();

    await page.getByRole('button', { name: '去购物车' }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('heading', { name: '确认商品' })).toBeVisible();
    await expect(page.locator('.mobile-cart-item').first()).toBeVisible();

    await page.getByRole('button', { name: '提交订单' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole('heading', { name: '我的订单' })).toBeVisible();
    await expect(page.getByLabel('搜索订单')).toBeVisible();
    const orderCard = page.locator('.mobile-order-card').first();
    await expect(orderCard).toBeVisible();
    await orderCard.getByRole('button', { name: '模拟支付' }).click();
    await expect(page.getByText(/支付成功/)).toBeVisible();
    await expect(orderCard.getByText('已支付', { exact: true })).toBeVisible();

    await request.delete(`${apiBaseURL}/api/admin/products/${product.id}`, { headers: adminHeaders });
  });

  test('用户可以在移动端修改购物车数量并删除商品', async ({ page, request }) => {
    const adminHeaders = await loginHeaders(request, 'admin');
    const product = await createProduct(request, adminHeaders, `移动端购物车商品-${Date.now()}`);

    await loginByMobileUI(page);

    await page.goto(`/products/${product.id}`);
    await page.getByRole('button', { name: '加入购物车' }).click();
    await expect(page.getByText('已加入购物车')).toBeVisible();
    await page.getByRole('button', { name: '去购物车' }).click();

    const cartItem = page.locator('.mobile-cart-item').first();
    await expect(cartItem).toBeVisible();
    await cartItem.getByLabel('数量').fill('2');
    await expect(cartItem.getByLabel('数量')).toHaveValue('2');

    await cartItem.getByRole('button', { name: '删除' }).click();
    await expect(page.getByText('购物车为空，请先选择商品。')).toBeVisible();

    await request.delete(`${apiBaseURL}/api/admin/products/${product.id}`, { headers: adminHeaders });
  });
});

async function loginByMobileUI(page: Page) {
  await page.goto('/login');
  await page.getByLabel('用户名').fill('buyer');
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '登录' }).click();
}

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
      description: '用于移动端 H5 自动化测试的数据',
      price: 88.8,
      stock: 8,
      category: '移动端测试分类',
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
      receiver_name: `移动端地址-${Date.now()}`,
      phone: '13800000000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '移动端自动化测试路 1 号',
      is_default: true,
    },
  });
  await expect(response).toBeOK();
  const address = await response.json();
  return address.id as number;
}

