import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { fetchWishlist, WishlistItem } from '../lib/extraApi';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import StarRating from '../components/StarRating';
import { ProductCardSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function WishlistPage() {
  const qc = useQueryClient();
  const { toggle } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  });

  const items: WishlistItem[] = data?.data ?? [];

  const handleRemove = async (productId: string) => {
    try {
      await toggle(productId);
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Could not remove item');
    }
  };

  const handleAddToCart = async (productId: string, name: string) => {
    try {
      await addItem(productId);
      toast.success(`${name} added to cart`);
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-28">
      <div className="mb-8">
        <p className="text-xs text-accent tracking-widest uppercase mb-2">My Account</p>
        <h1 className="font-display text-3xl font-medium text-stone-900 flex items-center gap-3">
          <Heart size={24} className="text-accent" />
          Wishlist
        </h1>
        {items.length > 0 && (
          <p className="text-stone-400 text-sm mt-1">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={48} className="text-stone-200 mx-auto mb-4" />
          <p className="font-medium text-stone-700 text-lg mb-2">Your wishlist is empty</p>
          <p className="text-stone-400 text-sm mb-8">
            Save products you love and come back to them later.
          </p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="card group">
              {/* Image */}
              <Link to={`/products/${item.productId}`} className="block relative aspect-[4/3] bg-stone-100 overflow-hidden">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {item.product.stock === 0 && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                    <span className="bg-white text-stone-800 text-xs font-medium px-3 py-1 tracking-widest uppercase">
                      Sold Out
                    </span>
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{item.product.category}</p>
                <Link to={`/products/${item.productId}`}>
                  <h3 className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors line-clamp-1">
                    {item.product.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <StarRating value={item.product.rating} size={11} />
                  <span className="text-xs text-stone-400">({item.product.reviewCount})</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="font-medium text-stone-900">${item.product.price.toFixed(2)}</span>
                  {item.product.originalPrice && (
                    <span className="text-sm text-stone-400 line-through">${item.product.originalPrice.toFixed(2)}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAddToCart(item.productId, item.product.name)}
                    disabled={item.product.stock === 0}
                    className="btn-primary flex-1 py-2 text-xs disabled:opacity-50"
                  >
                    <ShoppingBag size={13} />
                    {item.product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    className="btn-secondary p-2 text-stone-400 hover:text-red-500 hover:border-red-300"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
