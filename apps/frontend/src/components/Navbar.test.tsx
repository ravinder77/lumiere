import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import Navbar from './Navbar';

describe('Navbar', () => {
  beforeEach(() => {
    useCartStore.setState({
      cart: { id: 'cart-1', items: [], subtotal: 0, discount: 0, total: 0, itemCount: 120 },
      toggleCart: vi.fn(),
    } as Partial<ReturnType<typeof useCartStore.getState>>);
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      logout: vi.fn(),
    } as Partial<ReturnType<typeof useAuthStore.getState>>);
    useWishlistStore.setState({
      ids: new Set(['1', '2']),
      load: vi.fn(),
    } as Partial<ReturnType<typeof useWishlistStore.getState>>);
  });

  it('renders guest navigation and toggles the cart', async () => {
    const user = userEvent.setup();
    const toggleCart = vi.fn();
    useCartStore.setState({ toggleCart } as Partial<ReturnType<typeof useCartStore.getState>>);

    render(<Navbar />, { wrapper: MemoryRouter });

    expect(screen.getByText('LUMIÈRE')).toBeInTheDocument();
    expect(screen.getByText('99+')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cart/i }));
    expect(toggleCart).toHaveBeenCalled();
  });

  it('renders authenticated user menu and logs out', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'admin-1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', createdAt: '' },
      logout,
    } as Partial<ReturnType<typeof useAuthStore.getState>>);

    render(<Navbar />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /admin/i }));
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getByText('2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(logout).toHaveBeenCalled();
  });

  it('opens the mobile menu', async () => {
    const user = userEvent.setup();
    render(<Navbar />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole('button', { name: /menu/i }));

    expect(screen.getAllByText('Shop').length).toBeGreaterThan(1);
  });
});
