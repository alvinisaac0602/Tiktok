/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
// We will import useVendorAuth from '../hooks/useRealtimeOrders'
import { useVendorAuth as useAuth } from '../hooks/useRealtimeOrders'

const VendorNotificationContext = createContext(null)

export function useVendorNotifications() {
  const context = useContext(VendorNotificationContext)
  if (!context) {
    throw new Error('useVendorNotifications must be used within a VendorNotificationProvider')
  }
  return context
}

/**
 * Synthesizes a beautiful, clean electronic chime sound using the browser's Web Audio API.
 * This is self-contained and does not require loading/fetching external mp3 assets.
 */
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    
    // Quick fade in/out nodes
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    // Waveforms: beautiful sine wave chords
    osc1.type = 'sine'
    osc2.type = 'sine'
    
    // Musical chords: C5 (523.25Hz) and E5 (659.25Hz) blending into G5 (783.99Hz)
    const now = audioCtx.currentTime
    osc1.frequency.setValueAtTime(523.25, now) // C5
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15) // G5 slide
    
    osc2.frequency.setValueAtTime(659.25, now) // E5
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2) // C6 slide
    
    // Envelope: sharp attack, gentle decay
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.04)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    
    osc1.start(now)
    osc2.start(now)
    
    osc1.stop(now + 1.2)
    osc2.stop(now + 1.2)
  } catch (err) {
    console.warn('Web Audio chime playback blocked or unsupported:', err)
  }
}

export function VendorNotificationProvider({ children }) {
  const navigate = useNavigate()
  const { vendor } = useAuth()
  
  const [notifications, setNotifications] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('tikshop_notif_sound')
    return saved !== null ? saved === 'true' : true
  })
  const [pushEnabled, setPushEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted'
    }
    return false
  })

  // Initialize notifications from localStorage once vendor ID is loaded
  useEffect(() => {
    if (vendor?.id) {
      const saved = localStorage.getItem(`tikshop_notifications_${vendor.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setTimeout(() => setNotifications(parsed), 0)
        } catch (e) {
          console.error('Failed to parse notifications', e)
        }
      } else {
        setTimeout(() => setNotifications([]), 0)
      }
    } else {
      setTimeout(() => setNotifications([]), 0)
    }
  }, [vendor?.id])

  // Listen for realtime orders when vendor is logged in
  useEffect(() => {
    if (!vendor?.id) return

    const channel = supabase
      .channel(`vendor-notifs-${vendor.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${vendor.id}`,
        },
        async (payload) => {
          // Fetch order with related product title
          const { data, error } = await supabase
            .from('orders')
            .select('*, products (title)')
            .eq('id', payload.new.id)
            .single()

          if (error || !data) return

          const newNotif = {
            id: Math.random().toString(36).substring(2, 9),
            orderId: data.id,
            customerName: data.customer_name || 'Customer',
            customerPhone: data.customer_phone || 'Unknown Phone',
            amount: data.total_amount || 0,
            productTitle: data.products?.title || 'Order Item',
            createdAt: data.created_at || new Date().toISOString(),
            read: false,
          }

          // Update notifications state & localStorage
          setNotifications((prev) => {
            const updated = [newNotif, ...prev].slice(0, 15) // Keep last 15
            localStorage.setItem(`tikshop_notifications_${vendor.id}`, JSON.stringify(updated))
            return updated
          })

          // Play audio alert
          if (soundEnabled) {
            playChime()
          }

          // Trigger browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('🎉 New TikShop Order!', {
                body: `${newNotif.customerName} ordered ${newNotif.productTitle} for UGX ${newNotif.amount.toLocaleString()}`,
                tag: newNotif.orderId,
                requireInteraction: true,
              })
            } catch (err) {
              console.warn('Failed to fire desktop Notification:', err)
            }
          }

          // Trigger Custom react-hot-toast alert
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-bounce-in opacity-100 scale-100' : 'opacity-0 scale-95'
              } max-w-sm w-full bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 transition-all duration-300 pointer-events-auto flex flex-col gap-3`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl animate-pulse">🎉</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-100 text-sm">New Order Placed!</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium truncate">
                    {newNotif.productTitle}
                  </p>
                  <p className="text-brand-400 font-bold text-xs mt-0.5">
                    UGX {newNotif.amount.toLocaleString()} • {newNotif.customerPhone}
                  </p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-slate-500 hover:text-slate-300 text-base font-bold leading-none p-1 rounded-lg hover:bg-white/5"
                >
                  &times;
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t.id)
                    navigate('/vendor/dashboard', { state: { expandOrderId: newNotif.orderId } })
                  }}
                  className="flex-1 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  ⚡ View Order
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-white/5 text-slate-400 hover:text-slate-200 font-bold text-xs transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ), { duration: 10000 })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendor?.id, soundEnabled, pushEnabled, navigate])

  // Mark specific notification as read
  const markAsRead = (id) => {
    if (!vendor?.id) return
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      localStorage.setItem(`tikshop_notifications_${vendor.id}`, JSON.stringify(updated))
      return updated
    })
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    if (!vendor?.id) return
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      localStorage.setItem(`tikshop_notifications_${vendor.id}`, JSON.stringify(updated))
      return updated
    })
  }

  // Toggle sound setting
  const toggleSound = () => {
    const next = !soundEnabled
    setSoundEnabled(next)
    localStorage.setItem('tikshop_notif_sound', String(next))
    if (next) {
      playChime() // play test sound
      toast.success('Sound alerts enabled!')
    } else {
      toast.success('Sound alerts muted.')
    }
  }

  // Toggle browser push notifications (requests permissions)
  const togglePush = async () => {
    if (!('Notification' in window)) {
      toast.error('Desktop notifications not supported in this browser.')
      return
    }

    if (Notification.permission === 'granted') {
      // Toggle off in local state
      setPushEnabled(!pushEnabled)
      toast.success(pushEnabled ? 'Desktop notifications disabled.' : 'Desktop notifications enabled!')
      return
    }

    if (Notification.permission === 'denied') {
      toast.error('Permission denied. Please enable notifications in your browser settings.')
      return
    }

    // Prompt for permission
    try {
      const res = await Notification.requestPermission()
      const granted = res === 'granted'
      setPushEnabled(granted)
      if (granted) {
        toast.success('Desktop notifications enabled!')
        new Notification('🎉 Notifications Active!', {
          body: 'You will now receive desktop alerts for new orders.',
        })
      } else {
        toast.error('Permission not granted.')
      }
    } catch (e) {
      console.error('Error requesting notification permission', e)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <VendorNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        pushEnabled,
        markAsRead,
        markAllAsRead,
        toggleSound,
        togglePush,
        triggerTestChime: playChime,
      }}
    >
      {children}
    </VendorNotificationContext.Provider>
  )
}
