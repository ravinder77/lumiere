import { startTransition, useDeferredValue, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchProducts, fetchCategories, ProductFilters } from '../lib/api';
import ProductCard from '../components/ProductCard';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
] as const;

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');
  const [isFilterPending, startFilterTransition] = useTransition();

  const [filters, setFilters] = useState<ProductFilters>({
    category: searchParams.get('category') || '',
    search: searchDraft,
    sort: (searchParams.get('sort') as ProductFilters['sort']) || 'newest',
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    page: 1,
    limit: 12,
  });
  const deferredSearch = useDeferredValue(searchDraft);

  useEffect(() => {
    startTransition(() => {
      setFilters((current) => ({ ...current, search: deferredSearch, page: 1 }));
    });
  }, [deferredSearch]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
    if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    placeholderData: (prev) => prev,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const products = data?.data?.items ?? [];
  const pagination = data?.data;
  const categories = categoriesData?.data ?? [];

  const update = (patch: Partial<ProductFilters>) => {
    startFilterTransition(() => {
      setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
    });
  };

  const clearFilters = () => {
    setSearchDraft('');
    startFilterTransition(() => {
      setFilters({ sort: 'newest', page: 1, limit: 12 });
    });
  };

  const hasActiveFilters = !!(
    filters.category ||
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sort !== 'newest'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-28">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-medium text-stone-900">
          {filters.category
            ? categories.find((c) => c.id === filters.category)?.name || 'Products'
            : 'All Products'}
        </h1>
        {pagination && (
          <p className="text-stone-400 text-sm mt-1">
            {pagination.total} {pagination.total === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="input pl-9 pr-4"
          />
          {searchDraft && (
            <button
              onClick={() => setSearchDraft('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={filters.sort || 'newest'}
          onChange={(e) => update({ sort: e.target.value as ProductFilters['sort'] })}
          className="input w-auto min-w-[180px] cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn-secondary gap-2', showFilters && 'border-stone-900 text-stone-900')}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 bg-accent rounded-full" />
          )}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-ghost text-stone-500">
            Clear all
          </button>
        )}
      </div>

      {isFilterPending && (
        <p className="mb-4 text-xs uppercase tracking-[0.24em] text-stone-400">
          Updating results
        </p>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters */}
        {showFilters && (
          <aside className="w-56 flex-shrink-0 animate-fade-in">
            <div className="space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-xs tracking-widest uppercase text-stone-500 mb-3">Category</h3>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() =>
                          update({ category: cat.id === 'all' ? '' : cat.id })
                        }
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm transition-colors',
                          (filters.category || 'all') === cat.id
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        )}
                      >
                        <span>{cat.name}</span>
                        <span className="float-right text-xs opacity-60">{cat.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price range */}
              <div>
                <h3 className="text-xs tracking-widest uppercase text-stone-500 mb-3">
                  Price Range
                </h3>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ''}
                    onChange={(e) =>
                      update({ minPrice: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="input py-2 text-xs"
                  />
                  <span className="text-stone-400 text-xs flex-shrink-0">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ''}
                    onChange={(e) =>
                      update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="input py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-[4/3] bg-stone-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-stone-200 rounded w-1/3" />
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-stone-400 text-lg">No products found</p>
              <button onClick={clearFilters} className="btn-secondary mt-4">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => update({ page: (filters.page ?? 1) - 1 })}
                    disabled={(filters.page ?? 1) <= 1}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {[...Array(pagination.totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => update({ page: i + 1 })}
                      className={clsx(
                        'w-9 h-9 text-sm transition-colors',
                        (filters.page ?? 1) === i + 1
                          ? 'bg-stone-900 text-white'
                          : 'border border-stone-200 text-stone-600 hover:border-stone-400'
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => update({ page: (filters.page ?? 1) + 1 })}
                    disabled={(filters.page ?? 1) >= pagination.totalPages}
                    className="btn-secondary p-2 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
