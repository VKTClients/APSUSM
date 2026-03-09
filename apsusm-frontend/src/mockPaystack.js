// Mock Paystack for development when backend isn't available

const CARD_GENERATOR_URL = 'http://localhost:5500'
const CARD_GENERATOR_UNAVAILABLE_MESSAGE =
  'Card generator service is not running on http://localhost:5500. Start the Flask card generator to render mock cards.'

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

export function isMockReference(reference) {
  return typeof reference === 'string' && reference.startsWith('MOCK_')
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
  const photoMode = formData.get('photoMode') || 'original'

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
    photoMode,
    status: 'ACTIVE',
    hasCard: false,
    emailSent: false,
    registeredAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }

  sessionStorage.setItem('mockMember', JSON.stringify(memberData))

  // Simulate processing delay
  await new Promise((r) => setTimeout(r, 500))

  return {
    success: true,
    message: 'Registration successful',
    memberId: mockId,   // <-- RegisterPage reads result.memberId
    status: 'ACTIVE',
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
  if (!isMockReference(reference)) {
    return null // not a mock reference, let real API handle it
  }

  const member = _getMockMember()
  if (!member) {
    return { success: false, message: 'No registration data found' }
  }

  const storedRef = sessionStorage.getItem('mockPaymentRef')
  const expectedReference = member.paymentReference || storedRef
  if (expectedReference && expectedReference !== reference) {
    return { success: false, message: 'Invalid reference' }
  }

  // Update member status to ACTIVE
  member.status = 'ACTIVE'
  member.paidAt = new Date().toISOString()

  // Card generation is now handled by SuccessPage so the user
  // sees a proper loading spinner while the AI works.
  member.hasCard = false
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

async function _fetchCardGenerator(path, options = {}) {
  let response
  try {
    response = await fetch(`${CARD_GENERATOR_URL}${path}`, options)
  } catch {
    throw new Error(CARD_GENERATOR_UNAVAILABLE_MESSAGE)
  }

  if (!response.ok) {
    throw new Error(`Card generator returned ${response.status}`)
  }

  return response
}

// ---------------------------------------------------------------------------
// Call the Python card generator API
// ---------------------------------------------------------------------------
export async function generateCardViaAPI(member) {
  // Convert base64 data URL back to a Blob
  const res = await fetch(member.photoBase64)
  const blob = await res.blob()

  const formData = new FormData()
  formData.append('full_name', member.fullName)
  formData.append('photo', blob, 'photo.jpg')
  formData.append('member_id', member.memberId)
  formData.append('user_id', member.id)
  formData.append('email', member.email || '')
  formData.append('photo_mode', member.photoMode || 'original')

  const response = await _fetchCardGenerator('/api/generate-card-ai', {
    method: 'POST',
    body: formData,
  })

  const cardBlob = await response.blob()
  const cardUrl = URL.createObjectURL(cardBlob)

  // Store for later retrieval
  sessionStorage.setItem('mockCardUrl', cardUrl)
  return cardUrl
}

export async function generateBackCardViaAPI(member) {
  const membroDesde = _formatDatePT(member.registeredAt || new Date())
  const validoAte = _formatDatePT(member.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))

  const formData = new FormData()
  formData.append('membro_desde_date', membroDesde)
  formData.append('valido_ate_date', validoAte)

  const response = await _fetchCardGenerator('/api/generate-card-back', {
    method: 'POST',
    body: formData,
  })

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
