import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { Spinner } from '../components/UI'
import { CheckCircle2, XCircle, Clock, ArrowRight, Share2 } from 'lucide-react'

export default function ConfirmPage() {
  const { orderId } = useParams()
  const [searchParams] = useSearchParams()
  const paymentStatus = searchParams.get('status')
  const flwRef = searchParams.get('ref')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!orderId || orderId === 'demo') {
        setOrder({
          id: 'demo',
          customer_phone: '0771234567',
          total_amount: 85000,
          quantity: 1,
          status: paymentStatus === 'success' ? 'paid' : 'pending_payment',
          customer_location_zone: 'Kampala Central',
          products: { title: 'Premium Wireless Earbuds Pro' },
        })
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('orders')
        .select('*, products(title, images)')
        .eq('id', orderId)
        .single()
      setOrder(data)
      setLoading(false)
    }
    load()

    // Poll for status update if pending
    if (paymentStatus === 'success') {
      const interval = setInterval(async () => {
        const { data } = await supabase
          .from('orders')
          .select('status')
          .eq('id', orderId)
          .single()
        if (data?.status === 'paid') {
          setOrder((o) => ({ ...o, status: 'paid' }))
          clearInterval(interval)
        }
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [orderId, paymentStatus])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  const isPaid = order?.status === 'paid' || paymentStatus === 'success'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 page-enter">
      <div className="w-full max-w-md space-y-5">

        {/* Status card */}
        <div className="card text-center space-y-4 py-10">
          {isPaid ? (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-fade-in">
                  <CheckCircle2 size={44} className="text-emerald-500" />
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900">Payment Confirmed!</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  Your order has been placed and the vendor has been notified.
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
                <h1 className="font-display font-bold text-2xl text-slate-900">Order Received</h1>
                <p className="text-slate-500 text-sm mt-1.5">
                  Awaiting payment confirmation. This updates automatically.
                </p>
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
                <span className="text-slate-500">Total Paid</span>
                <span className="font-bold text-brand-700 text-base">{formatUGX(order.total_amount)}</span>
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

            {/* Status badge */}
            <div className={`mt-2 px-4 py-2 rounded-xl text-sm font-semibold text-center ${
              isPaid
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {isPaid ? '✅ Payment Successful' : '⏳ Awaiting Confirmation…'}
            </div>
          </div>
        )}

        {/* What's next */}
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">What Happens Next?</p>
          {[
            { step: '1', text: 'Vendor receives your order instantly' },
            { step: '2', text: 'Vendor contacts you on your phone number' },
            { step: '3', text: 'Delivery arranged directly with vendor' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <p className="text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigator.share?.({
              title: 'Check out this product!',
              url: window.location.origin + `/p/${order?.product_id || 'demo'}`,
            })}
            className="btn-secondary w-full"
          >
            <Share2 size={16} /> Share This Product
          </button>
          <Link to="/p/demo" className="btn-primary w-full">
            Shop More <ArrowRight size={16} />
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          Questions? Contact the vendor directly on {order?.customer_phone || 'your phone'}
        </p>
      </div>
    </div>
  )
}
