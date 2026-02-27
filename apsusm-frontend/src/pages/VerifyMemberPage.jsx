import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { verifyMember } from '../api'

export default function VerifyMemberPage() {
  const { memberId } = useParams()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await verifyMember(memberId)
        setResult(data)
      } catch (err) {
        setResult({ verified: false, message: 'Verification service unavailable' })
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [memberId])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-brand-blue mx-auto animate-spin mb-4" />
          <p className="text-slate-500">Verifying membership...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <div className="max-w-md mx-auto px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-purple rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">Membership Verification</h1>
          <p className="text-sm text-slate-500 mt-1 font-mono tracking-wide">{memberId}</p>
        </div>

        {result?.verified ? (
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
            <div className="bg-green-50 p-6 text-center border-b border-green-200">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-green-800">Verified Member</h2>
              <p className="text-sm text-green-600 mt-1">This is a valid APSUSM credential</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                ['Member ID', result.memberId],
                ['Name', result.name],
                ['Position', result.position || 'N/A'],
                ['Province', result.province || 'N/A'],
                ['Status', result.status],
                ['Expires', result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : 'N/A'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="bg-red-50 p-6 text-center">
              <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-red-800">Not Found</h2>
              <p className="text-sm text-red-600 mt-1">{result?.message || 'This member ID could not be verified'}</p>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          APSUSM — Associação dos Profissionais de Saúde Unidos e Solidários de Moçambique
        </p>
      </div>
    </div>
  )
}
