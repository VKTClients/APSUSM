import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react'
import { verifyPayment } from '../api'

export default function PaymentVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, generating, success, failed
  const [message, setMessage] = useState('')
  const [memberId, setMemberId] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  // Elapsed time counter for AI generation
  useEffect(() => {
    if (status === 'generating') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref')
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference found')
      return
    }

    const verify = async () => {
      try {
        // Show generating state while the API call runs
        // (verifyPayment triggers AI card generation in mock mode)
        setStatus('generating')
        const result = await verifyPayment(reference)
        if (result.success) {
          setStatus('success')
          setMemberId(result.member?.id)
          setTimeout(() => {
            navigate(`/success/${result.member?.id}`)
          }, 2000)
        } else {
          setStatus('failed')
          setMessage(result.message || 'Payment verification failed')
        }
      } catch (err) {
        setStatus('failed')
        setMessage(err.response?.data?.message || 'Verification failed. Please contact support.')
      }
    }

    verify()
  }, [searchParams, navigate])

  const formatTime = (s) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6 text-center animate-fade-in">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 text-brand-blue mx-auto animate-spin mb-6" />
            <h2 className="text-2xl font-medium text-slate-900 mb-3">Verifying Payment...</h2>
            <p className="text-slate-500">Please wait while we confirm your payment with Paystack.</p>
          </>
        )}

        {status === 'generating' && (
          <>
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-medium text-slate-900 mb-3">Generating Your Card...</h2>
            <p className="text-slate-500 mb-4">
              Our AI is creating your personalized membership card. This may take up to 30 seconds.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Processing — {formatTime(elapsed)}</span>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-medium text-slate-900 mb-3">Card Ready!</h2>
            <p className="text-slate-500">Your membership card has been generated. Redirecting...</p>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-medium text-slate-900 mb-3">Payment Failed</h2>
            <p className="text-slate-500 mb-6">{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-all"
            >
              Back to Registration
            </button>
          </>
        )}
      </div>
    </div>
  )
}
