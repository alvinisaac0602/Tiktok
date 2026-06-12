import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { useRealtimeOrders, useVendorAuth } from '../hooks/useRealtimeOrders'
import {
  StatCard, StatusBadge, Spinner, EmptyState,
  NewOrderToast, PageLoader
} from '../components/UI'
import { Navbar } from '../components/Navbar'
import toast from 'react-hot-toast'
import {
  Search, MapPin, Phone, Package, ChevronDown, Copy, Banknote, CreditCard, Sparkles, Clock
} from 'lucide-react'

function OrderRow({ order, expanded, onToggle, onStatusChange }) {
  const copyPhone = () => {
    navigator.clipboard.writeText(order.customer_phone)
    toast.success('Phone number copied!')
  }

  // Determine the next step action and description based on order status & payment method
  const getStepAction = () => {
    const status = order.status
    const pm = order.payment_method

    if (status === 'pending_cod') {
      return {
        step: 'Step 1: Pack the items',
        description: 'Prepare and pack this order. Check the delivery details below.',
        buttonLabel: '📦 Mark Prepared & Packed',
        nextStatus: 'processing',
        colorClass: 'bg-brand-50 border-brand-100 text-brand-800'
      }
    }
    if (status === 'paid' && pm === 'online') {
      return {
        step: 'Step 1: Pack the items',
        description: 'The customer paid online. Pack this order and get it ready for delivery.',
        buttonLabel: '📦 Mark Prepared & Packed',
        nextStatus: 'processing',
        colorClass: 'bg-brand-50 border-brand-100 text-brand-800'
      }
    }
    if (status === 'processing') {
      return {
        step: 'Step 2: Ship with Driver',
        description: 'Give this packaged order to your delivery driver or dispatch courier.',
        buttonLabel: '🚚 Mark Shipped with Driver',
        nextStatus: 'dispatched',
        colorClass: 'bg-indigo-50 border-indigo-100 text-indigo-800'
      }
    }
    if (status === 'dispatched' && pm === 'cod') {
      return {
        step: 'Step 3: Collect payment',
        description: 'Driver is delivering. Once you receive the cash payment, complete this order.',
        buttonLabel: '💵 Cash Received - Complete Order',
        nextStatus: 'paid',
        colorClass: 'bg-emerald-50 border-emerald-100 text-emerald-800'
      }
    }
    return null
  }

  const stepAction = getStepAction()

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-300 bg-white ${
      expanded 
        ? 'border-brand-500 shadow-lg ring-1 ring-brand-500/20' 
        : 'border-slate-100 hover:border-brand-200 hover:shadow-md'
    }`}>
      {/* Collapsed Header Bar */}
      <button 
        onClick={onToggle}
        className="w-full text-left p-3 sm:p-4 md:p-5 flex items-center justify-between gap-3 sm:gap-4 bg-white"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Product image or package icon */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-100">
            {order.products?.images?.[0] ? (
              <img src={order.products.images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package size={22} className="text-slate-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">
                {order.products?.title || 'Untitled Product'}
              </span>
              <StatusBadge status={order.status} />
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                order.payment_method === 'cod'
                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                {order.payment_method === 'cod' ? '💵 COD' : '💳 Paid Online'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-400">
              <span>👤 {order.customer_name || 'Customer'}</span>
              <span>📍 {order.customer_location_zone}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm sm:text-base font-black text-brand-700">{formatUGX(order.total_amount)}</p>
            <p className="text-xs font-bold text-slate-400">Qty: {order.quantity}</p>
          </div>
          <div className={`text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </div>
      </button>

      {/* Expanded Details Section */}
      {expanded && (
        <div className="bg-slate-50/50 border-t border-slate-100 p-5 space-y-5 animate-fade-in">
          {/* Action Step Card */}
          {stepAction ? (
            <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${stepAction.colorClass}`}>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">{stepAction.step}</span>
                <p className="text-sm font-semibold">{stepAction.description}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(order.id, stepAction.nextStatus)
                }}
                className="py-3 px-5 rounded-xl bg-brand-600 text-white hover:bg-brand-500 font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 flex-shrink-0"
              >
                {stepAction.buttonLabel}
              </button>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Information</p>
              <p className="text-sm font-semibold text-slate-600 mt-1">
                {order.status === 'cancelled' && '❌ This order was cancelled.'}
                {order.status === 'failed' && '⚠️ This order payment failed.'}
                {order.status === 'pending_payment' && '⏳ Waiting for the customer to pay online.'}
                {order.status === 'paid' && order.payment_method === 'cod' && '✅ Order completed! Cash received.'}
                {order.status === 'dispatched' && order.payment_method === 'online' && '✅ Order completed! Shipped to paid customer.'}
              </p>
            </div>
          )}

          {/* Delivery & Customer Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-100 rounded-2xl p-4 text-sm shadow-sm">
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Customer Name</p>
                <p className="font-bold text-slate-800 mt-0.5">{order.customer_name || '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Phone Number</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-800">{order.customer_phone}</span>
                  <button 
                    onClick={copyPhone}
                    className="p-1 rounded-lg hover:bg-slate-100 text-brand-600 hover:text-brand-700 transition-colors"
                    title="Copy Phone"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              {order.creator_id && (
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">TikTok Creator Ref</p>
                  <p className="font-bold text-slate-700 mt-0.5">@{order.creator_id}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Delivery Zone / District</p>
                <p className="font-bold text-slate-800 mt-0.5">{order.customer_location_zone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Specific Location Landmark</p>
                <p className="font-bold text-slate-800 mt-0.5">{order.customer_location_detail || '—'}</p>
              </div>
              {order.customer_lat && order.customer_lng && (
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">GPS Coordinates</p>
                  <a 
                    href={`https://maps.google.com?q=${order.customer_lat},${order.customer_lng}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 mt-1"
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>
                </div>
              )}
            </div>

            <div className="col-span-1 sm:col-span-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Placed on: {new Date(order.created_at).toLocaleString('en-UG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              {order.payments?.[0]?.flw_ref && (
                <span className="font-mono">FLW Ref: {order.payments[0].flw_ref}</span>
              )}
            </div>
          </div>

          {/* Cancel Button (only for active todo orders) */}
          {stepAction && (
            <div className="flex justify-end pt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Are you sure you want to cancel this order?')) {
                    onStatusChange(order.id, 'cancelled')
                  }
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 transition-colors"
              >
                Cancel Order
              </button>
            </div>
          )}
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
  const [activeTab, setActiveTab] = useState('todo')
  const [newAlertVisible, setNewAlertVisible] = useState(null)

  useEffect(() => { if (!authLoading && !user) navigate('/vendor/login') }, [authLoading, user])

  useEffect(() => {
    if (newOrderAlert) {
      setNewAlertVisible(newOrderAlert)
      const t = setTimeout(() => setNewAlertVisible(null), 6000)
      return () => clearTimeout(t)
    }
  }, [newOrderAlert])

  const handleStatusChange = async (orderId, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) toast.error('Failed to update status')
    else toast.success(`Order marked as ${newStatus}`)
  }

  if (authLoading) return <PageLoader />

  if (!authLoading && user && vendor === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="card border-red-100 bg-red-50 p-8 text-center max-w-lg">
          <h2 className="text-xl font-bold text-slate-900">Vendor profile not found</h2>
          <p className="text-sm text-slate-500 mt-3">Sign out and sign back in, or contact support.</p>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/vendor/login') }}
            className="mt-6 btn-primary px-6 py-3">Sign out and try again</button>
        </div>
      </div>
    )
  }

  const getTabForOrder = (order) => {
    const status = order.status
    const pm = order.payment_method
    if (status === 'cancelled' || status === 'failed' || status === 'pending_payment') {
      return 'cancelled'
    }
    if (status === 'paid' && pm === 'cod') {
      return 'completed'
    }
    if (status === 'dispatched' && pm === 'online') {
      return 'completed'
    }
    return 'todo'
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search
      || o.customer_phone?.includes(search)
      || o.customer_name?.toLowerCase().includes(search.toLowerCase())
      || o.customer_location_zone?.toLowerCase().includes(search.toLowerCase())
      || o.products?.title?.toLowerCase().includes(search.toLowerCase())
    const matchTab = getTabForOrder(o) === activeTab
    return matchSearch && matchTab
  })

  const paidOrders    = orders.filter(o => o.status === 'paid')
  const totalEarnings = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const todoCount     = orders.filter(o => getTabForOrder(o) === 'todo').length
  const completedCount = orders.filter(o => getTabForOrder(o) === 'completed').length

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <NewOrderToast order={newAlertVisible} onDismiss={() => setNewAlertVisible(null)} />
      <Navbar vendor={vendor} user={user} />

      {/* Welcoming Header with store name */}
      <div className="bg-gradient-to-r from-brand-850 via-brand-700 to-accent-950 text-white px-4 py-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Live Shop Portal</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
              {vendor?.store_name || 'My Store'}
            </h1>
            <p className="text-brand-200 text-sm mt-1.5 font-medium">
              {todoCount > 0 
                ? `👋 Welcome back! You have ${todoCount} active orders that need your attention.`
                : '🎉 Excellent! All orders are packed and shipped.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/vendor/products" className="btn-primary bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold shadow-none py-2.5 px-4 rounded-2xl transition-all">
              📦 Products
            </Link>
            <Link to="/vendor/analytics" className="btn-primary bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-none py-2.5 px-4 rounded-2xl transition-all">
              📊 Analytics
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-6 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="My Earnings (Paid)" value={formatUGX(totalEarnings)} icon="💰" color="green" sub="Completed money in pocket" />
          <StatCard label="Orders To Do" value={todoCount} icon="📦" color="orange" sub="Need packing or shipping" />
          <StatCard label="All-time Orders" value={orders.length} icon="✨" color="blue" sub="Total orders received" />
        </div>

        {/* Tab Selectors */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/80 gap-1 overflow-x-auto no-scrollbar">
          {['todo', 'completed', 'cancelled'].map((tabKey) => {
            const count = orders.filter(o => getTabForOrder(o) === tabKey).length
            const labels = {
              todo: '📦 To Do',
              completed: '✅ Finished',
              cancelled: '❌ Unpaid / Cancelled'
            }
            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey)
                  setExpandedId(null)
                }}
                className={`flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                  activeTab === tabKey
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{labels[tabKey]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tabKey ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Orders list card container */}
        <div className="space-y-4">
          {/* Search Toolbar */}
          <div className="relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search phone number, customer name or items…" className="input pl-10 pr-4 py-3 rounded-2xl border-slate-200 shadow-sm bg-white" />
          </div>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <div className="card bg-white p-8">
              <EmptyState
                icon="📭"
                title={search ? 'No matching orders found' : 'No orders in this list'}
                subtitle={search 
                  ? 'Double check your spelling or search term.'
                  : activeTab === 'todo'
                  ? 'All clear! Try sharing your creator links on TikTok to get more orders.'
                  : 'No orders found in this section.'}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(order => (
                <OrderRow key={order.id} order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <p className="text-xs text-slate-400 text-center mt-4 font-semibold">
              Showing {filtered.length} of {orders.length} total orders · Live Updates active
            </p>
          )}
        </div>

        {/* Share Product Links Helper Widget */}
        <div className="card bg-gradient-to-br from-brand-900 to-slate-900 border-none p-6 text-white space-y-4 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400 animate-pulse" size={20} />
            <p className="font-bold text-lg">Quick Guide: How to Get Sales</p>
          </div>
          <p className="text-sm text-brand-200">
            Go to <Link to="/vendor/products" className="text-white font-bold hover:underline">Products</Link>, click **"Generate Creator Link"** next to any product, enter a TikTok creator's handle, and share that custom link with them to put in their TikTok bio!
          </p>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-200 select-all truncate flex-1">
              {window.location.origin}/store/{vendor?.store_slug || 'yourstore'}?p=PRODUCT_ID
            </span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/store/${vendor?.store_slug || 'yourstore'}`)
                toast.success('Store link copied!')
              }}
              className="text-white hover:text-brand-300 font-bold text-xs flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all"
            >
              Copy Store Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
