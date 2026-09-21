// 后端 API 地址统一配置：优先读 MALL_API_URL，否则按 MALL_API_PORT 拼接，默认 http://127.0.0.1:8000。
// 与 playwright.config.ts 中的后端服务配置保持一致。
export const apiBaseURL =
  process.env.MALL_API_URL || `http://127.0.0.1:${process.env.MALL_API_PORT || '8000'}`;
