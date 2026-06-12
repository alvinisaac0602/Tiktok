import { supabase } from './supabase'

/** Get or create an anonymous session ID for this browser tab */
function getSessionId() {
  let sid = sessionStorage.getItem('tks_session')
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem('tks_session', sid)
  }
  return sid
}

/**
 * Track a funnel event — never throws, analytics must not break UX.
 * @param {Object} params
 * @param {string}  params.eventType   - 'link_click'|'page_view'|'checkout_start'|'order_placed'|'payment_success'|'dispatched'
 * @param {string}  [params.productId]
 * @param {string}  [params.vendorId]
 * @param {string}  [params.creatorRef]
 * @param {string}  [params.orderId]
 * @param {Object}  [params.metadata]
 */
export async function trackEvent({
  eventType,
  productId = null,
  vendorId  = null,
  creatorRef = null,
  orderId   = null,
  metadata  = {},
}) {
  // Skip tracking for demo products
  if (productId === 'demo' || vendorId === 'demo-vendor') return

  try {
    await supabase.from('analytics_events').insert({
      event_type:  eventType,
      product_id:  productId  || null,
      vendor_id:   vendorId   || null,
      creator_ref: creatorRef || null,
      order_id:    orderId    || null,
      session_id:  getSessionId(),
      metadata,
    })
  } catch (err) {
    console.warn('[Analytics] track error:', err?.message)
  }
}
