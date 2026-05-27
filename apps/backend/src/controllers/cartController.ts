import { Request, Response } from 'express';
import { products } from '../data/products';
import {
  computeCart,
  createCart,
  deleteCart,
  getCart,
  setCart,
} from '../lib/cartStore';
import { Cart } from '../types';

function param(req: Request, key: string): string {
  return req.params[key] as string;
}

function parsePositiveInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function parseNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

export function getCartById(req: Request, res: Response) {
  const cart = getCart(param(req, 'cartId'));
  if (!cart) {
    res.status(404).json({ success: false, error: 'Cart not found' });
    return;
  }

  res.json({ success: true, data: cart });
}

export function createNewCart(_req: Request, res: Response) {
  const cart = createCart();
  res.status(201).json({ success: true, data: cart });
}

export function addCartItem(req: Request, res: Response) {
  const { productId, quantity = 1 } = req.body as { productId: string; quantity?: number };
  const cart = getCart(param(req, 'cartId'));
  if (!cart) {
    res.status(404).json({ success: false, error: 'Cart not found' });
    return;
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ success: false, error: 'Product not found' });
    return;
  }

  const parsedQuantity = parsePositiveInteger(quantity);
  if (!parsedQuantity) {
    res.status(422).json({ success: false, error: 'Quantity must be a positive integer' });
    return;
  }

  if (product.stock <= 0) {
    res.status(409).json({ success: false, error: 'Product is out of stock' });
    return;
  }

  const existing = cart.items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + parsedQuantity, product.stock);
  } else {
    cart.items.push({ productId, quantity: Math.min(parsedQuantity, product.stock), product });
  }

  const updated: Cart = { ...computeCart(cart.items), id: cart.id };
  setCart(updated);
  res.json({ success: true, data: updated, message: 'Item added to cart' });
}

export function updateCartItem(req: Request, res: Response) {
  const { quantity } = req.body as { quantity: number };
  const cart = getCart(param(req, 'cartId'));
  if (!cart) {
    res.status(404).json({ success: false, error: 'Cart not found' });
    return;
  }

  const productId = param(req, 'productId');
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) {
    res.status(404).json({ success: false, error: 'Item not in cart' });
    return;
  }

  const parsedQuantity = parseNonNegativeInteger(quantity);
  if (parsedQuantity === null) {
    res.status(422).json({ success: false, error: 'Quantity must be a non-negative integer' });
    return;
  }

  if (parsedQuantity === 0) {
    cart.items = cart.items.filter((i) => i.productId !== productId);
  } else {
    item.quantity = Math.min(parsedQuantity, item.product.stock);
  }

  const updated: Cart = { ...computeCart(cart.items), id: cart.id };
  setCart(updated);
  res.json({ success: true, data: updated });
}

export function removeCartItem(req: Request, res: Response) {
  const cart = getCart(param(req, 'cartId'));
  if (!cart) {
    res.status(404).json({ success: false, error: 'Cart not found' });
    return;
  }

  const productId = param(req, 'productId');
  cart.items = cart.items.filter((i) => i.productId !== productId);
  const updated: Cart = { ...computeCart(cart.items), id: cart.id };
  setCart(updated);
  res.json({ success: true, data: updated });
}

export function clearCart(req: Request, res: Response) {
  deleteCart(param(req, 'cartId'));
  res.json({ success: true, message: 'Cart cleared' });
}
