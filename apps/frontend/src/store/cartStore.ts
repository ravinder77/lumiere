import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart } from '../types';
import {
  createCart,
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from '../lib/api';

interface CartStore {
  cartId: string | null;
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;

  initCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: null,
      cart: null,
      isOpen: false,
      loading: false,

      initCart: async () => {
        const { cartId } = get();
        if (cartId) {
          try {
            const res = await fetchCart(cartId);
            if (res.success && res.data) {
              set({ cart: res.data });
              return;
            }
          } catch {
            // Cart expired, create new one
          }
        }
        try {
          const res = await createCart();
          if (res.success && res.data) {
            set({ cartId: res.data.id, cart: res.data });
          }
        } catch (err) {
          console.error('Failed to create cart:', err);
        }
      },

      addItem: async (productId, quantity = 1) => {
        let { cartId } = get();
        if (!cartId) {
          const res = await createCart();
          if (res.success && res.data) {
            cartId = res.data.id;
            set({ cartId });
          }
        }
        if (!cartId) return;
        set({ loading: true });
        try {
          const res = await addToCart(cartId, productId, quantity);
          if (res.success && res.data) {
            set({ cart: res.data });
          }
        } finally {
          set({ loading: false });
        }
      },

      updateItem: async (productId, quantity) => {
        const { cartId } = get();
        if (!cartId) return;
        set({ loading: true });
        try {
          const res = await updateCartItem(cartId, productId, quantity);
          if (res.success && res.data) set({ cart: res.data });
        } finally {
          set({ loading: false });
        }
      },

      removeItem: async (productId) => {
        const { cartId } = get();
        if (!cartId) return;
        set({ loading: true });
        try {
          const res = await removeCartItem(cartId, productId);
          if (res.success && res.data) set({ cart: res.data });
        } finally {
          set({ loading: false });
        }
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      clearLocalCart: () => set({ cartId: null, cart: null }),
    }),
    {
      name: 'lumiere-cart',
      partialize: (state) => ({ cartId: state.cartId }),
    }
  )
);
