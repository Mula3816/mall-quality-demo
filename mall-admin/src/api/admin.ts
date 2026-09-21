import { request } from './client';
import type { AdminOrder, AdminSummary, AdminUser, Product, ProductInput } from './types';

export async function getSummary() {
  return request<AdminSummary>('/admin/summary');
}

export async function listProducts() {
  return request<Product[]>('/admin/products');
}

export async function createProduct(payload: ProductInput) {
  return request<Product>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(productId: number, payload: ProductInput) {
  return request<Product>(`/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId: number) {
  return request<{ message: string }>(`/admin/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function listOrders() {
  return request<AdminOrder[]>('/admin/orders');
}

export async function updateOrderStatus(orderId: number, status: string) {
  return request<AdminOrder>(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function updateOrderShipment(orderId: number, payload: { logistics_company: string; tracking_number: string; logistics_note: string }) {
  return request<AdminOrder>(`/admin/orders/${orderId}/shipment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAfterSaleStatus(afterSaleId: number, status: string, reply: string) {
  return request(`/admin/after-sales/${afterSaleId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reply }),
  });
}

export async function listUsers() {
  return request<AdminUser[]>('/admin/users');
}
