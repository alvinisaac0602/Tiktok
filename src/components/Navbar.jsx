import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, LayoutDashboard, LogOut, Menu, X, BarChart2, Bell, Volume2, VolumeX, Play } from 'lucide-react'
import { useState } from 'react'
import { signOut } from '../lib/supabase'
import { useVendorNotifications } from '../context/VendorNotificationContext'
import toast from 'react-hot-toast'

export function Navbar({ vendor }) {
  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isVendor = location.pathname.startsWith('/vendor')

  const {
    notifications,
    unreadCount,
    soundEnabled,
    pushEnabled,
    markAsRead,
    markAllAsRead,
    toggleSound,
    togglePush,
    triggerTestChime
  } = useVendorNotifications()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/vendor/login'
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-brand-700 text-lg">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white text-sm">🛍</span>
          <span className="hidden sm:block">TikShop</span>
        </Link>

        {/* Right Nav Container (contains notifications on both desktop & mobile) */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isVendor && vendor && (
            <div className="relative">
              {/* Notification Bell Icon */}
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-xl transition-all ${
                  notifOpen 
                    ? 'bg-brand-50 text-brand-600' 
                    : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                }`}
                title="Notifications"
              >
                <Bell size={20} className={unreadCount > 0 ? 'animate-swing' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {notifOpen && (
                <>
                  {/* Backdrop to catch clicks outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up flex flex-col max-h-[420px]">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <span className="text-xs font-bold text-slate-800">
                        Alert Center ({unreadCount} New)
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => { markAllAsRead(); toast.success('All marked as read'); }}
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-700 transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notification Items List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[220px] no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 space-y-1">
                          <span className="text-2xl">📭</span>
                          <p className="text-xs font-semibold">No recent order alerts</p>
                          <p className="text-[10px] text-slate-400">Updates will pop up here in real-time</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id)
                              setNotifOpen(false)
                              navigate('/vendor/dashboard', { state: { expandOrderId: n.orderId } })
                            }}
                            className={`p-3 hover:bg-slate-50 cursor-pointer flex gap-3 items-start transition-colors ${
                              !n.read ? 'bg-brand-50/20' : ''
                            }`}
                          >
                            <div className="mt-1 flex-shrink-0">
                              <span className={`block w-2 h-2 rounded-full ${!n.read ? 'bg-brand-500' : 'bg-slate-200'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{n.productTitle}</p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                UGX {n.amount.toLocaleString()} • {n.customerName}
                              </p>
                              <p className="text-[9px] text-slate-400 mt-1 font-medium">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Alert Control Settings */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          🔊 Sound Chime
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                          className={`p-1 rounded-lg transition-colors ${
                            soundEnabled ? 'text-brand-600 hover:bg-brand-100/50' : 'text-slate-400 hover:bg-slate-200/50'
                          }`}
                        >
                          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          🖥️ Desktop Alerts
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); togglePush(); }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            pushEnabled 
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {pushEnabled ? 'Active' : 'Enable'}
                        </button>
                      </div>

                      <div className="pt-1.5 flex justify-center border-t border-slate-200/60">
                        <button
                          onClick={(e) => { e.stopPropagation(); triggerTestChime(); }}
                          className="text-[9px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Play size={8} fill="currentColor" /> Test sound chime
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-4">
            {isVendor && vendor && (
              <>
                <Link to="/vendor/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                  <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/vendor/products"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                  <ShoppingBag size={16} /> Products
                </Link>
                <Link to="/vendor/analytics"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors">
                  <BarChart2 size={16} /> Analytics
                </Link>
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                    {vendor.store_name?.[0]?.toUpperCase() || 'V'}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{vendor.store_name}</span>
                  <button onClick={handleSignOut}
                    className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Sign out">
                    <LogOut size={15} />
                  </button>
                </div>
              </>
            )}
            {!isVendor && (
              <Link
                to="/vendor/login"
                className="btn-secondary text-sm py-2 px-4"
              >
                Vendor Login
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 animate-fade-in">
          {isVendor && vendor ? (
            <>
              <Link to="/vendor/dashboard" onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/vendor/products" onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700">
                <ShoppingBag size={16} /> Products
              </Link>
              <Link to="/vendor/analytics" onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700">
                <BarChart2 size={16} /> Analytics
              </Link>
              <button onClick={handleSignOut}
                className="flex items-center gap-2 py-2 text-sm font-medium text-red-500 w-full text-left">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/vendor/login"
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-brand-600"
            >
              Vendor Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

