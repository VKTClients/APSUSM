import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
  Download, Eye, Search, Filter, LogOut, Shield, Image, BarChart3
} from 'lucide-react'
import { setAdminAuth, getAdminDashboard, getAdminMembers, regenerateCard } from '../api'
import { useTranslation } from '../contexts/TranslationContext'
import LanguageToggle from '../components/LanguageToggle'

const STATUS_COLORS = {
  PENDING_PAYMENT: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  PAID: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
  PAYMENT_FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
  CARD_GENERATED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
  SUSPENDED: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' },
  EXPIRED: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-400' },
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.PENDING_PAYMENT
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${c.bg} ${c.text} ${c.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [regenerating, setRegenerating] = useState(null)
  const [cardView, setCardView] = useState(null) // { id, side:'front'|'back' }

  useEffect(() => {
    const saved = localStorage.getItem('admin_auth')
    if (!saved) { navigate('/admin'); return }
    const [u, p] = atob(saved).split(':')
    setAdminAuth(u, p)
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [dashData, membersData] = await Promise.all([
        getAdminDashboard(),
        getAdminMembers(filter || undefined)
      ])
      setStats(dashData)
      setMembers(membersData)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_auth')
        navigate('/admin')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filter])

  const handleRegenerate = async (id) => {
    setRegenerating(id)
    try {
      await regenerateCard(id)
      await loadData()
    } catch (err) {
      alert('Card regeneration failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setRegenerating(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth')
    navigate('/admin')
  }

  const filteredMembers = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.fullName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.memberId?.toLowerCase().includes(q) ||
      m.institution?.toLowerCase().includes(q)
    )
  })

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-50">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-blue" />
            <span className="text-sm font-semibold tracking-wide hidden sm:inline">APSUSM Admin</span>
            <span className="text-sm font-semibold tracking-wide sm:hidden">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <button onClick={loadData} className="text-slate-400 hover:text-white transition-colors p-1.5" title={t('admin_refresh')}>
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
              {t('admin_logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label: 'Total Members', value: stats.totalMembers, icon: Users, color: 'text-slate-700' },
              { label: 'Pending Payment', value: stats.pendingPayment, icon: Clock, color: 'text-yellow-600' },
              { label: 'Paid', value: stats.paid, icon: CreditCard, color: 'text-blue-600' },
              { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
              { label: 'Cards Generated', value: stats.cardGenerated, icon: Image, color: 'text-emerald-600' },
              { label: 'Payment Failed', value: stats.paymentFailed, icon: XCircle, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 md:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <s.icon className={`w-4 md:w-5 h-4 md:h-5 ${s.color}`} />
                  <BarChart3 className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-300" />
                </div>
                <p className="text-xl md:text-2xl font-semibold text-slate-900">{s.value}</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Members</h2>
            <span className="text-sm text-slate-400">({filteredMembers.length})</span>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="CARD_GENERATED">Card Generated</option>
                <option value="ACTIVE">Active</option>
                <option value="PAYMENT_FAILED">Payment Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_member')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_member_id')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('reg_position')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_province')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_status')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_registered')}</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs uppercase tracking-wide">{t('admin_col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-slate-900">{m.fullName}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{m.memberId || '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600">{m.position || '—'}</td>
                      <td className="py-3 px-4 text-slate-600">{m.province}</td>
                      <td className="py-3 px-4"><StatusBadge status={m.status} /></td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {m.registeredAt ? new Date(m.registeredAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {m.hasCard && (
                            <button
                              onClick={() => setCardView({ id: m.id, memberId: m.memberId })}
                              className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-md transition-all"
                              title="View card"
                            >
                              <Image className="w-4 h-4" />
                            </button>
                          )}
                          {(m.status === 'ACTIVE' || m.status === 'CARD_GENERATED' || m.status === 'PAID') && (
                            <button
                              onClick={() => handleRegenerate(m.id)}
                              disabled={regenerating === m.id}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all disabled:opacity-50"
                              title="Regenerate card"
                            >
                              <RefreshCw className={`w-4 h-4 ${regenerating === m.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Detail Drawer */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedMember(null)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-slide-in-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="font-semibold text-slate-900">Member Details</h3>
                <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center pb-4 border-b border-slate-100">
                  <p className="text-xl font-semibold text-slate-900">{selectedMember.fullName}</p>
                  <p className="text-sm text-slate-500">{selectedMember.position || 'Health Professional'}</p>
                  {selectedMember.memberId && (
                    <p className="mt-2 font-mono text-sm text-brand-blue font-semibold">{selectedMember.memberId}</p>
                  )}
                </div>

                {[
                  ['Email', selectedMember.email],
                  ['Phone', selectedMember.phone || '—'],
                  ['Institution', selectedMember.institution || '—'],
                  ['Position', selectedMember.position || '—'],
                  ['Province', selectedMember.province],
                  ['Status', selectedMember.status],
                  ['Registered', selectedMember.registeredAt ? new Date(selectedMember.registeredAt).toLocaleString() : '—'],
                  ['Paid At', selectedMember.paidAt ? new Date(selectedMember.paidAt).toLocaleString() : '—'],
                  ['Card Generated', selectedMember.cardGeneratedAt ? new Date(selectedMember.cardGeneratedAt).toLocaleString() : '—'],
                  ['Expires', selectedMember.expiresAt ? new Date(selectedMember.expiresAt).toLocaleDateString() : '—'],
                  ['Email Sent', selectedMember.emailSent ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-medium text-slate-700">{value}</span>
                  </div>
                ))}

                {selectedMember.hasCard && (
                  <div className="pt-4 space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Card Preview</h4>
                    <img
                      src={`/api/members/card/${selectedMember.id}/front`}
                      alt="Card Front"
                      className="w-full rounded-lg shadow border border-slate-200"
                    />
                    <img
                      src={`/api/members/card/${selectedMember.id}/back`}
                      alt="Card Back"
                      className="w-full rounded-lg shadow border border-slate-200"
                    />
                    <div className="flex gap-2">
                      <a
                        href={`/api/members/card/${selectedMember.id}/front`}
                        download
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <Download className="w-4 h-4" /> Front
                      </a>
                      <a
                        href={`/api/members/card/${selectedMember.id}/back`}
                        download
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <Download className="w-4 h-4" /> Back
                      </a>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { handleRegenerate(selectedMember.id); }}
                  disabled={regenerating === selectedMember.id || !selectedMember.memberId}
                  className="w-full mt-4 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating === selectedMember.id ? 'animate-spin' : ''}`} />
                  Regenerate Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card Lightbox */}
        {cardView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6" onClick={() => setCardView(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative max-w-2xl w-full space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between text-white mb-2">
                <span className="font-mono text-sm">{cardView.memberId}</span>
                <button onClick={() => setCardView(null)} className="text-white/70 hover:text-white text-lg">✕</button>
              </div>
              <img
                src={`/api/members/card/${cardView.id}/front`}
                alt="Card Front"
                className="w-full rounded-xl shadow-2xl"
              />
              <img
                src={`/api/members/card/${cardView.id}/back`}
                alt="Card Back"
                className="w-full rounded-xl shadow-2xl"
              />
              <div className="flex gap-3 justify-center">
                <a
                  href={`/api/members/card/${cardView.id}/front`}
                  download
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Front
                </a>
                <a
                  href={`/api/members/card/${cardView.id}/back`}
                  download
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Back
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
