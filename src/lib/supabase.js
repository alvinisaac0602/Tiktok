import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set your Supabase URL and anon key in .env')
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)

// Auth helpers
export const signInWithEmail = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signInWithOTP = (phone) =>
  supabase.auth.signInWithOtp({ phone })

export const verifyOTP = (phone, token) =>
  supabase.auth.verifyOtp({ phone, token, type: 'sms' })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

export const onAuthStateChange = (cb) =>
  supabase.auth.onAuthStateChange(cb)
