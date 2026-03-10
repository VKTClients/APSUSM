import axios from 'axios';
import {
  shouldUseMock, mockRegisterMember, mockPaystackPayment,
  mockVerifyPayment, mockGetMemberStatus, mockVerifyMember,
  isMockReference,
  getMockCardUrl as _getMockCardUrl,
  getMockCardBackUrl as _getMockCardBackUrl,
} from './mockPaystack';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

function getApiError(error, fallbackMessage) {
  return error?.response?.data?.message || error?.message || fallbackMessage;
}

function normalizeRegistrationError(message) {
  const text = (message || '').toLowerCase();

  if (text.includes('email is already registered')) {
    return 'Email already used. Please use a different email address.';
  }
  if (text.includes('license number is already registered')) {
    return 'This ID is already used. Please check your details.';
  }
  if (text.includes('photo file is required')) {
    return 'Please upload a photo before submitting.';
  }
  if (text.includes('only jpeg and png images are allowed')) {
    return 'Only JPEG and PNG images are allowed.';
  }
  if (text.includes('file size must be under 5mb')) {
    return 'Photo must be smaller than 5MB.';
  }
  if (text.includes('member photo not found')) {
    return 'Photo upload failed. Please try again.';
  }

  return message;
}

// Member Registration
export async function registerMember(formData) {
  if (shouldUseMock()) {
    return mockRegisterMember(formData);
  }
  try {
    const response = await api.post('/members/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    if (shouldUseMock()) {
      console.warn('Backend not available, falling back to mock:', error);
      return mockRegisterMember(formData);
    }
    throw new Error(
      normalizeRegistrationError(
        getApiError(error, 'Registration failed. Backend is unavailable.')
      )
    );
  }
}

// Initialize Payment
export async function initializePayment(memberId) {
  if (shouldUseMock()) {
    return mockPaystackPayment(memberId);
  }
  try {
    const response = await api.post(`/members/${memberId}/pay`);
    return response.data;
  } catch (error) {
    if (shouldUseMock()) {
      console.warn('Backend not available, falling back to mock:', error);
      return mockPaystackPayment(memberId);
    }
    throw new Error(getApiError(error, 'Payment initialization failed.'));
  }
}

// Verify Payment (after Paystack redirect)
export async function verifyPayment(reference) {
  if (shouldUseMock() && isMockReference(reference)) {
    const mockResult = await mockVerifyPayment(reference);
    if (mockResult) return mockResult;
  }
  try {
    const response = await api.get(`/payment/verify/${reference}`);
    return response.data;
  } catch (error) {
    if (shouldUseMock() && isMockReference(reference)) {
      const mockResult = await mockVerifyPayment(reference);
      if (mockResult) return mockResult;
    }
    console.warn('Payment verification failed:', error);
    throw error;
  }
}

// Check Member Status
export async function getMemberStatus(memberId) {
  if (shouldUseMock()) {
    return mockGetMemberStatus(memberId);
  }
  try {
    const response = await api.get(`/members/status/${memberId}`);
    return response.data;
  } catch (error) {
    if (shouldUseMock()) {
      console.warn('Backend not available, falling back to mock:', error);
      return mockGetMemberStatus(memberId);
    }
    throw new Error(getApiError(error, 'Failed to fetch member status.'));
  }
}

// Verify Member (public)
export async function verifyMember(memberId) {
  if (shouldUseMock()) {
    return mockVerifyMember(memberId);
  }
  try {
    const response = await api.get(`/members/verify/${memberId}`);
    return response.data;
  } catch (error) {
    if (shouldUseMock()) {
      console.warn('Backend not available, falling back to mock:', error);
      return mockVerifyMember(memberId);
    }
    throw new Error(getApiError(error, 'Member verification failed.'));
  }
}

// Get mock-generated card URLs (for dev mode)
export { _getMockCardUrl as getMockCardUrl };
export { _getMockCardBackUrl as getMockCardBackUrl };

// Admin API (requires Basic Auth)
const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Accept': 'application/json',
  },
});

export function setAdminAuth(username, password) {
  adminApi.defaults.headers['Authorization'] = 'Basic ' + btoa(`${username}:${password}`);
}

export async function getAdminDashboard() {
  const response = await adminApi.get('/dashboard');
  return response.data;
}

export async function getAdminMembers(status) {
  const params = status ? { status } : {};
  const response = await adminApi.get('/members', { params });
  return response.data;
}

export async function getAdminMember(id) {
  const response = await adminApi.get(`/members/${id}`);
  return response.data;
}

export async function regenerateCard(id) {
  const response = await adminApi.post(`/members/${id}/regenerate-card`);
  return response.data;
}

export function getCardFrontUrl(id) {
  return `${API_BASE_URL}/members/card/${id}/front`;
}

export function getCardBackUrl(id) {
  return `${API_BASE_URL}/members/card/${id}/back`;
}

export default api;
