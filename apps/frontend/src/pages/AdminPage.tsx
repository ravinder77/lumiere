import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2, Users, Package, DollarSign,
  TrendingUp, ChevronDown, RefreshCw,
} from 'lucide-react';
import {
  fetchAdminStats, fetchAdminOrders, fetchAdminUsers,
  updateOrderStatus, AdminStats,
} from '../lib/extraApi';
import { TableRowSkeleton } from '../components/Skeletons';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type AdminTab = 'overview' | 'orders' | 'users';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  SHIPPED:    'bg-purple-100 text-purple-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const qc = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    refetchInterval: 30_000,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAdminOrders,
    enabled: tab === 'orders',
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    enabled: tab === 'users',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Order status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const stats: AdminStats | undefined = statsData?.data;
  const orders = (ordersData?.data ?? []) as Array<{
    id: string; total: number; status: string; createdAt: string;
    customer: { name: string; email: string };
    user?: { name: string; email: string };
  }>;
  const users = (usersData?.data ?? []) as Array<{
    id: string; name: string; email: string; role: string; createdAt: string;
  }>;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview',  icon: <BarChart2 size={15} /> },
    { id: 'orders',   label: 'Orders',    icon: <Package size={15} /> },
    { id: 'users',    label: 'Users',     icon: <Users size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-accent tracking-widest uppercase mb-1">Administration</p>
            <h1 className="font-display text-3xl font-medium text-stone-900">Dashboard</h1>
          </div>
          <button
            onClick={() => { qc.invalidateQueries(); toast.success('Refreshed'); }}
            className="btn-ghost gap-2 text-sm"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-8 border-b border-stone-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === t.id
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-700'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Total Revenue',   value: stats ? `$${stats.revenue.total.toFixed(2)}` : '—', icon: <DollarSign size={20} />, color: 'text-green-600 bg-green-50' },
                { label: 'Total Orders',    value: stats?.orders.total ?? '—',   icon: <Package size={20} />,   color: 'text-blue-600 bg-blue-50' },
                { label: 'Total Users',     value: stats?.users.total ?? '—',    icon: <Users size={20} />,     color: 'text-purple-600 bg-purple-50' },
                { label: 'Products Listed', value: stats?.products.total ?? '—', icon: <TrendingUp size={20} />, color: 'text-accent bg-amber-50' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-stone-500 tracking-wide uppercase">{label}</p>
                    <div className={clsx('p-2 rounded-lg', color)}>{icon}</div>
                  </div>
                  <p className="text-2xl font-display font-medium text-stone-900">
                    {statsLoading ? <span className="animate-pulse bg-stone-200 rounded w-16 h-6 inline-block" /> : value}
                  </p>
                </div>
              ))}
            </div>

            {/* Sub-stats */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="card p-5">
                  <p className="text-xs text-stone-500 tracking-wide uppercase mb-2">Pending Orders</p>
                  <p className="text-3xl font-display font-medium text-amber-600">{stats.orders.pending}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-stone-500 tracking-wide uppercase mb-2">Processing</p>
                  <p className="text-3xl font-display font-medium text-blue-600">{stats.orders.processing}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs text-stone-500 tracking-wide uppercase mb-2">In Stock Products</p>
                  <p className="text-3xl font-display font-medium text-green-600">{stats.products.inStock}</p>
                </div>
              </div>
            )}

            {/* Revenue by day */}
            {stats && (
              <div className="card p-6">
                <h2 className="text-sm font-medium text-stone-700 tracking-wide uppercase mb-6">
                  Revenue — Last 7 Days
                </h2>
                <div className="flex items-end gap-3 h-32">
                  {stats.revenue.byDay.map(({ date, revenue }) => {
                    const max = Math.max(...stats.revenue.byDay.map((d) => d.revenue), 1);
                    const pct = (revenue / max) * 100;
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] text-stone-500">${revenue > 0 ? revenue.toFixed(0) : '0'}</span>
                        <div
                          className="w-full bg-stone-900 rounded-t transition-all duration-500 min-h-[4px]"
                          style={{ height: `${Math.max(pct, 3)}%` }}
                        />
                        <span className="text-[10px] text-stone-400">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-500 tracking-widest uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ordersLoading
                    ? [1,2,3,4,5].map((i) => <TableRowSkeleton key={i} cols={6} />)
                    : orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-stone-600">
                          #{order.id.split('-')[0].toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-stone-800">{order.customer?.name}</p>
                          <p className="text-xs text-stone-400">{order.customer?.email}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-stone-900">
                          ${Number(order.total).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full', STATUS_COLORS[order.status] ?? 'bg-stone-100 text-stone-600')}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                              className="text-xs border border-stone-200 px-2 py-1 focus:outline-none focus:border-stone-500"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="text-stone-400 -ml-6 pointer-events-none" />
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {!ordersLoading && orders.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-sm">No orders yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-stone-500 tracking-widest uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersLoading
                    ? [1,2,3].map((i) => <TableRowSkeleton key={i} cols={4} />)
                    : users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-stone-900 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-stone-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-stone-500">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={clsx(
                            'px-2 py-0.5 text-xs font-medium rounded-full',
                            u.role === 'ADMIN' ? 'bg-accent/10 text-accent' : 'bg-stone-100 text-stone-600'
                          )}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {!usersLoading && users.length === 0 && (
                <div className="text-center py-12 text-stone-400 text-sm">No users found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
