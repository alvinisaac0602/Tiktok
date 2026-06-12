import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { useVendorAuth } from '../hooks/useRealtimeOrders'
import { Spinner, PageLoader, EmptyState } from '../components/UI'
import { Navbar } from '../components/Navbar'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X,
  Image, DollarSign, Package, Tag, Save, Link2,
  Copy, Share2, AtSign, ChevronDown, ChevronUp,
  Upload, ImagePlus, GripVertical
} from 'lucide-react'

const BUCKET = 'product-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * Upload a single file to Supabase Storage and return the public URL.
 */
async function uploadImage(file, vendorId) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${vendorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}

/* ─── Image Upload Zone ─────────────────────────────────────────── */
function ImageUploadZone({ images, onChange, vendorId }) {
  const fileRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const processFiles = useCallback(async (files) => {
    const validFiles = []
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        toast.error(`${f.name}: Only JPG, PNG, WebP, GIF allowed`)
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: File too large (max 5MB)`)
        continue
      }
      validFiles.push(f)
    }
    if (validFiles.length === 0) return

    setUploading(true)
    const newUrls = []
    for (const file of validFiles) {
      try {
        const url = await uploadImage(file, vendorId)
        newUrls.push(url)
      } catch (err) {
        console.error('Upload failed:', err)
        toast.error(`Failed to upload ${file.name}: ${err.message}`)
      }
    }
    if (newUrls.length > 0) {
      onChange([...images, ...newUrls])
      toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded`)
    }
    setUploading(false)
  }, [images, onChange, vendorId])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.length) processFiles(Array.from(e.dataTransfer.files))
  }, [processFiles])

  const handleFileSelect = (e) => {
    if (e.target.files?.length) processFiles(Array.from(e.target.files))
    e.target.value = '' // reset so same file can be re-selected
  }

  const removeImage = (idx) => {
    onChange(images.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <label className="label"><Image size={13} className="inline mr-1" />Product Images</label>

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" onError={e => { e.target.src = ''; e.target.style.background = '#f1f5f9' }} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-brand-600 text-white px-1.5 py-0.5 rounded-md shadow">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-brand-400 bg-brand-50 scale-[1.01]'
            : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Spinner size="sm" />
            <p className="text-sm font-semibold text-brand-600">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center">
              <ImagePlus size={22} className="text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {dragOver ? 'Drop images here' : 'Tap to add photos'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">or drag & drop · JPG, PNG, WebP · max 5MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Product Form Modal ────────────────────────────────────────── */
function ProductModal({ product, vendorId, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    is_active: product?.is_active ?? true,
  })
  const [images, setImages] = useState(product?.images || [])
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price) { toast.error('Title and price are required'); return }
    setSaving(true)
    if (!vendorId) {
      toast.error('Vendor profile not loaded. Refresh the page and try again.')
      setSaving(false)
      return
    }
    const payload = {
      vendor_id: vendorId, title: form.title, description: form.description,
      price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
      images: images.filter(Boolean),
      is_active: form.is_active,
    }
    try {
      let res
      if (isEdit) {
        res = await supabase.from('products').update(payload).eq('id', product.id).select().maybeSingle()
      } else {
        res = await supabase.from('products').insert(payload).select().maybeSingle()
      }

      if (res.error) {
        console.error('Product save error:', res.error)
        toast.error('Failed to save product: ' + (res.error.message || JSON.stringify(res.error)))
      } else {
        toast.success(isEdit ? 'Product updated!' : 'Product created!')
        onSaved()
      }
    } catch (err) {
      console.error('Unexpected product save error:', err)
      toast.error(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display font-bold text-lg text-slate-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="label"><Tag size={13} className="inline mr-1" />Product Title *</label>
            <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. Premium Wireless Earbuds" className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={set('description')} placeholder="Describe your product…" rows={3} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label"><DollarSign size={13} className="inline mr-1" />Price (UGX) *</label>
              <input type="number" value={form.price} onChange={set('price')} placeholder="85000" min="0" className="input" />
            </div>
            <div>
              <label className="label"><Package size={13} className="inline mr-1" />Stock</label>
              <input type="number" value={form.stock} onChange={set('stock')} placeholder="50" min="0" className="input" />
            </div>
          </div>

          {/* Image upload zone */}
          <ImageUploadZone images={images} onChange={setImages} vendorId={vendorId} />

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {form.is_active ? 'Active (visible to customers)' : 'Inactive (hidden)'}
            </span>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">
            {saving ? <Spinner size="sm" /> : <Save size={16} />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Creator Link Generator ────────────────────────────────────── */
function LinkGenerator({ product, storeSlug }) {
  const [open, setOpen] = useState(false)
  const [creator, setCreator] = useState('')
  const base = storeSlug
    ? `${window.location.origin}/store/${storeSlug}?p=${product.id}`
    : `${window.location.origin}/p/${product.id}`
  const link = creator.trim() ? `${base}&ref=${creator.trim().replace('@', '')}` : base

  const copyLink = () => {
    navigator.clipboard.writeText(link)
    toast.success('Link copied!')
  }

  const shareWhatsApp = () => {
    const msg = `🛍️ Check out *${product.title}* — ${formatUGX(product.price)}\n\nBuy here: ${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const shareTikTok = () => {
    navigator.clipboard.writeText(link)
    toast.success('Link copied! Paste it in your TikTok bio or video description.')
  }

  return (
    <div className="mt-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
        <Link2 size={13} /> Generate Creator Link {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div className="mt-3 bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100 animate-fade-in">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1">
              <AtSign size={12} /> Creator TikTok Handle <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input type="text" value={creator} onChange={e => setCreator(e.target.value)}
              placeholder="e.g. @myhandle or myhandle"
              className="input text-sm py-2" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-400 mb-1">Shareable Link:</p>
            <p className="font-mono text-xs text-slate-700 break-all">{link}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-50 transition-colors">
              <Copy size={13} /> Copy Link
            </button>
            <button onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors">
              <Share2 size={13} /> WhatsApp
            </button>
            <button onClick={shareTikTok}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors">
              🎵 TikTok
            </button>
          </div>
          <p className="text-xs text-slate-400">
            When viewers click this link and buy, the creator earns a 5% commission tracked automatically.
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function VendorProducts() {
  const navigate = useNavigate()
  const { vendor, user, loading: authLoading } = useVendorAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalProduct, setModalProduct] = useState(undefined) // undefined=closed, null=new, obj=edit

  useEffect(() => { if (!authLoading && !user) navigate('/vendor/login') }, [authLoading, user])
  useEffect(() => { if (vendor?.id) fetchProducts() }, [vendor?.id])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*')
      .eq('vendor_id', vendor.id).order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching products:', error)
      try { toast.error('Failed to load products: ' + (error.message || JSON.stringify(error))) } catch (e) {}
      setProducts([])
      setLoading(false)
      return
    }
    setProducts(data || [])
    setLoading(false)
  }

  const toggleActive = async (product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    setProducts(ps => ps.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    toast.success(product.is_active ? 'Product hidden' : 'Product activated')
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(ps => ps.filter(p => p.id !== id))
    toast.success('Product deleted')
  }

  if (authLoading) return <PageLoader />

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      {modalProduct !== undefined && (
        <ProductModal product={modalProduct} vendorId={vendor?.id}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => { setModalProduct(undefined); fetchProducts() }} />
      )}
      <Navbar vendor={vendor} user={user} />

      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-brand-300 text-sm">Product Management</p>
            <h1 className="font-display font-bold text-2xl">{vendor?.store_name}</h1>
          </div>
          <button onClick={() => setModalProduct(null)} className="btn-primary bg-white/20 border border-white/30 hover:bg-white/30 shadow-none">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-10">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="card mt-4">
            <EmptyState icon="📦" title="No products yet"
              subtitle="Create your first product and generate a creator link to share on TikTok!" />
            <div className="flex justify-center mt-4">
              <button onClick={() => { if (!vendor?.id) { toast.error('Vendor profile not loaded yet. Refresh the page and try again.') ; return } setModalProduct(null) }} className="btn-primary">
                <Plus size={16} /> Add Your First Product
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 mt-4">
            {products.map(product => (
              <div key={product.id} className={`card transition-all ${!product.is_active ? 'opacity-60' : ''}`}>
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-16 h-32 sm:h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                    {product.images?.[0]
                      ? <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }} />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{product.title}</p>
                      {!product.is_active && <span className="badge bg-slate-100 text-slate-500 text-xs">Hidden</span>}
                    </div>
                    <p className="text-brand-700 font-bold">{formatUGX(product.price)}</p>
                    <p className="text-xs text-slate-400">Stock: {product.stock} · {product.images?.length || 0} photos</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 ml-auto sm:ml-0">
                    <button onClick={() => toggleActive(product)} title={product.is_active ? 'Hide' : 'Show'}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                      {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => setModalProduct(product)} title="Edit"
                      className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} title="Delete"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Creator Link Generator */}
                <LinkGenerator product={product} storeSlug={vendor?.store_slug} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
