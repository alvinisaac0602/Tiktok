import React from 'react'

/**
 * Status badge for order status
 */
export function StatusBadge({ status }) {
  const map = {
    paid:            { label: '✅ Paid',           cls: 'badge-paid' },
    pending_payment: { label: '⏳ Awaiting Payment', cls: 'badge-pending' },
    pending_cod:     { label: '🚚 Cash on Delivery', cls: 'badge bg-amber-100 text-amber-700' },
    processing:      { label: '🔄 Processing',     cls: 'badge-processing' },
    dispatched:      { label: '📦 Dispatched',     cls: 'badge bg-indigo-100 text-indigo-700' },
    cancelled:       { label: '❌ Cancelled',      cls: 'badge bg-slate-100 text-slate-500' },
    failed:          { label: '💔 Failed',         cls: 'badge-failed' },
  }
  const item = map[status] || { label: status, cls: 'badge bg-slate-100 text-slate-600' }
  return <span className={item.cls}>{item.label}</span>
}


/**
 * Spinner loader
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizes[size]} border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin ${className}`}
    />
  )
}

/**
 * Full-page loader
 */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Spinner size="lg" className="mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading…</p>
      </div>
    </div>
  )
}

/**
 * Error display card
 */
export function ErrorCard({ message = 'Something went wrong.' }) {
  return (
    <div className="card border-red-100 bg-red-50 text-red-700 text-sm font-medium">
      ⚠️ {message}
    </div>
  )
}

/**
 * Empty state placeholder
 */
export function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <span className="text-5xl">{icon}</span>
      <p className="font-semibold text-slate-700 text-lg">{title}</p>
      {subtitle && <p className="text-slate-400 text-sm max-w-xs">{subtitle}</p>}
    </div>
  )
}

/**
 * Stat card for dashboard
 */
export function StatCard({ label, value, icon, color = 'blue', sub }) {
  const colors = {
    blue:   'from-brand-600 to-brand-400',
    green:  'from-emerald-600 to-emerald-400',
    purple: 'from-purple-600 to-purple-400',
    orange: 'from-orange-500 to-orange-400',
  }
  return (
    <div className="card-hover flex items-start gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-lg sm:text-xl shadow-sm flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 hidden sm:block">{sub}</p>}
      </div>
    </div>
  )
}

/**
 * New order toast notification (realtime)
 */
export function NewOrderToast({ order, onDismiss }) {
  if (!order) return null
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-up">
      <div className="card border-emerald-200 bg-emerald-50 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎉</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-emerald-800 text-sm">New Order!</p>
            <p className="text-emerald-700 text-xs mt-0.5 truncate">
              {order.customer_phone} • UGX {order.total_amount?.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-emerald-400 hover:text-emerald-600 text-lg leading-none"
          >×</button>
        </div>
      </div>
    </div>
  )
}
