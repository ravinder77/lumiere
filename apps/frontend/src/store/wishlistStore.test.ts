import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addToWishlistApi, fetchWishlistIds, removeFromWishlistApi } from '../lib/extraApi';
import { useWishlistStore } from './wishlistStore';

vi.mock('../lib/extraApi', () => ({
  fetchWishlistIds: vi.fn(),
  addToWishlistApi: vi.fn(),
  removeFromWishlistApi: vi.fn(),
}));

describe('wishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ ids: new Set(), loading: false, initialized: false });
  });

  it('loads wishlist ids once and marks unsuccessful responses initialized', async () => {
    vi.mocked(fetchWishlistIds).mockResolvedValueOnce({ success: true, data: ['1', '2'] });

    await useWishlistStore.getState().load();
    expect(useWishlistStore.getState().ids.has('1')).toBe(true);

    await useWishlistStore.getState().load();
    expect(fetchWishlistIds).toHaveBeenCalledTimes(1);

    useWishlistStore.setState({ ids: new Set(), initialized: false });
    vi.mocked(fetchWishlistIds).mockResolvedValueOnce({ success: false, data: [] });
    await useWishlistStore.getState().load();
    expect(useWishlistStore.getState().initialized).toBe(true);
  });

  it('optimistically toggles wishlist ids and reverts on failure', async () => {
    vi.mocked(addToWishlistApi).mockResolvedValueOnce({ success: true, data: undefined as never });
    await expect(useWishlistStore.getState().toggle('1')).resolves.toBe(true);
    expect(useWishlistStore.getState().has('1')).toBe(true);

    vi.mocked(removeFromWishlistApi).mockRejectedValueOnce(new Error('network'));
    await expect(useWishlistStore.getState().toggle('1')).rejects.toThrow('Failed to update wishlist');
    expect(useWishlistStore.getState().has('1')).toBe(true);
  });

  it('clears wishlist ids', () => {
    useWishlistStore.setState({ ids: new Set(['1']), initialized: true });
    useWishlistStore.getState().clear();

    expect(useWishlistStore.getState().ids.size).toBe(0);
    expect(useWishlistStore.getState().initialized).toBe(false);
  });
});
