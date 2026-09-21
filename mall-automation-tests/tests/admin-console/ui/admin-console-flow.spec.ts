import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { apiBaseURL } from '../../support/api-base-url';
const testImageUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80';

test.describe('管理后台 UI 自动化', () => {
  test('公司管理人员可以登录并查看后台概览', async ({ page }) => {
    await loginByUI(page);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: '后台运营面板' })).toBeVisible();
    await expect(page.getByText('公司管理人员')).toBeVisible();
    await expect(page.getByRole('heading', { name: '管理后台实时数据' })).toBeVisible();
    await expect(page.getByLabel('搜索概览指标')).toBeVisible();
    await expect(page.getByText('商品总数')).toBeVisible();
    await expect(page.getByText('订单总数')).toBeVisible();
  });

  test('公司管理人员可以在后台所有功能页看到搜索框', async ({ page }) => {
    await loginByUI(page);

    await expect(page.getByLabel('搜索概览指标')).toBeVisible();

    await page.getByRole('link', { name: '商品管理' }).click();
    await expect(page.getByLabel('搜索商品')).toBeVisible();

    await page.getByRole('link', { name: '订单管理' }).click();
    await expect(page.getByLabel('搜索订单')).toBeVisible();

    await page.getByRole('link', { name: '用户管理' }).click();
    await expect(page.getByLabel('搜索用户')).toBeVisible();
  });

  test('商家可以登录后台但不能进入用户管理', async ({ page }) => {
    await loginByUI(page, 'merchant');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('商家')).toBeVisible();
    await expect(page.getByRole('link', { name: '商品管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: '订单管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: '用户管理' })).toHaveCount(0);

    await page.goto('/users');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('管理员可以在后台新增、编辑和删除商品', async ({ page }) => {
    const productName = `后台UI测试商品-${Date.now()}`;

    await loginByUI(page);
    await page.getByRole('link', { name: '商品管理' }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('heading', { name: '维护商城商品和库存' })).toBeVisible();
    await expect(page.getByLabel('搜索商品')).toBeVisible();

    await page.getByLabel('商品名称').fill(productName);
    await page.getByLabel('分类').fill('后台UI测试分类');
    await page.getByLabel('价格').fill('88.8');
    await page.getByLabel('库存').fill('12');
    await page.getByLabel('图片地址').fill(testImageUrl);
    await page.getByLabel('商品描述').fill('用于管理后台 UI 自动化测试的数据');
    await page.getByRole('button', { name: '新增商品' }).click();

    await expect(page.getByText('商品已新增')).toBeVisible();
    await expect(page.getByRole('cell', { name: productName })).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: productName });
    await row.getByRole('button', { name: '编辑' }).click();
    await page.getByLabel('商品名称').fill(`${productName}-已更新`);
    await page.getByLabel('库存').fill('7');
    await page.getByRole('button', { name: '保存修改' }).click();

    await expect(page.getByText('商品已更新')).toBeVisible();
    await expect(page.getByRole('cell', { name: `${productName}-已更新` })).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    const updatedRow = page.getByRole('row').filter({ hasText: `${productName}-已更新` });
    await updatedRow.getByRole('button', { name: '删除' }).click();
    await expect(page.getByText('商品已删除')).toBeVisible();
    await expect(page.getByText(`${productName}-已更新`)).toHaveCount(0);
  });

  test('管理员可以在后台更新订单状态', async ({ page, request }) => {
    const orderId = await createOrderByApi(request);

    await loginByUI(page);
    await page.getByRole('link', { name: '订单管理' }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByLabel('搜索订单')).toBeVisible();

    const row = page.getByRole('row').filter({ has: page.getByText(`#${orderId}`, { exact: true }) });
    await expect(row).toBeVisible();
    await row.getByRole('combobox').selectOption('shipped');
    await row.getByRole('button', { name: '保存状态' }).click();

    await expect(page.getByText(`订单 #${orderId} 状态已更新`)).toBeVisible();
    await expect(row.getByText('当前：已发货')).toBeVisible();
  });
});

async function loginByUI(page: Page, username = 'admin') {
  await page.goto('/login');
  await page.getByLabel('用户名').fill(username);
  await page.getByLabel('密码').fill('123456');
  await page.getByRole('button', { name: '进入后台' }).click();
  // 等待登录完成（token 写入 localStorage 后跳转概览页）再返回，
  // 避免调用方在登录请求尚未完成时访问受保护页面导致偶发失败。
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function createOrderByApi(request: APIRequestContext) {
  const adminHeaders = await loginHeaders(request, 'admin');
  const buyerHeaders = await loginHeaders(request, 'buyer');
  const productResponse = await request.post(`${apiBaseURL}/api/admin/products`, {
    headers: adminHeaders,
    data: {
      name: `后台UI订单商品-${Date.now()}`,
      description: '用于管理后台订单状态 UI 自动化测试',
      price: 66.6,
      stock: 5,
      category: '后台UI测试分类',
      image_url: testImageUrl,
    },
  });
  await expect(productResponse).toBeOK();
  const product = await productResponse.json();

  await clearCart(request, buyerHeaders);
  const addressId = await createAddress(request, buyerHeaders, '后台 UI 地址');
  const addCartResponse = await request.post(`${apiBaseURL}/api/cart/items`, {
    headers: buyerHeaders,
    data: { product_id: product.id, quantity: 1 },
  });
  await expect(addCartResponse).toBeOK();

  const orderResponse = await request.post(`${apiBaseURL}/api/orders`, {
    headers: buyerHeaders,
    data: { address_id: addressId },
  });
  await expect(orderResponse).toBeOK();
  const order = await orderResponse.json();
  expect(order.address_id).toBe(addressId);

  const payResponse = await request.post(`${apiBaseURL}/api/orders/${order.id}/pay`, { headers: buyerHeaders });
  await expect(payResponse).toBeOK();
  const paidOrder = await payResponse.json();
  expect(paidOrder.status).toBe('paid');
  return order.id as number;
}

async function loginHeaders(request: APIRequestContext, username = 'admin') {
  const loginResponse = await request.post(`${apiBaseURL}/api/auth/login`, {
    data: { username, password: '123456' },
  });
  await expect(loginResponse).toBeOK();
  const token = (await loginResponse.json()).access_token as string;
  return { Authorization: `Bearer ${token}` };
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

async function createAddress(request: APIRequestContext, headers: Record<string, string>, receiverName: string) {
  const response = await request.post(`${apiBaseURL}/api/addresses`, {
    headers,
    data: {
      receiver_name: receiverName,
      phone: '13800000000',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      detail: '后台 UI 测试路 1 号',
      is_default: true,
    },
  });
  await expect(response).toBeOK();
  const address = await response.json();
  return address.id as number;
}

