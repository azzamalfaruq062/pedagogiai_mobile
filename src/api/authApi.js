import { apiClient } from './client';

export const authApi = {
  login: (credentials) => apiClient('/auth/login', { body: credentials }),
  register: (payload) => apiClient('/auth/register', { body: payload }),
  logout: (token) => apiClient('/auth/logout', { method: 'POST', token }),
  getProfile: (token) => apiClient('/auth/me', { token }),
  forgotPassword: (email) => apiClient('/auth/forgot-password', { body: { email } }),
};
