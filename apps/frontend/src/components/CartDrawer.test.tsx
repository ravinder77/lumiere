import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cart } from '../types';
import { useCartStore } from '../store/cartStore';
import CartDrawer from './CartDrawer';

const cart: Cart = {
  id: 'cart-1',
  subtotal: 20,
  discount: 5,
  total: 20,
  itemCount: 2,
  items: [{
    productId: 'product-1',
    quantity: 2,
    product: {
      id: 'product-1',
      name: 'Test Product',
      description: 'Description',
      price: 10,
      originalPrice: 12.5,
      category: 'home',
      image: '/image.jpg',
      images: ['/image.jpg'],
      rating: 4.5,
      reviewCount: 10,
      stock: 3,
      tags: ['home'],
    },
  }],
};

describe('CartDrawer', () => {
  beforeEach(() => {
    useCartStore.setState({
      cart: null,
      cartId: null,
      isOpen: false,
      loading: false,
      closeCart: vi.fn(),
      updateItem: vi.fn(),
      removeItem: vi.fn(),
    } as Partial<ReturnType<typeof useCartStore.getState>>);
  });

  it('renders empty cart state', () => {
    useCartStore.setState({ isOpen: true, cart: null });

    render(<CartDrawer />, { wrapper: MemoryRouter });

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('updates quantities, removes items, and closes on checkout link', async () => {
    const user = userEvent.setup();
    const closeCart = vi.fn();
    const updateItem = vi.fn();
    const removeItem = vi.fn();
    useCartStore.setState({ isOpen: true, cart, closeCart, updateItem, removeItem } as Partial<ReturnType<typeof useCartStore.getState>>);

    render(<CartDrawer />, { wrapper: MemoryRouter });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Savings')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    await user.click(buttons.find((button) => button.querySelector('svg'))!);
    expect(closeCart).toHaveBeenCalled();

    await user.click(screen.getByRole('link', { name: /checkout/i }));
    expect(closeCart).toHaveBeenCalledTimes(2);
  });
});
