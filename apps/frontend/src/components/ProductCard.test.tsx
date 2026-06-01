import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import type { Product } from '../types';
import ProductCard from './ProductCard';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const product: Product = {
  id: 'product-1',
  name: 'Test Product',
  description: 'Description',
  price: 80,
  originalPrice: 100,
  category: 'home',
  image: '/image.jpg',
  images: ['/image.jpg'],
  rating: 4.5,
  reviewCount: 12,
  stock: 5,
  tags: ['home'],
  badge: 'Sale',
};

describe('ProductCard', () => {
  beforeEach(() => {
    useCartStore.setState({ addItem: vi.fn(), openCart: vi.fn() } as Partial<ReturnType<typeof useCartStore.getState>>);
    useWishlistStore.setState({ ids: new Set(), toggle: vi.fn(), has: (id) => useWishlistStore.getState().ids.has(id) } as Partial<ReturnType<typeof useWishlistStore.getState>>);
    useAuthStore.setState({ isAuthenticated: false, user: null });
  });

  it('renders product information and adds to cart', async () => {
    const user = userEvent.setup();
    const addItem = vi.fn().mockResolvedValue(undefined);
    const openCart = vi.fn();
    useCartStore.setState({ addItem, openCart } as Partial<ReturnType<typeof useCartStore.getState>>);

    render(<ProductCard product={product} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('−20%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /quick add/i }));

    expect(addItem).toHaveBeenCalledWith('product-1');
    expect(openCart).toHaveBeenCalled();
  });

  it('requires authentication before wishlist updates', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn();
    useWishlistStore.setState({ toggle } as Partial<ReturnType<typeof useWishlistStore.getState>>);

    render(<ProductCard product={product} />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole('button', { name: /add to wishlist/i }));

    expect(toggle).not.toHaveBeenCalled();
  });

  it('toggles wishlist for authenticated users', async () => {
    const user = userEvent.setup();
    const toggle = vi.fn().mockResolvedValue(true);
    useAuthStore.setState({ isAuthenticated: true });
    useWishlistStore.setState({ toggle } as Partial<ReturnType<typeof useWishlistStore.getState>>);

    render(<ProductCard product={product} />, { wrapper: MemoryRouter });
    await user.click(screen.getByRole('button', { name: /add to wishlist/i }));

    expect(toggle).toHaveBeenCalledWith('product-1');
  });

  it('hides quick add for out of stock products', () => {
    render(<ProductCard product={{ ...product, stock: 0 }} />, { wrapper: MemoryRouter });

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /quick add/i })).not.toBeInTheDocument();
  });
});
