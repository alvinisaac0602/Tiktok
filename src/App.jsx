import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProductPage from './pages/ProductPage'
import CheckoutPage from './pages/CheckoutPage'
import ConfirmPage from './pages/ConfirmPage'
import VendorLogin from './pages/VendorLogin'
import VendorDashboard from './pages/VendorDashboard'
import AdminPanel from './pages/AdminPanel'
import AdminLogin from './pages/AdminLogin'
import VendorProducts from './pages/VendorProducts'
import AdminAnalytics from './pages/AdminAnalytics'
import StorePage from './pages/StorePage'
import LandingPage from './pages/LandingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '16px',
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Customer-facing routes */}
        <Route path="/p/:productId"      element={<ProductPage />} />
        <Route path="/store/:storeSlug"  element={<StorePage />} />
        <Route path="/checkout/:productId" element={<CheckoutPage />} />
        <Route path="/confirm/:orderId"  element={<ConfirmPage />} />

        {/* Vendor routes */}
        <Route path="/vendor/login"      element={<VendorLogin />} />
        <Route path="/vendor/dashboard"  element={<VendorDashboard />} />
        <Route path="/vendor/products"   element={<VendorProducts />} />

        {/* Admin */}
        <Route path="/admin/login"       element={<AdminLogin />} />
        <Route path="/admin"             element={<AdminPanel />} />
        <Route path="/admin/analytics"   element={<AdminAnalytics />} />

        {/* Default route to Landing Page and wildcard redirect */}
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
