import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addToCart,
  createCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '../lib/api';
import { useCartStore } from './cartStore';
import type { Cart } from '../types';

vi.mock('../lib/api', () => ({
  createCart: vi.fn(),
  fetchCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}));

const emptyCart: Cart = {
  id: 'cart-1',
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
};

const filledCart: Cart = {
  ...emptyCart,
  items: [{
    productId: 'product-1',
    quantity: 1,
    product: {
      id: 'product-1',
      name: 'Product',
      description: 'Description',
      price: 10,
      category: 'home',
      image: '/image.jpg',
      images: ['/image.jpg'],
      rating: 4,
      reviewCount: 1,
      stock: 10,
      tags: ['home'],
    },
  }],
  subtotal: 10,
  total: 10,
  itemCount: 1,
};

describe('cartStore', () => {
  beforeEach(() => {
    vi.mocked(createCart).mockReset();
    vi.mocked(fetchCart).mockReset();
    vi.mocked(addToCart).mockReset();
    vi.mocked(updateCartItem).mockReset();
    vi.mocked(removeCartItem).mockReset();
    useCartStore.setState({ cartId: null, cart: null, isOpen: false, loading: false });
  });

  it('initializes an existing cart or creates a new one when fetch fails', async () => {
    useCartStore.setState({ cartId: 'cart-1' });
    vi.mocked(fetchCart).mockResolvedValueOnce({ success: true, data: emptyCart });

    await useCartStore.getState().initCart();
    expect(useCartStore.getState().cart).toEqual(emptyCart);

    vi.mocked(fetchCart).mockRejectedValueOnce(new Error('expired'));
    vi.mocked(createCart).mockResolvedValueOnce({ success: true, data: { ...emptyCart, id: 'cart-2' } });

    await useCartStore.getState().initCart();
    expect(useCartStore.getState().cartId).toBe('cart-2');
  });

  it('handles cart creation failures without throwing', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(createCart).mockRejectedValueOnce(new Error('offline'));

    await expect(useCartStore.getState().initCart()).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
  });

  it('adds items by creating a cart when needed', async () => {
    vi.mocked(createCart).mockResolvedValueOnce({ success: true, data: emptyCart });
    vi.mocked(addToCart).mockResolvedValueOnce({ success: true, data: filledCart });

    await useCartStore.getState().addItem('product-1', 1);

    expect(addToCart).toHaveBeenCalledWith('cart-1', 'product-1', 1);
    expect(useCartStore.getState().cart).toEqual(filledCart);
    expect(useCartStore.getState().loading).toBe(false);
  });

  it('does nothing when addItem cannot create a cart', async () => {
    vi.mocked(createCart).mockResolvedValueOnce({ success: false });

    await useCartStore.getState().addItem('product-1');

    expect(addToCart).not.toHaveBeenCalled();
  });

  it('updates and removes items for an existing cart', async () => {
    useCartStore.setState({ cartId: 'cart-1', cart: filledCart });
    vi.mocked(updateCartItem).mockResolvedValueOnce({ success: true, data: { ...filledCart, itemCount: 2 } });
    vi.mocked(removeCartItem).mockResolvedValueOnce({ success: true, data: emptyCart });

    await useCartStore.getState().updateItem('product-1', 2);
    expect(useCartStore.getState().cart?.itemCount).toBe(2);

    await useCartStore.getState().removeItem('product-1');
    expect(useCartStore.getState().cart).toEqual(emptyCart);
  });

  it('ignores update and remove requests before a cart exists', async () => {
    await useCartStore.getState().updateItem('product-1', 2);
    await useCartStore.getState().removeItem('product-1');

    expect(updateCartItem).not.toHaveBeenCalled();
    expect(removeCartItem).not.toHaveBeenCalled();
  });

  it('toggles drawer state and clears local cart', () => {
    useCartStore.getState().openCart();
    expect(useCartStore.getState().isOpen).toBe(true);

    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isOpen).toBe(false);

    useCartStore.setState({ cartId: 'cart-1', cart: filledCart });
    useCartStore.getState().clearLocalCart();
    expect(useCartStore.getState().cartId).toBeNull();
  });
});
