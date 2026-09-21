// 后端地址可通过环境变量 VITE_API_BASE_URL 覆盖，例如远程部署时指向真实域名。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
const ADMIN_TOKEN_KEY = 'admin_access_token';
const ADMIN_ROLE_KEY = 'admin_role';
const ADMIN_NICKNAME_KEY = 'admin_nickname';

export type ApiError = {
  detail?: string;
};

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminRole() {
  return localStorage.getItem(ADMIN_ROLE_KEY);
}

export function setAdminProfile(nickname: string, role: string) {
  localStorage.setItem(ADMIN_NICKNAME_KEY, nickname);
  localStorage.setItem(ADMIN_ROLE_KEY, role);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_NICKNAME_KEY);
  localStorage.removeItem(ADMIN_ROLE_KEY);
}


export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(data.detail || `请求失败：${response.status}`);
  }

  return response.json() as Promise<T>;
}
