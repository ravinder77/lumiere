import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCw, Shield, Star } from 'lucide-react';
import { fetchFeaturedProducts, fetchCategories } from '../lib/api';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { data: featuredData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: fetchFeaturedProducts,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const featured = featuredData?.data ?? [];
  const categories = categoriesData?.data?.filter((c) => c.id !== 'all') ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-900">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Hero image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-accent text-xs tracking-[0.4em] uppercase mb-6 animate-fade-up">
            Considered Goods
          </p>
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-medium text-stone-50 leading-[0.95] mb-8 animate-fade-up animate-delay-100">
            Live with
            <br />
            <em className="not-italic text-accent">intention</em>
          </h1>
          <p className="text-stone-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up animate-delay-200">
            A curated selection of objects designed to last — chosen for craft, function, and quiet beauty.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-300">
            <Link to="/products" className="btn-primary px-10 py-4 text-base">
              Shop Now
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/products?category=home"
              className="inline-flex items-center justify-center gap-2 border border-stone-600 text-stone-300 px-10 py-4 text-base hover:border-stone-400 hover:text-stone-100 transition-colors"
            >
              Explore Home
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-[1px] h-12 bg-gradient-to-b from-stone-400 to-transparent mx-auto" />
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-stone-100 border-y border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'On orders over $75' },
              { icon: RefreshCw, label: 'Free Returns', sub: '30-day hassle-free' },
              { icon: Shield, label: 'Secure Payment', sub: 'SSL encrypted checkout' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-2 justify-center">
                <Icon size={18} className="text-accent flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-stone-800">{label}</p>
                  <p className="text-xs text-stone-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs text-accent tracking-widest uppercase mb-2">Curated Selection</p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-stone-900">
              Featured Pieces
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link to="/products" className="btn-secondary">
            View All Products
          </Link>
        </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-10">
          <p className="text-xs text-accent tracking-widest uppercase mb-2">Browse by</p>
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-stone-900">
            Categories
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="group card p-5 text-center hover:border-stone-400 transition-all duration-200 hover:shadow-md animate-fade-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <p className="font-medium text-stone-800 group-hover:text-stone-900 text-sm">
                {cat.name}
              </p>
              <p className="text-xs text-stone-400 mt-1">{cat.count} items</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="bg-stone-900 text-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-accent text-xs tracking-widest uppercase mb-4">Our Philosophy</p>
            <h2 className="font-display text-4xl sm:text-5xl font-medium leading-tight mb-6">
              Buy less,
              <br />
              choose <em>well</em>.
            </h2>
            <p className="text-stone-400 leading-relaxed max-w-md">
              We believe in objects that earn their place. Every product in our collection is
              chosen for durability, craft, and the simple pleasure of using something made right.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-8 text-sm text-accent hover:text-accent-light transition-colors"
            >
              Discover the collection <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
              alt="Craftsmanship"
              className="w-full h-80 object-cover"
            />
            <div className="absolute -bottom-4 -left-4 bg-accent text-white p-5 hidden sm:block">
              <div className="flex items-center gap-1 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="fill-white text-white" />
                ))}
              </div>
              <p className="text-sm font-medium">4.9 avg rating</p>
              <p className="text-xs text-white/70">from 5,000+ reviews</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
