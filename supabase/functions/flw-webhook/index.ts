// Supabase Edge Function: flw-webhook
// Deploy with: supabase functions deploy flw-webhook
// Set secret: supabase secrets set FLW_SECRET_HASH=your_secret_hash

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify Flutterwave webhook signature
    const secretHash = Deno.env.get('FLW_SECRET_HASH')
    const incomingHash = req.headers.get('verif-hash')

    if (!secretHash || incomingHash !== secretHash) {
      console.error('❌ Invalid webhook signature')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Parse payload
    const payload = await req.json()
    console.log('📨 FLW Webhook received:', JSON.stringify(payload, null, 2))

    const { event, data } = payload

    if (event !== 'charge.completed') {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const {
      tx_ref,        // our order ID
      flw_ref,       // flutterwave reference
      status,        // successful | failed
      amount,
      currency,
    } = data

    // 3. Init Supabase admin client (service role — bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    if (status === 'successful') {
      // 4a. Update order status → paid
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', tx_ref)
        .eq('status', 'pending_payment') // idempotent guard

      if (orderError) {
        console.error('❌ Order update error:', orderError)
        throw orderError
      }

      // 4b. Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          flw_ref,
          tx_ref,
          amount,
          status: 'success',
          raw_data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', tx_ref)

      if (paymentError) {
        // Payment record might not exist yet — insert it
        await supabase.from('payments').insert({
          order_id: tx_ref,
          flw_ref,
          tx_ref,
          amount,
          status: 'success',
          raw_data: data,
        })
      }

      console.log(`✅ Order ${tx_ref} marked as PAID (flw_ref: ${flw_ref})`)

    } else if (status === 'failed') {
      // 4c. Mark order as failed
      await supabase
        .from('orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', tx_ref)
        .eq('status', 'pending_payment')

      await supabase
        .from('payments')
        .update({ status: 'failed', raw_data: data })
        .eq('order_id', tx_ref)

      console.log(`❌ Order ${tx_ref} payment FAILED`)
    }

    return new Response(
      JSON.stringify({ received: true, order_id: tx_ref, status }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    console.error('💥 Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
