import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { StatusBadge, Spinner, EmptyState, StatCard, PageLoader } from '../components/UI'
import { Navbar } from '../components/Navbar'
import toast from 'react-hot-toast'
import { Search, RefreshCw, Users, Store, ShoppingBag, TrendingUp, AlertTriangle, Trash2, BarChart2, Copy, X } from 'lucide-react'

export default function AdminPanel() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('orders') // 'orders' | 'vendors' | 'products'
  const [data, setData] = useState({ orders: [], vendors: [], products: [] })
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/vendor/login'); return }

      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      // If user doesn't exist in public.users, create an admin record
      if (error?.code === 'PGRST116') {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          role: 'admin'
        })
        if (insertError) {
          console.error('Failed to create admin profile:', insertError)
          toast.error('Failed to create admin profile: ' + insertError.message)
          navigate('/vendor/login')
          return
        }
        toast.success('Admin profile created')
        fetchAll()
        return
      }

      if (error) {
        console.error('Error checking admin:', error)
        toast.error('Error: ' + error.message)
        return
      }

      if (!profile || profile.role !== 'admin') {
        toast.error('Admin access required')
        navigate('/vendor/login')
        return
      }
      
      fetchAll()
    } catch (err) {
      console.error('checkAdmin error:', err)
      toast.error(err.message)
    }
  }

  const fetchAll = async () => {
    setRefreshing(true)
    const [ordersRes, vendorsRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*, products(title), vendors(store_name)').order('created_at', { ascending: false }).limit(200),
      supabase.from('vendors').select('*, users(email)').order('created_at', { ascending: false }),
      supabase.from('products').select('*, vendors(store_name)').order('created_at', { ascending: false }),
    ])
    setData({
      orders: ordersRes.data || [],
      vendors: vendorsRes.data || [],
      products: productsRes.data || [],
    })
    setLoading(false)
    setRefreshing(false)
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    toast.success('Product deleted')
    fetchAll()
  }

  const suspendVendor = async (id) => {
    await supabase.from('vendors').update({ suspended: true }).eq('id', id)
    toast.success('Vendor suspended')
    fetchAll()
  }

  const generateVendorInvite = async () => {
    if (!inviteEmail.trim() || !/\S+@\S+\.\S+/.test(inviteEmail)) {
      toast.error('Valid email is required')
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const token = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data, error } = await supabase.from('vendor_invites').insert([
        {
          email: inviteEmail,
          token,
          created_by_admin_id: user.id,
        }
      ]).select()
      if (error) throw error
      const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
      const link = `${appUrl}/vendor/login?invite=${token}`
      setInviteLink(link)
      toast.success('Invite generated!')
    } catch (err) {
      toast.error(err.message || 'Failed to generate invite')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    toast.success('Link copied to clipboard!')
  }

  if (loading) return <PageLoader />

  const tabs = [
    { key: 'orders',   label: 'Orders',   icon: <ShoppingBag size={15} />, count: data.orders.length },
    { key: 'vendors',  label: 'Vendors',  icon: <Store size={15} />,       count: data.vendors.length },
    { key: 'products', label: 'Products', icon: <TrendingUp size={15} />,  count: data.products.length },
  ]

  const totalRevenue = data.orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Admin Panel</p>
            <h1 className="font-display font-bold text-2xl">System Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowInviteModal(true); setInviteEmail(''); setInviteLink(''); }}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <Users size={14} />
              Invite Vendor
            </button>
            <Link to="/admin/analytics"
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
              <BarChart2 size={14} />
              Platform Analytics
            </Link>
            <button
              onClick={fetchAll}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4 space-y-5 pb-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Revenue" value={formatUGX(totalRevenue)} icon="💰" color="green" />
          <StatCard label="Total Orders"  value={data.orders.length}      icon="📦" color="blue" />
          <StatCard label="Vendors"       value={data.vendors.length}     icon="🏪" color="purple" />
          <StatCard label="Products"      value={data.products.length}    icon="🛍️" color="orange" />
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="bg-slate-200 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab}…`}
              className="input pl-9"
            />
          </div>

          {/* Orders table */}
          {tab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">Product</th>
                    <th className="pb-3 pr-4">Vendor</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Zone</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.orders
                    .filter((o) =>
                      !search ||
                      o.customer_phone?.includes(search) ||
                      o.products?.title?.toLowerCase().includes(search.toLowerCase()) ||
                      o.vendors?.store_name?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pr-4 font-medium text-slate-800 max-w-[150px] truncate">{o.products?.title || '—'}</td>
                        <td className="py-3 pr-4 text-slate-600">{o.vendors?.store_name || '—'}</td>
                        <td className="py-3 pr-4">
                          <p className="text-slate-800 font-medium">{o.customer_name || '—'}</p>
                          <p className="text-slate-400 text-xs">{o.customer_phone}</p>
                        </td>
                        <td className="py-3 pr-4 text-slate-600 text-xs">{o.customer_location_zone}</td>
                        <td className="py-3 pr-4 font-bold text-brand-700">{formatUGX(o.total_amount)}</td>
                        <td className="py-3 pr-4"><StatusBadge status={o.status} /></td>
                        <td className="py-3 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString('en-UG')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vendors table */}
          {tab === 'vendors' && (
            <div className="space-y-2">
              {data.vendors
                .filter((v) => !search || v.store_name?.toLowerCase().includes(search.toLowerCase()))
                .map((v) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white font-bold text-sm">
                      {v.store_name?.[0] || 'V'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{v.store_name}</p>
                      <p className="text-xs text-slate-400">{v.users?.email}</p>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(v.created_at).toLocaleDateString()}</p>
                    {v.suspended && (
                      <span className="badge bg-red-100 text-red-600">Suspended</span>
                    )}
                    {!v.suspended && (
                      <button
                        onClick={() => suspendVendor(v.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Products table */}
          {tab === 'products' && (
            <div className="space-y-2">
              {data.products
                .filter((p) => !search || p.title?.toLowerCase().includes(search.toLowerCase()))
                .map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.vendors?.store_name} · {formatUGX(p.price)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400">Stock: {p.stock}</p>
                    </div>
                    <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Invite Vendor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-slate-900">Invite Vendor</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {!inviteLink ? (
              <>
                <p className="text-sm text-slate-600">Generate a signup link for a new vendor.</p>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="input"
                />
                <button
                  onClick={generateVendorInvite}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all"
                >
                  Generate Link
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600">Share this link with the vendor:</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 bg-transparent text-xs text-slate-600 outline-none truncate"
                  />
                  <button
                    onClick={copyLink}
                    className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-all"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 text-center">Link is valid for 30 days</p>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
