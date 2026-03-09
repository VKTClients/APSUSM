import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, Menu, X, Heart } from 'lucide-react'
import { useTranslation } from '../contexts/TranslationContext'
import LanguageToggle from './LanguageToggle'

export default function Navbar() {
  const [open, setOpen] = React.useState(false)
  const location = useLocation()
  const { t } = useTranslation()
  const isAdmin = location.pathname.startsWith('/admin')
  const isHome = location.pathname === '/'

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-slate-900 leading-none">
              AP<span className="text-brand-red">+</span>SUSM
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link to="/" className={`hover:text-slate-900 transition-colors ${isHome ? 'text-slate-900' : ''}`}>
            {t('nav_home')}
          </Link>
          <a href="/#how-it-works" className="hover:text-slate-900 transition-colors">
            {t('nav_how_it_works')}
          </a>
          <Link to="/register" className={`hover:text-slate-900 transition-colors ${location.pathname === '/register' ? 'text-slate-900' : ''}`}>
            {t('nav_register')}
          </Link>
          <Link to="/admin" className={`hover:text-slate-900 transition-colors ${isAdmin ? 'text-slate-900' : ''}`}>
            {t('nav_admin')}
          </Link>
          <Link to="/donate" className={`hover:text-slate-900 transition-colors flex items-center gap-1 ${location.pathname === '/donate' ? 'text-slate-900' : ''}`}>
            <Heart className="w-3.5 h-3.5" />
            {t('nav_donate')}
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageToggle />
          {import.meta.env.DEV && window.location.hostname === 'localhost' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
              {t('nav_mock_mode')}
            </span>
          )}
          <Link
            to="/register"
            className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 px-5 rounded-full transition-all shadow-sm flex items-center gap-2"
          >
            {t('nav_apply')}
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-5 space-y-1 animate-fade-in">
          <Link to="/" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isHome ? 'bg-slate-100 text-slate-900' : 'text-slate-600 active:bg-slate-50'}`} onClick={() => setOpen(false)}>{t('nav_home')}</Link>
          <a href="/#how-it-works" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-slate-600 active:bg-slate-50 transition-colors" onClick={() => setOpen(false)}>{t('nav_how_it_works')}</a>
          <Link to="/register" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/register' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 active:bg-slate-50'}`} onClick={() => setOpen(false)}>{t('nav_register')}</Link>
          <Link to="/admin" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isAdmin ? 'bg-slate-100 text-slate-900' : 'text-slate-600 active:bg-slate-50'}`} onClick={() => setOpen(false)}>{t('nav_admin')}</Link>
          <Link to="/donate" className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/donate' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 active:bg-slate-50'}`} onClick={() => setOpen(false)}><Heart className="w-4 h-4" /> {t('nav_donate')}</Link>
          <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between">
            <LanguageToggle />
            {import.meta.env.DEV && window.location.hostname === 'localhost' && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                {t('nav_mock_mode')}
              </span>
            )}
          </div>
          <Link
            to="/register"
            className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-3 rounded-full transition-all shadow-sm mt-3"
            onClick={() => setOpen(false)}
          >
            {t('nav_apply')}
          </Link>
        </div>
      )}
    </nav>
  )
}
