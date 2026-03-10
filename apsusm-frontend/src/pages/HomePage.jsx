import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Shield,
  Mail,
  BadgeCheck,
  Heart,
  Handshake,
  Megaphone,
  Award,
  FileCheck,
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
    icon: FileCheck,
    titleKey: 'reg_payment_required',
    descKey: 'reg_payment_desc',
  },
  {
    icon: Mail,
    titleKey: 'feature_email_title',
    descKey: 'feature_email_desc',
  },
]

const steps = [
  { num: '01', titleKey: 'process_1_title', descKey: 'process_1_desc' },
  { num: '02', titleKey: 'process_2_title', descKey: 'reg_payment_desc' },
  { num: '03', titleKey: 'process_3_title', descKey: 'process_3_desc' },
]

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#f2f0eb] font-sans">
      <section className="relative flex min-h-[80vh] items-center overflow-hidden pt-20 md:min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(237,28,36,0.12),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(46,99,188,0.14),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,206,0,0.16),_transparent_22%),linear-gradient(135deg,_rgba(38,153,70,0.08),_rgba(242,240,235,0))]" />
        <div className="max-w-7xl mx-auto w-full px-6">
          <div className="grid min-h-[calc(80vh-5rem)] items-center gap-8 py-8 md:min-h-[calc(100vh-5rem)] md:py-16 lg:grid-cols-2 lg:gap-12">
            <div className="relative z-10 flex flex-col justify-center">
              <div className="mb-6 flex items-center gap-3 md:mb-10">
                <div className="h-px w-6 bg-slate-400" />
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-400">
                    <ArrowRight className="h-3 w-3" />
                  </div>
                  {t('hero_tag')}{' '}
                  <span className="font-semibold text-slate-900">{t('hero_tag_suffix')}</span>
                </div>
              </div>

              <h1 className="mb-6 text-[clamp(2.25rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-tight text-slate-900 md:mb-8">
                APSUSM
                <br />
                {t('hero_title').split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}
                    <br />
                  </React.Fragment>
                ))}
              </h1>

              <p className="mb-6 max-w-md text-base font-light leading-relaxed text-slate-500 md:mb-10 md:text-lg">
                {t('hero_subtitle')}
              </p>

              <div className="mb-6 inline-flex w-fit items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur-sm md:mb-10">
                <img
                  src="/brand/Logo.png"
                  alt="APSUSM"
                  className="h-10 w-10 object-contain"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">APSUSM</p>
                  <p className="text-sm text-slate-700">
                    Unified membership for health professionals in Mozambique
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800"
                >
                  {t('hero_cta_primary')}
                </Link>
                <a
                  href="#how-it-works"
                  className="group flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-900"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400 transition-colors group-hover:border-slate-700">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  {t('hero_cta_secondary')}
                </a>
              </div>
            </div>

            <div className="relative z-10 flex justify-center lg:hidden">
              <div className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/80 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-sm">
                <img
                  src="/brand/HomepageExample.png"
                  alt="APSUSM membership card example"
                  className="w-full rounded-[1.5rem] object-cover"
                />
              </div>
            </div>

            <div className="relative z-10 hidden h-[560px] items-center justify-center lg:flex">
              <div className="absolute inset-0 rounded-[2rem] border border-white/60 bg-white/50 shadow-2xl shadow-slate-900/5 backdrop-blur-sm" />
              <div className="absolute inset-x-10 top-0 h-2 rounded-full bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />

              <div className="relative flex h-full w-full items-center justify-center px-10">
                <div className="absolute left-2 top-16 w-48 rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-xl">
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src="/brand/Logo.png"
                      alt="APSUSM logo"
                      className="h-10 w-10 object-contain"
                    />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Verified</p>
                      <p className="text-sm font-semibold text-slate-900">Member card</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    Real APSUSM-issued digital card for identification and verification.
                  </p>
                </div>

                <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
                  <img
                    src="/brand/HomepageExample.png"
                    alt="APSUSM membership card example"
                    className="w-full rounded-[1.5rem] object-cover"
                  />
                </div>

                <div className="absolute bottom-12 right-4 w-56 rounded-[1.75rem] bg-[#c8c2b4] p-5 shadow-xl">
                  <p className="text-4xl font-bold leading-none text-slate-900">11</p>
                  <p className="mt-2 text-sm leading-snug text-slate-700">
                    Provinces connected through one membership system
                  </p>
                </div>

                <div className="absolute right-10 top-14 flex h-16 w-16 items-center justify-center rounded-full bg-brand-red text-white shadow-xl">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-300/50 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight text-slate-900">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500">{t(s.label)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t('features_title')}
            </p>
            <h2 className="max-w-lg text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {t('features_subtitle')}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.titleKey}
                className={`rounded-2xl p-6 ${
                  i % 2 === 0 ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${
                    i % 2 === 0 ? 'bg-white/10' : 'bg-slate-100'
                  }`}
                >
                  <f.icon className={`h-5 w-5 ${i % 2 === 0 ? 'text-white' : 'text-slate-700'}`} />
                </div>
                <h3 className={`mb-2 text-base font-semibold ${i % 2 === 0 ? 'text-white' : 'text-slate-900'}`}>
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

      <section className="bg-white/50 px-4 py-12 md:px-6 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t('mission_label')}
              </p>
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {t('mission_title')}
              </h2>
              <p className="mb-6 leading-relaxed text-slate-500">{t('mission_body')}</p>
              <p className="border-l-4 border-brand-blue pl-4 text-sm font-medium leading-relaxed text-slate-600">
                {t('mission_closing')}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: Megaphone,
                  titleKey: 'pillar_advocacy_title',
                  descKey: 'pillar_advocacy_desc',
                  color: 'bg-red-50 text-red-600',
                },
                {
                  icon: Award,
                  titleKey: 'pillar_appreciation_title',
                  descKey: 'pillar_appreciation_desc',
                  color: 'bg-blue-50 text-blue-600',
                },
                {
                  icon: Handshake,
                  titleKey: 'pillar_representation_title',
                  descKey: 'pillar_representation_desc',
                  color: 'bg-emerald-50 text-emerald-600',
                },
                {
                  icon: Heart,
                  titleKey: 'pillar_solidarity_title',
                  descKey: 'pillar_solidarity_desc',
                  color: 'bg-purple-50 text-purple-600',
                },
              ].map((p) => (
                <div key={p.titleKey} className="rounded-2xl border border-slate-200/60 bg-[#f2f0eb] p-6">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${p.color}`}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{t(p.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{t(p.descKey)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white/50 px-4 py-12 md:px-6 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-14">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t('process_title')}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {t('process_subtitle')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.num} className="relative rounded-2xl border border-slate-200/60 bg-[#f2f0eb] p-8">
                {i < steps.length - 1 && (
                  <div className="absolute -right-3 top-10 z-10 hidden md:block">
                    <ArrowRight className="h-5 w-5 text-slate-400" />
                  </div>
                )}
                <span className="mb-6 block text-5xl font-bold leading-none text-slate-200">{s.num}</span>
                <h3 className="mb-3 text-lg font-semibold text-slate-900">{t(s.titleKey)}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-6 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-slate-900 px-6 py-10 md:flex-row md:gap-8 md:rounded-3xl md:px-10 md:py-14">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-slate-400">{t('cta_title')}</p>
              <h2 className="max-w-lg text-center text-2xl font-bold tracking-tight text-white md:text-left md:text-4xl">
                {t('cta_subtitle')}
              </h2>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-100"
              >
                {t('cta_button')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-slate-500">{t('cta_note')}</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-300/50 px-4 py-8 md:px-6 md:py-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/brand/Logo.png"
              alt="APSUSM logo"
              className="h-9 w-auto object-contain"
            />
            <span className="text-sm font-semibold text-slate-800">
              AP<span className="text-brand-red">+</span>SUSM
            </span>
          </div>
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {t('footer_copyright')}
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link to="/register" className="transition-colors hover:text-slate-700">
              {t('nav_register')}
            </Link>
            <Link to="/donate" className="transition-colors hover:text-slate-700">
              {t('nav_donate')}
            </Link>
            <Link to="/admin" className="transition-colors hover:text-slate-700">
              {t('nav_admin')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
