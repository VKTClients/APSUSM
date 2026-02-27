import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Download, Mail, Shield, CreditCard } from 'lucide-react'
import { getMemberStatus, getCardFrontUrl, getCardBackUrl, getMockCardUrl, getMockCardBackUrl } from '../api'
import { shouldUseMock } from '../mockPaystack'

export default function SuccessPage() {
  const { id } = useParams()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mockCardUrl, setMockCardUrl] = useState(null)
  const [mockCardBackUrl, setMockCardBackUrl] = useState(null)

  useEffect(() => {
    // Check for mock-generated cards
    if (shouldUseMock()) {
      const url = getMockCardUrl()
      if (url) setMockCardUrl(url)
      const backUrl = getMockCardBackUrl()
      if (backUrl) setMockCardBackUrl(backUrl)
    }

    const fetchStatus = async () => {
      try {
        const result = await getMemberStatus(id)
        if (result.success) {
          setMember(result.member)
          // Also check if member has card URLs from mock
          if (result.member.cardUrl) {
            setMockCardUrl(result.member.cardUrl)
          }
          if (result.member.cardBackUrl) {
            setMockCardBackUrl(result.member.cardBackUrl)
          }
        }
      } catch (err) {
        console.error('Failed to fetch member status', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStatus()
    // Poll for card generation (only needed for real backend)
    const interval = shouldUseMock() ? null : setInterval(fetchStatus, 3000)
    return () => { if (interval) clearInterval(interval) }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <div className="max-w-2xl mx-auto px-6 animate-fade-in">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight mb-3">
            Welcome to APSUSM!
          </h1>
          <p className="text-slate-500 text-lg font-light">
            Your membership has been confirmed. You are now a verified member.
          </p>
        </div>

        {member && (
          <>
            {/* Member ID Badge */}
            {member.memberId && (
              <div className="text-center mb-8">
                <div className="inline-block px-8 py-4 bg-slate-900 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Your Member ID</p>
                  <p className="text-lg sm:text-2xl font-bold text-white font-mono tracking-wider break-all">{member.memberId}</p>
                </div>
              </div>
            )}

            {/* Details Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 space-y-3">
                {[
                  ['Full Name', member.fullName],
                  ['Email', member.email],
                  ['Phone', member.phone || 'N/A'],
                  ['Institution', member.institution || 'N/A'],
                  ['Position', member.position || 'N/A'],
                  ['Province', member.province],
                  ['Status', member.status],
                  ['Registered', member.registeredAt ? new Date(member.registeredAt).toLocaleDateString() : 'N/A'],
                  ['Expires', member.expiresAt ? new Date(member.expiresAt).toLocaleDateString() : 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className={`text-sm font-medium ${
                      value === 'ACTIVE' || value === 'CARD_GENERATED' ? 'text-green-600' :
                      value === 'PAID' ? 'text-blue-600' : 'text-slate-700'
                    }`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Preview & Download */}
            {(member.hasCard || mockCardUrl) ? (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Your Membership Card
                </h3>

                {/* Mock-generated cards (front + back) */}
                {mockCardUrl ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Front</p>
                      <img
                        src={mockCardUrl}
                        alt="Card Front"
                        className="w-full rounded-xl shadow-lg border border-slate-200"
                      />
                      <a
                        href={mockCardUrl}
                        download={`${member.memberId || 'card'}_front.png`}
                        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Front
                      </a>
                    </div>
                    {mockCardBackUrl && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Back</p>
                        <img
                          src={mockCardBackUrl}
                          alt="Card Back"
                          className="w-full rounded-xl shadow-lg border border-slate-200"
                        />
                        <a
                          href={mockCardBackUrl}
                          download={`${member.memberId || 'card'}_back.png`}
                          className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download Back
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Real backend cards (front + back) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Front</p>
                      <img
                        src={getCardFrontUrl(id)}
                        alt="Card Front"
                        className="w-full rounded-xl shadow-lg border border-slate-200"
                      />
                      <a
                        href={getCardFrontUrl(id)}
                        download={`${member.memberId}_front.png`}
                        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Front
                      </a>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Back</p>
                      <img
                        src={getCardBackUrl(id)}
                        alt="Card Back"
                        className="w-full rounded-xl shadow-lg border border-slate-200"
                      />
                      <a
                        href={getCardBackUrl(id)}
                        download={`${member.memberId}_back.png`}
                        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download Back
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-blue-50 border border-blue-200 rounded-xl mb-8">
                <div className="animate-spin w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full mx-auto mb-3" />
                <p className="text-sm font-medium text-blue-800">Generating your membership card...</p>
                <p className="text-xs text-blue-600 mt-1">This page will update automatically.</p>
              </div>
            )}

            {/* Email notification */}
            {member.emailSent && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                <Mail className="w-5 h-5 shrink-0" />
                A confirmation email with your digital card has been sent to <strong>{member.email}</strong>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-10">
          <Link
            to="/"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
