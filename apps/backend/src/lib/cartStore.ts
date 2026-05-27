import type { Cart, CartItem } from '../types';
import { products } from '../data/products';

const carts = new Map<string, Cart>();

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getCart(cartId: string): Cart | undefined {
  return carts.get(cartId);
}

export function setCart(cart: Cart): Cart {
  carts.set(cart.id, cart);
  return cart;
}

export function deleteCart(cartId: string): void {
  carts.delete(cartId);
}

export function createCart(): Cart {
  const cart: Cart = {
    id: crypto.randomUUID(),
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    itemCount: 0,
  };

  carts.set(cart.id, cart);
  return cart;
}

export function computeCart(items: CartItem[]): Omit<Cart, 'id'> {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = items.reduce((sum, item) => {
    const originalPrice = item.product.originalPrice ?? item.product.price;
    return sum + (originalPrice - item.product.price) * item.quantity;
  }, 0);

  return {
    items,
    subtotal: roundCurrency(subtotal),
    discount: roundCurrency(discount),
    total: roundCurrency(subtotal),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function hydrateCartItem(productId: string, quantity: number): CartItem | null {
  const product = products.find((entry) => entry.id === productId);
  if (!product) {
    return null;
  }

  return {
    productId,
    quantity: Math.min(quantity, product.stock),
    product,
  };
}
