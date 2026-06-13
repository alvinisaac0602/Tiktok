import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { trackEvent } from '../lib/analytics'
import { Spinner, ErrorCard } from '../components/UI'
import {
  ShoppingCart, Star, Shield, Truck, ChevronLeft,
  ChevronRight, Flame, Users, Share2, Heart, Store,
  MessageCircle, Phone
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
}

export default function StorePage() {
  const { storeSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const creatorRef = searchParams.get('ref')
  const targetProductId = searchParams.get('p')

  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [featuredProduct, setFeaturedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Featured product gallery state
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
    const loadStore = async () => {
      setLoading(true)
      setError(null)

      if (storeSlug === 'demo-store' || storeSlug === 'demo') {
        setVendor({
          id: 'demo-vendor',
          store_name: 'TechZone UG',
          store_slug: 'demo-store',
          store_description: 'Your ultimate destination for quality premium audio gear and smart devices in Kampala.',
          store_phone: '0771234567',
          store_whatsapp: '0771234567',
        })
        setProducts([
          { ...DEMO_PRODUCT, is_active: true },
          {
            id: 'demo-2',
            title: 'Active Noise Cancelling Headphones',
            price: 180000,
            images: ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80'],
            stock: 15,
            is_active: true,
          },
          {
            id: 'demo-3',
            title: 'Waterproof Smart Sports Watch',
            price: 120000,
            images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'],
            stock: 24,
            is_active: true,
          }
        ])
        setFeaturedProduct(DEMO_PRODUCT)
        setLoading(false)
        return
      }

      const lookupSlug = (storeSlug || '').toLowerCase().trim().replace(/\/$/, '')

      // Fetch Vendor Store details
      const { data: vendorData, error: vendorErr } = await supabase
        .from('vendors')
        .select('*')
        .eq('store_slug', lookupSlug)
        .eq('suspended', false)
        .single()

      if (vendorErr || !vendorData) {
        setError('Store not found or suspended.')
        setLoading(false)
        return
      }

      setVendor(vendorData)

      // Fetch all active products for this vendor
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      const activeProducts = prodData || []
      setProducts(activeProducts)

      // Determine featured product
      let featured = null
      if (targetProductId) {
        featured = activeProducts.find(p => p.id === targetProductId)
      }
      if (!featured && activeProducts.length > 0) {
        featured = activeProducts[0] // fallback to newest product
      }
      setFeaturedProduct(featured)
      setImgIndex(0)

      // Track page views and link clicks
      if (featured) {
        trackEvent({
          eventType: 'page_view',
          productId: featured.id,
          vendorId: vendorData.id,
          creatorRef: creatorRef || null,
        })
        if (creatorRef) {
          trackEvent({
            eventType: 'link_click',
            productId: featured.id,
            vendorId: vendorData.id,
            creatorRef,
          })
        }
      }

      setLoading(false)
    }

    loadStore()
  }, [storeSlug, targetProductId])

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

  const handleBuy = (prod) => {
    const params = creatorRef ? `?ref=${creatorRef}` : ''
    navigate(`/checkout/${prod.id}${params}`)
  }

  const selectProduct = (prod) => {
    const refParam = creatorRef ? `&ref=${creatorRef}` : ''
    navigate(`/store/${storeSlug}?p=${prod.id}${refParam}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const images = featuredProduct?.images?.length ? featuredProduct.images : [DEMO_PRODUCT.images[0]]
  const prevImg = () => setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const nextImg = () => setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="min-h-screen bg-slate-50 pb-32 page-enter">
      
      {/* Store Header Bio */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white px-4 py-8">
        <div className="max-w-lg mx-auto flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg">
            🏪
          </div>
          <div>
            <h1 className="font-display font-black text-2xl tracking-tight">{vendor?.store_name}</h1>
            {vendor?.store_description && (
              <p className="text-slate-300 text-xs mt-1.5 px-4 leading-relaxed max-w-sm">
                {vendor.store_description}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            {vendor?.store_phone && (
              <a href={`tel:${vendor.store_phone}`} className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-3.5 py-1.5 transition-all text-white/90">
                <Phone size={12} /> Call
              </a>
            )}
            {(vendor?.store_whatsapp || vendor?.store_phone) && (
              <a href={`https://wa.me/${(vendor.store_whatsapp || vendor.store_phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/20 rounded-full px-3.5 py-1.5 transition-all text-emerald-300">
                <MessageCircle size={12} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Featured / Selected Product Details */}
      {featuredProduct ? (
        <div className="max-w-lg mx-auto mt-4 space-y-4 px-4">
          
          {/* Image Gallery */}
          <div className="relative bg-black overflow-hidden rounded-3xl shadow-card" style={{ height: '55vw', maxHeight: 380 }}>
            <img
              src={images[imgIndex]}
              alt={featuredProduct.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={(e) => { e.target.src = DEMO_PRODUCT.images[0] }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Share + Like */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => navigator.share?.({ title: featuredProduct.title, url: window.location.href })}
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

            {/* Trending / Highlight tag */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              <Flame size={12} className="animate-bounce-sm" />
              Featured Product
            </div>
          </div>

          {/* Creator Referral attribution */}
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

          {/* Title & Price */}
          <div className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display font-bold text-xl text-slate-900 leading-tight flex-1">
                {featuredProduct.title}
              </h2>
              <div className="flex-shrink-0 text-right">
                <p className="text-2xl font-black text-brand-700">{formatUGX(featuredProduct.price)}</p>
                <p className="text-xs text-slate-400">per item</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Store size={12} />
                <span>Sold by {vendor?.store_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{featuredProduct.stock || 47} remaining in stock</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {featuredProduct.description && (
            <div className="card">
              <h3 className="font-semibold text-slate-800 mb-2 text-sm">Product Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{featuredProduct.description}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-lg mx-auto mt-10 px-4">
          <EmptyState icon="📦" title="No Products Available" subtitle="This store doesn't have any active products listed yet." />
        </div>
      )}

      {/* Vendor Store Catalog List */}
      <div className="max-w-lg mx-auto mt-6 px-4 space-y-4">
        <h3 className="font-display font-black text-lg text-slate-800 flex items-center gap-2">
          <span>🛍️ Shop Our Store</span>
          <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
            {products.length} Items
          </span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {products.map(prod => (
            <button
              key={prod.id}
              onClick={() => selectProduct(prod)}
              className={`card text-left p-2 overflow-hidden flex flex-col h-full border-2 transition-all ${
                featuredProduct?.id === prod.id
                  ? 'border-brand-500 ring-2 ring-brand-100 bg-brand-50/20'
                  : 'border-slate-100 hover:border-brand-300'
              }`}
            >
              <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 relative">
                {prod.images?.[0] ? (
                  <img src={prod.images[0]} alt={prod.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">📦</div>
                )}
                {featuredProduct?.id === prod.id && (
                  <span className="absolute top-2 left-2 bg-brand-600 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow">
                    Viewing
                  </span>
                )}
              </div>

              <div className="p-2 flex-1 flex flex-col justify-between mt-1.5">
                <p className="font-bold text-slate-900 text-sm leading-tight line-clamp-2">{prod.title}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <p className="font-black text-brand-700 text-sm">{formatUGX(prod.price)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="max-w-lg mx-auto mt-6 px-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Shield size={16} />, label: 'Secure\nPayment' },
            { icon: <Truck size={16} />, label: 'Fast\nDelivery' },
            { icon: <Star size={16} />, label: 'Top\nQuality' },
          ].map(({ icon, label }) => (
            <div key={label} className="card text-center py-3.5 space-y-1">
              <div className="flex justify-center text-brand-600">{icon}</div>
              <p className="text-xs text-slate-500 leading-tight whitespace-pre-line">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Buy Button for Featured Product */}
      {featuredProduct && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 py-4 safe-area-pb">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => handleBuy(featuredProduct)}
              className={`btn-primary w-full text-base py-4 rounded-2xl font-bold transition-transform ${pulse ? 'scale-[1.02]' : ''}`}
            >
              <ShoppingCart size={20} />
              Buy Now — {formatUGX(featuredProduct.price)}
            </button>
            <p className="text-center text-xs text-slate-400 mt-2">
              ⚡ Instant checkout · No account needed
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
