import { request } from './client';
import type { User } from './types';

export async function login(username: string, password: string) {
  return request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username: string, password: string, nickname: string) {
  return request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, nickname }),
  });
}

export async function getMe() {

  return request<User>('/users/me');
}
