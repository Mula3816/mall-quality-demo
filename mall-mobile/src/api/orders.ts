import { request } from './client';
import type { Order } from './types';

export async function createOrder(addressId: number) {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({ address_id: addressId }),
  });
}



export async function listOrders() {
  return request<Order[]>('/orders');
}

export async function payOrder(orderId: number) {
  return request<Order>(`/orders/${orderId}/pay`, { method: 'POST' });
}

export async function cancelOrder(orderId: number) {
  return request<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
}

export async function createAfterSale(orderId: number, reason: string, description: string) {
  return request(`/orders/${orderId}/after-sale`, {
    method: 'POST',
    body: JSON.stringify({ reason, description }),
  });
}

export async function createReview(orderId: number, productId: number, rating: number, comment: string) {
  return request(`/orders/${orderId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, rating, comment }),
  });
}


