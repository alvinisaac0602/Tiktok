import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatUGX } from '../lib/flutterwave'
import { useVendorAuth } from '../hooks/useRealtimeOrders'
import { Spinner, PageLoader, EmptyState, ErrorCard } from '../components/UI'
import { Navbar } from '../components/Navbar'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, X,
  Image, DollarSign, Package, Tag, Save, Link2
} from 'lucide-react'

function ProductModal({ product, vendorId, onClose, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    title: product?.title || '',
    description: product?.description || '',
    price: product?.price || '',
    stock: product?.stock || '',
    images: product?.images?.join('\n') || '',
    is_active: product?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title || !form.price) {
      toast.error('Title and price are required')
      return
    }
    setSaving(true)
    const payload = {
      vendor_id: vendorId,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      images: form.images.split('\n').map((u) => u.trim()).filter(Boolean),
      is_active: form.is_active,
    }
    const { error } = isEdit
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    if (error) {
      toast.error('Failed to save product')
    } else {
      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      onSaved()
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-display font-bold text-lg text-slate-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="label"><Tag size={13} className="inline mr-1" />Product Title *</label>
            <input type="text" value={form.title} onChange={set('title')}
              placeholder="e.g. Premium Wireless Earbuds" className="input" />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={set('description')}
              placeholder="Describe your product…" rows={3}
              className="input resize-none" />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label"><DollarSign size={13} className="inline mr-1" />Price (UGX) *</label>
              <input type="number" value={form.price} onChange={set('price')}
                placeholder="85000" min="0" className="input" />
            </div>
            <div>
              <label className="label"><Package size={13} className="inline mr-1" />Stock</label>
              <input type="number" value={form.stock} onChange={set('stock')}
                placeholder="50" min="0" className="input" />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="label"><Image size={13} className="inline mr-1" />Image URLs (one per line)</label>
            <textarea value={form.images} onChange={set('images')}
              placeholder={'https://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
              rows={3} className="input resize-none font-mono text-xs" />
            <p className="text-xs text-slate-400 mt-1">Use direct image links (Unsplash, Cloudinary, etc.)</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-brand-500' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {form.is_active ? 'Active (visible to customers)' : 'Inactive (hidden)'}
            </span>
          </div>

          {/* Preview */}
          {form.images.split('\n')[0]?.trim() && (
            <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-video">
              <img
                src={form.images.split('\n')[0].trim()}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full py-3.5">
            {saving ? <Spinner size="sm" /> : <Save size={16} />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function VendorProducts() {
  const navigate = useNavigate()
  const { vendor, user, loading: authLoading } = useVendorAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalProduct, setModalProduct] = useState(undefined) // undefined=closed, null=new, obj=edit

  useEffect(() => {
    if (!authLoading && !user) navigate('/vendor/login')
  }, [authLoading, user])

  useEffect(() => {
    if (vendor?.id) fetchProducts()
  }, [vendor?.id])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const toggleActive = async (product) => {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    setProducts((ps) => ps.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    toast.success(product.is_active ? 'Product hidden' : 'Product activated')
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((ps) => ps.filter((p) => p.id !== id))
    toast.success('Product deleted')
  }

  const copyLink = (id) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${id}`)
    toast.success('Product link copied!')
  }

  if (authLoading) return <PageLoader />

  return (
    <div className="min-h-screen bg-slate-50 page-enter">
      <Toaster position="top-right" />
      {modalProduct !== undefined && (
        <ProductModal
          product={modalProduct}
          vendorId={vendor?.id}
          onClose={() => setModalProduct(undefined)}
          onSaved={() => { setModalProduct(undefined); fetchProducts() }}
        />
      )}

      <Navbar vendor={vendor} user={user} />

      {/* Header */}
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

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-10 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
        ) : products.length === 0 ? (
          <div className="card mt-4">
            <EmptyState
              icon="📦"
              title="No products yet"
              subtitle="Create your first product and share the link on TikTok!"
            />
            <div className="flex justify-center mt-4">
              <button onClick={() => setModalProduct(null)} className="btn-primary">
                <Plus size={16} /> Add Your First Product
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 mt-4">
            {products.map((product) => (
              <div key={product.id} className={`card flex items-center gap-4 transition-all ${!product.is_active ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display='none' }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900 truncate">{product.title}</p>
                    {!product.is_active && (
                      <span className="badge bg-slate-100 text-slate-500 text-xs">Hidden</span>
                    )}
                  </div>
                  <p className="text-brand-700 font-bold">{formatUGX(product.price)}</p>
                  <p className="text-xs text-slate-400">Stock: {product.stock} · {product.images?.length || 0} photos</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => copyLink(product.id)} title="Copy product link"
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    <Link2 size={16} />
                  </button>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
