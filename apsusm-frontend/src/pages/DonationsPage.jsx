import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, Shield, Stethoscope, GraduationCap,
  Users, ArrowRight, CheckCircle, Copy, Check
} from 'lucide-react'
import { useTranslation } from '../contexts/TranslationContext'

const impactAreas = [
  {
    icon: Stethoscope,
    titleKey: 'donate_impact_equipment_title',
    descKey: 'donate_impact_equipment_desc',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: GraduationCap,
    titleKey: 'donate_impact_training_title',
    descKey: 'donate_impact_training_desc',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Users,
    titleKey: 'donate_impact_community_title',
    descKey: 'donate_impact_community_desc',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Shield,
    titleKey: 'donate_impact_advocacy_title',
    descKey: 'donate_impact_advocacy_desc',
    color: 'bg-red-50 text-red-600',
  },
]

const tiers = [
  { amount: '500', label: 'donate_tier_supporter', mzn: '500 MZN' },
  { amount: '1000', label: 'donate_tier_champion', mzn: '1,000 MZN' },
  { amount: '2500', label: 'donate_tier_patron', mzn: '2,500 MZN' },
  { amount: '5000', label: 'donate_tier_benefactor', mzn: '5,000 MZN' },
]

export default function DonationsPage() {
  const { t } = useTranslation()
  const [selectedTier, setSelectedTier] = useState(1)
  const [customAmount, setCustomAmount] = useState('')
  const [copiedField, setCopiedField] = useState(null)

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const bankDetails = [
    { label: t('donate_bank_name'), value: 'APSUSM', field: 'name' },
    { label: t('donate_bank_bank'), value: 'Millennium BIM', field: 'bank' },
    { label: t('donate_bank_account'), value: '0000 0000 0000 0000', field: 'account' },
    { label: t('donate_bank_nib'), value: '0001 0000 0000 0000 000 00', field: 'nib' },
  ]

  return (
    <div className="bg-[#f2f0eb] min-h-screen font-sans">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            {t('donate_badge')}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
            {t('donate_headline')}
          </h1>
          <p className="text-slate-500 text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto">
            {t('donate_subtitle')}
          </p>
        </div>
      </section>

      {/* ── IMPACT AREAS ──────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
              {t('donate_impact_label')}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {t('donate_impact_title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {impactAreas.map((area) => (
              <div key={area.titleKey} className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${area.color}`}>
                  <area.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{t(area.titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(area.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATION TIERS + BANK DETAILS ─────────────────────────── */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

            {/* Left — Suggested amounts */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                {t('donate_amount_label')}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-8">
                {t('donate_amount_title')}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {tiers.map((tier, i) => (
                  <button
                    key={tier.amount}
                    onClick={() => { setSelectedTier(i); setCustomAmount('') }}
                    className={`rounded-2xl p-5 text-left border-2 transition-all ${
                      selectedTier === i && !customAmount
                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-2xl font-bold mb-1 ${
                      selectedTier === i && !customAmount ? 'text-white' : 'text-slate-900'
                    }`}>
                      {tier.mzn}
                    </p>
                    <p className={`text-sm ${
                      selectedTier === i && !customAmount ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {t(tier.label)}
                    </p>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('donate_custom_amount')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">MZN</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setSelectedTier(-1) }}
                    className="w-full pl-16 pr-4 py-4 rounded-xl border border-slate-200 text-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Donate CTA (placeholder — no real payment integration yet) */}
              <button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-4 px-8 rounded-full transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4" />
                {t('donate_cta_button')}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">{t('donate_cta_note')}</p>
            </div>

            {/* Right — Bank transfer details */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                {t('donate_bank_label')}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-8">
                {t('donate_bank_title')}
              </h2>

              <div className="bg-[#f2f0eb] rounded-2xl p-6 md:p-8 border border-slate-200/60">
                <div className="space-y-5">
                  {bankDetails.map((detail) => (
                    <div key={detail.field} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{detail.label}</p>
                        <p className="text-sm font-semibold text-slate-900 font-mono">{detail.value}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(detail.value, detail.field)}
                        className="p-2 rounded-lg hover:bg-white/60 transition-colors"
                        title="Copy"
                      >
                        {copiedField === detail.field
                          ? <Check className="w-4 h-4 text-green-600" />
                          : <Copy className="w-4 h-4 text-slate-400" />
                        }
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-300/50">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {t('donate_bank_reference')}
                  </p>
                </div>
              </div>

              {/* Trust signals */}
              <div className="mt-6 flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200/60">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('donate_trust_title')}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('donate_trust_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-2xl md:rounded-3xl px-6 md:px-10 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">{t('donate_bottom_cta_label')}</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight max-w-lg text-center md:text-left">
                {t('donate_bottom_cta_title')}
              </h2>
            </div>
            <div className="flex flex-col items-center gap-4 shrink-0">
              <Link
                to="/register"
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm py-4 px-8 rounded-full transition-all whitespace-nowrap flex items-center gap-2 shadow-lg"
              >
                {t('donate_bottom_cta_button')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-500">{t('donate_bottom_cta_note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-300/50 py-8 md:py-10 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-blue to-brand-purple rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              AP<span className="text-brand-red">+</span>SUSM
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} {t('footer_copyright')}
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link to="/register" className="hover:text-slate-700 transition-colors">{t('nav_register')}</Link>
            <Link to="/donate" className="hover:text-slate-700 transition-colors">{t('nav_donate')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
