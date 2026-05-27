import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Package,
  Lock,
  Heart,
  Search,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getMyOrdersApi } from '../lib/authApi';
import type { Order } from '../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type Tab = 'profile' | 'orders' | 'password';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED:    'bg-purple-100 text-purple-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

export default function AccountPage() {
  const { user, updateProfile, changePassword } = useAuthStore();
  const [tab, setTab] = useState<Tab>('profile');

  // ── Profile tab state ──────────────────────────────────────────────────────
  const [name, setName]       = useState(user?.name ?? '');
  const [email, setEmail]     = useState(user?.email ?? '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user]);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await updateProfile({ name, email });
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
      toast.success('Profile saved');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setProfileMsg({ type: 'err', text: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password tab state ─────────────────────────────────────────────────────
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwMsg, setPwMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingPw, setSavingPw]     = useState(false);

  const handlePasswordSave = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 8)    { setPwMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
    setSavingPw(true);
    try {
      await changePassword(currentPw, newPw);
      setPwMsg({ type: 'ok', text: 'Password changed successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      toast.success('Password changed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPwMsg({ type: 'err', text: msg });
    } finally {
      setSavingPw(false);
    }
  };

  // ── Orders query ───────────────────────────────────────────────────────────
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrdersApi,
    enabled: tab === 'orders',
  });
  const orders: Order[] = (ordersData?.data ?? []) as unknown as Order[];

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile',  label: 'Profile',         icon: <User size={16} /> },
    { id: 'orders',   label: 'Order History',   icon: <Package size={16} /> },
    { id: 'password', label: 'Change Password', icon: <Lock size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs text-accent tracking-widest uppercase mb-1">My Account</p>
          <h1 className="font-display text-3xl font-medium text-stone-900">
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-stone-400 text-sm mt-1">{user?.email}</p>
          {user?.role === 'ADMIN' && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-accent/10 text-accent border border-accent/20">
              Admin
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="card divide-y divide-stone-100">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    'w-full flex items-center justify-between px-5 py-4 text-sm transition-colors',
                    tab === t.id
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  )}
                >
                  <span className="flex items-center gap-3">
                    {t.icon}
                    {t.label}
                  </span>
                  <ChevronRight size={14} className="opacity-40" />
                </button>
              ))}
            </nav>

            {/* Quick links */}
            <div className="mt-4 text-xs text-stone-400 space-y-2 px-1">
              <Link to="/wishlist" className="flex items-center gap-1.5 hover:text-stone-700 transition-colors">
                <Heart size={11} /> My Wishlist
              </Link>
              <Link to="/track-order" className="flex items-center gap-1.5 hover:text-stone-700 transition-colors">
                <Search size={11} /> Track an Order
              </Link>
              <Link to="/products" className="block hover:text-stone-700 transition-colors">
                → Continue shopping
              </Link>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">

            {/* ── Profile ── */}
            {tab === 'profile' && (
              <div className="card p-6 lg:p-8">
                <h2 className="font-display text-xl font-medium text-stone-900 mb-6">
                  Profile Information
                </h2>

                {profileMsg && (
                  <div className={clsx(
                    'flex items-start gap-2 px-4 py-3 mb-5 text-sm animate-fade-in',
                    profileMsg.type === 'ok'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}>
                    {profileMsg.type === 'ok'
                      ? <Check size={15} className="mt-0.5 flex-shrink-0" />
                      : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                    {profileMsg.text}
                  </div>
                )}

                <form onSubmit={handleProfileSave} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                      Role
                    </label>
                    <input
                      type="text"
                      value={user?.role ?? ''}
                      disabled
                      className="input bg-stone-100 text-stone-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      disabled
                      className="input bg-stone-100 text-stone-400 cursor-not-allowed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary py-3 px-8 disabled:opacity-60"
                  >
                    {savingProfile
                      ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                      : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* ── Orders ── */}
            {tab === 'orders' && (
              <div className="card p-6 lg:p-8">
                <h2 className="font-display text-xl font-medium text-stone-900 mb-6">
                  Order History
                </h2>

                {ordersLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={28} className="animate-spin text-stone-300" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16">
                    <Package size={40} className="text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-500 font-medium">No orders yet</p>
                    <p className="text-stone-400 text-sm mt-1 mb-6">
                      Your orders will appear here once placed.
                    </p>
                    <Link to="/products" className="btn-primary">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(orders as unknown as Array<{
                      id: string; total: number; createdAt: string; status: string;
                      customer: { name: string; email: string; address: { line1: string; city: string; state: string; zip: string } };
                      items: Array<{ product: { name: string; image: string; price: number }; quantity: number }>;
                    }>).map((order) => (
                      <div key={order.id} className="border border-stone-200 overflow-hidden">
                        {/* Order header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-stone-50 border-b border-stone-200">
                          <div className="space-y-0.5">
                            <p className="text-xs text-stone-500">
                              Order{' '}
                              <span className="font-mono text-stone-700">
                                #{order.id.split('-')[0].toUpperCase()}
                              </span>
                            </p>
                            <p className="text-xs text-stone-400">
                              {new Date(order.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={clsx(
                              'px-2.5 py-0.5 text-xs font-medium rounded-full',
                              STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600'
                            )}>
                              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </span>
                            <span className="font-medium text-stone-900 text-sm">
                              ${Number(order.total).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Order items */}
                        <div className="divide-y divide-stone-100">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-5 py-4">
                              <div className="w-12 h-12 bg-stone-100 flex-shrink-0 overflow-hidden">
                                <img
                                  src={item.product?.image ?? ''}
                                  alt={item.product?.name ?? 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-800 truncate">
                                  {item.product?.name ?? 'Product'}
                                </p>
                                <p className="text-xs text-stone-400">
                                  Qty {item.quantity} × ${Number(item.product?.price ?? 0).toFixed(2)}
                                </p>
                              </div>
                              <p className="text-sm font-medium text-stone-800">
                                ${(Number(item.product?.price ?? 0) * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Shipping address */}
                        <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-400">
                          Ship to:{' '}
                          <span className="text-stone-600">
                            {order.customer?.address?.line1}, {order.customer?.address?.city},{' '}
                            {order.customer?.address?.state} {order.customer?.address?.zip}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Password ── */}
            {tab === 'password' && (
              <div className="card p-6 lg:p-8">
                <h2 className="font-display text-xl font-medium text-stone-900 mb-2">
                  Change Password
                </h2>
                <p className="text-sm text-stone-400 mb-6">
                  Use a strong password with at least 8 characters, one uppercase letter, and one number.
                </p>

                {pwMsg && (
                  <div className={clsx(
                    'flex items-start gap-2 px-4 py-3 mb-5 text-sm animate-fade-in',
                    pwMsg.type === 'ok'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}>
                    {pwMsg.type === 'ok'
                      ? <Check size={15} className="mt-0.5 flex-shrink-0" />
                      : <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />}
                    {pwMsg.text}
                  </div>
                )}

                <form onSubmit={handlePasswordSave} className="space-y-5 max-w-lg">
                  {(
                    [
                      { label: 'Current Password',  value: currentPw, set: setCurrentPw, auto: 'current-password' },
                      { label: 'New Password',       value: newPw,     set: setNewPw,     auto: 'new-password' },
                      { label: 'Confirm New Password', value: confirmPw, set: setConfirmPw, auto: 'new-password' },
                    ] as Array<{ label: string; value: string; set: (v: string) => void; auto: string }>
                  ).map(({ label, value, set, auto }) => (
                    <div key={label}>
                      <label className="block text-xs tracking-widest uppercase text-stone-500 mb-1.5">
                        {label}
                      </label>
                      <input
                        type="password"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        autoComplete={auto}
                        required
                        placeholder="••••••••"
                        className={clsx(
                          'input',
                          label === 'Confirm New Password' &&
                            confirmPw.length > 0 &&
                            confirmPw !== newPw &&
                            'border-red-400'
                        )}
                      />
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={savingPw}
                    className="btn-primary py-3 px-8 disabled:opacity-60"
                  >
                    {savingPw
                      ? <><Loader2 size={15} className="animate-spin" /> Updating…</>
                      : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
