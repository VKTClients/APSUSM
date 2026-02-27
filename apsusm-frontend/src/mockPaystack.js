// Mock Paystack for development when backend isn't available

const CARD_GENERATOR_URL = 'http://localhost:5500'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function _generateMemberId() {
  const year = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')
  return `APSUSM-DR-${year}-${num}`
}

function _fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function _getMockMember() {
  const stored = sessionStorage.getItem('mockMember')
  return stored ? JSON.parse(stored) : null
}

const _PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function _formatDatePT(date) {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = _PT_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// ---------------------------------------------------------------------------
// Mock Registration — stores REAL form data (name + photo) in sessionStorage
// ---------------------------------------------------------------------------
export async function mockRegisterMember(formData) {
  // Extract fields from FormData
  const fullName = formData.get('fullName') || ''
  const email = formData.get('email') || ''
  const phone = formData.get('phone') || ''
  const institution = formData.get('institution') || ''
  const position = formData.get('position') || ''
  const province = formData.get('province') || ''
  const photoFile = formData.get('photo')

  // Convert photo to base64 for sessionStorage persistence
  let photoBase64 = null
  if (photoFile && photoFile instanceof File) {
    photoBase64 = await _fileToBase64(photoFile)
  }

  const mockId = `mock_${Date.now()}`
  const memberId = _generateMemberId()

  // Store full member data for later use
  const memberData = {
    id: mockId,
    memberId,
    fullName,
    email,
    phone,
    institution,
    position,
    province,
    photoBase64,
    status: 'PENDING_PAYMENT',
    hasCard: false,
    emailSent: false,
    registeredAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }

  sessionStorage.setItem('mockMember', JSON.stringify(memberData))

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 500))

  return {
    success: true,
    message: 'Registration successful',
    memberId: mockId,   // <-- RegisterPage reads result.memberId
    status: 'PENDING_PAYMENT',
  }
}

// ---------------------------------------------------------------------------
// Mock Payment Initialization
// ---------------------------------------------------------------------------
export function mockPaystackPayment(memberId) {
  const mockReference = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const mockAuthUrl = `${window.location.origin}/payment/verify?reference=${mockReference}`

  // Tag the payment reference onto the stored member
  const member = _getMockMember()
  if (member) {
    member.paymentReference = mockReference
    sessionStorage.setItem('mockMember', JSON.stringify(member))
  }

  sessionStorage.setItem('mockPaymentRef', mockReference)

  return {
    success: true,
    authorizationUrl: mockAuthUrl,   // <-- RegisterPage reads payResult.authorizationUrl
    reference: mockReference,
  }
}

// ---------------------------------------------------------------------------
// Mock Payment Verification — triggers card generation
// ---------------------------------------------------------------------------
export async function mockVerifyPayment(reference) {
  const storedRef = sessionStorage.getItem('mockPaymentRef')
  if (!storedRef || !reference.startsWith('MOCK_')) {
    return null // not a mock reference, let real API handle it
  }
  if (storedRef !== reference) {
    return { success: false, message: 'Invalid reference' }
  }

  const member = _getMockMember()
  if (!member) {
    return { success: false, message: 'No registration data found' }
  }

  // Update member status to ACTIVE
  member.status = 'ACTIVE'
  member.paidAt = new Date().toISOString()

  // Try to generate front + back cards via card-generator API
  let cardUrl = null
  let cardBackUrl = null
  if (member.photoBase64) {
    try {
      cardUrl = await _generateCardViaAPI(member)
      member.hasCard = true
      member.cardGeneratedAt = new Date().toISOString()
      member.cardUrl = cardUrl
    } catch (err) {
      console.warn('Front card generation failed (is card-generator running on :5500?):', err)
      member.hasCard = false
    }
    try {
      cardBackUrl = await _generateBackCardViaAPI(member)
      member.cardBackUrl = cardBackUrl
    } catch (err) {
      console.warn('Back card generation failed:', err)
    }
  }

  member.emailSent = true
  sessionStorage.setItem('mockMember', JSON.stringify(member))
  sessionStorage.removeItem('mockPaymentRef')

  return {
    success: true,
    message: 'Payment verified successfully',
    reference,
    member: {
      id: member.id,
      memberId: member.memberId,
      status: member.status,
      hasCard: member.hasCard,
      emailSent: member.emailSent,
      paidAt: member.paidAt,
      cardGeneratedAt: member.cardGeneratedAt,
      expiresAt: member.expiresAt,
    },
  }
}

