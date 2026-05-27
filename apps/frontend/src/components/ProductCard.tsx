import { useOptimistic, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlistPending, startWishlistTransition] = useTransition();
  const { addItem, openCart } = useCartStore();
  const { has, toggle } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const wishlisted = has(product.id);
  const [optimisticWishlisted, setOptimisticWishlisted] = useOptimistic(
    wishlisted,
    (_current, nextValue: boolean) => nextValue
  );

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    try {
      await addItem(product.id);
      toast.success(`${product.name} added to cart`);
      openCart();
    } catch {
      toast.error('Failed to add item');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Sign in to save to wishlist');
      return;
    }
    const nextWishlisted = !wishlisted;

    startWishlistTransition(async () => {
      setOptimisticWishlisted(nextWishlisted);
      try {
        const added = await toggle(product.id);
        toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
      } catch {
        setOptimisticWishlisted(wishlisted);
        toast.error('Could not update wishlist');
      }
    });
  };

  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="card hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative overflow-hidden bg-stone-100 aspect-[4/3]">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3">
              <span className={clsx(
                'badge text-white tracking-widest uppercase text-[10px]',
                product.badge === 'Sale'       && 'bg-red-500',
                product.badge === 'New'        && 'bg-stone-900',
                product.badge === 'Bestseller' && 'bg-accent'
              )}>
                {product.badge}
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white disabled:cursor-wait"
            aria-label={optimisticWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            disabled={isWishlistPending}
          >
            <Heart
              size={15}
              className={clsx(optimisticWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-500')}
            />
          </button>

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
              <span className="bg-white text-stone-800 text-xs font-medium px-3 py-1 tracking-widest uppercase">
                Sold Out
              </span>
            </div>
          )}

          {/* Quick add */}
          {product.stock > 0 && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="btn-primary w-full rounded-none py-3"
              >
                <ShoppingBag size={15} />
                {addingToCart ? 'Adding…' : 'Quick Add'}
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{product.category}</p>
          <h3 className="text-sm font-medium text-stone-900 leading-snug line-clamp-1 group-hover:text-stone-600 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-2">
            <StarRating value={product.rating} size={11} />
            <span className="text-xs text-stone-400">({product.reviewCount})</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="font-medium text-stone-900">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-stone-400 line-through">${product.originalPrice.toFixed(2)}</span>
                <span className="text-xs text-red-500 font-medium">−{discountPct}%</span>
              </>
            )}
          </div>

          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-amber-600 mt-1.5">Only {product.stock} left</p>
          )}
        </div>
      </div>
    </Link>
  );
}
