import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReview, fetchReviews, submitReview } from '../lib/extraApi';
import { useAuthStore } from '../store/authStore';
import ReviewsSection from './ReviewsSection';

vi.mock('../lib/extraApi', () => ({
  fetchReviews: vi.fn(),
  submitReview: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ReviewsSection', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', createdAt: '' },
    });
    vi.mocked(fetchReviews).mockResolvedValue({
      success: true,
      data: {
        stats: {
          count: 1,
          average: 5,
          distribution: [{ star: 5, count: 1 }],
        },
        reviews: [{
          id: 'review-1',
          userId: 'user-2',
          productId: 'product-1',
          rating: 5,
          title: 'Great',
          body: 'Excellent product',
          verified: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          user: { id: 'user-2', name: 'Reviewer' },
        }],
      },
    });
  });

  it('renders review stats and allows admin deletion for another user', async () => {
    const user = userEvent.setup();
    vi.mocked(deleteReview).mockResolvedValue({ success: true });

    renderWithQuery(<ReviewsSection productId="product-1" />);

    expect(await screen.findByText('Reviewer')).toBeInTheDocument();
    expect(screen.getByText('Verified Purchase')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete review/i }));

    await waitFor(() => {
      expect(deleteReview).toHaveBeenCalledWith('product-1', 'user-2');
    });
  });

  it('validates review form before submission', async () => {
    const user = userEvent.setup();
    renderWithQuery(<ReviewsSection productId="product-1" />);

    await user.click(await screen.findByRole('button', { name: /write a review/i }));
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    expect(screen.getByText('Please fill in all fields')).toBeInTheDocument();
    expect(submitReview).not.toHaveBeenCalled();
  });

  it('submits a review form', async () => {
    const user = userEvent.setup();
    vi.mocked(submitReview).mockResolvedValue({
      success: true,
      data: {
        id: 'review-2',
        userId: 'admin-1',
        productId: 'product-1',
        rating: 5,
        title: 'Excellent',
        body: 'This was excellent',
        verified: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        user: { id: 'admin-1', name: 'Admin User' },
      },
    });

    renderWithQuery(<ReviewsSection productId="product-1" />);

    await user.click(await screen.findByRole('button', { name: /write a review/i }));
    await user.type(screen.getByPlaceholderText('Summarise your experience'), 'Excellent');
    await user.type(screen.getByPlaceholderText('Share your thoughts about this product…'), 'This was excellent');
    await user.click(screen.getByRole('button', { name: /submit review/i }));

    await waitFor(() => {
      expect(submitReview).toHaveBeenCalledWith('product-1', {
        rating: 5,
        title: 'Excellent',
        body: 'This was excellent',
      });
    });
  });
});
