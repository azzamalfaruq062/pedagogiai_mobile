import { Platform } from 'react-native';
import { CONFIG } from '../config';
import { appStorage } from '../utils/storage';

/**
 * Scalable fetch wrapper for SaaS API endpoints with bearer token support & fallback
 */
export async function apiClient(endpoint, { body, token, ...customConfig } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Retrieve token from argument or persistent storage
  const activeToken = token || (await appStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN));
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const candidateBases = [
    CONFIG.API_BASE_URL,
    Platform.OS === 'ios' ? 'http://127.0.0.1:8000/api' : null,
    Platform.OS === 'ios' ? 'http://localhost:8000/api' : null,
    CONFIG.FALLBACK_URL,
    Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : null,
  ].filter(Boolean);

  const urlsToTry = Array.from(new Set(candidateBases)).map((base) => `${base}${endpoint}`);

  let lastError = null;

  for (const url of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: response.ok, message: text };
      }

      if (response.ok) {
        return data;
      }
      return Promise.reject(data);
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      // If network error occurred, continue to next fallback URL
    }
  }

  const isTimeout = lastError?.name === 'AbortError';
  return Promise.reject({
    success: false,
    isConnectionError: true,
    isNetworkError: true,
    targetUrl: CONFIG.API_BASE_URL,
    message: isTimeout
      ? 'Koneksi ke server waktu habis.'
      : 'Gagal terhubung ke server.',
  });
}
