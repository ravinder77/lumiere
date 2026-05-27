import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Heart,
  ArrowLeft,
  Truck,
  RefreshCw,
  Shield,
  Plus,
  Minus,
} from 'lucide-react';
import { fetchProduct } from '../lib/api';
import { useWishlistStore } from '../store/wishlistStore';
import ReviewsSection from '../components/ReviewsSection';
import StarRating from '../components/StarRating';
import { ProductDetailSkeleton } from '../components/Skeletons';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const [adding, setAdding] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { has, toggle } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();


  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });

  const product = data?.data?.product;
  const wishlisted = product ? has(product.id) : false;
  const related = data?.data?.related ?? [];

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast.success(`${product.name} added to cart`);
      openCart();
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-stone-200" />
          <div className="space-y-4">
            <div className="h-4 bg-stone-200 rounded w-24" />
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-24 bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
        <p className="text-stone-500 text-lg">Product not found.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">
          Back to Shop
        </Link>
      </div>
    );
  }

  const discountPct = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-400 mb-8">
          <Link to="/" className="hover:text-stone-700 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-stone-700 transition-colors">
            Products
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-stone-700 transition-colors capitalize"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-stone-700 truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="aspect-square bg-stone-100 overflow-hidden">
              <img
                src={product.images[selectedImage] || product.image}
                alt={product.name}
                className="w-full h-full object-cover animate-fade-in"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={clsx(
                      'w-20 h-20 overflow-hidden border-2 transition-colors',
                      selectedImage === i ? 'border-stone-900' : 'border-transparent hover:border-stone-300'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <div className="flex-1">
              <p className="text-xs text-accent tracking-widest uppercase mb-2">
                {product.category}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-medium text-stone-900 leading-snug mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <StarRating value={product.rating} size={16} />
                <span className="text-sm text-stone-500">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-medium text-stone-900">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-stone-400 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                    <span className="badge bg-red-100 text-red-600">Save {discountPct}%</span>
                  </>
                )}
              </div>

              <p className="text-stone-600 leading-relaxed mb-6">{product.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-stone-100 text-stone-500 text-xs tracking-wide uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stock */}
              {product.stock <= 5 && product.stock > 0 && (
                <p className="text-sm text-amber-600 mb-4 font-medium">
                  ⚠ Only {product.stock} left in stock
                </p>
              )}
              {product.stock === 0 && (
                <p className="text-sm text-red-500 mb-4 font-medium">Out of stock</p>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-stone-100 pt-6 space-y-4">
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-500 w-20">Quantity</span>
                <div className="flex items-center border border-stone-200">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-3 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-6 text-sm font-medium text-stone-800 min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="p-3 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Add to cart & wishlist */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  className="btn-primary flex-1 py-4 text-base disabled:opacity-50"
                >
                  <ShoppingBag size={18} />
                  {adding ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={async () => {
                    if (!isAuthenticated) { toast.error('Sign in to save to wishlist'); return; }
                    try {
                      const added = await toggle(product!.id);
                      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
                    } catch { toast.error('Could not update wishlist'); }
                  }}
                  className="btn-secondary p-4"
                >
                  <Heart
                    size={18}
                    className={clsx(wishlisted && 'fill-red-500 text-red-500')}
                  />
                </button>
              </div>

              {/* Shipping info */}
              <div className="grid grid-cols-1 gap-2 pt-2">
                {[
                  { icon: Truck, text: 'Free shipping on orders over $75' },
                  { icon: RefreshCw, text: '30-day free returns' },
                  { icon: Shield, text: 'Secure SSL checkout' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-stone-500">
                    <Icon size={13} className="text-stone-400 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ReviewsSection productId={product.id} />

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-stone-200">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-2xl font-medium text-stone-900">
                You might also like
              </h2>
              <Link
                to={`/products?category=${product.category}`}
                className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft size={14} className="rotate-180" />
                More {product.category}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