// ---------------------------------------------------------------------------
// Call the Python card generator API
// ---------------------------------------------------------------------------
async function _generateCardViaAPI(member) {
  // Convert base64 data URL back to a Blob
  const res = await fetch(member.photoBase64)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append('full_name', member.fullName)
  formData.append('photo', blob, 'photo.jpg')
  formData.append('member_id', member.memberId)
  formData.append('email', member.email || '')

  const response = await fetch(`${CARD_GENERATOR_URL}/api/generate-card`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Card generator returned ${response.status}`)
  }

  const cardBlob = await response.blob()
  const cardUrl = URL.createObjectURL(cardBlob)

  // Store for later retrieval
  sessionStorage.setItem('mockCardUrl', cardUrl)
  return cardUrl
}

async function _generateBackCardViaAPI(member) {
  const membroDesde = _formatDatePT(member.registeredAt || new Date())
  const validoAte = _formatDatePT(member.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))

  const formData = new FormData()
  formData.append('membro_desde_date', membroDesde)
  formData.append('valido_ate_date', validoAte)

  const response = await fetch(`${CARD_GENERATOR_URL}/api/generate-card-back`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Back card generator returned ${response.status}`)
  }

  const cardBlob = await response.blob()
  const cardBackUrl = URL.createObjectURL(cardBlob)

  sessionStorage.setItem('mockCardBackUrl', cardBackUrl)
  return cardBackUrl
}

// ---------------------------------------------------------------------------
// Mock Member Status — returns REAL registered data
// ---------------------------------------------------------------------------
export function mockGetMemberStatus(memberId) {
  const member = _getMockMember()
  if (!member) {
    // Fallback if no stored data
    return {
      success: true,
      member: {
        id: memberId,
        memberId: _generateMemberId(),
        fullName: 'Mock Member',
        email: 'mock@example.com',
        status: 'ACTIVE',
        hasCard: false,
        emailSent: false,
      },
    }
  }

  return {
    success: true,
    member: {
      id: member.id,
      memberId: member.memberId,
      fullName: member.fullName,
      email: member.email,
      institution: member.institution,
      position: member.position,
      province: member.province,
      status: member.status,
      hasCard: member.hasCard,
      emailSent: member.emailSent,
      registeredAt: member.registeredAt,
      paidAt: member.paidAt,
      cardGeneratedAt: member.cardGeneratedAt,
      expiresAt: member.expiresAt,
      cardUrl: member.cardUrl || null,
      cardBackUrl: member.cardBackUrl || null,
    },
  }
}

// ---------------------------------------------------------------------------
// Mock Member Verification (public)
// ---------------------------------------------------------------------------
export function mockVerifyMember(memberId) {
  const member = _getMockMember()
  const data = member || {}

  return {
    verified: true,
    memberId: data.memberId || memberId,
    name: data.fullName || 'Mock Member',
    position: data.position || 'N/A',
    province: data.province || 'N/A',
    status: data.status || 'ACTIVE',
    expiresAt: data.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Should we use mock mode?
// ---------------------------------------------------------------------------
export function shouldUseMock() {
  return import.meta.env.DEV && window.location.hostname === 'localhost'
}

// ---------------------------------------------------------------------------
// Get the generated card URL (for SuccessPage)
// ---------------------------------------------------------------------------
export function getMockCardUrl() {
  const member = _getMockMember()
  return member?.cardUrl || sessionStorage.getItem('mockCardUrl') || null
}

export function getMockCardBackUrl() {
  const member = _getMockMember()
  return member?.cardBackUrl || sessionStorage.getItem('mockCardBackUrl') || null
}
