import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight, ArrowRight, Shield, CreditCard,
  Mail, Stethoscope, QrCode, BadgeCheck,
  Heart, Handshake, Megaphone, Award
} from 'lucide-react'
import { useTranslation } from '../contexts/TranslationContext'

const stats = [
  { value: '5,000+', label: 'stats_members' },
  { value: '11', label: 'stats_provinces' },
  { value: '100%', label: 'stats_secure' },
  { value: '24h', label: 'stats_card' },
]

const features = [
  {
    icon: BadgeCheck,
    titleKey: 'feature_card_title',
    descKey: 'feature_card_desc',
  },
  {
    icon: Shield,
    titleKey: 'feature_verify_title',
    descKey: 'feature_verify_desc',
  },
  {
    icon: CreditCard,
    titleKey: 'feature_payment_title',
    descKey: 'feature_payment_desc',
  },
  {
    icon: Mail,
    titleKey: 'feature_email_title',
    descKey: 'feature_email_desc',
  },
]

const steps = [
  { num: '01', titleKey: 'process_1_title', descKey: 'process_1_desc' },
  { num: '02', titleKey: 'process_2_title', descKey: 'process_2_desc' },
  { num: '03', titleKey: 'process_3_title', descKey: 'process_3_desc' },
]

export default function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="bg-[#f2f0eb] min-h-screen font-sans">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="min-h-[80vh] md:min-h-screen pt-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[calc(80vh-5rem)] md:min-h-[calc(100vh-5rem)] py-8 md:py-16">

            {/* Left — headline */}
            <div className="flex flex-col justify-center">
              {/* Tag */}
              <div className="flex items-center gap-3 mb-6 md:mb-10">
                <div className="w-6 h-px bg-slate-400" />
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  {t('hero_tag')}{' '}
                  <span className="font-semibold text-slate-900">{t('hero_tag_suffix')}</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-[clamp(2.25rem,7vw,5.5rem)] font-bold text-slate-900 leading-[0.92] tracking-tight mb-6 md:mb-8">
                APSUSM<br />
                {t('hero_title').split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}<br />
                  </React.Fragment>
                ))}
              </h1>

              <p className="text-slate-500 text-base md:text-lg font-light leading-relaxed max-w-md mb-6 md:mb-10">
                {t('hero_subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  to="/register"
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-4 px-8 rounded-full transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2"
                >
                  {t('hero_cta_primary')}
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full border border-slate-400 flex items-center justify-center group-hover:border-slate-700 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                  {t('hero_cta_secondary')}
                </a>
              </div>
            </div>

            {/* Mobile — compact card preview */}
            <div className="flex lg:hidden justify-center mt-4 mb-2">
              <div className="w-full max-w-xs bg-slate-900 text-white rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-7 h-7 rounded-full bg-brand-red/90 flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono tracking-widest">APSUSM</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">Member ID</p>
                <p className="font-mono font-semibold text-base tracking-widest text-white mb-3">APSUSM-2025-0042</p>
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-sm font-medium text-white">Dr. Ana Machava</p>
                  <p className="text-xs text-slate-400 mt-0.5">Internal Medicine · Maputo</p>
                </div>
              </div>
            </div>

            {/* Desktop — floating cards */}
            <div className="relative hidden lg:flex items-center justify-center h-[520px]">

              {/* Background blob */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200/60 to-transparent rounded-3xl" />

              {/* Main card — dark */}
              <div className="absolute top-8 right-4 w-72 bg-slate-900 text-white rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-red/90 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono tracking-widest">APSUSM</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">Member ID</p>
                <p className="font-mono font-semibold text-lg tracking-widest text-white mb-4">APSUSM-2025-0042</p>
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-sm font-medium text-white">Dr. Ana Machava</p>
                  <p className="text-xs text-slate-400 mt-0.5">Internal Medicine · Maputo</p>
                </div>
              </div>

              {/* Orange arrow accent */}
              <div className="absolute top-6 right-[calc(18rem-1.5rem)] w-14 h-14 bg-brand-red rounded-full flex items-center justify-center shadow-xl z-10">
                <ArrowDownRight className="w-6 h-6 text-white" />
              </div>

              {/* Feature card — QR */}
              <div className="absolute bottom-24 left-0 w-56 bg-white rounded-2xl p-5 shadow-xl border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-slate-700" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">QR Verified</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">Scan any card to instantly verify membership status.</p>
                <div className="mt-3 flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>

              {/* Stat card */}
              <div className="absolute top-1/2 left-8 -translate-y-1/2 w-40 bg-[#c8c2b4] rounded-2xl p-5 shadow-lg">
                <p className="text-4xl font-bold text-slate-900 leading-none">5k+</p>
                <p className="text-xs text-slate-600 mt-2 leading-snug">Verified health professionals</p>
              </div>

              {/* Stethoscope decorative card */}
              <div className="absolute bottom-8 right-12 w-14 h-14 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-brand-blue" />
              </div>

              {/* Sunburst / decorative ring */}
              <div className="absolute bottom-20 left-32 w-16 h-16 rounded-full border-2 border-slate-400/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-slate-400/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section className="border-t border-b border-slate-300/50 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1">{t(s.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{t('features_title')}</p>
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight max-w-lg">
              {t('features_subtitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.titleKey}
                className={`rounded-2xl p-6 ${i % 2 === 0 ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
                  i % 2 === 0 ? 'bg-white/10' : 'bg-slate-100'
                }`}>
                  <f.icon className={`w-5 h-5 ${i % 2 === 0 ? 'text-white' : 'text-slate-700'}`} />
                </div>
                <h3 className={`font-semibold text-base mb-2 ${i % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>
                  {t(f.titleKey)}
                </h3>
                <p className={`text-sm leading-relaxed ${i % 2 === 0 ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────── */}
      <section className="py-12 md:py-24 px-4 md:px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            {/* Left — mission statement */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{t('mission_label')}</p>
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6">
                {t('mission_title')}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                {t('mission_body')}
              </p>
              <p className="text-slate-600 font-medium text-sm leading-relaxed border-l-4 border-brand-blue pl-4">
                {t('mission_closing')}
              </p>
            </div>

            {/* Right — four pillars */}
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: Megaphone, titleKey: 'pillar_advocacy_title', descKey: 'pillar_advocacy_desc', color: 'bg-red-50 text-red-600' },
                { icon: Award, titleKey: 'pillar_appreciation_title', descKey: 'pillar_appreciation_desc', color: 'bg-blue-50 text-blue-600' },
                { icon: Handshake, titleKey: 'pillar_representation_title', descKey: 'pillar_representation_desc', color: 'bg-emerald-50 text-emerald-600' },
                { icon: Heart, titleKey: 'pillar_solidarity_title', descKey: 'pillar_solidarity_desc', color: 'bg-purple-50 text-purple-600' },
              ].map((p) => (
                <div key={p.titleKey} className="bg-[#f2f0eb] rounded-2xl p-6 border border-slate-200/60">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${p.color}`}>
                    <p.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{t(p.titleKey)}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{t(p.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section id="how-it-works" className="py-12 md:py-24 px-4 md:px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{t('process_title')}</p>
            <h2 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">{t('process_subtitle')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.num} className="relative bg-[#f2f0eb] rounded-2xl p-8 border border-slate-200/60">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-3 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <span className="block text-5xl font-bold text-slate-200 mb-6 leading-none">{s.num}</span>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">{t(s.titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-2xl md:rounded-3xl px-6 md:px-10 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">{t('cta_title')}</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight max-w-lg text-center md:text-left">
                {t('cta_subtitle')}
              </h2>
            </div>
            <div className="flex flex-col items-center gap-4 shrink-0">
              <Link
                to="/register"
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm py-4 px-8 rounded-full transition-all whitespace-nowrap flex items-center gap-2 shadow-lg"
              >
                {t('cta_button')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-slate-500">{t('cta_note')}</p>
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
            <Link to="/admin" className="hover:text-slate-700 transition-colors">{t('nav_admin')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
