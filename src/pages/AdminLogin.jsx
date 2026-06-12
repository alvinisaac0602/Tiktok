import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/UI'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
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
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user returned from auth')

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') {
        toast.success('Welcome, admin!')
        navigate('/admin')
      } else {
        // non-admins should not use this page
        await supabase.auth.signOut()
        toast.error('Admin access required')
      }
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-accent-900 flex items-center justify-center px-4 py-12 page-enter">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-glow-blue">
            🛡️
          </div>
          <h1 className="font-display font-bold text-2xl text-white">TikShop Admin Login</h1>
          <p className="text-brand-300 text-sm mt-1">System administrators only</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5"><Mail size={13} className="inline mr-1" />Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="admin@example.com"
                className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 ${errors.email ? 'border-red-400' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-red-300 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5"><Lock size={13} className="inline mr-1" />Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={`input bg-white/10 border-white/20 text-white placeholder-white/40 focus:ring-brand-300 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80">
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
              Sign In as Admin
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 mt-5 text-white/40 text-xs">
            <ShieldCheck size={13} />
            <span>Secured by Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
