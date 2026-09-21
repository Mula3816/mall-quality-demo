import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 端口可通过环境变量 MALL_MOBILE_PORT 覆盖，默认 5175。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'MALL_');

  return {
    plugins: [react()],
    server: {
      port: Number(env.MALL_MOBILE_PORT) || 5175,
    },
    preview: {
      port: Number(env.MALL_MOBILE_PORT) || 5175,
    },
  };
});
