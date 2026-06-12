import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/UI'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Zap, ShieldCheck, AlertCircle } from 'lucide-react'

export default function VendorLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', store_name: '', store_phone: '', store_whatsapp: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteValid, setInviteValid] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(null)

  useEffect(() => {
    if (inviteToken) validateInvite(inviteToken)
  }, [inviteToken])

  useEffect(() => {
    setSignupSuccess(null)
  }, [mode])

  const validateInvite = async (token) => {
    setInviteLoading(true)
    try {
      const { data, error } = await supabase
        .from('vendor_invites')
        .select('email,used')
        .eq('token', token)
        .single()

      if (error || !data || data.used) {
        setInviteValid(false)
      } else {
        setInviteValid(true)
        setForm((f) => ({ ...f, email: data.email }))
        // Stay in 'login' mode by default, let them choose
      }
    } catch (err) {
      setInviteValid(false)
    } finally {
      setInviteLoading(false)
    }
  }

  const set = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (error) throw error

      // Mark invite as used if they logged in with an invite
      if (inviteToken) {
        try {
          const { data: userRes } = await supabase.auth.getUser()
          const userId = userRes?.user?.id ?? null
          await supabase.from('vendor_invites').update({ used: true, used_by_user_id: userId }).eq('token', inviteToken)
        } catch (e) {
          // ignore invite marking failure
        }
      }

      toast.success('Signed in')
      navigate('/vendor/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    if (!form.email || !form.password || !form.store_name) {
      setErrors({ general: 'Please fill required fields' })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            store_name: form.store_name,
            role: 'vendor',
            store_phone: form.store_phone || null,
            store_whatsapp: form.store_whatsapp || null,
          }
        }
      })
      if (error) throw error

      // If Supabase returns a user immediately (some providers do), ensure a vendors row exists
      if (data?.user) {
        try {
          const slug = form.store_name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          await supabase.from('vendors').insert({ user_id: data.user.id, store_name: form.store_name, store_slug: slug })
        } catch (e) {
          // ignore; DB trigger or later fetch may handle it
        }
      }

      if (inviteToken) {
        try {
          const { data: userRes } = await supabase.auth.getUser()
          const userId = userRes?.user?.id ?? null
          await supabase.from('vendor_invites').update({ used: true, used_by_user_id: userId }).eq('token', inviteToken)
        } catch (e) {
          // ignore invite marking failure
        }
      }

      if (data?.session) {
        toast.success('Account created and signed in!')
        navigate('/vendor/dashboard')
      } else {
        setSignupSuccess('Account created! Please check your email to confirm your registration before logging in.')
        setMode('login')
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-accent-900 flex items-center justify-center px-4 py-12 page-enter">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow-blue">
            🛍️
          </div>
          <h1 className="font-display font-bold text-2xl text-white">TikShop Vendor Portal</h1>
          <p className="text-brand-300 text-sm mt-1">Manage your TikTok orders in real-time</p>
        </div>

        {!inviteLoading && !inviteValid && inviteToken && (
          <div className="bg-red-100/20 border border-red-400/30 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-200">Invalid or Expired Link</p>
                <p className="text-xs text-red-300 mt-1">This signup link is no longer valid. Contact your admin for a new link.</p>
              </div>
            </div>
          </div>
        )}

        {signupSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2 animate-fade-in">
              <Zap size={16} className="text-emerald-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">Confirm Email Address</p>
                <p className="text-xs text-emerald-300 mt-1">{signupSuccess}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          {inviteLoading && inviteToken && (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
              <p className="ml-2 text-sm text-white/60">Validating invite...</p>
            </div>
          )}

          {!inviteLoading && (
            <>
              {inviteValid && (
                <div className="mb-6 pb-4 border-b border-white/10">
                  <p className="text-xs text-white/60">Vendor Invite Link</p>
                  <p className="text-sm text-white/80 font-semibold">Sign in or create account</p>
                </div>
              )}

              {inviteValid && (
                <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
                  {['login', 'register'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
              )}

              {!inviteValid && !inviteToken && (
                <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
                  {['login', 'register'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>
              )}

              {(!inviteToken || inviteValid || !inviteLoading) && (
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Store Name *</label>
                        <input type="text" value={form.store_name} onChange={set('store_name')}
                          placeholder="e.g. TechZone UG"
                          className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 ${errors.store_name ? 'border-red-400' : ''}`} />
                        {errors.store_name && <p className="text-red-300 text-xs mt-1">{errors.store_name}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">Phone Number <span className="text-white/40 font-normal">(optional)</span></label>
                        <input type="tel" value={form.store_phone} onChange={set('store_phone')}
                          placeholder="e.g. 0771234567"
                          className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300" />
                        <p className="text-white/40 text-xs mt-1">Customers can call/WhatsApp you about orders</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">WhatsApp Number <span className="text-white/40 font-normal">(if different)</span></label>
                        <input type="tel" value={form.store_whatsapp} onChange={set('store_whatsapp')}
                          placeholder="Leave blank to use phone number above"
                          className="input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">
                      <Mail size={13} className="inline mr-1" />Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={inviteValid ? undefined : set('email')}
                      readOnly={inviteValid}
                      disabled={inviteValid}
                      placeholder="you@example.com"
                      className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 ${errors.email ? 'border-red-400' : ''} ${inviteValid ? 'opacity-70 cursor-not-allowed' : ''}`}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
                    {inviteValid && <p className="text-xs text-white/40 mt-1">Email is locked to your invite</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-1.5">
                      <Lock size={13} className="inline mr-1" />Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder="••••••••"
                        className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-300 text-xs mt-1">{errors.password}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-400 to-accent-400 text-white font-bold text-sm shadow-glow-blue hover:from-brand-300 hover:to-accent-300 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Spinner size="sm" /> : <Zap size={17} />}
                    {mode === 'login' ? 'Sign In to Dashboard' : 'Create Vendor Account'}
                  </button>
                </form>
              )}

              <div className="flex items-center justify-center gap-2 mt-5 text-white/40 text-xs">
                <ShieldCheck size={13} />
                <span>Secured by Supabase Auth</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center">
          <p className="text-white/50 text-xs">
            Demo? Use <span className="text-white/80 font-mono">demo@tiktokshop.ug</span> / <span className="text-white/80 font-mono">demo1234</span>
          </p>
        </div>
      </div>
    </div>
  )
}
