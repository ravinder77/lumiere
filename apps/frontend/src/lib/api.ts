import { http } from '../shared/lib/http';
import {
  Product, Cart, Order, Customer,
  ApiResponse, PaginatedResponse, Category, CheckoutSessionResponse, CheckoutSessionStatus,
} from '../types';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function fetchProducts(
  filters: ProductFilters = {}
): Promise<ApiResponse<PaginatedResponse<Product>>> {
  return http.get('/products', { params: filters });
}

export async function fetchFeaturedProducts(): Promise<ApiResponse<Product[]>> {
  return http.get('/products/featured');
}

export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  return http.get('/products/categories');
}

export async function fetchProduct(
  id: string
): Promise<ApiResponse<{ product: Product; related: Product[] }>> {
  return http.get(`/products/${id}`);
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export async function createCart(): Promise<ApiResponse<Cart>> {
  return http.post('/cart');
}

export async function fetchCart(cartId: string): Promise<ApiResponse<Cart>> {
  return http.get(`/cart/${cartId}`);
}

export async function addToCart(
  cartId: string, productId: string, quantity = 1
): Promise<ApiResponse<Cart>> {
  return http.post(`/cart/${cartId}/items`, { productId, quantity });
}

export async function updateCartItem(
  cartId: string, productId: string, quantity: number
): Promise<ApiResponse<Cart>> {
  return http.patch(`/cart/${cartId}/items/${productId}`, { quantity });
}

export async function removeCartItem(
  cartId: string, productId: string
): Promise<ApiResponse<Cart>> {
  return http.delete(`/cart/${cartId}/items/${productId}`);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function createCheckoutSession(payload: {
  cartId: string;
  customer: Customer;
  returnUrl: string;
}): Promise<ApiResponse<CheckoutSessionResponse>> {
  return http.post('/checkout/session', payload);
}

export async function fetchCheckoutSessionStatus(
  sessionId: string,
  email?: string
): Promise<ApiResponse<CheckoutSessionStatus>> {
  return http.get(`/checkout/session/${sessionId}`, { params: { email } });
}

export async function fetchOrder(id: string, email?: string): Promise<ApiResponse<Order>> {
  return http.get(`/orders/${id}`, { params: { email } });
}
