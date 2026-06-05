import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/UI'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react'

export default function VendorLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', store_name: '' })
  const [errors, setErrors] = useState({})

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (mode === 'register' && !form.store_name.trim()) e.store_name = 'Store name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error
      toast.success('Welcome back! 👋')
      navigate('/vendor/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { store_name: form.store_name, role: 'vendor' } },
      })
      if (error) throw error

      // Create vendor record
      if (data.user) {
        const slug = form.store_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        await supabase.from('vendors').insert({
          user_id: data.user.id,
          store_name: form.store_name,
          store_slug: slug,
        })
      }

      toast.success('Account created! Check your email to verify.')
      setMode('login')
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-accent-900 flex items-center justify-center px-4 py-12 page-enter">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow-blue">
            🛍️
          </div>
          <h1 className="font-display font-bold text-2xl text-white">TikShop Vendor Portal</h1>
          <p className="text-brand-300 text-sm mt-1">Manage your TikTok orders in real-time</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          {/* Tab switcher */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {/* Store name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Store Name</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={set('store_name')}
                  placeholder="e.g. TechZone UG"
                  className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 ${errors.store_name ? 'border-red-400' : ''}`}
                />
                {errors.store_name && <p className="text-red-300 text-xs mt-1">{errors.store_name}</p>}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                <Mail size={13} className="inline mr-1" />Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 ${errors.email ? 'border-red-400' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
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

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-5 text-white/40 text-xs">
            <ShieldCheck size={13} />
            <span>Secured by Supabase Auth</span>
          </div>
        </div>

        {/* Demo hint */}
        <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-center">
          <p className="text-white/50 text-xs">
            Demo? Use <span className="text-white/80 font-mono">demo@tiktokshop.ug</span> / <span className="text-white/80 font-mono">demo1234</span>
          </p>
        </div>
      </div>
    </div>
  )
}
