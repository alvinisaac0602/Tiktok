import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner, ErrorCard } from '../components/UI'

export default function ProductPage() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const creatorRef = searchParams.get('ref')
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getStoreAndRedirect = async () => {
      if (productId === 'demo') {
        const refParam = creatorRef ? `&ref=${creatorRef}` : ''
        navigate(`/store/demo-store?p=demo${refParam}`, { replace: true })
        return
      }

      // Fetch the product with its vendor store slug
      const { data, error } = await supabase
        .from('products')
        .select('id, is_active, vendors(store_slug)')
        .eq('id', productId)
        .single()

      if (error || !data) {
        setError('Product not found.')
        setLoading(false)
        return
      }

      if (!data.is_active) {
        setError('This product is currently inactive.')
        setLoading(false)
        return
      }

      const storeSlug = data.vendors?.store_slug
      if (!storeSlug) {
        setError('Vendor store not found.')
        setLoading(false)
        return
      }

      const refParam = creatorRef ? `&ref=${creatorRef}` : ''
      navigate(`/store/${storeSlug}?p=${productId}${refParam}`, { replace: true })
    }

    getStoreAndRedirect()
  }, [productId, creatorRef])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="max-w-md mx-auto p-6 mt-20">
      <ErrorCard message={error} />
    </div>
  )
}
