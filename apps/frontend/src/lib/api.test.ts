import { describe, expect, it, vi } from 'vitest';
import {
  addToCart,
  createCart,
  createCheckoutSession,
  fetchCart,
  fetchCategories,
  fetchCheckoutSessionStatus,
  fetchFeaturedProducts,
  fetchOrder,
  fetchProduct,
  fetchProducts,
  removeCartItem,
  updateCartItem,
} from './api';
import { http } from '../shared/lib/http';

vi.mock('../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('catalog and checkout API wrappers', () => {
  it('calls product endpoints with expected paths', async () => {
    vi.mocked(http.get).mockResolvedValue({ success: true });

    await fetchProducts({ search: 'wallet' });
    await fetchFeaturedProducts();
    await fetchCategories();
    await fetchProduct('1');

    expect(http.get).toHaveBeenNthCalledWith(1, '/products', { params: { search: 'wallet' } });
    expect(http.get).toHaveBeenNthCalledWith(2, '/products/featured');
    expect(http.get).toHaveBeenNthCalledWith(3, '/products/categories');
    expect(http.get).toHaveBeenNthCalledWith(4, '/products/1');
  });

  it('calls cart endpoints with expected payloads', async () => {
    vi.mocked(http.post).mockResolvedValue({ success: true });
    vi.mocked(http.get).mockResolvedValue({ success: true });
    vi.mocked(http.patch).mockResolvedValue({ success: true });
    vi.mocked(http.delete).mockResolvedValue({ success: true });

    await createCart();
    await fetchCart('cart-1');
    await addToCart('cart-1', 'product-1', 2);
    await updateCartItem('cart-1', 'product-1', 3);
    await removeCartItem('cart-1', 'product-1');

    expect(http.post).toHaveBeenCalledWith('/cart');
    expect(http.get).toHaveBeenCalledWith('/cart/cart-1');
    expect(http.post).toHaveBeenCalledWith('/cart/cart-1/items', { productId: 'product-1', quantity: 2 });
    expect(http.patch).toHaveBeenCalledWith('/cart/cart-1/items/product-1', { quantity: 3 });
    expect(http.delete).toHaveBeenCalledWith('/cart/cart-1/items/product-1');
  });

  it('calls checkout and order endpoints', async () => {
    vi.mocked(http.post).mockResolvedValue({ success: true });
    vi.mocked(http.get).mockResolvedValue({ success: true });

    const customer = {
      name: 'Test User',
      email: 'test@example.com',
      address: { line1: '1 Main', city: 'LA', state: 'CA', zip: '90001', country: 'US' },
    };

    await createCheckoutSession({ cartId: 'cart-1', customer, returnUrl: 'http://localhost:5173' });
    await fetchCheckoutSessionStatus('cs_1', 'test@example.com');
    await fetchOrder('order-1', 'test@example.com');

    expect(http.post).toHaveBeenCalledWith('/checkout/session', {
      cartId: 'cart-1',
      customer,
      returnUrl: 'http://localhost:5173',
    });
    expect(http.get).toHaveBeenCalledWith('/checkout/session/cs_1', { params: { email: 'test@example.com' } });
    expect(http.get).toHaveBeenCalledWith('/orders/order-1', { params: { email: 'test@example.com' } });
  });
});
