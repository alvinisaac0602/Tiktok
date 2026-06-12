import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

/**
 * Hook to subscribe to real-time order updates for a vendor
 */
export function useRealtimeOrders(vendorId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [newOrderAlert, setNewOrderAlert] = useState(null)

  // Fetch initial orders
  useEffect(() => {
    if (!vendorId) {
      setOrders([])
      setLoading(false)
      return
    }

    const fetchOrders = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          products (title, price, images),
          payments (status, flw_ref)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      }
      setLoading(false)
    }

    fetchOrders()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendorId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the new order with relations
            const { data } = await supabase
              .from('orders')
              .select(`*, products (title, price, images), payments (status, flw_ref)`)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders((prev) => [data, ...prev])
              setNewOrderAlert(data)
              setTimeout(() => setNewOrderAlert(null), 5000)
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === payload.new.id ? { ...o, ...payload.new } : o
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId])

  return { orders, loading, newOrderAlert }
}

/**
 * Hook for vendor auth state
 */
export function useVendorAuth() {
  const [vendor, setVendor] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrCreateVendor = async (user) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)

      if (fetchError) {
        console.error('Error fetching vendor profile:', fetchError?.message ?? fetchError, fetchError)

        // quick retry once
        await new Promise((r) => setTimeout(r, 500))
        const { data: vendorRetry, error: retryErr } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!retryErr && vendorRetry) return vendorRetry

        return null
      }

      // Handle multiple or zero rows
      if (Array.isArray(data) && data.length === 1) return data[0]
      if (Array.isArray(data) && data.length > 1) {
        console.warn('Multiple vendor rows found for user:', user.id, data)
        return data[0]
      }
      if (!data || (Array.isArray(data) && data.length === 0)) {
        // no vendor found — continue to create
      }
      // No vendor row found — create one using available metadata or fallbacks
      const storeName = user.user_metadata?.store_name || user.app_metadata?.store_name || (user.email ? user.email.split('@')[0] : 'My Store')

      // Build a URL-safe slug and ensure uniqueness
      let slug = storeName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const { data: existing } = await supabase.from('vendors').select('id').eq('store_slug', slug).maybeSingle()
      if (existing) {
        slug = `${slug}-${Math.random().toString(36).slice(2,6)}`
      }

      const { data: newVendor, error: insertError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          store_name: storeName,
          store_slug: slug,
        })
        .select()
        .maybeSingle()

      if (insertError) {
        console.error('Error creating vendor profile:', insertError)
        return null
      }

      return newVendor
    } catch (err) {
      console.error('fetchOrCreateVendor failed:', err)
      return null
    }
  }

  useEffect(() => {
    let cancelled = false

    const handleUser = async (sessionUser) => {
      if (cancelled) return
      setUser(sessionUser)

      if (sessionUser) {
        const vendorProfile = await fetchOrCreateVendor(sessionUser)
        if (!cancelled) setVendor(vendorProfile)
      } else {
        setVendor(null)
      }
      if (!cancelled) setLoading(false)
    }

    // 1. Set up auth listener FIRST so we never miss events (e.g. from login redirect)
    const { data: subscriptionData, error: subError } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          await handleUser(session?.user ?? null)
        } catch (err) {
          console.error('Auth state change failed:', err)
          if (!cancelled) setLoading(false)
        }
      }
    )

    if (subError) console.error('onAuthStateChange error:', subError)
    const subscription = subscriptionData?.subscription ?? subscriptionData

    // 2. Read session from local storage (instant, no network call)
    //    This covers the case where onAuthStateChange hasn't fired yet
    const initFromSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const sessionUser = sessionData?.session?.user ?? null
        // Only use this if onAuthStateChange hasn't already set loading to false
        if (!cancelled) {
          await handleUser(sessionUser)
        }
      } catch (err) {
        console.error('Session init failed:', err)
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initFromSession()

    // 3. Safety fallback — if everything fails, stop loading after 8s
    const fallback = setTimeout(() => {
      if (!cancelled) {
        setLoading(false)
      }
    }, 8000)

    return () => {
      cancelled = true
      clearTimeout(fallback)
      try { subscription?.unsubscribe?.() } catch (e) {}
    }
  }, [])

  return { vendor, user, loading }
}
