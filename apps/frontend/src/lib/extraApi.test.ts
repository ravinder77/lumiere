import { describe, expect, it, vi } from 'vitest';
import {
  addToWishlistApi,
  deleteReview,
  fetchAdminOrders,
  fetchAdminStats,
  fetchAdminUsers,
  fetchReviews,
  fetchWishlist,
  fetchWishlistIds,
  removeFromWishlistApi,
  submitReview,
  updateOrderStatus,
} from './extraApi';
import { http } from '../shared/lib/http';

vi.mock('../shared/lib/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('extra API wrappers', () => {
  it('calls wishlist endpoints', async () => {
    vi.mocked(http.get).mockResolvedValue({ success: true });
    vi.mocked(http.post).mockResolvedValue({ success: true });
    vi.mocked(http.delete).mockResolvedValue({ success: true });

    await fetchWishlist();
    await fetchWishlistIds();
    await addToWishlistApi('product-1');
    await removeFromWishlistApi('product-1');

    expect(http.get).toHaveBeenCalledWith('/wishlist');
    expect(http.get).toHaveBeenCalledWith('/wishlist/ids');
    expect(http.post).toHaveBeenCalledWith('/wishlist', { productId: 'product-1' });
    expect(http.delete).toHaveBeenCalledWith('/wishlist/product-1');
  });

  it('sends review userId when deleting on behalf of another user', async () => {
    vi.mocked(http.get).mockResolvedValue({ success: true });
    vi.mocked(http.post).mockResolvedValue({ success: true });
    vi.mocked(http.delete).mockResolvedValue({ success: true });

    await fetchReviews('product-1');
    await submitReview('product-1', { rating: 5, title: 'Great', body: 'Excellent product' });
    await deleteReview('product-1', 'user-2');
    await deleteReview('product-1');

    expect(http.get).toHaveBeenCalledWith('/reviews/product-1');
    expect(http.post).toHaveBeenCalledWith('/reviews/product-1', {
      rating: 5,
      title: 'Great',
      body: 'Excellent product',
    });
    expect(http.delete).toHaveBeenCalledWith('/reviews/product-1', { body: { userId: 'user-2' } });
    expect(http.delete).toHaveBeenCalledWith('/reviews/product-1', { body: undefined });
  });

  it('calls admin endpoints', async () => {
    vi.mocked(http.get).mockResolvedValue({ success: true });
    vi.mocked(http.patch).mockResolvedValue({ success: true });

    await fetchAdminStats();
    await fetchAdminOrders();
    await fetchAdminUsers();
    await updateOrderStatus('order-1', 'SHIPPED');

    expect(http.get).toHaveBeenCalledWith('/admin/stats');
    expect(http.get).toHaveBeenCalledWith('/admin/orders');
    expect(http.get).toHaveBeenCalledWith('/admin/users');
    expect(http.patch).toHaveBeenCalledWith('/admin/orders/order-1/status', { status: 'SHIPPED' });
  });
});
