import { request } from './client';
import type { Cart, CartItem } from './types';

export async function getCart() {
  return request<Cart>('/cart');
}

export async function addCartItem(productId: number, quantity = 1) {
  return request<CartItem>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function updateCartItem(itemId: number, quantity: number) {
  return request<CartItem>(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
}

export async function deleteCartItem(itemId: number) {
  return request<{ message: string }>(`/cart/items/${itemId}`, {
    method: 'DELETE',
  });
}
