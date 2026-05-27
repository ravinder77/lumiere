import { create } from 'zustand';
import { fetchWishlistIds, addToWishlistApi, removeFromWishlistApi } from '../lib/extraApi';

interface WishlistStore {
  ids: Set<string>;
  loading: boolean;
  initialized: boolean;

  load: () => Promise<void>;
  toggle: (productId: string) => Promise<boolean>; // returns new wishlist state
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: new Set(),
  loading: false,
  initialized: false,

  load: async () => {
    if (get().initialized) return;
    try {
      const res = await fetchWishlistIds();
      if (res.success) set({ ids: new Set(res.data), initialized: true });
    } catch {
      set({ initialized: true });
    }
  },

  toggle: async (productId: string): Promise<boolean> => {
    const { ids } = get();
    const isWishlisted = ids.has(productId);
    // Optimistic update
    const newIds = new Set(ids);
    if (isWishlisted) newIds.delete(productId);
    else newIds.add(productId);
    set({ ids: newIds });

    try {
      if (isWishlisted) {
        await removeFromWishlistApi(productId);
      } else {
        await addToWishlistApi(productId);
      }
      return !isWishlisted;
    } catch {
      // Revert on error
      set({ ids });
      throw new Error('Failed to update wishlist');
    }
  },

  has: (productId: string) => get().ids.has(productId),
  clear: () => set({ ids: new Set(), initialized: false }),
}));
