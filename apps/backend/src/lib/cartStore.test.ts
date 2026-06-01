import { computeCart, createCart, deleteCart, getCart, hydrateCartItem, setCart } from './cartStore';
import { products } from '../data/products';

describe('cartStore', () => {
  it('creates, stores, retrieves, and deletes carts', () => {
    const cart = createCart();

    expect(getCart(cart.id)).toEqual(cart);
    expect(setCart({ ...cart, itemCount: 1 }).itemCount).toBe(1);

    deleteCart(cart.id);
    expect(getCart(cart.id)).toBeUndefined();
  });

  it('computes cart totals and hydrates product items', () => {
    const product = products[0];
    const totals = computeCart([{ productId: product.id, quantity: 2, product }]);

    expect(totals.itemCount).toBe(2);
    expect(totals.subtotal).toBe(179.98);
    expect(totals.discount).toBe(80);

    expect(hydrateCartItem(product.id, 999)?.quantity).toBe(product.stock);
    expect(hydrateCartItem('missing', 1)).toBeNull();
  });
});
