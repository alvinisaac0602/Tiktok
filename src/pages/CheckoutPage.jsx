import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { initiatePayment, formatUGX } from '../lib/flutterwave'
import { Spinner, ErrorCard } from '../components/UI'
import toast from 'react-hot-toast'
import {
  Phone, User, MapPin, Navigation, Minus, Plus,
  ChevronLeft, Lock, Zap, AlertCircle
} from 'lucide-react'

const LOCATION_ZONES = [
  'Kampala Central',
  'Nakawa Division',
  'Kawempe Division',
  'Makindye Division',
  'Rubaga Division',
  'Wakiso (Entebbe Rd)',
  'Wakiso (Gayaza Rd)',
  'Wakiso (Hoima Rd)',
  'Mukono',
  'Jinja',
  'Mbarara',
  'Gulu',
  'Mbale',
  'Masaka',
  'Fort Portal',
  'Other (specify in landmark)',
]

const DEMO_PRODUCT = {
  id: 'demo',
  title: 'Premium Wireless Earbuds Pro',
  price: 85000,
  images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&q=80'],
  vendor_id: 'demo-vendor',
  vendors: { store_name: 'TechZone UG' },
}

export default function CheckoutPage() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const creatorRef = searchParams.get('ref')

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [qty, setQty] = useState(1)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_location_zone: '',
    customer_location_detail: '',
    customer_lat: null,
    customer_lng: null,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const load = async () => {
      if (productId === 'demo') {
        setProduct(DEMO_PRODUCT)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('products')
        .select('*, vendors(store_name)')
        .eq('id', productId)
        .single()
      if (error || !data) {
        setProduct(DEMO_PRODUCT) // fallback gracefully
      } else {
        setProduct(data)
      }
      setLoading(false)
    }
    load()
  }, [productId])

  const validate = () => {
    const e = {}
    if (!form.customer_phone.trim()) e.customer_phone = 'Phone number is required'
    else if (!/^(\+?256|0)[0-9]{9}$/.test(form.customer_phone.replace(/\s/g, '')))
      e.customer_phone = 'Enter a valid Uganda phone number'
    if (!form.customer_location_zone) e.customer_location_zone = 'Please select your location zone'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          customer_lat: pos.coords.latitude,
          customer_lng: pos.coords.longitude,
        }))
        setGpsLoading(false)
        toast.success('📍 Location captured!')
      },
      () => {
        setGpsLoading(false)
        toast.error('Could not get location. Please enter manually.')
      },
      { timeout: 10000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    try {
      const total_amount = product.price * qty
      const phone = form.customer_phone.replace(/\s/g, '')

      // 1. Create order in Supabase (status: pending_payment)
      let orderId = `order_${Date.now()}`
      let orderData = null

      if (productId !== 'demo') {
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            product_id: product.id,
            vendor_id: product.vendor_id,
            creator_id: creatorRef || null,
            customer_name: form.customer_name || null,
            customer_phone: phone,
            quantity: qty,
            total_amount,
            status: 'pending_payment',
            customer_location_zone: form.customer_location_zone,
            customer_location_detail: form.customer_location_detail || null,
            customer_lat: form.customer_lat,
            customer_lng: form.customer_lng,
          })
          .select()
          .single()

        if (orderError) throw orderError
        orderId = order.id
        orderData = order

        // 2. Create pending payment record
        await supabase.from('payments').insert({
          order_id: orderId,
          status: 'pending',
        })
      }

      // 3. Initiate Flutterwave payment
      await initiatePayment({
        txRef: orderId,
        amount: total_amount,
        phone,
        name: form.customer_name || 'TikTok Customer',
        description: `Order: ${product.title}`,
        onSuccess: (response) => {
          setSubmitting(false)
          navigate(`/confirm/${orderId}?status=success&ref=${response.flw_ref || ''}`)
        },
        onClose: () => {
          setSubmitting(false)
          toast('Payment cancelled. Your order is saved.', { icon: '💛' })
        },
      })
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: null }))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  const total = product ? product.price * qty : 0

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-700 to-brand-500 text-white px-4 pt-5 pb-8">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4">
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="font-display font-bold text-xl">Checkout</h1>
          <p className="text-brand-200 text-sm mt-0.5">Complete your order in seconds</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 pb-10 space-y-4">
        {/* Order summary card */}
        <div className="card shadow-card-hover">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Order Summary</p>
          <div className="flex items-center gap-3">
            <img
              src={product?.images?.[0] || DEMO_PRODUCT.images[0]}
              alt={product?.title}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-100"
              onError={(e) => { e.target.src = DEMO_PRODUCT.images[0] }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-tight truncate">{product?.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{product?.vendors?.store_name}</p>
              <p className="text-brand-600 font-bold mt-1">{formatUGX(product?.price)}</p>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <span className="text-sm font-semibold text-slate-700">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-brand-400 hover:text-brand-600 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="text-lg font-bold w-6 text-center text-slate-900">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-xl border-2 border-brand-300 bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-xl font-black text-brand-700">{formatUGX(total)}</span>
          </div>
        </div>

        {/* Checkout form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Details</p>

            {/* Name (optional) */}
            <div>
              <label className="label">
                <User size={13} className="inline mr-1" />
                Your Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={set('customer_name')}
                placeholder="e.g. Aisha Nakato"
                className="input"
                autoComplete="name"
              />
            </div>

            {/* Phone (required) */}
            <div>
              <label className="label">
                <Phone size={13} className="inline mr-1" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.customer_phone}
                onChange={set('customer_phone')}
                placeholder="e.g. 0771234567"
                className={`input ${errors.customer_phone ? 'border-red-300 ring-1 ring-red-200' : ''}`}
                autoComplete="tel"
                inputMode="tel"
              />
              {errors.customer_phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />{errors.customer_phone}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">MTN or Airtel number for mobile money</p>
            </div>
          </div>

          {/* Location */}
          <div className="card space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivery Location</p>

            {/* Location zone (required) */}
            <div>
              <label className="label">
                <MapPin size={13} className="inline mr-1" />
                Location Zone <span className="text-red-500">*</span>
              </label>
              <select
                value={form.customer_location_zone}
                onChange={set('customer_location_zone')}
                className={`input bg-white appearance-none ${errors.customer_location_zone ? 'border-red-300 ring-1 ring-red-200' : ''}`}
              >
                <option value="">Select your area…</option>
                {LOCATION_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {errors.customer_location_zone && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />{errors.customer_location_zone}
                </p>
              )}
            </div>

            {/* Landmark (optional) */}
            <div>
              <label className="label">
                <MapPin size={13} className="inline mr-1" />
                Landmark / Street <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.customer_location_detail}
                onChange={set('customer_location_detail')}
                placeholder="e.g. Next to Nakumatt, Opp. Shell"
                className="input"
              />
            </div>

            {/* GPS button */}
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsLoading}
              className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors"
            >
              {gpsLoading
                ? <Spinner size="sm" />
                : <Navigation size={15} className="text-brand-500" />
              }
              {form.customer_lat
                ? `✅ GPS location saved (${form.customer_lat.toFixed(4)}, ${form.customer_lng.toFixed(4)})`
                : 'Use My GPS Location (optional)'
              }
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
            <Lock size={12} />
            <span>Your payment is secured by Flutterwave. We accept MTN, Airtel, and cards.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-4 text-base font-bold rounded-2xl"
          >
            {submitting ? (
              <><Spinner size="sm" /> Processing…</>
            ) : (
              <><Zap size={18} /> Pay {formatUGX(total)} Now</>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            By proceeding, you agree to our terms of service
          </p>
        </form>
      </div>
    </div>
  )
}
