import { useState, useEffect } from 'react'
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
    if (!vendorId) return

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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setVendor(data)
      }
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data } = await supabase
            .from('vendors')
            .select('*')
            .eq('user_id', session.user.id)
            .single()
          setVendor(data)
        } else {
          setVendor(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { vendor, user, loading }
}
