
import axios from 'axios';

const API_URL = (
    import.meta.env.VITE_API_URL ||
    'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

export const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let onLogoutCallback = null;
let refreshPromise = null;

export function registerLogoutHandler(fn) {
    onLogoutCallback = fn;
}

// Attach access token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired access tokens
api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const original = error.config;
        const status = error.response?.status;
        const url = original?.url || '';

        if (
            status !== 401 ||
            !original ||
            original._retry ||
            url.includes('/auth/refresh') ||
            url.includes('/auth/login')
        ) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            if (onLogoutCallback) {
                onLogoutCallback();
            }

            return Promise.reject(error);
        }

        original._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = axios.post(
                    `${API_URL}/auth/refresh`,
                    { refreshToken },
                    { timeout: 30000 }
                );
            }

            const { data } = await refreshPromise;

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            original.headers = original.headers || {};
            original.headers.Authorization =
                `Bearer ${data.accessToken}`;

            return api(original);
        } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            if (onLogoutCallback) {
                onLogoutCallback();
            }

            return Promise.reject(refreshError);
        } finally {
            refreshPromise = null;
        }
    }
);

// Extract useful backend error messages
export function extractError(error) {
    const response = error?.response?.data;

    return (
        response?.error?.message ||
        response?.message ||
        response?.error?.code ||
        error?.message ||
        'Request failed'
    );
}
