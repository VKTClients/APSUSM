import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Loader2 } from 'lucide-react'
import { setAdminAuth, getAdminDashboard } from '../api'
import { useTranslation } from '../contexts/TranslationContext'
import LanguageToggle from '../components/LanguageToggle'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      setAdminAuth(username, password)
      await getAdminDashboard()
      localStorage.setItem('admin_auth', btoa(`${username}:${password}`))
      navigate('/admin/dashboard')
    } catch (err) {
      setError(t('admin_invalid'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center bg-slate-50">
      <div className="max-w-sm w-full mx-auto px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-slate-900">{t('admin_title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('admin_subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">{t('admin_username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
              placeholder="admin"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">{t('admin_password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {t('admin_sign_in')}
              </>
            )}
          </button>

          <div className="flex justify-center pt-2">
            <LanguageToggle />
          </div>
        </form>
      </div>
    </div>
  )
}
