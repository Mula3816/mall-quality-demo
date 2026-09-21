import { defineConfig, devices } from '@playwright/test';

// 各服务端口可通过环境变量覆盖，默认值与本地开发端口一致。
const apiPort = process.env.MALL_API_PORT || '8000';
const webPort = process.env.MALL_WEB_PORT || '5173';
const adminPort = process.env.MALL_ADMIN_PORT || '5174';
const mobilePort = process.env.MALL_MOBILE_PORT || '5175';
// 后端地址：测试用例通过 tests/support/api-base-url.ts 使用同一套环境变量。
const apiURL = process.env.MALL_API_URL || `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `python -m uvicorn app.main:app --host 127.0.0.1 --port ${apiPort}`,
      cwd: '../mall-backend',
      url: `${apiURL}/api/health`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${webPort}`,
      cwd: '../mall-web',
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${adminPort}`,
      cwd: '../mall-admin',
      url: `http://127.0.0.1:${adminPort}`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${mobilePort}`,
      cwd: '../mall-mobile',
      url: `http://127.0.0.1:${mobilePort}`,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [
    {
      name: 'storefront-api',
      testMatch: 'tests/api/**/*.spec.ts',
    },
    {
      name: 'storefront-ui',
      testMatch: 'tests/ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.MALL_WEB_URL || `http://127.0.0.1:${webPort}`,
      },
    },
    {
      name: 'admin-console-api',
      testMatch: 'tests/admin-console/api/**/*.spec.ts',
    },
    {
      name: 'admin-console-ui',
      testMatch: 'tests/admin-console/ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.MALL_ADMIN_URL || `http://127.0.0.1:${adminPort}`,
      },
    },
    {
      name: 'mobile-h5',
      testMatch: 'tests/mobile-h5/**/*.spec.ts',
      use: {
        ...devices['Pixel 5'],
        baseURL: process.env.MALL_MOBILE_URL || `http://127.0.0.1:${mobilePort}`,
      },
    },
  ],
});
