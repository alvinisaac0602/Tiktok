import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { Spinner, ErrorCard } from '../components/UI'
import {
  ShoppingCart, Star, Shield, Truck, ChevronLeft,
  ChevronRight, Flame, Users, Share2, Heart
} from 'lucide-react'

const DEMO_PRODUCT = {
  id: 'demo',
  title: 'Premium Wireless Earbuds Pro',
  description: 'Experience crystal-clear sound with our latest TWS earbuds. Noise cancellation, 30hr battery life, and IPX5 waterproof rating. Perfect for workouts and daily use.',
  price: 85000,
  images: [
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
  ],
  stock: 47,
  vendors: { store_name: 'TechZone UG' },
}

export default function ProductPage() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const creatorRef = searchParams.get('ref')

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imgIndex, setImgIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    // Pulse the buy button periodically
    const t = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 700)
    }, 4000)
    return () => clearInterval(t)
  }, [])

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
        .eq('is_active', true)
        .single()

      if (error || !data) setError('Product not found.')
      else setProduct(data)
      setLoading(false)
    }
    load()
  }, [productId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
  if (error) return (
    <div className="max-w-md mx-auto p-6 mt-20">
      <ErrorCard message={error} />
    </div>
  )

  const images = product.images?.length ? product.images : [DEMO_PRODUCT.images[0]]
  const handleBuy = () => {
    const params = creatorRef ? `?ref=${creatorRef}` : ''
    navigate(`/checkout/${product.id}${params}`)
  }

  const prevImg = () => setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const nextImg = () => setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="min-h-screen bg-slate-50 pb-32 page-enter">
      {/* Image Gallery */}
      <div className="relative bg-black overflow-hidden" style={{ height: '55vw', maxHeight: 420 }}>
        <img
          src={images[imgIndex]}
          alt={product.title}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => { e.target.src = DEMO_PRODUCT.images[0] }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Share + Like */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => navigator.share?.({ title: product.title, url: window.location.href })}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all"
          >
            <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : 'white'} />
          </button>
        </div>

        {/* Image nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center">
              <ChevronLeft size={18} />
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center">
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={`rounded-full transition-all ${i === imgIndex ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}

        {/* Trending badge */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          <Flame size={12} className="animate-bounce-sm" />
          Trending Now
        </div>
      </div>

      {/* Product Info */}
      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">

        {/* Creator attribution */}
        {creatorRef && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-accent-50 to-brand-50 border border-accent-100 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-brand-500 flex items-center justify-center text-white text-xs font-bold">
              @
            </div>
            <div>
              <p className="text-xs text-slate-500">Recommended by</p>
              <p className="text-sm font-bold text-accent-700">@{creatorRef}</p>
            </div>
          </div>
        )}

        {/* Title & price */}
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display font-bold text-xl text-slate-900 leading-tight flex-1">
              {product.title}
            </h1>
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-black text-brand-700">{formatUGX(product.price)}</p>
              <p className="text-xs text-slate-400">per item</p>
            </div>
          </div>

          {/* Vendor + stock */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white text-xs font-bold">
                {product.vendors?.store_name?.[0] || 'S'}
              </div>
              <span className="text-sm font-semibold text-slate-700">{product.vendors?.store_name || 'Vendor'}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Users size={12} />
              <span>{product.stock || 47} left in stock</span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={14} className="fill-amber-400 text-amber-400" />
          ))}
          <span className="text-sm text-slate-500 ml-1">4.8 (238 reviews)</span>
        </div>

        {/* Description */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-2 text-sm">Product Details</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Shield size={16} />, label: 'Secure\nPayment' },
            { icon: <Truck size={16} />, label: 'Fast\nDelivery' },
            { icon: <Star size={16} />, label: 'Top\nQuality' },
          ].map(({ icon, label }) => (
            <div key={label} className="card text-center py-3 space-y-1">
              <div className="flex justify-center text-brand-600">{icon}</div>
              <p className="text-xs text-slate-500 leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Buy Button */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-4 safe-area-pb">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleBuy}
            className={`btn-primary w-full text-base py-4 rounded-2xl font-bold transition-transform ${pulse ? 'scale-[1.02]' : ''}`}
          >
            <ShoppingCart size={20} />
            Buy Now — {formatUGX(product.price)}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            ⚡ Instant checkout · No account needed
          </p>
        </div>
      </div>
    </div>
  )
}
