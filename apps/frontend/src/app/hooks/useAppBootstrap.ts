import { useEffect, useEffectEvent } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export function useAppBootstrap(): void {
  const initCart = useCartStore((state) => state.initCart);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadWishlist = useWishlistStore((state) => state.load);
  const clearWishlist = useWishlistStore((state) => state.clear);

  const bootstrapSession = useEffectEvent(() => {
    void initCart();
    void fetchMe();
  });

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadWishlist();
      return;
    }

    clearWishlist();
  }, [clearWishlist, isAuthenticated, loadWishlist]);
}
