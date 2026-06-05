import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { signOut } from '../lib/supabase'

export function Navbar({ vendor, user }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isVendor = location.pathname.startsWith('/vendor')

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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          {isVendor && vendor && (
            <>
              <Link
                to="/vendor/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link
                to="/vendor/products"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
              >
                <ShoppingBag size={16} />
                Products
              </Link>
              <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                  {vendor.store_name?.[0]?.toUpperCase() || 'V'}
                </div>
                <span className="text-sm font-semibold text-slate-700">{vendor.store_name}</span>
                <button
                  onClick={handleSignOut}
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
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

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-2 animate-fade-in">
          {isVendor && vendor ? (
            <>
              <Link
                to="/vendor/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium text-slate-700"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 py-2 text-sm font-medium text-red-500"
              >
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
