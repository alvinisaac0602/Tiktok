import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { Spinner } from '../components/UI'
import { CheckCircle2, Clock, ArrowRight, Share2, Phone, Banknote } from 'lucide-react'

export default function ConfirmPage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('status') // 'success' | 'cod' | null
  const flwRef = searchParams.get('ref')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const isCOD     = paymentStatus === 'cod'
  const isSuccess = paymentStatus === 'success'

  useEffect(() => {
    const load = async () => {
      if (!orderId || orderId.startsWith('demo')) {
        setOrder({
          id: 'demo', customer_phone: '0771234567', total_amount: 85000,
          quantity: 1, payment_method: isCOD ? 'cod' : 'online',
          status: isCOD ? 'pending_cod' : 'paid',
          customer_location_zone: 'Kampala Central',
          products: { title: 'Premium Wireless Earbuds Pro' },
          vendors: { store_name: 'Demo Store', store_slug: 'demo-store' }
        })
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('orders').select('*, products(title, images), vendors(store_name, store_phone, store_whatsapp, store_slug)')
        .eq('id', orderId).single()
      setOrder(data)
      setLoading(false)
    }
    load()

    // Poll for status update if online payment (webhook may update separately)
    if (isSuccess && orderId && !orderId.startsWith('demo')) {
      const interval = setInterval(async () => {
        const { data } = await supabase.from('orders').select('status').eq('id', orderId).single()
        if (data?.status === 'paid') { setOrder(o => ({ ...o, status: 'paid' })); clearInterval(interval) }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [orderId, paymentStatus])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>

  const isPaid = order?.status === 'paid' || isSuccess
  const isCodOrder = order?.payment_method === 'cod' || isCOD

  const vendorWhatsapp = order?.vendors?.store_whatsapp || order?.vendors?.store_phone
  const waLink = vendorWhatsapp
    ? `https://wa.me/${vendorWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! I placed an order for ${order?.products?.title || 'your product'}. Order ref: ${orderId?.slice(0,8)}`)}`
    : null

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 page-enter">
      <div className="w-full max-w-md space-y-5">

        {/* Status card */}
        <div className="card text-center space-y-4 py-10">
          {isCodOrder ? (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center animate-fade-in">
                  <Banknote size={44} className="text-amber-500" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900">Order Confirmed! 🎉</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  Your order is placed. The vendor will call you to confirm and arrange delivery.
                  Pay cash when your order arrives.
                </p>
              </div>
            </>
          ) : isPaid ? (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-fade-in">
                  <CheckCircle2 size={44} className="text-emerald-500" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900">Payment Confirmed! ✅</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  Your payment went through. The vendor has been notified and will process your order.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock size={44} className="text-amber-500 animate-pulse-slow" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900">Awaiting Confirmation</h1>
                <p className="text-slate-500 text-sm mt-1.5">Payment confirmation in progress. This updates automatically.</p>
              </div>
            </>
          )}
        </div>

        {/* Order details */}
        {order && (
          <div className="card space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Product</span>
                <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">
                  {order.products?.title || 'Your Order'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Quantity</span>
                <span className="font-semibold text-slate-800">{order.quantity || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-bold text-brand-700 text-base">{formatUGX(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className={`font-semibold text-sm ${isCodOrder ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {isCodOrder ? '💵 Cash on Delivery' : '💳 Paid Online'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-semibold text-slate-800">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-800">{order.customer_location_zone}</span>
              </div>
              {flwRef && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Ref</span>
                  <span className="font-mono text-xs text-slate-600 truncate max-w-[60%]">{flwRef}</span>
                </div>
              )}
            </div>

            <div className={`mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-center ${
              isCodOrder ? 'bg-amber-50 text-amber-700'
              : isPaid   ? 'bg-emerald-50 text-emerald-700'
                         : 'bg-amber-50 text-amber-700'
            }`}>
              {isCodOrder ? '🚚 Cash on Delivery — Vendor will contact you'
               : isPaid   ? '✅ Payment Successful'
                          : '⏳ Awaiting Confirmation…'}
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What Happens Next?</p>
          {(isCodOrder ? [
            { step: '1', text: 'Vendor calls you on your phone to confirm the order' },
            { step: '2', text: 'Vendor arranges delivery to your location' },
            { step: '3', text: 'Pay cash when order arrives — inspect before paying' },
          ] : [
            { step: '1', text: 'Vendor receives your order & payment notification instantly' },
            { step: '2', text: 'Vendor contacts you on your phone number to confirm delivery' },
            { step: '3', text: 'Delivery arranged directly with vendor' },
          ]).map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
            <p className="text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full bg-emerald-500 hover:bg-emerald-600 from-emerald-500 to-emerald-600 justify-center">
              <Phone size={16} /> Chat Vendor on WhatsApp
            </a>
          )}
          <button
            onClick={() => navigator.share?.({ title: 'Check out this product!', url: window.location.origin + `/b/${order?.product_id || 'demo'}` })}
            className="btn-secondary w-full">
            <Share2 size={16} /> Share This Product
          </button>
          <Link to={`/store/${order?.vendors?.store_slug || 'demo-store'}`} className="btn-primary w-full">
            Shop More <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          {isCodOrder
            ? `Vendor will call ${order?.customer_phone || 'your number'} to confirm.`
            : `Questions? Contact the vendor directly on ${order?.customer_phone || 'your phone'}`
          }
        </p>
      </div>
    </div>
  )
}
