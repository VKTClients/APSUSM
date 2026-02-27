import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, AlertCircle, Camera, Shield, CreditCard, ArrowRight, FileCheck } from 'lucide-react'
import { registerMember, initializePayment } from '../api'
import { useTranslation } from '../contexts/TranslationContext'

const PROVINCES = [
  'Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane',
  'Sofala', 'Manica', 'Tete', 'Zambezia',
  'Nampula', 'Cabo Delgado', 'Niassa'
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1=form, 2=review, 3=payment
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [registeredId, setRegisteredId] = useState(null)

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    institution: '', position: '',
    province: '', photo: null, termsAccepted: false
  })

  const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all placeholder:text-slate-400"

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
    setError('')
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError(t('reg_error_photo_type'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('reg_error_photo_size'))
      return
    }

    setForm({ ...form, photo: file })
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
  }

  const validateForm = () => {
    if (!form.fullName.trim()) return t('reg_error_name')
    if (!form.phone.trim()) return t('reg_error_phone')
    if (!form.email.trim()) return t('reg_error_email')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return t('reg_error_email_format')
    if (!form.institution.trim()) return t('reg_error_institution')
    if (!form.position.trim()) return t('reg_error_position')
    if (!form.province) return t('reg_error_province')
    if (!form.photo) return t('reg_error_photo')
    if (!form.termsAccepted) return t('reg_error_terms')
    return null
  }

  const handleReview = () => {
    const err = validateForm()
    if (err) { setError(err); return }
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('fullName', form.fullName)
      formData.append('email', form.email)
      formData.append('phone', form.phone)
      formData.append('institution', form.institution)
      formData.append('position', form.position)
      formData.append('province', form.province)
      formData.append('photo', form.photo)

      const result = await registerMember(formData)

      if (result.success) {
        setRegisteredId(result.memberId)
        setStep(3)

        // Initialize payment
        const payResult = await initializePayment(result.memberId)
        if (payResult.success && payResult.authorizationUrl) {
          window.location.href = payResult.authorizationUrl
        } else {
          setError(payResult.message || t('reg_error_payment'))
        }
      } else {
        setError(result.message || t('reg_error_failed'))
      }
    } catch (err) {
      setError(err.response?.data?.message || t('reg_error_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-radial from-brand-blue/5 to-transparent opacity-60 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-radial from-brand-green/5 to-transparent opacity-60 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center py-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-500 mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
            {t('reg_badge')}
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-medium text-slate-900 tracking-tight leading-tight mb-4">
            {t('reg_headline')}
          </h1>
          <p className="text-lg text-slate-500 font-light max-w-xl mx-auto">
            {t('reg_subheadline')}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-xl mx-auto px-6 mb-10">
        <div className="flex items-center justify-center gap-0">
          {[
            { num: 1, label: t('reg_step_details') },
            { num: 2, label: t('reg_step_review') },
            { num: 3, label: t('reg_step_payment') }
          ].map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step >= s.num
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs font-medium ${step >= s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-10 sm:w-20 h-0.5 mb-6 mx-1 sm:mx-2 ${step > s.num ? 'bg-slate-900' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto px-6 animate-slide-up">
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_full_name')} *</label>
              <input
                name="fullName" value={form.fullName} onChange={handleChange}
                className={inputClass}
                placeholder={t('reg_full_name_placeholder')}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_phone')} *</label>
              <input
                name="phone" value={form.phone} onChange={handleChange}
                className={inputClass}
                placeholder="+258 84 000 0000"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_email')} *</label>
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                className={inputClass}
                placeholder={t('reg_email_placeholder')}
              />
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_institution')} *</label>
              <input
                name="institution" value={form.institution} onChange={handleChange}
                className={inputClass}
                placeholder={t('reg_institution_placeholder')}
              />
            </div>

            {/* Position / Occupation */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_position')} *</label>
              <input
                name="position" value={form.position} onChange={handleChange}
                className={inputClass}
                placeholder={t('reg_position_placeholder')}
              />
            </div>

            {/* Province */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_province')} *</label>
              <select
                name="province" value={form.province} onChange={handleChange}
                className={`${inputClass} text-slate-600 appearance-none cursor-pointer`}
              >
                <option value="">{t('reg_province_placeholder')}</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">{t('reg_photo')} *</label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    photoPreview ? 'border-brand-blue/30 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    {photoPreview ? (
                      <div className="flex items-center gap-4">
                        <img src={photoPreview} alt="Preview" className="w-20 h-24 object-cover rounded-lg border border-slate-200" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-700">{form.photo?.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{(form.photo?.size / 1024 / 1024).toFixed(2)} MB</p>
                          <p className="text-xs text-brand-blue mt-1">{t('reg_photo_change')}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">{t('reg_photo_upload')}</p>
                        <p className="text-xs text-slate-400 mt-1">{t('reg_photo_hint')}</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/jpg" onChange={handlePhoto} className="hidden" />
                </label>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={form.termsAccepted}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 cursor-pointer"
              />
              <label className="text-sm text-slate-600 leading-relaxed cursor-pointer" onClick={() => setForm({ ...form, termsAccepted: !form.termsAccepted })}>
                <FileCheck className="w-4 h-4 inline-block mr-1 text-slate-400 -mt-0.5" />
                {t('reg_terms_label')}
              </label>
            </div>

            <button
              onClick={handleReview}
              className="w-full bg-slate-900 text-white font-medium py-3.5 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {t('reg_review_btn')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5 sm:space-y-6">
            <h3 className="text-lg font-semibold text-slate-900">{t('reg_review_title')}</h3>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              {photoPreview && (
                <img src={photoPreview} alt="Portrait" className="w-20 h-24 object-cover rounded-lg border border-slate-200" />
              )}
              <div>
                <p className="text-lg font-semibold text-slate-900">{form.fullName}</p>
                <p className="text-sm text-slate-500">{form.position}</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                [t('reg_phone'), form.phone],
                [t('reg_email'), form.email],
                [t('reg_institution'), form.institution],
                [t('reg_position'), form.position],
                [t('reg_province'), form.province],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800 mb-1">
                <CreditCard className="w-4 h-4" />
                {t('reg_payment_required')}
              </div>
              <p className="text-xs text-blue-600">
                {t('reg_payment_desc')}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
              >
                {t('reg_edit_btn')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white font-medium py-3.5 rounded-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('reg_processing')}
                  </>
                ) : (
                  <>
                    {t('reg_confirm_btn')}
                    <Shield className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-blue mx-auto animate-spin" />
            <h3 className="text-lg font-semibold text-slate-900">{t('reg_redirecting')}</h3>
            <p className="text-sm text-slate-500">{t('reg_redirecting_desc')}</p>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
                <button
                  onClick={() => { setStep(2); setError('') }}
                  className="block mt-2 text-brand-blue underline text-xs"
                >
                  {t('reg_go_back')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {t('reg_privacy')}
          </p>
        </div>
      </div>
    </div>
  )
}
