import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom'
import { TranslationProvider } from './contexts/TranslationContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import PaymentVerifyPage from './pages/PaymentVerifyPage'
import SuccessPage from './pages/SuccessPage'
import VerifyMemberPage from './pages/VerifyMemberPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import DonationsPage from './pages/DonationsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-6">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-slate-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-3 px-8 rounded-full transition-all shadow-sm inline-block">Back to Home</Link>
      </div>
    </div>
  )
}

function AppContent() {
  return (
    <div className="min-h-screen bg-white text-slate-600 font-sans">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Navbar />
      <ScrollToTop />
      <main id="main-content">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/payment/verify" element={<PaymentVerifyPage />} />
        <Route path="/success/:id" element={<SuccessPage />} />
        <Route path="/verify/:memberId" element={<VerifyMemberPage />} />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/donate" element={<DonationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <TranslationProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
      </BrowserRouter>
    </TranslationProvider>
  )
}
