import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { useVendorAuth } from '../hooks/useRealtimeOrders'
import { Spinner, PageLoader, StatCard } from '../components/UI'
import { Navbar } from '../components/Navbar'
import { BarChart2, TrendingUp, Users, ArrowRight, RefreshCw } from 'lucide-react'

const DATE_RANGES = [
  { label: 'Today',    days: 0 },
  { label: '7 days',  days: 7 },
  { label: '30 days', days: 30 },
  { label: 'All time', days: -1 },
]

function FunnelBar({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{count.toLocaleString()}</span>
          <span className="text-xs text-slate-400">{pct}%</span>
        </div>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function VendorAnalytics() {
  const navigate = useNavigate()
  const { vendor, user, loading: authLoading } = useVendorAuth()
  const [events, setEvents]           = useState([])
  const [orders, setOrders]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [dateRange, setDateRange]     = useState(7) // days

  useEffect(() => { if (!authLoading && !user) navigate('/vendor/login') }, [authLoading, user])
  useEffect(() => { if (vendor?.id) fetchData() }, [vendor?.id, dateRange])

  const fetchData = async () => {
    setRefreshing(true)
    const since = dateRange === -1
      ? null
      : dateRange === 0
        ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
        : new Date(Date.now() - dateRange * 86400000).toISOString()

    const [evtsRes, ordersRes] = await Promise.all([
      supabase.from('analytics_events')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => since ? (data || []).filter(e => e.created_at >= since) : (data || [])),
      supabase.from('orders')
        .select('id, status, payment_method, total_amount, creator_id, created_at, products(title)')
        .eq('vendor_id', vendor.id)
        .then(({ data }) => since ? (data || []).filter(o => o.created_at >= since) : (data || [])),
    ])

    setEvents(Array.isArray(evtsRes) ? evtsRes : [])
    setOrders(Array.isArray(ordersRes) ? ordersRes : [])
    setLoading(false)
    setRefreshing(false)
  }

  if (authLoading) return <PageLoader />

  // Funnel aggregation
  const count = (type) => events.filter(e => e.event_type === type).length
  const linkClicks     = count('link_click')
  const pageViews      = count('page_view')
  const checkoutStarts = count('checkout_start')
  const ordersPlaced   = orders.length
  const paidOrders     = orders.filter(o => o.status === 'paid' || o.status === 'dispatched')
  const dispatchedOrders = orders.filter(o => o.status === 'dispatched')
  const totalRevenue   = paidOrders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const maxFunnel      = Math.max(linkClicks, pageViews, 1)
  const convRate       = ordersPlaced > 0 && linkClicks > 0
    ? ((ordersPlaced / linkClicks) * 100).toFixed(1) : '0.0'

  // Creator leaderboard
  const creatorMap = {}
  events.forEach(e => {
    if (!e.creator_ref) return
    if (!creatorMap[e.creator_ref]) creatorMap[e.creator_ref] = { clicks: 0, orders: 0, revenue: 0 }
    if (e.event_type === 'link_click') creatorMap[e.creator_ref].clicks++
  })
  orders.forEach(o => {
    if (!o.creator_id) return
    if (!creatorMap[o.creator_id]) creatorMap[o.creator_id] = { clicks: 0, orders: 0, revenue: 0 }
    creatorMap[o.creator_id].orders++
    if (o.status === 'paid' || o.status === 'dispatched') {
      creatorMap[o.creator_id].revenue += o.total_amount || 0
    }
  })
  const creators = Object.entries(creatorMap)
    .map(([ref, data]) => ({ ref, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Product leaderboard
  const productMap = {}
  orders.forEach(o => {
    const key = o.products?.title || o.id
    if (!productMap[key]) productMap[key] = { orders: 0, revenue: 0 }
    productMap[key].orders++
    if (o.status === 'paid' || o.status === 'dispatched') productMap[key].revenue += o.total_amount || 0
  })
  const products = Object.entries(productMap)
    .map(([title, data]) => ({ title, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <Navbar vendor={vendor} user={user} />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-brand-800 text-white px-4 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Analytics</p>
            <h1 className="font-display font-bold text-2xl">{vendor?.store_name}</h1>
          </div>
          <button onClick={fetchData} disabled={refreshing}
            className="flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-4 space-y-5 pb-10">
        {/* Date range filter */}
        <div className="card">
          <div className="flex gap-2 flex-wrap">
            {DATE_RANGES.map(({ label, days }) => (
              <button key={label} onClick={() => setDateRange(days)}
                className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${
                  dateRange === days ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-600 hover:border-brand-300'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total Revenue"  value={formatUGX(totalRevenue)} icon="💰" color="green" />
              <StatCard label="Orders Placed"  value={ordersPlaced}            icon="📦" color="blue" />
              <StatCard label="Conversion Rate" value={`${convRate}%`}         icon="🎯" color="purple" sub="clicks → orders" />
              <StatCard label="Dispatched"     value={dispatchedOrders.length} icon="🚚" color="orange" />
            </div>

            {/* Funnel */}
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-brand-600" />
                <h2 className="font-display font-bold text-lg text-slate-900">Conversion Funnel</h2>
              </div>
              <p className="text-xs text-slate-400">From TikTok click to order dispatched</p>

              <div className="space-y-4">
                <FunnelBar label="🔗 TikTok Link Clicks" count={linkClicks}     max={maxFunnel} color="bg-brand-500" />
                <FunnelBar label="👁 Product Page Views"  count={pageViews}     max={maxFunnel} color="bg-purple-500" />
                <FunnelBar label="🛒 Checkout Started"    count={checkoutStarts} max={maxFunnel} color="bg-amber-500" />
                <FunnelBar label="📦 Orders Placed"       count={ordersPlaced}  max={maxFunnel} color="bg-emerald-500" />
                <FunnelBar label="✅ Paid / Confirmed"    count={paidOrders.length} max={maxFunnel} color="bg-green-600" />
                <FunnelBar label="🚚 Dispatched"          count={dispatchedOrders.length} max={maxFunnel} color="bg-indigo-600" />
              </div>

              {linkClicks === 0 && pageViews === 0 && (
                <div className="mt-4 text-center py-8 text-slate-400">
                  <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-slate-500">No analytics data yet</p>
                  <p className="text-sm mt-1">Generate creator links in <Link to="/vendor/products" className="text-brand-600 hover:underline">Products</Link> and share on TikTok to start tracking</p>
                </div>
              )}
            </div>

            {/* Creator Leaderboard */}
            {creators.length > 0 && (
              <div className="card space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-brand-600" />
                  <h2 className="font-display font-bold text-lg text-slate-900">Creator Performance</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                        <th className="pb-3 pr-4">Creator</th>
                        <th className="pb-3 pr-4">Clicks</th>
                        <th className="pb-3 pr-4">Orders</th>
                        <th className="pb-3 pr-4">Revenue</th>
                        <th className="pb-3">Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {creators.map(({ ref, clicks, orders: ords, revenue }) => (
                        <tr key={ref} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white text-xs font-bold">@</div>
                              <span className="font-semibold text-slate-800">@{ref}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-medium text-slate-700">{clicks}</td>
                          <td className="py-3 pr-4 font-medium text-slate-700">{ords}</td>
                          <td className="py-3 pr-4 font-bold text-brand-700">{formatUGX(revenue)}</td>
                          <td className="py-3">
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {clicks > 0 ? ((ords / clicks) * 100).toFixed(1) : '0.0'}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Performance */}
            {products.length > 0 && (
              <div className="card space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-600" />
                  <h2 className="font-display font-bold text-lg text-slate-900">Product Performance</h2>
                </div>
                <div className="space-y-2">
                  {products.map(({ title, orders: ords, revenue }) => (
                    <div key={title} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{title}</p>
                        <p className="text-xs text-slate-400">{ords} orders</p>
                      </div>
                      <p className="font-bold text-brand-700 ml-4">{formatUGX(revenue)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
