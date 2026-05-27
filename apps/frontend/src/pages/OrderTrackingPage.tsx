import { useState, FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { fetchOrder } from '../lib/api';
import clsx from 'clsx';

const STATUS_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING:    { label: 'Order Received',  icon: <Clock size={16} />,        color: 'text-amber-600 bg-amber-50 border-amber-200' },
  PROCESSING: { label: 'Processing',      icon: <Package size={16} />,      color: 'text-blue-600 bg-blue-50 border-blue-200' },
  SHIPPED:    { label: 'Shipped',         icon: <Truck size={16} />,        color: 'text-purple-600 bg-purple-50 border-purple-200' },
  DELIVERED:  { label: 'Delivered',       icon: <CheckCircle size={16} />,  color: 'text-green-600 bg-green-50 border-green-200' },
  CANCELLED:  { label: 'Cancelled',       icon: <XCircle size={16} />,      color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function OrderTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputId, setInputId] = useState(searchParams.get('id') ?? '');
  const [inputEmail, setInputEmail] = useState(searchParams.get('email') ?? '');
  const [searchId, setSearchId] = useState(searchParams.get('id') ?? '');
  const [searchEmail, setSearchEmail] = useState(searchParams.get('email') ?? '');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['order', searchId, searchEmail],
    queryFn: () => fetchOrder(searchId, searchEmail),
    enabled: searchId.length > 4 && searchEmail.length > 3,
    retry: false,
  });

  const order = data?.data;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputId.trim();
    const trimmedEmail = inputEmail.trim().toLowerCase();
    setSearchId(trimmed);
    setSearchEmail(trimmedEmail);
    setSearchParams(trimmed && trimmedEmail ? { id: trimmed, email: trimmedEmail } : {});
  };

  const currentStepIdx = order
    ? STATUS_STEPS.indexOf(order.status.toUpperCase() as typeof STATUS_STEPS[number])
    : -1;

  const items = (order?.items ?? []) as Array<{
    productId: string;
    quantity: number;
    product: { name: string; image: string; price: number };
  }>;

  const customer = order?.customer as {
    name: string; email: string;
    address: { line1: string; line2?: string; city: string; state: string; zip: string; country: string };
  } | undefined;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-28">
      <div className="mb-10">
        <p className="text-xs text-accent tracking-widest uppercase mb-2">Order Status</p>
        <h1 className="font-display text-3xl font-medium text-stone-900">Track Your Order</h1>
        <p className="text-stone-400 text-sm mt-2">
          Enter your order ID and checkout email to see status updates.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 mb-10">
        <input
          type="text"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          placeholder="Enter order ID (e.g. cm1a2b3c4…)"
          className="input flex-1 font-mono text-sm"
        />
        <input
          type="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          placeholder="Enter checkout email"
          className="input text-sm"
        />
        <button type="submit" className="btn-primary px-6">
          <Search size={16} /> Track
        </button>
      </form>

      {/* Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && searchId && searchEmail && (
        <div className="text-center py-16">
          <Package size={40} className="text-stone-200 mx-auto mb-4" />
          <p className="text-stone-700 font-medium">Order not found</p>
          <p className="text-stone-400 text-sm mt-1">
            Double-check the order ID and checkout email, then try again.
          </p>
        </div>
      )}

      {order && (
        <div className="space-y-6 animate-fade-up">
          {/* Status badge */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-1">Order ID</p>
              <p className="font-mono text-sm text-stone-700">#{order.id.toUpperCase()}</p>
            </div>
            {order.status.toUpperCase() !== 'CANCELLED' ? (
              <span className={clsx(
                'inline-flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-full',
                STATUS_META[order.status]?.color ?? 'text-stone-600 bg-stone-50 border-stone-200'
              )}>
                {STATUS_META[order.status]?.icon}
                {STATUS_META[order.status]?.label ?? order.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 border text-sm font-medium rounded-full text-red-600 bg-red-50 border-red-200">
                <XCircle size={16} /> Cancelled
              </span>
            )}
          </div>

          {/* Progress tracker */}
          {order.status.toUpperCase() !== 'CANCELLED' && (
            <div className="card p-6">
              <div className="flex items-center gap-0">
                {STATUS_STEPS.map((step, idx) => {
                  const done    = idx <= currentStepIdx;
                  const current = idx === currentStepIdx;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={clsx(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all',
                          done    ? 'bg-stone-900 border-stone-900 text-white' : 'bg-white border-stone-300 text-stone-400',
                          current && 'ring-2 ring-stone-400 ring-offset-2'
                        )}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <span className={clsx(
                          'text-[10px] text-center leading-tight whitespace-nowrap',
                          done ? 'text-stone-700 font-medium' : 'text-stone-400'
                        )}>
                          {STATUS_META[step]?.label}
                        </span>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className={clsx(
                          'flex-1 h-0.5 mx-2 mb-5 transition-colors',
                          idx < currentStepIdx ? 'bg-stone-900' : 'bg-stone-200'
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 bg-stone-50">
              <h2 className="text-sm font-medium text-stone-700 tracking-wide uppercase">Items Ordered</h2>
            </div>
            <div className="divide-y divide-stone-100">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-12 h-12 bg-stone-100 flex-shrink-0 overflow-hidden">
                    <img src={item.product?.image} alt={item.product?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{item.product?.name}</p>
                    <p className="text-xs text-stone-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-stone-900">
                    ${(Number(item.product?.price ?? 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-stone-100 flex justify-between font-medium text-stone-900">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Shipping info */}
          {customer && (
            <div className="card p-5">
              <h2 className="text-sm font-medium text-stone-700 tracking-wide uppercase mb-3">Shipping To</h2>
              <p className="text-sm text-stone-800">{customer.name}</p>
              <p className="text-sm text-stone-500">{customer.email}</p>
              <p className="text-sm text-stone-500 mt-1">
                {customer.address.line1}
                {customer.address.line2 ? `, ${customer.address.line2}` : ''},&nbsp;
                {customer.address.city}, {customer.address.state} {customer.address.zip}
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-stone-400 flex flex-wrap gap-4">
            <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
            <span>Updated: {new Date(order.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      )}

      {!searchId && !searchEmail && (
        <div className="text-center py-16 text-stone-400">
          <Package size={40} className="mx-auto mb-4 text-stone-200" />
          <p className="text-sm">Enter an order ID and checkout email above to get started.</p>
          <Link to="/account" className="text-accent text-sm hover:underline mt-2 inline-block">
            View my orders →
          </Link>
        </div>
      )}
    </div>
  );
}
