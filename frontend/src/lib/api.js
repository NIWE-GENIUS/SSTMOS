// src/lib/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let onLogoutCallback = null;
let refreshPromise = null;

export function registerLogoutHandler(fn) {
  onLogoutCallback = fn;
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → attempt refresh → retry original request → else force logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url || '';

    if (status !== 401 || original?._retry || url.includes('/auth/refresh') || url.includes('/auth/login')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      if (onLogoutCallback) onLogoutCallback();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise = refreshPromise || axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { data } = await refreshPromise;
      refreshPromise = null;

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch (refreshErr) {
      refreshPromise = null;
      if (onLogoutCallback) onLogoutCallback();
      return Promise.reject(refreshErr);
    }
  }
);

// Extract a friendly error message from a backend error response
export function extractError(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.error?.code ||
    err?.message ||
    'Request failed'
  );
}