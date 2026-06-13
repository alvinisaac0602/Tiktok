import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  ShoppingBag, Zap, TrendingUp, BarChart2, ArrowRight,
  Check, ChevronDown, ChevronUp, Smartphone, Play,
  CheckCircle2, HelpCircle, Lock, Shield, Phone, MapPin, CreditCard, Banknote,
  Menu, X, Mail, MessageCircle
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  
  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null)
  
  // Checkout simulator state
  const [simStep, setSimStep] = useState('product') // product, checkout, success
  const [simName, setSimName] = useState('')
  const [simPhone, setSimPhone] = useState('')
  const [simZone, setSimZone] = useState('Kampala Central')
  const [simMethod, setSimMethod] = useState('cod')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Pricing tab state ('standard' or 'enterprise')
  const [pricingTab, setPricingTab] = useState('standard')

  // Landing Page Feedback states
  const [lName, setLName] = useState('')
  const [lEmail, setLEmail] = useState('')
  const [lMsg, setLMsg] = useState('')
  const [landingFbSubmitting, setLandingFbSubmitting] = useState(false)
  const [landingFeedbackSubmitted, setLandingFeedbackSubmitted] = useState(false)

  const handleLandingFeedbackSubmit = async (e) => {
    e.preventDefault()
    if (!lMsg.trim()) return
    setLandingFbSubmitting(true)
    try {
      const { error } = await supabase.from('feedback').insert({
        source: 'landing_page',
        name: lName.trim() || null,
        email: lEmail.trim() || null,
        message: lMsg.trim(),
      })
      if (error) throw error
      setLandingFeedbackSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit feedback: ' + err.message)
    } finally {
      setLandingFbSubmitting(false)
    }
  }

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const resetSimulator = () => {
    setSimStep('product')
    setSimName('')
    setSimPhone('')
    setSimMethod('cod')
  }

  const handleSimSubmit = (e) => {
    e.preventDefault()
    if (!simPhone) return
    setSimStep('success')
  }

  const faqs = [
    {
      q: "How does the TikTok integration work?",
      a: "Once you upload a product in the Vendor Dashboard, you can generate a creator-specific link (e.g., ?ref=creator_handle). When a creator adds this link to their TikTok bio or video, any customers clicking it are tracked. We attribute sales and calculate commissions automatically."
    },
    {
      q: "How do I receive payments from customers?",
      a: "TikShop integrates seamlessly with Flutterwave. Customers in East Africa can pay instantly using MTN Mobile Money, Airtel Money, or credit/debit cards. The money goes directly to your merchant account. You can also offer Cash on Delivery (COD)."
    },
    {
      q: "How is the 5% creator commission handled?",
      a: "When an order referred by a creator is marked as paid or successfully dispatched (for COD), our system automatically calculates and logs the 5% commission. You can review payouts and creator performance inside your analytics tab."
    },
    {
      q: "Do I need coding skills to use TikShop?",
      a: "Not at all! TikShop is built for speed and ease of use. You can set up your store, upload products, and start generating creator links within 5 minutes. No coding or technical servers required."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col page-enter">
      
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-brand-700 text-lg" id="logo-link">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white text-sm sm:text-base">🛍</span>
            <span>TikShop</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-brand-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
            <Link to="/p/demo" className="text-slate-500 hover:text-brand-600 transition-colors">Demo Shop</Link>
          </nav>
          
          <div className="hidden sm:flex items-center gap-3">
            <Link to="/vendor/login" className="text-sm font-semibold text-slate-600 hover:text-brand-700 px-3 py-2 transition-colors">
              Sign In
            </Link>
            <Link to="/vendor/login?mode=register" className="btn-primary py-2 px-4 text-sm rounded-xl" id="nav-cta-btn">
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1 animate-fade-in shadow-lg">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-slate-700 hover:text-brand-600">Features</a>
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-slate-700 hover:text-brand-600">How it Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-slate-700 hover:text-brand-600">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-slate-700 hover:text-brand-600">FAQ</a>
            <Link to="/p/demo" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 text-sm font-semibold text-slate-500 hover:text-brand-600">Demo Shop</Link>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Link to="/vendor/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl">Sign In</Link>
              <Link to="/vendor/login?mode=register" onClick={() => setMobileMenuOpen(false)} className="flex-1 btn-primary py-2.5 text-sm rounded-xl text-center">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-900 via-brand-800 to-slate-900 text-white px-4 py-10 sm:py-16 md:py-24">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45">
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/30 rounded-full blur-3xl" />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Copywriter Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Zap size={12} className="animate-pulse" /> 2-Click Purchase Platform
              </div>
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-none text-white">
                Turn TikTok Views <br />
                <span className="bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                  Into Instant Sales
                </span>
              </h1>
              <p className="text-brand-100 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-medium">
                The fastest social commerce engine for creators and vendors in East Africa.
                Generate tracking affiliate links, accept mobile money payments, and manage dispatches in real-time.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/vendor/login?mode=register" className="w-full sm:w-auto btn-primary bg-gradient-to-r from-brand-400 to-accent-400 hover:from-brand-300 hover:to-accent-300 py-3.5 px-8 text-base shadow-glow-blue" id="hero-cta-btn">
                  Start Selling as Vendor <ArrowRight size={16} />
                </Link>
                <Link to="/p/demo" className="w-full sm:w-auto btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20 py-3.5 px-8 text-base">
                  View Demo Storefront
                </Link>
              </div>

              {/* Badges / Social Proof stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 max-w-md mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-black text-brand-300">5 Min</p>
                  <p className="text-xs text-brand-200/70 font-semibold">Store Setup</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-300">2-Click</p>
                  <p className="text-xs text-brand-200/70 font-semibold">Quick Checkout</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-brand-300">5%</p>
                  <p className="text-xs text-brand-200/70 font-semibold">Auto Commission</p>
                </div>
              </div>
            </div>

            {/* Interactive Simulator Column */}
            <div className="lg:col-span-5 flex justify-center" id="simulator">
              <div className="w-full max-w-[340px] bg-slate-900 border border-slate-700/50 rounded-[40px] p-3 shadow-2xl relative">
                {/* Speaker grill + Camera notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-950 rounded-b-xl flex items-center justify-center gap-1.5 z-20">
                  <div className="w-2 h-2 bg-slate-800 rounded-full" />
                  <div className="w-12 h-1 bg-slate-800 rounded-full" />
                </div>
                
                {/* Simulated Screen */}
                <div className="bg-slate-50 text-slate-800 rounded-[32px] overflow-hidden min-h-[460px] flex flex-col relative pt-4 text-xs font-sans">
                  
                  {/* Mock App Header */}
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-brand-600 flex items-center justify-center text-white text-[9px]">🛍</span>
                      DemoShop
                    </span>
                    <span className="text-[10px] text-slate-400">⚡ Fast checkout</span>
                  </div>

                  {/* Simulator Step 1: Product detail */}
                  {simStep === 'product' && (
                    <div className="flex-1 p-4 flex flex-col justify-between animate-fade-in">
                      <div className="space-y-3">
                        <div className="w-full h-32 bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center">
                          <span className="text-5xl">🎧</span>
                        </div>
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-extrabold text-sm text-slate-900">Trendy Pro Wireless Earbuds</h3>
                            <span className="font-black text-brand-700 text-sm">UGX 75,000</span>
                          </div>
                          <p className="text-slate-400 text-[10px] mt-1">
                            High-fidelity sound, noise reduction, and up to 30 hours of battery life with case.
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[10px]">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          <span>14 people buying right now</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSimStep('checkout')}
                        className="w-full btn-primary py-3 text-xs rounded-xl font-bold flex items-center justify-center gap-1"
                      >
                        <Play size={10} fill="white" /> Click to Test 2-Click Checkout
                      </button>
                    </div>
                  )}

                  {/* Simulator Step 2: Checkout Form */}
                  {simStep === 'checkout' && (
                    <div className="flex-1 p-4 flex flex-col justify-between animate-fade-in">
                      <form onSubmit={handleSimSubmit} className="space-y-3">
                        <p className="font-bold text-slate-800">Quick Purchase</p>
                        
                        <div>
                          <label className="block text-slate-500 text-[10px] mb-1 font-semibold">Your Name</label>
                          <input
                            type="text"
                            value={simName}
                            onChange={(e) => setSimName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 text-[10px] mb-1 font-semibold">Phone Number *</label>
                          <input
                            type="tel"
                            value={simPhone}
                            onChange={(e) => setSimPhone(e.target.value)}
                            placeholder="0771234567"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-slate-500 text-[10px] mb-1 font-semibold">Zone</label>
                          <select
                            value={simZone}
                            onChange={(e) => setSimZone(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none"
                          >
                            <option>Kampala Central</option>
                            <option>Nakawa</option>
                            <option>Makindye</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSimMethod('cod')}
                            className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              simMethod === 'cod' ? 'border-brand-600 bg-brand-50/50 text-brand-700 font-bold' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            <Banknote size={14} /> Pay on Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimMethod('online')}
                            className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                              simMethod === 'online' ? 'border-brand-600 bg-brand-50/50 text-brand-700 font-bold' : 'border-slate-200 text-slate-500'
                            }`}
                          >
                            <CreditCard size={14} /> Mobile Money
                          </button>
                        </div>

                        <button
                          type="submit"
                          className="w-full btn-primary py-3 text-xs rounded-xl font-bold mt-2"
                        >
                          Place Order (UGX 75,000)
                        </button>
                      </form>
                      
                      <button
                        type="button"
                        onClick={() => setSimStep('product')}
                        className="text-center text-slate-400 hover:text-slate-600 text-[10px] font-medium"
                      >
                        ← Back to product details
                      </button>
                    </div>
                  )}

                  {/* Simulator Step 3: Success */}
                  {simStep === 'success' && (
                    <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-xl font-bold animate-bounce-sm">
                        ✓
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">Order Confirmed!</h4>
                        <p className="text-slate-500 text-[10px] mt-1 px-4">
                          The order has been push-notified to the vendor's dashboard in real-time.
                        </p>
                      </div>
                      
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 w-full text-left space-y-1 text-[10px]">
                        <p className="font-bold text-slate-700">Vendor view:</p>
                        <p className="text-slate-500">📞 Customer: {simPhone}</p>
                        <p className="text-slate-500">📍 Zone: {simZone}</p>
                        <p className="text-slate-500">💰 Payment: {simMethod === 'cod' ? 'Cash on Delivery' : 'Mobile Money'}</p>
                      </div>

                      <button
                        onClick={resetSimulator}
                        className="btn-secondary py-2 px-4 rounded-xl text-[10px]"
                      >
                        Reset Demo Flow
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
                Built to Turn Traffic into Revenue
              </h2>
              <p className="text-slate-500 text-base max-w-xl mx-auto">
                No complex checkouts, no slow loading times. TikShop is built natively for creators and vendors looking to sell directly on TikTok.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Feature 1 */}
              <div className="card-hover space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold shadow-sm">
                  ⚡
                </div>
                <h3 className="font-bold text-lg text-slate-900">2-Click Checkout</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Customers order right inside the TikTok embedded web browser. Minimum form fields to maximize conversion rates.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card-hover space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold shadow-sm">
                  🔗
                </div>
                <h3 className="font-bold text-lg text-slate-900">Creator Referral Links</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Generate links for TikTok influencers. Track clicks, checkouts, and payouts automatically.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card-hover space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold shadow-sm">
                  📲
                </div>
                <h3 className="font-bold text-lg text-slate-900">Mobile Money Ready</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Integrated with Flutterwave. Supports MTN MoMo, Airtel Money, and card transactions instantly.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="card-hover space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold shadow-sm">
                  📈
                </div>
                <h3 className="font-bold text-lg text-slate-900">Funnel Analytics</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Track full platform funnels from creator clicks to successful dispatches. Know exactly where you make money.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Showcase Banner */}
        <section className="bg-slate-900 text-white py-16 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <h3 className="font-display font-extrabold text-2xl sm:text-3xl">Ready to set up your online storefront?</h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-xl">
                Create products, manage store links, and track commissions with your dashboard.
              </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto justify-center">
              <Link to="/vendor/login?mode=register" className="btn-primary bg-gradient-to-r from-brand-400 to-accent-400 py-3.5 px-6 font-bold rounded-xl text-sm">
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Tiers Section */}
        <section id="pricing" className="py-20 px-4 bg-slate-50">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
                Simple, Transparent Plans
              </h2>
              <p className="text-slate-500 text-base max-w-xl mx-auto">
                Scale up your social commerce business with plans built for creators, growing vendors, and large retail brands.
              </p>
              
              {/* Toggle Switch */}
              <div className="flex justify-center pt-2">
                <div className="relative flex bg-slate-200/60 p-1 rounded-2xl border border-slate-200/80">
                  <button
                    onClick={() => setPricingTab('standard')}
                    className={`relative z-10 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      pricingTab === 'standard'
                        ? 'bg-white text-brand-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Standard Plans
                  </button>
                  <button
                    onClick={() => setPricingTab('enterprise')}
                    className={`relative z-10 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      pricingTab === 'enterprise'
                        ? 'bg-white text-brand-700 shadow-sm font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Enterprise Plans
                  </button>
                </div>
              </div>
            </div>

            {pricingTab === 'standard' ? (
              <div key="standard" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in">
                {/* Starter Plan */}
                <div className="card bg-white flex flex-col justify-between border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Starter</h3>
                      <p className="text-xs text-slate-400 mt-1">Perfect for small creators & side hustlers</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">UGX 10,000</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Up to 10 active products
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Standard creator tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Mobile Money & Cash on Delivery
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Real-time order alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Basic email support
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-secondary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Start Starter Plan
                  </Link>
                </div>

                {/* Growth Plan (Popular) */}
                <div className="card bg-white border-brand-500 shadow-lg relative flex flex-col justify-between transform md:-translate-y-2">
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Popular
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Growth</h3>
                      <p className="text-xs text-slate-400 mt-1">For scaling stores & active vendors</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-brand-700">UGX 40,000</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Unlimited products
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Advanced creator payout dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Full analytics & event funnel
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Custom store slug (/store/your-name)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Premium WhatsApp notifications
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> 24/7 priority support
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-primary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Start Growth Plan
                  </Link>
                </div>

                {/* Professional Plan */}
                <div className="card bg-white flex flex-col justify-between border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Professional</h3>
                      <p className="text-xs text-slate-400 mt-1">For established retail brands</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">UGX 80,000</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Custom domain integration
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Dedicated API access
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Up to 3 staff accounts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Lower transaction fee override
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Dedicated support manager
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-secondary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Start Pro Plan
                  </Link>
                </div>
              </div>
            ) : (
              <div key="enterprise" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-fade-in">
                {/* Retail Chain */}
                <div className="card bg-white flex flex-col justify-between border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Retail Chain</h3>
                      <p className="text-xs text-slate-400 mt-1">For multi-brand retail operations</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">UGX 150,000</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Up to 5 distinct storefronts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Up to 15 staff accounts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Centralized inventory & routing
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Advanced customer CRM integration
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Onboarding assistance & training
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-secondary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Deploy Retail Suite
                  </Link>
                </div>

                {/* Agency Partner (Popular) */}
                <div className="card bg-white border-brand-500 shadow-lg relative flex flex-col justify-between transform md:-translate-y-2">
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Best Value
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Agency Partner</h3>
                      <p className="text-xs text-slate-400 mt-1">For marketing agencies & creator managers</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-brand-700">UGX 350,000</span>
                      <span className="text-xs text-slate-400">/ month</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Unlimited client storefronts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Consolidated agency dashboard
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> White-labeled creator portal
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Custom commission payouts
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Priority feature request channel
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-primary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Become Agency Partner
                  </Link>
                </div>

                {/* Custom Enterprise */}
                <div className="card bg-white flex flex-col justify-between border-slate-200">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">Custom Enterprise</h3>
                      <p className="text-xs text-slate-400 mt-1">For national brands & custom logistics</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">Custom</span>
                      <span className="text-xs text-slate-400">/ tailor-made</span>
                    </div>
                    <hr className="border-slate-100" />
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Dedicated database instances
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> 0% transaction fee override
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> SLA uptime agreements
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> Custom API integrations & sync
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-500" /> 24/7/365 dedicated hotline
                      </li>
                    </ul>
                  </div>
                  <Link to="/vendor/login?mode=register" className="w-full btn-secondary text-xs mt-6 text-center py-2.5 rounded-xl font-semibold">
                    Contact Enterprise Sales
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Collapsible FAQ Section */}
        <section id="faq" className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-500 text-sm">
                Everything you need to know about setting up and running your TikShop account.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-bold text-sm text-slate-800 hover:bg-slate-100/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle size={16} className="text-brand-500" /> {faq.q}
                    </span>
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100/50 pt-2 bg-white animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact & Feedback Section */}
        <section id="contact-feedback" className="py-20 px-4 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Contact Info (Left) */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <span className="text-brand-600 text-xs font-bold uppercase tracking-widest text-[11px]">Get In Touch</span>
                  <h2 className="font-display font-extrabold text-3xl text-slate-900 leading-tight">
                    Contact & Support
                  </h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Have questions about setting up your TikShop, pricing, or need custom enterprise integrations? Reach out to us directly.
                  </p>
                </div>

                <div className="space-y-5 pt-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Phone Support</h4>
                      <p className="text-xs text-slate-500 mt-1">Call or message us anytime:</p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1">
                        <a href="tel:0789186476" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">0789186476</a>
                        <span className="hidden sm:inline text-slate-300">|</span>
                        <a href="tel:0741319191" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">0741319191</a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Email Support</h4>
                      <p className="text-xs text-slate-500 mt-1">Direct inquiries & support:</p>
                      <a href="mailto:kiizaisaacalvin256@gmail.com" className="text-sm font-semibold text-brand-600 hover:text-brand-700 block mt-0.5 transition-colors">
                        kiizaisaacalvin256@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Form (Right) */}
              <div className="card bg-white shadow-card p-6 sm:p-8 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900">Share Your Feedback</h3>
                  <p className="text-xs text-slate-400">Help us build the best social commerce system in Uganda.</p>
                </div>

                {landingFeedbackSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl p-4 text-center">
                    🎉 Thank you for your feedback! We appreciate your insights.
                  </div>
                ) : (
                  <form onSubmit={handleLandingFeedbackSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Name <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input 
                          type="text" 
                          value={lName}
                          onChange={e => setLName(e.target.value)}
                          placeholder="e.g. Isaac" 
                          className="input bg-slate-50/50" 
                        />
                      </div>
                      <div>
                        <label className="label">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input 
                          type="email" 
                          value={lEmail}
                          onChange={e => setLEmail(e.target.value)}
                          placeholder="e.g. isaac@gmail.com" 
                          className="input bg-slate-50/50" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Message <span className="text-red-500">*</span></label>
                      <textarea 
                        value={lMsg}
                        onChange={e => setLMsg(e.target.value)}
                        placeholder="What do you think of TikShop? Any features you'd like to see?" 
                        rows={4}
                        className="input bg-slate-50/50 resize-none"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={landingFbSubmitting}
                      className="w-full btn-primary py-3 rounded-xl font-bold justify-center"
                    >
                      {landingFbSubmitting ? 'Submitting...' : 'Send Feedback'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-10 sm:py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display font-bold text-white text-base">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center text-white text-xs">🛍</span>
              <span>TikShop</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Fast social commerce checkout engines for content-driven retail. Let creators sell your stock.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Platform Features</a></li>
              <li><Link to="/p/demo" className="hover:text-white transition-colors">Demo Client Store</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Vendors</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/vendor/login?mode=register" className="hover:text-white transition-colors">Vendor Registration</Link></li>
              <li><Link to="/vendor/login" className="hover:text-white transition-colors">Vendor Sign In</Link></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Support FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Contact & Security</h4>
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-400">Phone: <a href="tel:0789186476" className="hover:text-white transition-colors">0789186476</a> / <a href="tel:0741319191" className="hover:text-white transition-colors">0741319191</a></p>
              <p className="text-slate-400">Email: <a href="mailto:kiizaisaacalvin256@gmail.com" className="hover:text-white transition-colors break-all">kiizaisaacalvin256@gmail.com</a></p>
              <hr className="border-slate-800 my-2" />
              <p className="flex items-center gap-1.5 text-slate-500">
                <Lock size={12} /> SSL Secured
              </p>
              <p className="flex items-center gap-1.5 text-slate-500">
                <Shield size={12} /> Payments by Flutterwave
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TikShop UG. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/admin/login" className="hover:text-white transition-colors">Admin Panel</Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-600">Uganda Social Commerce Platform</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
