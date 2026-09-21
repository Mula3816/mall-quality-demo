import { request } from './client';
import type { Address, AddressInput } from './types';

export async function listAddresses() {
  return request<Address[]>('/addresses');
}

export async function createAddress(payload: AddressInput) {
  return request<Address>('/addresses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAddress(addressId: number, payload: AddressInput) {
  return request<Address>(`/addresses/${addressId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAddress(addressId: number) {
  return request<{ message: string }>(`/addresses/${addressId}`, {
    method: 'DELETE',
  });
}
