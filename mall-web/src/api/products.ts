import { request } from './client';
import type { Product, Review } from './types';

export async function listProducts() {
  return request<Product[]>('/products');
}

export async function getProduct(productId: string | number) {
  return request<Product>(`/products/${productId}`);
}

export async function listProductReviews(productId: string | number) {
  return request<Review[]>(`/products/${productId}/reviews`);
}

