import { http } from '../shared/lib/http';
import { Product } from '../types';

export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export async function fetchWishlist(): Promise<{ success: boolean; data: WishlistItem[] }> {
  return http.get('/wishlist');
}

export async function fetchWishlistIds(): Promise<{ success: boolean; data: string[] }> {
  return http.get('/wishlist/ids');
}

export async function addToWishlistApi(productId: string): Promise<{ success: boolean; data: WishlistItem }> {
  return http.post('/wishlist', { productId });
}

export async function removeFromWishlistApi(productId: string): Promise<{ success: boolean }> {
  return http.delete(`/wishlist/${productId}`);
}

export interface ReviewStats {
  count: number;
  average: number;
  distribution: Array<{ star: number; count: number }>;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string;
  user: { id: string; name: string };
}

export async function fetchReviews(productId: string): Promise<{
  success: boolean;
  data: { reviews: Review[]; stats: ReviewStats };
}> {
  return http.get(`/reviews/${productId}`);
}

export async function submitReview(
  productId: string,
  payload: { rating: number; title: string; body: string }
): Promise<{ success: boolean; data: Review }> {
  return http.post(`/reviews/${productId}`, payload);
}

export async function deleteReview(productId: string): Promise<{ success: boolean }> {
  return http.delete(`/reviews/${productId}`);
}

export interface AdminStats {
  users: { total: number };
  orders: { total: number; pending: number; processing: number };
  revenue: { total: number; byDay: Array<{ date: string; revenue: number }> };
  products: { total: number; inStock: number };
}

export async function fetchAdminStats(): Promise<{ success: boolean; data: AdminStats }> {
  return http.get('/admin/stats');
}

export async function fetchAdminOrders(): Promise<{ success: boolean; data: unknown[] }> {
  return http.get('/admin/orders');
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean }> {
  return http.patch(`/admin/orders/${orderId}/status`, { status });
}

export async function fetchAdminUsers(): Promise<{ success: boolean; data: unknown[] }> {
  return http.get('/admin/users');
}
