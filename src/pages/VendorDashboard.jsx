import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { useRealtimeOrders, useVendorAuth } from '../hooks/useRealtimeOrders'
import {
  StatCard, StatusBadge, Spinner, EmptyState,
  NewOrderToast, PageLoader
} from '../components/UI'
import { Navbar } from '../components/Navbar'
import toast, { Toaster } from 'react-hot-toast'
import {
  RefreshCw, LogOut, Search, Filter, Phone,
  MapPin, Package, TrendingUp, Clock, CheckCircle,
  Eye, ChevronDown, ChevronUp, X, Copy
} from 'lucide-react'

function OrderRow({ order, expanded, onToggle }) {
  const copyPhone = () => {
    navigator.clipboard.writeText(order.customer_phone)
    toast.success('Phone copied!')
  }

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-200 hover:border-brand-200 hover:shadow-card">
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 bg-white"
      >
        {/* Product image */}
        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
          {order.products?.images?.[0] ? (
            <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 truncate max-w-[140px] sm:max-w-none">
              {order.products?.title || 'Order'}
            </p>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Phone size={10} />{order.customer_phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={10} />{order.customer_location_zone}
            </span>
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-black text-brand-700">{formatUGX(order.total_amount)}</p>
          <p className="text-xs text-slate-400">×{order.quantity}</p>
        </div>
        <div className="text-slate-400 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Customer</p>
              <p className="font-semibold text-slate-800">{order.customer_name || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Phone</p>
              <button
                onClick={copyPhone}
                className="font-semibold text-brand-700 flex items-center gap-1 hover:text-brand-800"
              >
                {order.customer_phone} <Copy size={11} />
              </button>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Zone</p>
              <p className="font-semibold text-slate-800">{order.customer_location_zone}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Landmark</p>
              <p className="font-semibold text-slate-800">{order.customer_location_detail || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Qty</p>
              <p className="font-semibold text-slate-800">{order.quantity}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
              <p className="font-bold text-brand-700">{formatUGX(order.total_amount)}</p>
            </div>
            {order.payments?.[0]?.flw_ref && (
              <div className="col-span-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">FLW Ref</p>
                <p className="font-mono text-xs text-slate-600">{order.payments[0].flw_ref}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Time</p>
              <p className="font-semibold text-slate-800">
                {new Date(order.created_at).toLocaleString('en-UG', {
                  dateStyle: 'medium', timeStyle: 'short'
                })}
              </p>
            </div>
          </div>

          {/* GPS link */}
          {order.customer_lat && order.customer_lng && (
            <a
              href={`https://maps.google.com?q=${order.customer_lat},${order.customer_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <MapPin size={14} /> Open in Google Maps
            </a>
          )}

          {/* Status update buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
            {['processing', 'paid'].map((s) => (
              <button
                key={s}
                onClick={async () => {
                  await supabase.from('orders').update({ status: s }).eq('id', order.id)
                  toast.success(`Order marked as ${s}`)
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                  order.status === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
                }`}
              >
                Mark {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VendorDashboard() {
  const navigate = useNavigate()
  const { vendor, user, loading: authLoading } = useVendorAuth()
  const { orders, loading: ordersLoading, newOrderAlert } = useRealtimeOrders(vendor?.id)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [newAlertVisible, setNewAlertVisible] = useState(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/vendor/login')
    }
  }, [authLoading, user])

  // Show new order toast notification
  useEffect(() => {
    if (newOrderAlert) {
      setNewAlertVisible(newOrderAlert)
      const t = setTimeout(() => setNewAlertVisible(null), 5000)
      return () => clearTimeout(t)
    }
  }, [newOrderAlert])

  if (authLoading) return <PageLoader />

  // Filter orders
  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.customer_phone?.includes(search) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_location_zone?.toLowerCase().includes(search.toLowerCase()) ||
      o.products?.title?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  // Stats
  const paidOrders = orders.filter((o) => o.status === 'paid')
  const totalEarnings = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'pending_payment').length
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <Toaster position="top-right" />
      <NewOrderToast order={newAlertVisible} onDismiss={() => setNewAlertVisible(null)} />
      <Navbar vendor={vendor} user={user} />

      {/* Header banner */}
      <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-brand-300 text-sm font-medium">Welcome back 👋</p>
              <h1 className="font-display font-bold text-2xl mt-0.5">
                {vendor?.store_name || 'Your Store'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-slow" />
                Live
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4 space-y-5 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Earnings"
            value={formatUGX(totalEarnings)}
            icon="💰"
            color="green"
            sub="paid orders"
          />
          <StatCard
            label="Total Orders"
            value={orders.length}
            icon="📦"
            color="blue"
            sub="all time"
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon="⏳"
            color="orange"
            sub="awaiting payment"
          />
          <StatCard
            label="Today"
            value={todayOrders}
            icon="📈"
            color="purple"
            sub="orders today"
          />
        </div>

        {/* Orders table */}
        <div className="card">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by phone, name, location…"
                className="input pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'paid', 'pending_payment', 'processing'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                    statusFilter === s
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'pending_payment' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Orders list */}
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📭"
              title={search || statusFilter !== 'all' ? 'No matching orders' : 'No orders yet'}
              subtitle={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Share your TikTok product links to start getting orders!'
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-slate-400 text-center mt-4">
              Showing {filtered.length} of {orders.length} orders · Updates in real-time
            </p>
          )}
        </div>

        {/* Product Links section */}
        <div className="card space-y-3">
          <p className="font-semibold text-slate-800">🔗 Your Product Links</p>
          <p className="text-sm text-slate-500">
            Share these links in your TikTok videos. They track creators and convert viewers into buyers.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 font-mono text-xs text-slate-600 break-all">
            {window.location.origin}/p/YOUR_PRODUCT_ID?ref=CREATOR_ID
          </div>
          <p className="text-xs text-slate-400">
            Replace YOUR_PRODUCT_ID with your product ID from Supabase, and CREATOR_ID with the creator's handle.
          </p>
        </div>
      </div>
    </div>
  )
}
