import { request } from './client';
import type { LoginResult } from './types';

export async function login(username: string, password: string) {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
